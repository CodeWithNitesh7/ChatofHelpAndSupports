const { addMessageToChat, now } = require("../helpers/chatHelpers");
const { getAgentById } = require("../helpers/agentHelpers");

module.exports = function messagingEvents(io, socket) {
  socket.on("customer-message", (msg) => {
    // … same logic, just extracted here …
  });

  socket.on("agent-message", (msg) => {
    // … same logic, just extracted here …
  });
};
