const { updateAgentLocationInRedis } = require("../services/geoService");
const { checkTelemetryAnomaly } = require("../services/aiService");

// Initialize 10 virtual riders around central Bengaluru
const riders = Array.from({ length: 10 }, (_, index) => {
    const lat = 12.9630 + (Math.random() - 0.5) * 0.04;
    const lng = 77.6240 + (Math.random() - 0.5) * 0.04;

    return {
        agentId: `AGT-${101 + index}`,
        lat,
        lng,
        prevLat: lat, // Track prior position for velocity checks
        prevLng: lng,
        stationarySeconds: 0,
        speedKmh: Math.floor(20 + Math.random() * 25),
        battery: Math.floor(50 + Math.random() * 50),
        status: "AVAILABLE",
        activeOrders: 0,
        acceptanceProb: Number((0.75 + Math.random() * 0.24).toFixed(2)),
    };
});

function getRiders() {
    return riders;
}

function getRiderById(agentId) {
    return riders.find((r) => r.agentId === agentId);
}

function assignOrderToRider(agentId) {
    const rider = riders.find((r) => r.agentId === agentId);
    if (rider) {
        rider.activeOrders += 1;
        rider.status = "BUSY";
    }
    return rider;
}

// Chaos test trigger: Teleports an agent 6 km away instantly to trigger GPS_SPOOFED!
function triggerSpoofingAnomaly(agentId = "AGT-101") {
    const rider = riders.find((r) => r.agentId === agentId);
    if (rider) {
        rider.prevLat = rider.lat;
        rider.prevLng = rider.lng;
        // Jump coordinates ~6km away
        rider.lat += 0.05;
        rider.lng += 0.05;
        console.log(`🚨 [Chaos Test] Injected GPS Spoof on ${rider.agentId} (Jumped ~6 km)!`);
        return rider;
    }
    return null;
}

function startFleetSimulator(io) {
    const TICK_INTERVAL_SECONDS = 2.0;

    setInterval(async () => {
        for (const rider of riders) {
            // 1. Save prior coordinates before applying random walk
            const prevCoords = { lat: rider.prevLat || rider.lat, lng: rider.prevLng || rider.lng };

            // Update historical markers
            rider.prevLat = rider.lat;
            rider.prevLng = rider.lng;

            // 2. Normal random movement step (~20-40 meters)
            rider.lat += (Math.random() - 0.5) * 0.00015;
            rider.lng += (Math.random() - 0.5) * 0.00015;

            const currCoords = { lat: rider.lat, lng: rider.lng };

            // 3. Inspect telemetry ping via Python AI service
            const anomalyResult = await checkTelemetryAnomaly({
                agentId: rider.agentId,
                prevCoords,
                currCoords,
                timeDeltaSeconds: TICK_INTERVAL_SECONDS,
                stationaryDurationSeconds: rider.stationarySeconds,
                isAssigned: rider.activeOrders > 0,
            });

            // 4. If an anomaly is flagged, broadcast immediately to the React dashboard
            if (anomalyResult.isAnomaly) {
                console.warn(`🚨 [Anomaly Flagged] ${anomalyResult.agentId}: ${anomalyResult.reason}`);
                io.emit("telemetry_anomaly", anomalyResult);
            }

            // 5. Update hot Redis geospatial index
            await updateAgentLocationInRedis(rider);
        }

        // Broadcast live fleet positions to frontend
        io.emit("fleet_update", riders);
    }, 2000);
}

module.exports = {
    getRiders,
    getRiderById,
    assignOrderToRider,
    triggerSpoofingAnomaly, // random 6 km jump, we are adding..
    startFleetSimulator,
};