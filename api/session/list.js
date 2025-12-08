const { Redis } = require('@upstash/redis');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN
        });
        
        // Listar todas as keys que começam com 'session:'
        const keys = await redis.keys('session:*');
        
        const sessions = [];
        for (const key of keys) {
            const data = await redis.get(key);
            const ttl = await redis.ttl(key);
            sessions.push({
                key,
                sessionId: key.replace('session:', ''),
                createdAt: data?.createdAt,
                lastUpdate: data?.lastUpdate,
                ttl: ttl > 0 ? `${Math.floor(ttl / 3600)}h ${Math.floor((ttl % 3600) / 60)}m` : 'expired'
            });
        }
        
        return res.status(200).json({
            status: 'success',
            total: sessions.length,
            sessions
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
