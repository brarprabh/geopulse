const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

require("./config/redisClient");
const { initializeSockets } = require("./sockets/socketManager");
const { startFleetSimulator } = require("./simulator/fleetBotEngine");
const orderRoutes = require("./routes/orderRoutes"); // <-- Import clean router

const app = express();
app.use(cors());
app.use(express.json());

// Mount all order & dispatch API routes under /api/orders
app.use("/api/orders", orderRoutes);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

initializeSockets(io);
startFleetSimulator(io);

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`🚀 [Server] GeoPulse Engine running on http://localhost:${PORT}`);
});