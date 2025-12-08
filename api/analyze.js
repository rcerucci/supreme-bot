const { GoogleGenerativeAI } = require('@google/generative-ai');
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
        const { screenshot } = req.body;
        
        if (!screenshot) {
            return res.status(400).json({
                status: 'error',
                message: 'Screenshot is required'
            });
        }
        
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
        
        const result = await model.generateContent([
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
        
        const usage = result.response.usageMetadata;
        
        return res.status(200).json({
            status: 'success',
            analysis,
            metadata: {
                timestamp: new Date().toISOString(),
                tokens_input: usage?.promptTokenCount || 0,
                tokens_output: usage?.candidatesTokenCount || 0,
                model: MODEL
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
