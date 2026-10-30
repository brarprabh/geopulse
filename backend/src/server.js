const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { redisClient } = require("./config/redisClient");
const orderRoutes = require("./routes/orderRoutes");
const { initializeSockets } = require("./sockets/socketManager");
const { startFleetSimulator } = require("./simulator/fleetBotEngine");

const app = express();

// Allow frontend URL in production, or fallback to local Vite dev server
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
    cors({
        origin: ALLOWED_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
    })
);

app.use(express.json());
app.use("/api/orders", orderRoutes);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGIN,
        methods: ["GET", "POST"],
    },
});

initializeSockets(io);
startFleetSimulator(io);

// Dynamic cloud port with local fallback
const PORT = process.env.PORT || 4000;

async function bootServer() {
    try {
        await redisClient.connect();
        server.listen(PORT, () => {
            console.log(`🚀 [Server] GeoPulse Engine running on port ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Failed to boot server:", err);
    }
}

bootServer();