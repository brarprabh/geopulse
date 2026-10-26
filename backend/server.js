const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// 1. Create the Express app and wrap it in an HTTP server
const app = express();
app.use(cors());
const server = http.createServer(app);

// 2. Attach Socket.io to the server so it can talk live to React
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Your React map's address
        methods: ["GET", "POST"],
    },
});

// 3. ONE FUNCTION: Listen for when someone opens the React map
io.on("connection", (socket) => {
    console.log("🟢 A dashboard connected! Socket ID:", socket.id);

    socket.on("disconnect", () => {
        console.log("🔴 Dashboard disconnected:", socket.id);
    });
});

// 4. Start the server on Port 4000
server.listen(4000, () => {
    console.log("🚀 GeoPulse Backend running on http://localhost:4000");
});