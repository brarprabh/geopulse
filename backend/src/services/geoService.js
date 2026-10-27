const redisClient = require("../config/redisClient");

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
 * NEW FUNCTION: Searches for available agents within a given radius of a Dark Store.
 * Uses Redis GEOSEARCH command for sub-15ms RAM spatial lookup.
 */
async function findNearbyAgents(storeLng, storeLat, radiusKm = 3) {
    try {
        // GEOSEARCH searches the 'fleet:locations' key around [lng, lat] within radiusKm kilometers
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

module.exports = { updateAgentLocationInRedis, findNearbyAgents };