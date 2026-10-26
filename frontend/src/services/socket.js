import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:4000";

// Create and export a single shared socket connection
export const socket = io(BACKEND_URL, {
    autoConnect: true,
});