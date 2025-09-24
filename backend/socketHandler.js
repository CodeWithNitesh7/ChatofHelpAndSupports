const User = require("./src/models/User");
const Chat = require("./src/models/Chat");


const matchmakingUtils = require("./src/utils/matchmaking");


const {
  assignAgent,
  releaseAgent,
  getFreeAgents,
  getAgentById
} = matchmakingUtils;




const customers = {};
const waitingCustomers = [];

module.exports = function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);
    

    // --- ROLE SETUP ---
    socket.on("set-role", async ({ role, username }) => {
  socket.role = role;
  socket.username = username;

  if (role === "agent") {
  // Upsert agent in DB
await User.findOneAndUpdate(
  { socketId: socket.id, role: "agent" },
  { username, status: "free", currentCustomer: null },
  { upsert: true }
);
  // Assign waiting customers
  while (waitingCustomers.length > 0) {
    const customerId = waitingCustomers.shift();
    const customerSocket = io.sockets.sockets.get(customerId);
    if (customerSocket) {
      const agent = await assignAgent(); // DB-based
      if (agent) await connectCustomerToAgent(customerSocket, agent);
      break;
    }
  }
}
 else if (role === "customer") {
    customers[socket.id] = null;
    console.log(`👤 Customer joined: ${username} (${socket.id})`);

    const agent = await assignAgent();
    if (agent) {
      await connectCustomerToAgent(socket, agent);
    } else {
      waitingCustomers.push(socket.id);
      console.log(`⚠️ No free agent, customer added to waiting list: ${username}`);
    }
  }

  // Update agent list for everyone
  emitAgentList(io);

  // Send list & chat history to this socket
  socket.emit("agent-list-update", { agents: getAgentList() });
  const chats = await getChatHistoryForUser(socket.id, socket.role);
  socket.emit("chat-history", { chats });
});

    
    
    

    socket.on("request-agent-list", () => {
      console.log(`📤 Sending agent list to ${socket.id}`);
      socket.emit("agent-list-update", { agents: getAgentList() })
    });
    
    // --- REQUEST CHAT HISTORY ---
    socket.on("request-chat-history", async () => {
  console.log(`📤 Sending chat history to ${socket.id}`);

  try {
    let chats;

    if (socket.role === "admin") {
      // Admin gets all chats
      chats = await Chat.find({})
        .sort({ startTime: -1 })
        .limit(50); // limit for performance
    } else if (socket.role === "agent") {
      // Fetch chats where agent is a participant
      chats = await Chat.find({ "participants.id": socket.id })
        .sort({ startTime: -1 })
        .limit(50);
    } else if (socket.role === "customer") {
      // Fetch chats where customer is a participant
      chats = await Chat.find({ "participants.id": socket.id })
        .sort({ startTime: -1 })
        .limit(50);
    }

    // Send last 10 messages of each chat to the client
    const formattedChats = chats.map(chat => ({
      ...chat.toObject(),
      messages: chat.messages.slice(-10),
    }));

    socket.emit("chat-history", { chats: formattedChats });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    socket.emit("chat-error", { message: "Failed to load chat history" });
  }
});

    
    // --- LOAD SPECIFIC CHAT ---
    socket.on("load-chat", async ({ chatId }) => {
  try {
    // Find chat in MongoDB
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return socket.emit("chat-error", { message: "Chat not found" });
    }

    // Check if user is authorized (participant or admin)
    const isParticipant = chat.participants.some(
      (p) => p.id === socket.id || socket.role === "admin"
    );

    if (!isParticipant) {
      return socket.emit("chat-error", { message: "Not authorized to view this chat" });
    }

    // Send full chat object (or limit messages if needed)
    socket.emit("chat-loaded", { chat });
  } catch (err) {
    console.error("Error loading chat:", err);
    socket.emit("chat-error", { message: "Failed to load chat" });
  }
});


    // --- CUSTOMER MESSAGE ---
    // In your socket handler file, update the customer-message event:
