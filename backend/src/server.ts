import http from "http";
import app from "./app";
import { initializeSocket } from "./websocket/socket.manager";

const PORT = process.env.PORT || 8000;

// Create HTTP server from Express app
const server = http.createServer(app);

// Attach Socket.IO
initializeSocket(server);

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});