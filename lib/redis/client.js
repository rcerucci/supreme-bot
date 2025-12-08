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
    const key = 'session:' + sessionId;
    const data = await client.get(key);
    return data;
}

async function setSession(sessionId, data, ttl) {
    const client = getRedisClient();
    const key = 'session:' + sessionId;
    await client.set(key, data, { ex: ttl });
}

async function deleteSession(sessionId) {
    const client = getRedisClient();
    const key = 'session:' + sessionId;
    await client.del(key);
}

module.exports = {
    getSession,
    setSession,
    deleteSession
};
