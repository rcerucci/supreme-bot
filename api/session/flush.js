const { Redis } = require('@upstash/redis');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN
        });
        
        // Buscar todas as sessões
        const keys = await redis.keys('session:*');
        
        if (keys.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No sessions to delete',
                deleted: 0
            });
        }
        
        // Deletar todas
        for (const key of keys) {
            await redis.del(key);
        }
        
        return res.status(200).json({
            status: 'success',
            message: `Deleted ${keys.length} session(s)`,
            deleted: keys.length
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
