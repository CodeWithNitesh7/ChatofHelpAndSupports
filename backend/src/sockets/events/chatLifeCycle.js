const { addMessageToChat, getAllChats, now } = require("../helpers/chatHelpers");
const { emitAgentList } = require("../helpers/agentHelpers");

module.exports = function chatLifecycleEvents(io, socket) {
  socket.on("end-chat", () => {
    // … logic for ending chat …
  });

  socket.on("disconnect", () => {
    // … disconnect handling logic …
  });
};
