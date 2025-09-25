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
      { 
        username, 
        status: "free", 
        currentCustomer: null 
      },
      { upsert: true, new: true }
    );

    // Assign any waiting customers
    const waitingCustomers = await User.find({ 
      role: "customer", 
      currentCustomer: null 
    }).lean();

    for (const customer of waitingCustomers) {
      const agent = await assignAgent(customer.socketId);
      if (!agent) break;

      const customerSocket = io.sockets.sockets.get(customer.socketId);
      if (customerSocket) {
        await connectCustomerToAgent(customerSocket, agent);
      }
    }
  } else if (role === "customer") {
    // Upsert customer in DB
    await User.findOneAndUpdate(
      { socketId: socket.id, role: "customer" },
      { 
        username, 
        currentCustomer: null 
      },
      { upsert: true, new: true }
    );

    console.log(`👤 Customer joined: ${username} (${socket.id})`);

    // Try to assign a free agent from DB
    const agent = await assignAgent(socket.id);
    if (agent) {
      await connectCustomerToAgent(socket, agent);
    } else {
      console.log(`⚠️ No free agent for customer ${username}, waiting in DB`);
    }
  }

  // Update agent list for everyone
  await emitAgentList(io);

  // Send agent list & chat history to this socket
  socket.emit("agent-list-update", { agents: await getAgentList() });
  const chats = await getChatHistoryForUser(socket.id, socket.role);
  socket.emit("chat-history", { chats });
});


    
    
    

socket.on("request-agent-list", async () => {
  try {
    console.log(`📤 Sending agent list to ${socket.id}`);
    const agents = await getAgentList(); // DB-based
    socket.emit("agent-list-update", { agents });
  } catch (err) {
    console.error("❌ Error sending agent list:", err);
    socket.emit("agent-list-update", { agents: [] });
  }
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
    } else {
      // Fetch chats where user is a participant
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
    console.error("❌ Error fetching chat history:", err);
    socket.emit("chat-error", { message: "Failed to load chat history" });
  }
});


    
    // --- LOAD SPECIFIC CHAT ---
socket.on("load-chat", async ({ chatId }) => {
  try {
    // Find chat in MongoDB
    const chat = await Chat.findById(chatId).lean();

    if (!chat) {
      return socket.emit("chat-error", { message: "Chat not found" });
    }

    // Check if user is authorized (participant or admin)
    const isParticipant = socket.role === "admin" || 
      chat.participants.some(p => p.id === socket.id);

    if (!isParticipant) {
      return socket.emit("chat-error", { message: "Not authorized to view this chat" });
    }

    // Send full chat object
    socket.emit("chat-loaded", { chat });
  } catch (err) {
    console.error("❌ Error loading chat:", err);
    socket.emit("chat-error", { message: "Failed to load chat" });
  }
});



    // --- CUSTOMER MESSAGE ---
    // In your socket handler file, update the customer-message event:
// In your socket handler file, update the customer-message event:
socket.on("customer-message", async (msg) => {
  try {
    console.log("📨 Customer message received:", msg);
    
    // Extract text from message object if needed
    const messageText = typeof msg === 'string' ? msg : msg.text || '';

    // Try to find an assigned agent for this customer
    let chat = await findOrCreateChatForCustomer(socket.id);
    let agentId = chat.participants.find(p => p.role === "agent")?.id;

    if (!agentId) {
      // No agent yet, assign one
      const agent = await assignAgent(socket.id);
      if (agent) {
        await connectCustomerToAgent(socket, agent);
        agentId = agent.socketId;
      } else {
        // No free agent, notify customer
        return socket.emit("chat-message", {
          sender: "System",
          text: "All agents are busy. Please wait...",
          time: new Date().toISOString(),
          type: "system"
        });
      }
    }

    // Send message to the agent using the corrected sendMessage function
    await sendMessage(io, socket, agentId, messageText);

  } catch (err) {
    console.error("❌ Error handling customer-message:", err);
    socket.emit("chat-message", {
      sender: "System",
      text: "Message could not be sent.",
      time: new Date().toISOString(),
      type: "system"
    });
  }
});



