const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const uploadRoutes = require("./src/routes/uploadRoutes");
const registerSocketHandlers = require("./socketHandler");

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "https://chatof-help-and-supports.vercel.app/", // frontend origin
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", uploadRoutes);

// Register socket handlers
registerSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
