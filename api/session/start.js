const { v4: uuidv4 } = require('uuid');
const { setSession } = require('../../lib/redis/client');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const sessionId = uuidv4();
        
        // Sessão VAZIA - sem few-shot examples
        const sessionData = {
            sessionId,
            history: [],  // Array vazio!
            model: 'gemini-2.5-flash-lite',
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        };
        
        await setSession(sessionId, sessionData, 86400);
        
        return res.status(200).json({
            status: 'success',
            message: 'Sessão criada (sem few-shot)',
            sessionId,
            fewShotLoaded: 0,  // Zero!
            expiresIn: '24h'
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
