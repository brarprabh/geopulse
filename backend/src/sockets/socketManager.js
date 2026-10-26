const { getRiders } = require("../simulator/fleetBotEngine");

function initializeSockets(io) {
    io.on("connection", (socket) => {
        console.log("🟢 [Socket] Dashboard connected:", socket.id);

        // Immediately send current rider positions on connect
        socket.emit("fleet_update", getRiders());

        socket.on("disconnect", () => {
            console.log("🔴 [Socket] Dashboard disconnected:", socket.id);
        });
    });
}

module.exports = { initializeSockets };