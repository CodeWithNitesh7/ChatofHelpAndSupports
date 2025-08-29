const connectionEvents = require("./events/connection");
const messagingEvents = require("./events/messaging");
const transferEvents = require("./events/transfers");
const typingEvents = require("./events/typing");
const fileEvents = require("./events/files");
const chatLifecycleEvents = require("./events/chatLifeCycle");

module.exports = function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    // Grouped event registrations
    connectionEvents(io, socket);
    messagingEvents(io, socket);
    transferEvents(io, socket);
    typingEvents(io, socket);
    fileEvents(io, socket);
    chatLifecycleEvents(io, socket);

    socket.on("ping", () => socket.emit("pong"));
  });
};