// Add this to your socket handler file
socket.on("request-connection-status", async () => {
  try {
    if (socket.role === "agent") {
      // Find the customer currently connected to this agent
      const customerId = Object.keys(customers).find(
        (id) => customers[id] === socket.id
      );

      if (customerId) {
        const customerSocket = io.sockets.sockets.get(customerId);
        let username = customerSocket?.username;

        // Fallback: fetch from DB if socket not found
        if (!username) {
          const user = await User.findById(customerId).lean();
          username = user?.username || "Unknown Customer";
        }

        socket.emit("customer-connected", { customerId, username });
      }
    } else if (socket.role === "customer") {
      const agentId = customers[socket.id];

      if (agentId) {
        const agentSocket = io.sockets.sockets.get(agentId);
        let username = agentSocket?.username;

        // Fallback: fetch from DB if agent socket not available
        if (!username) {
          const user = await User.findById(agentId).lean();
          username = user?.username || "Unknown Agent";
        }

        socket.emit("agent-connected", { agentId, username });
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

    const currentAgent = await getAgentById(socket.id);
    const targetAgent = await getAgentById(toAgentId);

    // Validate agents
    if (!currentAgent || !targetAgent || targetAgent.status !== "free") {
      return socket.emit("transfer-failed", { message: "Transfer failed. Agent is not available." });
    }

    // Validate customer
    if (!customers[customerId]) {
      return socket.emit("transfer-failed", { message: "Customer not found or not connected to any agent." });
    }

    if (customers[customerId] !== socket.id) {
      return socket.emit("transfer-failed", { message: "You are not handling this customer." });
    }

    const customerSocket = io.sockets.sockets.get(customerId);
    const customerUsername = customerSocket?.username || (await User.findById(customerId).lean())?.username || "Customer";

    // --- DB: find or create chat ---
    let chat = await Chat.findOne({
      participants: { $all: [socket.id, customerId] },
      status: "active"
    });

    if (!chat) {
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

    // Add system message
    const systemMessage = {
      sender: "system",
      senderUsername: "System",
      text: `Customer ${customerUsername} has been transferred from ${currentAgent.username} to ${targetAgent.username}`,
      time: new Date(),
      type: "system"
    };
    chat.messages.push(systemMessage);

    // Ensure target agent is in participants
    if (!chat.participants.some(p => p.id === toAgentId)) {
      chat.participants.push({ id: toAgentId, username: targetAgent.username, role: "agent" });
    }

    await chat.save();

    // --- Update in-memory mappings ---
    customers[customerId] = toAgentId;
    await releaseAgent(currentAgent.socketId); // mark current agent free
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
      io.to(toAgentId).emit("customer-connected", { customerId, username: customerUsername });
    }

    emitAgentList(io);
    console.log("Current customers:", customers);

    socket.emit("transfer-success", { message: `Customer successfully transferred to ${targetAgent.username}` });

  } catch (err) {
    console.error("Error in transfer-customer:", err);
    socket.emit("transfer-failed", { message: "Internal server error." });
  }
});



    // --- GET FREE AGENTS LIST ---
socket.on("request-free-agents", async () => {
  try {
    if (socket.role !== "agent") return;

    // Get free agents from in-memory list, excluding self
    let freeAgents = (await getFreeAgents()).filter(a => a.socketId !== socket.id);

    // Optional: fallback to DB if needed
    // const dbAgents = await User.find({ role: "agent", status: "free" }).lean();
    // freeAgents = dbAgents.filter(a => a._id.toString() !== socket.userId);

    // Emit list of free agents
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
      if (!chat.participants.some(p => p.id === targetAgent.socketId)) {
        chat.participants.push({ id: targetAgent.socketId, username: targetAgent.username, role: "agent" });
      }
      chat.messages.push({
        sender: "system",
        senderUsername: "System",
        text: `Customer ${customerSocket.username} has been transferred from ${currentHandler?.username || "Agent"} to ${targetAgent.username}`,
        time: new Date(),
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
      time: new Date()
    });

    if (currentHandler) {
      io.to(currentHandlerId).emit("chat-message", {
        sender: "System",
        text: `Customer ${customerSocket.username} was transferred to ${targetAgent.username}`,
        time: new Date()
      });
    }

    io.to(toAgentId).emit("chat-message", {
      sender: "System",
      text: `You received customer ${customerSocket.username}`,
      time: new Date()
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
    // Find the customer this agent is handling
    const customerId = Object.keys(customers).find(
      (id) => customers[id] === socket.id
    );

    if (!customerId) {
      return socket.emit("chat-message", {
        sender: "System",
        text: "You are not connected to any customer.",
        time: new Date()
      });
    }

    // --- Send message in real-time to customer ---
    sendMessage(io, socket, customerId, msg);

    // --- Save message in DB ---
    let chat = await findOrCreateChat(customerId, socket.id);

    chat.messages.push({
      sender: socket.id,
      senderUsername: socket.username,
      text: msg,
      type: "text",
      time: new Date(),
      role: socket.role
    });

    await chat.save();

    // --- Optional: in-memory update if needed ---
    addMessageToChat(socket.id, customerId, {
      sender: socket.id,
      senderUsername: socket.username,
      text: msg,
      time: new Date(),
      type: "text",
      role: socket.role
    });

  } catch (err) {
    console.error("Error in agent-message:", err);
    socket.emit("chat-message", {
      sender: "System",
      text: "Message could not be sent.",
      time: new Date()
    });
  }
});



    // --- FILE MESSAGE ---
socket.on("send-file", async (data) => {
  try {
    let targetId;
    let targetRole;

    // Determine target based on sender role
    if (socket.role === "customer") {
      targetId = customers[socket.id];
      targetRole = "agent";
    } else if (socket.role === "agent") {
      targetId = Object.keys(customers).find(id => customers[id] === socket.id);
      targetRole = "customer";
    }

    if (!targetId) {
      return socket.emit("chat-message", {
        sender: "system",
        text: "No active chat to send file.",
        timestamp: new Date()
      });
    }

    // --- Find or create chat in DB ---
    let chat = await Chat.findOne({
      "participants.id": { $all: [socket.id, targetId] },
      status: "active"
    });

    if (!chat) {
      chat = new Chat({
        participants: [
          { id: socket.id, username: socket.username, role: socket.role },
          { id: targetId, username: io.sockets.sockets.get(targetId)?.username || targetRole, role: targetRole }
        ],
        messages: [],
        status: "active",
        startTime: new Date()
      });
    }

    // --- Add file message to chat ---
    const fileMessage = {
      sender: socket.role,
      senderUsername: socket.username,
      type: "file",
      fileUrl: data.fileUrl,
      originalName: data.originalName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      timestamp: new Date()
    };

    chat.messages.push(fileMessage);
    await chat.save();

    // --- Emit file message to the other user ---
    io.to(targetId).emit("chat-message", fileMessage);
    socket.emit("chat-message", fileMessage); // Optional: send to self as confirmation

  } catch (err) {
    console.error("Error in send-file:", err);
    socket.emit("chat-message", {
      sender: "system",
      text: "File could not be sent.",
      timestamp: new Date()
    });
  }
});



    // --- TYPING INDICATORS ---
socket.on("typing-start", async () => {
  try {
    let targetId;

    // Determine the chat partner
    if (socket.role === "customer") {
      targetId = customers[socket.id];
    } else if (socket.role === "agent") {
      targetId = Object.keys(customers).find(id => customers[id] === socket.id);
    }

    if (!targetId) return;

    // Emit typing event to the other user
    io.to(targetId).emit("user-typing", {
      userId: socket.id,
      username: socket.username
    });

    // Optional DB log if you want persistent typing status
    // const chat = await Chat.findOne({
    //   "participants.id": { $all: [socket.id, targetId] },
    //   status: "active"
    // });
    // if (chat) {
    //   chat.typingStatus = chat.typingStatus || {};
    //   chat.typingStatus[socket.id] = true;
    //   await chat.save();
    // }

  } catch (err) {
    console.error("Error in typing-start:", err);
  }
});



socket.on("typing-stop", async () => {
  try {
    let targetId;

    // Determine the chat partner
    if (socket.role === "customer") {
      targetId = customers[socket.id];
    } else if (socket.role === "agent") {
      targetId = Object.keys(customers).find(id => customers[id] === socket.id);
    }

    if (!targetId) return;

    // Emit stop typing event to the other user
    io.to(targetId).emit("user-stop-typing", {
      userId: socket.id
    });

    // Optional DB log if you want persistent typing status
    // const chat = await Chat.findOne({
    //   "participants.id": { $all: [socket.id, targetId] },
    //   status: "active"
    // });
    // if (chat && chat.typingStatus) {
    //   delete chat.typingStatus[socket.id];
    //   await chat.save();
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

    // Release agent in memory
    releaseAgent(agents, agentId);
    const agent = getAgentById(agents, agentId);
    if (agent) {
      agent.currentCustomer = null;
      agent.status = "free";
    }

    // --- Update chat in DB ---
    const chat = await Chat.findOne({
      "participants.id": { $all: [agentId, customerId] },
      status: "active"
    });

    if (chat) {
      chat.status = "ended";
      chat.endTime = new Date();

      // Add system message
      chat.messages.push({
        sender: "system",
        senderUsername: "System",
        text: `${socket.role === "customer" ? "Customer" : "Agent"} ended the chat`,
        time: new Date(),
        type: "system"
      });

      await chat.save();
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
    io.to(customerId).emit("customer-disconnected");

    // Remove customer from memory
    delete customers[customerId];

    // Update agent list
    emitAgentList(io);
    console.log("Current customers:", customers);

    // Optionally emit updated chat history to all clients
    const allChats = await Chat.find().sort({ startTime: -1 }).limit(50);
    io.emit("chat-history", { chats: allChats });

  } catch (err) {
    console.error("Error in end-chat:", err);
  }
});



    // --- DISCONNECT ---
socket.on("disconnect", async () => {
  console.log(`❌ Disconnected: ${socket.username || socket.id}`);

  try {
    // 1. Find the user in DB
    const user = await User.findOne({ socketId: socket.id });
    if (!user) return;

    // --- Agent disconnect ---
    if (user.role === "agent") {
      // Find active chat(s) where this agent is participating
      const chats = await Chat.find({ "participants.id": socket.id, status: "active" });

      for (const chat of chats) {
        chat.status = "ended";
        chat.endTime = new Date();
        chat.messages.push({
          sender: "system",
          senderUsername: "System",
          text: "Agent disconnected",
          time: new Date(),
          type: "system"
        });
        await chat.save();

        // Notify the customer
        const customerParticipant = chat.participants.find(p => p.role === "customer");
        if (customerParticipant) {
          io.to(customerParticipant.id).emit("chat-message", {
            sender: "System",
            text: "Agent disconnected. Please wait for another agent.",
            time: new Date().toISOString()
          });
        }
      }

      // Mark agent as available again
      user.status = "free";
      user.currentCustomer = null;
      await user.save();
    }

    // --- Customer disconnect ---
    else if (user.role === "customer") {
      const chats = await Chat.find({ "participants.id": socket.id, status: "active" });

      for (const chat of chats) {
        chat.status = "ended";
        chat.endTime = new Date();
        chat.messages.push({
          sender: "system",
          senderUsername: "System",
          text: "Customer disconnected",
          time: new Date(),
          type: "system"
        });
        await chat.save();

        // Notify the agent
        const agentParticipant = chat.participants.find(p => p.role === "agent");
        if (agentParticipant) {
          io.to(agentParticipant.id).emit("chat-message", {
            sender: "System",
            text: "Customer disconnected.",
            time: new Date().toISOString()
          });
          io.to(agentParticipant.id).emit("customer-disconnected");

          // Update agent status
          const agentUser = await User.findOne({ socketId: agentParticipant.id });
          if (agentUser) {
            agentUser.status = "free";
            agentUser.currentCustomer = null;
            await agentUser.save();
          }
        }
      }
    }

    // 2. Remove customer from in-memory tracking
    delete customers[socket.id];

    // 3. Refresh agent list for all clients
    await emitAgentList(io);

    console.log("✅ Disconnect handled for user:", user.username || socket.id);
  } catch (err) {
    console.error("❌ Error handling disconnect:", err);
  }
});




    socket.on("ping", () => {
      socket.emit("pong");
    });
  });


  // Helper function to find or create chat between customer & agent
async function findOrCreateChat(customerId, agentId) {
  // Try to find an active chat between customer and agent
  let chat = await Chat.findOne({
    "participants.id": { $all: [customerId, agentId] },
    status: "active"
  });

  if (!chat) {
    // Get usernames from sockets if they exist
    const customerSocket = io.sockets.sockets.get(customerId);
    const agentSocket = io.sockets.sockets.get(agentId);

    chat = new Chat({
      participants: [
        {
          id: customerId,
          username: customerSocket?.username || "Customer",
          role: "customer"
        },
        {
          id: agentId,
          username: agentSocket?.username || "Agent",
          role: "agent"
        }
      ],
      messages: [],
      startTime: new Date(),
      status: "active"
    });

    await chat.save();
  }

  return chat;
}

  // --- Helper Functions ---
async function sendMessage(io, socket, targetId, msg) {
  try {
    // Ensure msg is a string, not an object
    const messageText = typeof msg === 'string' ? msg : msg.text || '';

    // 1️⃣ Find or create the chat between sender and target
    const chat = await findOrCreateChat(socket.id, targetId);
    if (!chat) {
      throw new Error("Could not create or find chat");
    }

    // 2️⃣ Create message object with correct enum values
    const message = {
      sender: socket.role, // This should be "customer" or "agent", not socket.id
      senderUsername: socket.username,
      text: messageText,
      type: "text",
      time: new Date()
    };

    // 3️⃣ Save message inside Chat document
    chat.messages.push(message);
    await chat.save();

    // 4️⃣ Prepare payload for frontend
    const payload = {
      sender: socket.username,
      text: messageText,
      time: message.time.toISOString(),
      type: "text",
      role: socket.role
    };

    // 5️⃣ Emit message to recipient and sender
    io.to(targetId).emit("chat-message", payload);
    socket.emit("chat-message", payload);

  } catch (err) {
    console.error("Error in sendMessage:", err);
    socket.emit("chat-message", {
      sender: "System",
      text: "Message could not be sent.",
      time: new Date().toISOString(),
      type: "system"
    });
  }
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
  try {
    // Fetch all agents from the User collection
    const agents = await User.find(
      { role: "agent" },
      "socketId username status currentCustomer"
    ).lean();

    // Map to the structure used by frontend with fallbacks
    return agents.map((a) => ({
      id: a.socketId,
      username: a.username || "Unknown Agent",
      status: a.status || "free",
      currentCustomer: a.currentCustomer || null,
    }));
  } catch (err) {
    console.error("Error fetching agent list:", err);
    return [];
  }
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
    const customerSocketId = customerSocket.id;
    const agentSocketId = agent.socketId;

    // Update in-memory tracking
    customers[customerSocketId] = agentSocketId;

    // Update customer in DB
    await User.findOneAndUpdate(
      { socketId: customerSocketId, role: "customer" },
      { 
        username: customerSocket.username,
        currentCustomer: agentSocketId 
      },
      { upsert: true, new: true }
    );

    // Update agent in DB
    await User.findOneAndUpdate(
      { socketId: agentSocketId, role: "agent" },
      { 
        username: agent.username,
        status: "busy",
        currentCustomer: customerSocketId 
      },
      { upsert: true, new: true }
    );

    // Find or create chat
    let chat = await Chat.findOne({
      "participants.id": { $all: [customerSocketId, agentSocketId] },
      status: "active"
    });

    if (!chat) {
      chat = new Chat({
        participants: [
          {
            id: customerSocketId,
            username: customerSocket.username,
            role: "customer"
          },
          {
            id: agentSocketId,
            username: agent.username,
            role: "agent"
          }
        ],
        messages: [],
        startTime: new Date(),
        status: "active"
      });
      await chat.save();
    }

    // Add system message - FIXED: use parameter names instead of undefined 'socket'
    const systemMessage = {
      sender: "system",
      senderUsername: "System",
      text: `Connected to ${agent.username}`,
      time: new Date(),
      type: "system"
    };
    
    chat.messages.push(systemMessage);
    await chat.save();

    // Notify both users
    customerSocket.emit("agent-connected", {
      agentId: agentSocketId,
      username: agent.username
    });

    io.to(agentSocketId).emit("customer-connected", {
      customerId: customerSocketId,
      username: customerSocket.username
    });

    // Send chat history
    const customerChats = await getChatHistoryForUser(customerSocketId, "customer");
    const agentChats = await getChatHistoryForUser(agentSocketId, "agent");

    customerSocket.emit("chat-history", { chats: customerChats });
    io.to(agentSocketId).emit("chat-history", { chats: agentChats });

    // Update agent list
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

    const chatDoc = new Chat({
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

  
async function findChatByParticipants(customerId, agentId) {
  const chat = await Chat.findOne({
    status: "active",
    customer: customerId,
    agent: agentId
  });
  return chat;
}

async function findOrCreateChatForCustomer(customerId) {
  try {
    // Find active chat for this customer
    let chat = await Chat.findOne({
      "participants.id": customerId,
      status: "active"
    });

    if (!chat) {
      // Create a new chat with just the customer
      const customerSocket = io.sockets.sockets.get(customerId);
      chat = new Chat({
        participants: [
          {
            id: customerId,
            username: customerSocket?.username || "Customer",
            role: "customer"
          }
        ],
        messages: [],
        startTime: new Date(),
        status: "active"
      });
      await chat.save();
    }

    return chat;
  } catch (err) {
    console.error("❌ Error in findOrCreateChatForCustomer:", err);
    return null;
  }
}
  
async function addMessageToChat(userA, userB, message) {
  try {
    const chat = await Chat.findOne({
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
    const chat = await Chat.findOne({
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
    const chats = await Chat.find({
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
    const chats = await Chat.find({})
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
    const chat = await Chat.findById(chatId).lean();
    if (!chat) return false;

    return chat.participants.some(p => p.id === userId);
  } catch (err) {
    console.error("❌ Error in isUserInChat:", err);
    return false;
  }
}


async function findCustomerSocketByUsername(username) {
  try {
    const customer = await User.findOne({ username:username, role: "customer" });
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


