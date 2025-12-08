const { GoogleGenerativeAI } = require('@google/generative-ai');
const { setSession } = require('../../lib/redis/client');
const SYSTEM_INSTRUCTION = require('../../lib/systemInstruction');
const FEW_SHOT_EXAMPLES = require('../../lib/fewShot');
const { randomUUID } = require('crypto');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        // Gerar ID único da sessão
        const sessionId = randomUUID();
        
        // Criar sessão no Redis com few-shot examples
        const sessionData = {
            sessionId,
            history: FEW_SHOT_EXAMPLES,
            model: MODEL,
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        };
        
        // Salvar no Redis (24h TTL)
        await setSession(sessionId, sessionData, 86400);
        
        return res.status(200).json({
            status: 'success',
            message: 'Sessão criada com sucesso',
            sessionId,
            fewShotLoaded: FEW_SHOT_EXAMPLES.length / 2, // Pares user+model
            expiresIn: '24h'
        });
        
    } catch (error) {
        console.error('Error creating session:', error.message);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
