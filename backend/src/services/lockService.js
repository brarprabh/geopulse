const { redisClient } = require("../config/redisClient");
/**
 * Attempts to acquire an atomic lock on an agent using Redis SET NX with a 5-second TTL.
 * Returns true if lock is acquired successfully, false if another order grabbed them first.
 */
async function acquireAgentLock(agentId) {
    const lockKey = `lock:agent:${agentId}`;

    // SETNX: Set if Not Exists. EX 5: Automatically expires in 5 seconds in case of server crash.
    const result = await redisClient.set(lockKey, "LOCKED", {
        NX: true,
        EX: 5,
    });

    return result === "OK"; // Returns true if lock succeeded
}

/**
 * Releases the agent lock once state transition is complete.
 */
async function releaseAgentLock(agentId) {
    const lockKey = `lock:agent:${agentId}`;
    await redisClient.del(lockKey);
}

module.exports = { acquireAgentLock, releaseAgentLock };