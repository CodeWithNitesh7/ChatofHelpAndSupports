const { emitAgentList, getAgentList } = require("../helpers/agentHelpers");
const { getChatHistoryForUser } = require("../helpers/chatHelpers");

let agents = [];
let customers = {};

module.exports = function connectionEvents(io, socket) {
  socket.on("set-role", ({ role, username }) => {
    socket.role = role;
    socket.username = username;

    if (role === "agent") {
      agents.push({ id: socket.id, username, status: "free", socketId: socket.id });
      console.log(`✅ Agent registered: ${username} (${socket.id})`);
    } else {
      customers[socket.id] = null; // will be mapped to agent later
      console.log(`👤 Customer joined: ${username} (${socket.id})`);
    }

    emitAgentList(io, agents);
    socket.emit("agent-list-update", { agents: getAgentList(agents) });
    socket.emit("chat-history", { chats: getChatHistoryForUser(socket.id, socket.role) });
  });

  socket.on("request-agent-list", () => {
    socket.emit("agent-list-update", { agents: getAgentList(agents) });
  });

  socket.on("request-chat-history", () => {
    socket.emit("chat-history", { chats: getChatHistoryForUser(socket.id, socket.role) });
  });
};
