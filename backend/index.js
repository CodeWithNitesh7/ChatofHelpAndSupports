const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const connectDB = require("./src/config/db"); 
const uploadRoutes = require("./src/routes/uploadRoutes");
const registerSocketHandlers = require("./socketHandler");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", uploadRoutes);

// --- Connect to MongoDB ---
connectDB().then(() => {
  // Setup socket.io
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Register socket handlers
  registerSocketHandlers(io);

  // Start server
  server.listen(9000, () => console.log("🚀 Server running on port 9000"));
});
