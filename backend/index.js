const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const connectDB = require("./src/config/db");
connectDB();

const uploadRoutes = require("./src/routes/uploadRoutes");
const registerSocketHandlers = require("./src/sockets");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", uploadRoutes);

// Setup socket.io
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
registerSocketHandlers(io);

server.listen(9000, () => console.log("🚀 Server running on port 9000"));
