const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("./config/redisClient");
const { findNearbyAgents } = require("./services/geoService");
const { initializeSockets } = require("./sockets/socketManager");
const { startFleetSimulator } = require("./simulator/fleetBotEngine");
const { dispatchOrder } = require("./services/dispatchService")

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

// Initialize Socket listeners and start the Bot Simulator
initializeSockets(io);
startFleetSimulator(io);

// ==========================================
// NEW TEST ROUTE: Test Redis 3km Radius Search
// ==========================================
app.get("/api/test-radar", async (req, res) => {
    // Dark Store 1 coordinates (Indiranagar Hub from our mapConfig)
    const storeLng = 77.6408;
    const storeLat = 12.9784;

    // Run the Redis GEOSEARCH radar for a 3km radius
    const nearbyRiders = await findNearbyAgents(storeLng, storeLat, 3);

    res.json({
        store: "Indiranagar Hub",
        searchRadiusKm: 3,
        totalFound: nearbyRiders.length,
        riders: nearbyRiders,
    });
});

app.get("/api/test-dispatch", async (req, res) => {
    const dummyOrder = {
        orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        storeId: "STORE-1",
        pickupCoords: { lat: 12.9784, lng: 77.6408 }, // Indiranagar Hub
        slaUrgency: 0.8,
    };

    const result = await dispatchOrder(dummyOrder);
    res.json(result);
});

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`🚀 [Server] GeoPulse Engine running on http://localhost:${PORT}`);
});