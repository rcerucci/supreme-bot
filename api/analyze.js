const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSession, setSession } = require('../lib/redis/client');
const SYSTEM_INSTRUCTION = require('../lib/systemInstruction');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { screenshot, sessionId } = req.body;
        
        if (!screenshot) {
            return res.status(400).json({
                status: 'error',
                message: 'Screenshot is required'
            });
        }
        
        if (!sessionId) {
            return res.status(400).json({
                status: 'error',
                message: 'SessionId is required. Call /api/session/start first.'
            });
        }
        
        // Recuperar sessão do Redis
        const sessionData = await getSession(sessionId);
        
        if (!sessionData) {
            return res.status(404).json({
                status: 'error',
                message: 'Session not found or expired'
            });
        }
        
        // Criar modelo com system instruction
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
                maxOutputTokens: 500,
                thinkingConfig: {
                    thinkingBudget: 0
                }
            }
        });
        
        // Criar chat com histórico da sessão
        const chat = model.startChat({
            history: sessionData.history
        });
        
        // Enviar nova imagem
        const result = await chat.sendMessage([
            {
                inlineData: {
                    data: screenshot,
                    mimeType: 'image/png'
                }
            },
            { text: 'Analise este gráfico.' }
        ]);
        
        const text = result.response.text();
        const analysis = JSON.parse(text);
        
        // Atualizar histórico no Redis
        sessionData.history.push(
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            data: screenshot,
                            mimeType: 'image/png'
                        }
                    },
                    { text: 'Analise este gráfico.' }
                ]
            },
            {
                role: 'model',
                parts: [{ text }]
            }
        );
        
        sessionData.lastUpdate = new Date().toISOString();
        await setSession(sessionId, sessionData, 86400);
        
        const usage = result.response.usageMetadata;
        
        return res.status(200).json({
            status: 'success',
            analysis,
            metadata: {
                timestamp: new Date().toISOString(),
                tokens_input: usage?.promptTokenCount || 0,
                tokens_output: usage?.candidatesTokenCount || 0,
                model: MODEL,
                sessionId
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
