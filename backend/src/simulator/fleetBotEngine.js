// Generates 10 virtual riders starting around central Bengaluru
const { updateAgentLocationInRedis } = require("../services/geoService");

const riders = Array.from({ length: 10 }, (_, index) => ({
    agentId: `AGT-${101 + index}`,
    lat: 12.9630 + (Math.random() - 0.5) * 0.04,
    lng: 77.6240 + (Math.random() - 0.5) * 0.04,
    speedKmh: Math.floor(20 + Math.random() * 25),
    battery: Math.floor(50 + Math.random() * 50),
    status: "AVAILABLE",
}));

function getRiders() {
    return riders;
}

function startFleetSimulator(io) {
    setInterval(async () => {
        // 1. Move riders and update Redis RAM concurrently
        for (const rider of riders) {
            rider.lat += (Math.random() - 0.5) * 0.001;
            rider.lng += (Math.random() - 0.5) * 0.001;

            // Save into Redis Geo RAM via GEOADD
            await updateAgentLocationInRedis(rider);
        }

        // 2. Broadcast updated list to the React frontend via WebSockets
        io.emit("fleet_update", riders);
        console.log(`📡 [Simulator + Redis] Updated and broadcasted GPS for ${riders.length} riders`);
    }, 2000);
}

module.exports = { getRiders, startFleetSimulator };