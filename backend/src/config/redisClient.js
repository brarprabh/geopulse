const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisClient = createClient({
    url: redisUrl,
});

redisClient.on("error", (err) => console.error("❌ [Redis Error]", err));
redisClient.on("connect", () => console.log("⚡ [Redis] Connected successfully!"));

module.exports = { redisClient };