// In your socket handler file, update the customer-message event:
socket.on("customer-message", async (msg) => {
  try {
    const agentId = customers[socket.id];

    if (agentId) {
      // Agent already assigned
      sendMessage(io, socket, agentId, msg);

      // Save message in DB
      const chat = await findOrCreateChat(socket.id, agentId);
      chat.messages.push({
        sender: socket.id,
        senderUsername: socket.username,
        text: msg,
        time: new Date(),
        type: "text",
        role: socket.role
      });
      await chat.save();
    } else {
      // Customer waiting: try to assign an available agent
      const agent =await assignAgent();

      if (agent) {
        connectCustomerToAgent(socket, agent);
        sendMessage(io, socket, agent.socketId, msg);

        const chat = await findOrCreateChat(socket.id, agent.socketId);
        chat.messages.push({
          sender: socket.id,
          senderUsername: socket.username,
          text: msg,
          time: new Date(),
          type: "text",
          role: socket.role
        });
        await chat.save();
      } else {
        // No agent free yet
        waitingCustomers.push(socket.id);
        socket.emit("chat-message", {
          sender: "System",
          text: "All agents are busy. Please wait...",
          time: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error("Error handling customer-message:", err);
  }
});

// Helper function to find or create chat between customer & agent
async function findOrCreateChat(customerId, agentId) {
  let chat = await Chat.findOne({
    "participants.id": { $all: [customerId, agentId] },
    status: "active"
  });

  if (!chat) {
    chat = new Chat({
      participants: [
        { id: customerId, username: io.sockets.sockets.get(customerId)?.username || "Customer", role: "customer" },
        { id: agentId, username: io.sockets.sockets.get(agentId)?.username || "Agent", role: "agent" }
      ],
      messages: [],
      startTime: new Date(),
      status: "active"
    });
    await chat.save();
  }

  return chat;
}




// Add this to your socket handler file
// Add this to your socket handler file
socket.on("request-connection-status", async () => {
  try {
    if (socket.role === "agent") {
      // Find customer connected to this agent
      const customerId = Object.keys(customers).find(
        (id) => customers[id] === socket.id
      );
      if (customerId) {
        const customerSocket = io.sockets.sockets.get(customerId);
        let username = customerSocket?.username;

        // Fallback: fetch from DB if socket not found (agent might have disconnected)
        if (!username) {
          const user = await User.findById(customerId).lean();
          username = user?.username || "Unknown Customer";
        }

        socket.emit("customer-connected", {
          customerId,
          username
        });
      }
    } else if (socket.role === "customer") {
      const agentId = customers[socket.id];
      if (agentId) {
        const agent = getAgentById(agents, agentId);
        let username = agent?.username;

        // Fallback: fetch from DB if agent info not in memory
        if (!username) {
          const user = await User.findById(agentId).lean();
          username = user?.username || "Unknown Agent";
        }

        socket.emit("agent-connected", {
          agentId,
          username
        });
      }
    }
  } catch (err) {
    console.error("Error in request-connection-status:", err);
  }
});


    // --- AGENT TRANSFER REQUEST ---
    socket.on("transfer-customer", async ({ customerId, toAgentId }) => {
  try {
    if (socket.role !== "agent") return;

    const currentAgent = await getAgentById( socket.id);
    const targetAgent = await getAgentById(toAgentId);

    if (!currentAgent || !targetAgent || targetAgent.status !== "free") {
      socket.emit("transfer-failed", {
        message: "Transfer failed. Agent is not available."
      });
      return;
    }

    if (!customers[customerId]) {
      socket.emit("transfer-failed", {
        message: "Customer not found or not connected to any agent."
      });
      return;
    }

    if (customers[customerId] !== socket.id) {
      socket.emit("transfer-failed", {
        message: "You are not handling this customer."
      });
      return;
    }

    const customerSocket = io.sockets.sockets.get(customerId);
    const customerUsername = customerSocket?.username || (await User.findById(customerId).lean())?.username || "Customer";

    // --- Update chat in DB ---
    let chat = await Chat.findOne({
      participants: { $all: [socket.id, customerId] },
      status: "active"
    });

    if (!chat) {
      // create chat if not exists
      chat = await Chat.create({
        participants: [
          { id: socket.id, username: currentAgent.username, role: "agent" },
          { id: customerId, username: customerUsername, role: "customer" }
        ],
        messages: [],
        status: "active",
        startTime: new Date()
      });
    }

    // Add system message in DB
    const systemMessage = {
      sender: "system",
      senderUsername: "System",
      text: `Customer ${customerUsername} has been transferred from ${currentAgent.username} to ${targetAgent.username}`,
      time: new Date(),
      type: "system"
    };
    chat.messages.push(systemMessage);
    if (!chat.participants.some(p => p.id === toAgentId)) {
      chat.participants.push({ id: toAgentId, username: targetAgent.username, role: "agent" });
    }
    await chat.save();

    // --- Update in-memory mappings ---
    customers[customerId] = toAgentId;
    await releaseAgent(currentAgent.socketId);
    targetAgent.status = "busy";
    targetAgent.currentCustomer = customerId;

    // --- Emit socket events ---
    io.to(currentAgent.socketId).emit("customer-disconnected", { customerId });

    io.to(customerId).emit("chat-message", systemMessage);

    io.to(toAgentId).emit("chat-message", {
      sender: "System",
      text: `You received a transferred customer from ${currentAgent.username}`,
      time: new Date().toISOString()
    });

    if (customerSocket) {
      io.to(toAgentId).emit("customer-connected", {
        customerId,
        username: customerUsername
      });
    }

    emitAgentList(io);
    console.log("Current customers:", customers);

    socket.emit("transfer-success", {
      message: `Customer successfully transferred to ${targetAgent.username}`
    });

  } catch (err) {
    console.error("Error in transfer-customer:", err);
    socket.emit("transfer-failed", { message: "Internal server error." });
  }
});


    // --- GET FREE AGENTS LIST ---
socket.on("request-free-agents", async () => {
  try {
    if (socket.role !== "agent") return;

    // Option 1: Use in-memory agents list
let freeAgents = (await getFreeAgents()).filter(a => a.socketId !== socket.id);

    // Option 2: Optionally fetch from DB if agents are stored in User collection
    // const dbAgents = await User.find({ role: "agent", status: "free" }).lean();
    // freeAgents = dbAgents.filter(a => a._id.toString() !== socket.userId);

    socket.emit("free-agents-list", {
      agents: freeAgents.map(agent => ({
        id: agent.socketId,
        username: agent.username
      }))
    });

  } catch (err) {
    console.error("Error in request-free-agents:", err);
    socket.emit("free-agents-list", { agents: [] });
  }
});

    

    // --- ADMIN TRANSFER (OVERRIDE) ---
socket.on("admin-transfer-customer", async ({ customerUsername, toAgentId }) => {
  try {
    if (socket.role !== "agent") return;

    const targetAgent = await getAgentById(toAgentId);
    if (!targetAgent || targetAgent.status !== "free") {
      return socket.emit("transfer-failed", {
        message: "Target agent not available for transfer."
      });
    }

    const customerSocket = findCustomerSocketByUsername(io, customerUsername);
    if (!customerSocket || !customers[customerSocket.id]) {
      return socket.emit("transfer-failed", {
        message: "Customer not found or not connected."
      });
    }

    const customerId = customerSocket.id;
    const currentHandlerId = customers[customerId];
    const currentHandler = getAgentById(agents, currentHandlerId);

    // --- Update chat in DB ---
    const chat = await Chat.findOne({
      participants: { $all: [currentHandlerId, customerId] },
      status: "active"
    });

    if (chat) {
      chat.participants.push({ id: targetAgent.socketId, username: targetAgent.username, role: "agent" });
      chat.messages.push({
        sender: "system",
        senderUsername: "System",
        text: `Customer ${customerSocket.username} has been transferred from ${currentHandler.username} to ${targetAgent.username}`,
        time: new Date().toISOString(),
        type: "system"
      });
      await chat.save();
    }

    // --- Update in-memory tracking ---
    customers[customerId] = toAgentId;
    if (currentHandler) {
      currentHandler.status = "free";
      currentHandler.currentCustomer = null;
      io.to(currentHandlerId).emit("customer-disconnected");
    }

    targetAgent.status = "busy";
    targetAgent.currentCustomer = customerId;

    // --- Emit messages ---
    io.to(customerId).emit("chat-message", {
      sender: "System",
      text: `You have been transferred to agent ${targetAgent.username}`,
      time: new Date().toISOString()
    });

    if (currentHandler) {
      io.to(currentHandlerId).emit("chat-message", {
        sender: "System",
        text: `Customer ${customerSocket.username} was transferred to ${targetAgent.username}`,
        time: new Date().toISOString()
      });
    }

    io.to(toAgentId).emit("chat-message", {
      sender: "System",
      text: `You received customer ${customerSocket.username}`,
      time: new Date().toISOString()
    });

    io.to(toAgentId).emit("customer-connected", {
      customerId,
      username: customerSocket.username
    });

    emitAgentList(io);
    console.log("Current customers:", customers);

    socket.emit("transfer-success", {
      message: `Customer ${customerUsername} transferred to ${targetAgent.username}`
    });

  } catch (err) {
    console.error("Error in admin-transfer-customer:", err);
    socket.emit("transfer-failed", { message: "Something went wrong." });
  }
});


    // --- AGENT MESSAGE ---
socket.on("agent-message", async (msg) => {
  try {
    const customerId = Object.keys(customers).find(
      (id) => customers[id] === socket.id
    );

    if (!customerId) {
      return socket.emit("chat-message", {
        sender: "System",
        text: "You are not connected to any customer.",
        time: new Date().toISOString(),
      });
    }

    // --- Send message in real-time ---
    sendMessage(io, socket, customerId, msg);

    // --- Save message in DB ---
    let chat = await Chat.findOne({
      participants: { $all: [socket.id, customerId] },
      status: "active"
    });

    if (!chat) {
      // Create new chat if it doesn't exist
      chat = new Chat({
        participants: [
          { id: socket.id, username: socket.username, role: "agent" },
          { id: customerId, username: io.sockets.sockets.get(customerId)?.username, role: "customer" }
        ],
        messages: [],
        status: "active",
        startTime: new Date()
      });
    }

    chat.messages.push({
      sender: socket.id,
      senderUsername: socket.username,
      text: msg,
      type: "text",
      time: new Date()
    });

    await chat.save();

    // --- Optional: update in-memory if you use it ---
    addMessageToChat(socket.id, customerId, {
      sender: socket.id,
      senderUsername: socket.username,
      text: msg,
      time: new Date().toISOString(),
      type: "text"
    });

  } catch (err) {
    console.error("Error in agent-message:", err);
    socket.emit("chat-message", {
      sender: "System",
      text: "Message could not be sent.",
      time: new Date().toISOString(),
    });
  }
});


    // --- FILE MESSAGE ---
socket.on("send-file", async (data) => {
  try {
    let targetId;

    if (socket.role === "customer") {
      targetId = customers[socket.id];
    } else if (socket.role === "agent") {
      targetId = Object.keys(customers).find(id => customers[id] === socket.id);
    }

    if (!targetId) {
      return socket.emit("chat-message", {
        sender: "System",
        text: "No active chat to send file.",
        time: new Date().toISOString(),
      });
    }

    // --- Send file in real-time ---
    sendFile(io, socket, targetId, data);

    // --- Save file message in DB ---
    let chat = await Chat.findOne({
      participants: { $all: [socket.id, targetId] },
      status: "active"
    });

    if (!chat) {
      // Create new chat if it doesn't exist
      chat = new Chat({
        participants: [
          { id: socket.id, username: socket.username, role: socket.role },
          { id: targetId, username: io.sockets.sockets.get(targetId)?.username, role: socket.role === "agent" ? "customer" : "agent" }
        ],
        messages: [],
        status: "active",
        startTime: new Date()
      });
    }

    chat.messages.push({
      sender: socket.id,
      senderUsername: socket.username,
      fileUrl: data.fileUrl,
      originalName: data.originalName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      type: "file",
      time: new Date()
    });

    await chat.save();

    // --- Optional: update in-memory for immediate access ---
    addMessageToChat(socket.id, targetId, {
      sender: socket.id,
      senderUsername: socket.username,
      fileUrl: data.fileUrl,
      originalName: data.originalName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      time: new Date().toISOString(),
      type: "file"
    });

  } catch (err) {
    console.error("Error in send-file:", err);
    socket.emit("chat-message", {
      sender: "System",
      text: "File could not be sent.",
      time: new Date().toISOString(),
    });
  }
});


    // --- TYPING INDICATORS ---
socket.on("typing-start", async () => {
  try {
    let targetId;

    if (socket.role === "customer") {
      targetId = customers[socket.id];
    } else if (socket.role === "agent") {
      targetId = Object.keys(customers).find(id => customers[id] === socket.id);
    }

    if (!targetId) return;

    io.to(targetId).emit("user-typing", {
      userId: socket.id,
      username: socket.username
    });

    // Optional: save typing status in memory or DB if you want a persistent log
    // Example in-memory:
    // if (!typingStatus[chatId]) typingStatus[chatId] = {};
    // typingStatus[chatId][socket.id] = true;

  } catch (err) {
    console.error("Error in typing-start:", err);
  }
});


socket.on("typing-stop", async () => {
  try {
    let targetId;

    if (socket.role === "customer") {
      targetId = customers[socket.id];
    } else if (socket.role === "agent") {
      targetId = Object.keys(customers).find(id => customers[id] === socket.id);
    }

    if (!targetId) return;

    io.to(targetId).emit("user-stop-typing", {
      userId: socket.id
    });

    // Optional: clear typing status from memory if you are tracking it
    // if (typingStatus[chatId] && typingStatus[chatId][socket.id]) {
    //   delete typingStatus[chatId][socket.id];
    // }

  } catch (err) {
    console.error("Error in typing-stop:", err);
  }
});


    // --- END CHAT ---
socket.on("end-chat", async () => {
  try {
    let agentId, customerId;

    if (customers[socket.id]) {
      // Customer is ending the chat
      agentId = customers[socket.id];
      customerId = socket.id;
    } else {
      // Agent is ending the chat
      customerId = Object.keys(customers).find(id => customers[id] === socket.id);
      agentId = socket.id;
    }

    if (!customerId || !agentId) return;

    // Release agent
    releaseAgent(agents, agentId);
    const agent = getAgentById(agents, agentId);
    if (agent) {
      agent.currentCustomer = null;
      agent.status = "free";
    }

    // Update chat status to ended
    const chat = findChatByParticipants(agentId, customerId);
    if (chat) {
      chat.status = "ended";
      chat.endTime = new Date().toISOString();

      addMessageToChat(agentId, customerId, {
        sender: "system",
        senderUsername: "System",
        text: `${socket.role === "customer" ? "Customer" : "Agent"} ended the chat`,
        time: new Date().toISOString(),
        type: "system"
      });

      // Optional: save chat to MongoDB
      // await ChatModel.findByIdAndUpdate(chat._id, { status: 'ended', endTime: chat.endTime });
    }

    // Notify both users
    io.to(agentId).emit("chat-message", {
      sender: "System",
      text: `${socket.role === "customer" ? "Customer" : "Agent"} ended the chat.`,
      time: new Date().toISOString()
    });

    io.to(customerId).emit("chat-message", {
      sender: "System",
      text: `${socket.role === "customer" ? "Customer" : "Agent"} ended the chat.`,
      time: new Date().toISOString()
    });

    io.to(agentId).emit("customer-disconnected");
    io.to(socket.id).emit("customer-disconnected");

    // Remove customer from memory
    delete customers[customerId];

    // Update agent list
    emitAgentList(io);
    console.log("Current customers:", customers);

    // Optionally notify all clients of updated chat history
    io.emit("chat-history", { chats: getAllChats() });

  } catch (err) {
    console.error("Error in end-chat:", err);
  }
});


    // --- DISCONNECT ---
socket.on("disconnect", async () => {
  console.log(`❌ Disconnected: ${socket.username || socket.id}`);

  try {
    let agentId, customerId;

    const agentIndex = agents.findIndex(a => a.socketId === socket.id);

    if (agentIndex !== -1) {
      // Agent disconnected
      const agent = agents[agentIndex];
      customerId = Object.keys(customers).find(id => customers[id] === socket.id);

      if (customerId) {
        // Update chat status to ended
        const chat = findChatByParticipants(socket.id, customerId);
        if (chat) {
          chat.status = "ended";
          chat.endTime = new Date().toISOString();
          addMessageToChat(socket.id, customerId, {
            sender: "system",
            senderUsername: "System",
            text: "Agent disconnected",
            time: new Date().toISOString(),
            type: "system"
          });

          // Optional: save chat status to DB
          // await ChatModel.findByIdAndUpdate(chat._id, { status: 'ended', endTime: chat.endTime });
        }

        io.to(customerId).emit("chat-message", {
          sender: "System",
          text: "Agent disconnected. Please wait for another agent.",
          time: new Date().toISOString()
        });

        delete customers[customerId];
      }

      agents.splice(agentIndex, 1);

    } else if (customers[socket.id]) {
      // Customer disconnected
      customerId = socket.id;
      agentId = customers[customerId];

      releaseAgent(agents, agentId);
      const agent = getAgentById(agents, agentId);
      if (agent) {
        agent.currentCustomer = null;
        agent.status = "free";
      }

      const chat = findChatByParticipants(agentId, customerId);
      if (chat) {
        chat.status = "ended";
        chat.endTime = new Date().toISOString();
        addMessageToChat(agentId, customerId, {
          sender: "system",
          senderUsername: "System",
          text: "Customer disconnected",
          time: new Date().toISOString(),
          type: "system"
        });

        // Optional: save chat status to DB
        // await ChatModel.findByIdAndUpdate(chat._id, { status: 'ended', endTime: chat.endTime });
      }

      io.to(agentId).emit("chat-message", {
        sender: "System",
        text: "Customer disconnected.",
        time: new Date().toISOString()
      });

      io.to(agentId).emit("customer-disconnected");
      delete customers[customerId];
    }

    emitAgentList(io);
    console.log("Current customers:", customers);

    // Notify all users of updated chat history
    io.emit("chat-history", { chats: getAllChats() });

  } catch (err) {
    console.error("Error handling disconnect:", err);
  }
});


    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  // --- Helper Functions ---
  async function sendMessage(io, socket, targetId, text) {
  // 1️⃣ Find or create the chat between sender and target
  const chat = await findOrCreateChat(socket.id, targetId);

  // 2️⃣ Create message document in DB
  const message = await Message.create({
    chatId: chat._id,
    senderId: socket.id,
    senderUsername: socket.username,
    text: text,
    type: "text",
    role: socket.role,
    time: new Date(),
  });

  // 3️⃣ Prepare payload for frontend
  const payload = {
    sender: socket.username,
    text,
    time: message.time.toISOString(),
    type: "text",
    role: socket.role,
  };

  // 4️⃣ Emit to recipient and sender
  io.to(targetId).emit("chat-message", payload);
  socket.emit("chat-message", payload);
}


async function sendFile(io, socket, targetId, fileData) {
  // 1️⃣ Find or create the chat between sender and target
  const chat = await findOrCreateChat(socket.id, targetId);

  // 2️⃣ Create message document in DB
  const message = await Message.create({
    chatId: chat._id,
    senderId: socket.id,
    senderUsername: socket.username,
    fileUrl: fileData.fileUrl,
    originalName: fileData.originalName,
    mimeType: fileData.mimeType,
    fileSize: fileData.fileSize,
    type: "file",
    role: socket.role,
    time: new Date(),
  });

  // 3️⃣ Prepare payload for frontend
  const payload = {
    sender: socket.username,
    fileUrl: fileData.fileUrl,
    originalName: fileData.originalName,
    mimeType: fileData.mimeType,
    fileSize: fileData.fileSize,
    time: message.time.toISOString(),
    type: "file",
    role: socket.role,
  };

  // 4️⃣ Emit to recipient and sender
  io.to(targetId).emit("chat-message", payload);
  socket.emit("chat-message", payload);
}


async function getAgentList() {
  // Fetch all agents from the User collection
  const agents = await User.find({ role: "agent" }, 'socketId username status currentCustomer').lean();

  // Map to the structure used by frontend
  return agents.map(a => ({
    id: a.socketId,
    username: a.username,
    status: a.status,
    currentCustomer: a.currentCustomer || null
  }));
}



async function emitAgentList(io) {
  try {
    const list = await getAgentList(); // fetch from DB
    console.log("📤 Emitting agent-list-update:", list);
    io.emit("agent-list-update", { agents: list });
  } catch (err) {
    console.error("❌ Error emitting agent list:", err);
  }
}

async function connectCustomerToAgent(customerSocket, agent) {
  try {
    const customerId = customerSocket.id;
    const agentId = agent.socketId;

    // 1. Update mappings in DB
    await Customers.updateOne(
      { socketId: customerId },
      { $set: { assignedAgent: agentId, username: customerSocket.username } },
      { upsert: true }
    );

    await Agents.updateOne(
      { socketId: agentId },
      { $set: { currentCustomer: customerId, status: "busy", username: agent.username } },
      { upsert: true }
    );

    // 2. Create chat if not exists
    let chat = await Chats.findOne({
      participants: { $all: [customerId, agentId] },
      status: "active"
    });

    if (!chat) {
      const chatDoc = new Chats({
        participants: [
          { id: customerId, username: customerSocket.username, role: "customer" },
          { id: agentId, username: agent.username, role: "agent" }
        ],
        messages: [],
        startTime: new Date(),
        status: "active"
      });
      chat = await chatDoc.save();
    }

    // 3. Add system message for connection
    const systemMessage = {
      sender: "system",
      senderUsername: "System",
      text: `Agent ${agent.username} is now connected to you.`,
      time: new Date(),
      type: "system"
    };

    await Messages.create({
      chatId: chat._id,
      ...systemMessage
    });

    // 4. Notify customer
    customerSocket.emit("agent-connected", {
      agentId,
      username: agent.username
    });

    // 5. Notify agent
    io.to(agentId).emit("customer-connected", {
      customerId,
      username: customerSocket.username
    });

    // 6. Send latest chat history to both
    const customerChats = await getChatHistoryForUser(customerId, "customer");
    const agentChats = await getChatHistoryForUser(agentId, "agent");

    customerSocket.emit("chat-history", { chats: customerChats });
    io.to(agentId).emit("chat-history", { chats: agentChats });

    // 7. Update agent list for everyone
    await emitAgentList(io);
  } catch (err) {
    console.error("❌ Error in connectCustomerToAgent:", err);
  }
}

  
  
async function createChat(customerId, agentId) {
  try {
    const customerSocket = io.sockets.sockets.get(customerId);
    const agentSocket = io.sockets.sockets.get(agentId);

    if (!customerSocket || !agentSocket) return null;

    const chatDoc = new Chats({
      participants: [
        { id: customerId, username: customerSocket.username, role: "customer" },
        { id: agentId, username: agentSocket.username, role: "agent" }
      ],
      messages: [],
      startTime: new Date(),
      status: "active"
    });

    const savedChat = await chatDoc.save();
    return savedChat._id.toString(); // return the DB-generated chat ID
  } catch (err) {
    console.error("❌ Error in createChat:", err);
    return null;
  }
}

  
async function findChatByParticipants(userA, userB) {
  try {
    const chat = await Chats.findOne({
      status: "active",
      "participants.id": { $all: [userA, userB] }
    });
    return chat; // Returns the Mongoose document or null
  } catch (err) {
    console.error("❌ Error in findChatByParticipants:", err);
    return null;
  }
}

  
  
async function addMessageToChat(userA, userB, message) {
  try {
    const chat = await Chats.findOne({
      status: "active",
      "participants.id": { $all: [userA, userB] }
    });

    if (chat) {
      chat.messages.push(message);
      await chat.save();
    }
  } catch (err) {
    console.error("❌ Error in addMessageToChat:", err);
  }
}

  
async function addSystemMessage(userA, userB, text) {
  const systemMessage = {
    sender: "system",
    senderUsername: "System",
    text,
    time: new Date().toISOString(),
    type: "system"
  };

  // 1️⃣ Add message to DB
  await addMessageToChat(userA, userB, systemMessage);

  // 2️⃣ Broadcast this system message to connected participants
  try {
    const chat = await Chats.findOne({
      status: "active",
      "participants.id": { $all: [userA, userB] }
    });

    if (chat) {
      chat.participants.forEach((p) => {
        io.to(p.id).emit("chat-message", systemMessage);
      });
    }
  } catch (err) {
    console.error("❌ Error in addSystemMessage:", err);
  }
}

  
  
async function getChatHistoryForUser(userId, userRole) {
  if (userRole === "admin") {
    return getAllChats(); // Assuming getAllChats is also converted to DB version
  }

  try {
    const chats = await Chats.find({
      "participants.id": userId
    })
    .sort({ startTime: -1 }) // most recent chats first
    .lean();

    // Only keep last 10 messages per chat
    const chatHistories = chats.map(chat => ({
      ...chat,
      messages: chat.messages.slice(-10)
    }));

    return chatHistories;
  } catch (err) {
    console.error("❌ Error in getChatHistoryForUser:", err);
    return [];
  }
}

  
 async function getAllChats() {
  try {
    const chats = await Chats.find({})
      .sort({ startTime: -1 }) // optional: most recent chats first
      .lean();

    // Limit messages to last 10 per chat
    return chats.map(chat => ({
      ...chat,
      messages: chat.messages.slice(-10)
    }));
  } catch (err) {
    console.error("❌ Error in getAllChats:", err);
    return [];
  }
}

async function isUserInChat(userId, userRole, chatId) {
  if (userRole === "admin") return true;

  try {
    const chat = await Chats.findById(chatId).lean();
    if (!chat) return false;

    return chat.participants.some(p => p.id === userId);
  } catch (err) {
    console.error("❌ Error in isUserInChat:", err);
    return false;
  }
}


async function findCustomerSocketByUsername(username) {
  try {
    const customer = await Customers.findOne({ username: username });
    if (!customer) return null;

    // Return a simplified object similar to a socket reference
    return {
      id: customer._id.toString(),
      username: customer.username,
      role: "customer"
    };
  } catch (err) {
    console.error("❌ Error in findCustomerByUsername:", err);
    return null;
  }
}


  function now() {
    return new Date().toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit",
      second: "2-digit"
    });
  }
};


