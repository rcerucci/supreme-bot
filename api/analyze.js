const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSession } = require('../lib/redis/client');
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
        
        if (!screenshot || !sessionId) {
            return res.status(400).json({
                status: 'error',
                message: 'Screenshot and sessionId required'
            });
        }
        
        // Validar sessão (apenas para controle)
        const sessionData = await getSession(sessionId);
        if (!sessionData) {
            return res.status(404).json({
                status: 'error',
                message: 'Session not found'
            });
        }
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        
        // MÉTODO PATRIGESTOR - Prompt + Imagem (SEM systemInstruction, SEM chat)
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0.1,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        // Análise STATELESS - cada imagem é independente
        const result = await model.generateContent([
            SYSTEM_INSTRUCTION,
            {
                inlineData: {
                    data: screenshot,
                    mimeType: 'image/png'
                }
            }
        ]);
        
        const text = result.response.text();
        
        // Parse robusto
        let analysis;
        try {
            let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (jsonMatch) jsonText = jsonMatch[0];
            analysis = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('❌ Parse failed:', text);
            return res.status(500).json({
                status: 'error',
                message: 'JSON parse failed',
                rawResponse: text.substring(0, 500)
            });
        }
        
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
        console.error('❌ Error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
