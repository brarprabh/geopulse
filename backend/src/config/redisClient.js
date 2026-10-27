const { createClient } = require("redis");

// Create the Redis client connecting to localhost on port 6379
const redisClient = createClient({
    url: "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("❌ [Redis] Error:", err));

async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log("⚡ [Redis] Connected to RAM memory successfully!");
    }
}

connectRedis(); // in ioredis we dont need to make connect 

module.exports = redisClient;