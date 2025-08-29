let chats = [];

function createChat(io, customerId, agentId) {
  const customerSocket = io.sockets.sockets.get(customerId);
  const agentSocket = io.sockets.sockets.get(agentId);
  if (!customerSocket || !agentSocket) return null;

  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const chat = {
    id: chatId,
    participants: [
      { id: customerId, username: customerSocket.username, role: "customer" },
      { id: agentId, username: agentSocket.username, role: "agent" }
    ],
    messages: [],
    startTime: new Date(),
    status: "active"
  };

  chats.push(chat);
  return chatId;
}

function findChatByParticipants(agentId, customerId) {
  return chats.find(chat =>
    chat.participants.some(p => p.id === agentId && p.role === "agent") &&
    chat.participants.some(p => p.id === customerId && p.role === "customer") &&
    chat.status === "active"
  );
}

function addMessageToChat(agentId, customerId, message) {
  const chat = findChatByParticipants(agentId, customerId);
  if (chat) chat.messages.push(message);
}

function getChatHistoryForUser(userId, userRole) {
  return chats.filter(chat =>
    chat.participants.some(p => p.id === userId) ||
    (userRole === "agent" && chat.participants.some(p => p.role === "agent"))
  ).map(chat => ({
    ...chat,
    messages: chat.messages.slice(-10)
  }));
}

function getAllChats() {
  return chats.map(chat => ({
    ...chat,
    messages: chat.messages.slice(-10)
  }));
}

function isUserInChat(userId, userRole, chat) {
  if (userRole === "admin") return true;
  return chat.participants.some(p => p.id === userId);
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

module.exports = {
  createChat,
  findChatByParticipants,
  addMessageToChat,
  getChatHistoryForUser,
  getAllChats,
  isUserInChat,
  now
};
