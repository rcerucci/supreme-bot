const { deleteSession, getSession } = require('../../lib/redis/client');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({
                status: 'error',
                message: 'SessionId is required'
            });
        }
        
        const sessionData = await getSession(sessionId);
        
        if (!sessionData) {
            return res.status(404).json({
                status: 'error',
                message: 'Session not found'
            });
        }
        
        await deleteSession(sessionId);
        
        return res.status(200).json({
            status: 'success',
            message: 'Session deleted',
            sessionId
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
