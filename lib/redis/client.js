const Redis = require('ioredis');

let redisClient = null;

function getRedisClient() {
    if (!redisClient) {
        redisClient = new Redis(process.env.UPSTASH_REDIS_REST_URL, {
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
            tls: {}
        });
    }
    return redisClient;
}

async function getSession(sessionId) {
    const client = getRedisClient();
    const data = await client.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
}

async function setSession(sessionId, data, ttl = 86400) {
    const client = getRedisClient();
    await client.setex(
        `session:${sessionId}`,
        ttl,
        JSON.stringify(data)
    );
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
