const { addMessageToChat, now } = require("../helpers/chatHelpers");

module.exports = function fileEvents(io, socket) {
  socket.on("send-file", (data) => {
    // … file transfer logic …
  });
};
