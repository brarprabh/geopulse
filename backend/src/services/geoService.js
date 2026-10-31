const { redisClient } = require("../config/redisClient");

const GEO_KEY = "fleet:locations";

/**
 * Updates a single agent's latitude and longitude in Redis Geo RAM.
 * Note: Redis requires [Longitude, Latitude] order!
 */
async function updateAgentLocationInRedis(rider) {
    try {
        await redisClient.geoAdd(GEO_KEY, {
            longitude: rider.lng,
            latitude: rider.lat,
            member: rider.agentId,
        });
    } catch (error) {
        console.error(`❌ [Redis Geo] Failed to update location for ${rider.agentId}:`, error);
    }
}

/**
 * Batch updates all agent coordinates in a single Redis roundtrip.
 * Prevents ECONNRESET on cloud Redis providers (Upstash).
 */
async function updateAgentLocationsBatch(riders) {
    if (!riders || riders.length === 0) return;
    try {
        const geoAddItems = riders.map((rider) => ({
            longitude: rider.lng,
            latitude: rider.lat,
            member: rider.agentId,
        }));

        await redisClient.geoAdd(GEO_KEY, geoAddItems);
    } catch (error) {
        console.error("❌ [Redis Geo Batch Error]:", error);
    }
}

/**
 * Searches for available agents within a given radius of a Dark Store.
 * Uses Redis GEOSEARCH command for sub-15ms RAM spatial lookup.
 */
async function findNearbyAgents(storeLng, storeLat, radiusKm = 3) {
    try {
        const nearbyAgentIds = await redisClient.geoSearchWith(
            GEO_KEY,
            { longitude: storeLng, latitude: storeLat },
            { radius: radiusKm, unit: "km" },
            [
                "WITHCOORD",
                "WITHDIST", // Requests distance from center point
            ]
        );

        console.log(`🔍 [Redis GeoSearch] Found ${nearbyAgentIds.length} agents within ${radiusKm}km`);
        return nearbyAgentIds;
    } catch (error) {
        console.error("❌ [Redis GeoSearch] Failed to query nearby agents:", error);
        return [];
    }
}

module.exports = {
    updateAgentLocationInRedis,
    updateAgentLocationsBatch,
    findNearbyAgents,
};