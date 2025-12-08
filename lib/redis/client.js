const { Redis } = require('@upstash/redis');

let redisClient = null;

function getRedisClient() {
    if (!redisClient) {
        redisClient = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN
        });
    }
    return redisClient;
}

async function getSession(sessionId) {
    const client = getRedisClient();
    const data = await client.get(`session:${sessionId}`);
    return data; // Upstash já faz parse automático
}

async function setSession(sessionId, data, ttl = 86400) {
    const client = getRedisClient();
    await client.set(`session:${sessionId}`, data, { ex: ttl });
}

async function deleteSession(sessionId) {
    const client = getRedisClient();
    await client.del(`session:${sessionId}`);
}

module.exports = {
    getSession,
    setSession,
    deleteSession
};
