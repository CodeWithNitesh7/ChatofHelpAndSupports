const matchmakingUtils = require("./src/utils/matchmaking");

const {
  assignAgent,
  releaseAgent,
  getFreeAgents,
  getAgentById
} = matchmakingUtils;



let chats = [];
const agents = [];
const customers = {};
const waitingCustomers = [];

module.exports = function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);
    

    // --- ROLE SETUP ---
    socket.on("set-role", ({ role, username }) => {
      socket.role = role;
      socket.username = username;
    
      if (role === "agent") {
        // Remove any existing agent with the same socket.id before adding
  const existingIndex = agents.findIndex(a => a.socketId === socket.id);
  if (existingIndex !== -1) {
    agents.splice(existingIndex, 1);
  }

  agents.push({
    id: socket.id,
    username,
    status: "free",
    socketId: socket.id,
  });
        console.log(`✅ Agent registered: ${username} (${socket.id})`);
    
        // Check waiting customers
        while (waitingCustomers.length > 0) {
          const customerId = waitingCustomers.shift();
          const customerSocket = io.sockets.sockets.get(customerId);
          if (customerSocket) {
            connectCustomerToAgent(customerSocket, agents[agents.length - 1]); // last agent added
            break; // assign only one customer per agent for now
          }
        }
    
      } else if (role === "customer") {
        customers[socket.id] = null;
        console.log(`👤 Customer joined: ${username} (${socket.id})`);
    
        const agent = assignAgent(agents);
        if (agent) {
          connectCustomerToAgent(socket, agent);
        } else {
          waitingCustomers.push(socket.id);
          console.log(`⚠️ No free agent, customer added to waiting list: ${username}`);
        }
      }
    
      // Update agent list for everyone
      emitAgentList(io);
    
      // Send list & chat history to this socket
      socket.emit("agent-list-update", { agents: getAgentList() });
      socket.emit("chat-history", { chats: getChatHistoryForUser(socket.id, socket.role) });
    });
    
    
    

    socket.on("request-agent-list", () => {
      console.log(`📤 Sending agent list to ${socket.id}`);
      socket.emit("agent-list-update", { agents: getAgentList() })
    });
    
    // --- REQUEST CHAT HISTORY ---
    socket.on("request-chat-history", () => {
      console.log(`📤 Sending chat history to ${socket.id}`);
      socket.emit("chat-history", { chats: getChatHistoryForUser(socket.id, socket.role) });
    });
    
    // --- LOAD SPECIFIC CHAT ---
    socket.on("load-chat", ({ chatId }) => {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        // Check if user is authorized to view this chat
        if (isUserInChat(socket.id, socket.role, chat)) {
          socket.emit("chat-loaded", { chat });
        } else {
          socket.emit("chat-error", { message: "Not authorized to view this chat" });
        }
      } else {
        socket.emit("chat-error", { message: "Chat not found" });
      }
    });

    // --- CUSTOMER MESSAGE ---
    // In your socket handler file, update the customer-message event:
// In your socket handler file, update the customer-message event:
socket.on("customer-message", (msg) => {
  const agentId = customers[socket.id];

  if (agentId) {
    // Agent already assigned
    sendMessage(io, socket, agentId, msg);
    addMessageToChat(socket.id, agentId, {
      sender: socket.id,
      senderUsername: socket.username,
      text: msg,
      time: new Date(),
      type: "text"
    });
  } else {
    // Customer waiting: try to assign an available agent
    const agent = assignAgent(agents);

    if (agent) {
      connectCustomerToAgent(socket, agent);
      // Send the current message after connection
      sendMessage(io, socket, agent.socketId, msg);
      addMessageToChat(socket.id, agent.socketId, {
        sender: socket.id,
        senderUsername: socket.username,
        text: msg,
        time: new Date(),
        type: "text"
      });
    } else {
      // No agent free yet
      waitingCustomers.push(socket.id);
      socket.emit("chat-message", {
        sender: "System",
        text: "All agents are busy. Please wait...",
        time: now()
      });
    }
  }
});



// Add this to your socket handler file
// Add this to your socket handler file
socket.on("request-connection-status", () => {
  if (socket.role === "agent") {
    const customerId = Object.keys(customers).find(
      (id) => customers[id] === socket.id
    );
    if (customerId) {
      const customerSocket = io.sockets.sockets.get(customerId);
      if (customerSocket) {
        socket.emit("customer-connected", {
          customerId: customerId,
          username: customerSocket.username
        });
      }
    }
  } else if (socket.role === "customer") {
    const agentId = customers[socket.id];
    if (agentId) {
      const agent = getAgentById(agents, agentId);
      if (agent) {
        socket.emit("agent-connected", {
          agentId: agentId,
          username: agent.username
        });
      }
    }
  }
});

    // --- AGENT TRANSFER REQUEST ---
    socket.on("transfer-customer", ({ customerId, toAgentId }) => {
      if (socket.role !== "agent") return;

      const currentAgent = getAgentById(agents, socket.id);
      const targetAgent = getAgentById(agents, toAgentId);
      
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

      // Update chat with transfer information
      // Add system message for transfer
addSystemMessage(
  socket.id,
  customerId,
  `Customer ${customerSocket.username} has been transferred from ${currentAgent.username} to ${targetAgent.username}`
);

// Add new agent to chat participants
const chat = findChatByParticipants(socket.id, customerId);
if (chat) {
  chat.participants.push({
    id: targetAgent.socketId,
    username: targetAgent.username,
    role: "agent"
  });
}


      customers[customerId] = toAgentId;
      currentAgent.status = "free";
      currentAgent.currentCustomer = null;
      targetAgent.status = "busy";
      targetAgent.currentCustomer = customerId;

      io.to(customerId).emit("chat-message", {
        sender: "System",
        text: `You have been transferred to agent ${targetAgent.username}`,
        time: now(),
      });

      io.to(toAgentId).emit("chat-message", {
        sender: "System",
        text: `You received a transferred customer from ${currentAgent.username}`,
        time: now(),
      });

      const customerSocket = io.sockets.sockets.get(customerId);
      if (customerSocket) {
        io.to(toAgentId).emit("customer-connected", {
          customerId: customerId,
          username: customerSocket.username
        });
      }

      emitAgentList(io);
      console.log("Current customers:", customers);

      socket.emit("transfer-success", {
        message: `Customer successfully transferred to ${targetAgent.username}`
      });
    });

    // --- GET FREE AGENTS LIST ---
    socket.on("request-free-agents", () => {
      if (socket.role !== "agent") return;
    
      const freeAgents = getFreeAgents(agents).filter(a => a.socketId !== socket.id);
      socket.emit("free-agents-list", {
        agents: freeAgents.map(agent => ({
          id: agent.socketId,
          username: agent.username
        }))
      });
    });
    

    // --- ADMIN TRANSFER (OVERRIDE) ---
    socket.on("admin-transfer-customer", ({ customerUsername, toAgentId }) => {
      if (socket.role !== "agent") return;
      
      const targetAgent = getAgentById(agents, toAgentId);
      if (!targetAgent || targetAgent.status !== "free") {
        socket.emit("transfer-failed", {
          message: "Target agent not available for transfer."
        });
        return;
      }
      
      const customerSocket = findCustomerSocketByUsername(io, customerUsername);
      if (!customerSocket || !customers[customerSocket.id]) {
        socket.emit("transfer-failed", {
          message: "Customer not found or not connected."
        });
        return;
      }
      
      const customerId = customerSocket.id;
      const currentHandlerId = customers[customerId];
      const currentHandler = getAgentById(agents, currentHandlerId);
      
      // Update chat with transfer information
      // Add system message for admin transfer
addSystemMessage(
  currentHandlerId,
  customerId,
  `Customer ${customerSocket.username} has been transferred from ${currentHandler.username} to ${targetAgent.username}`
);

// Add new agent to chat participants
const chat = findChatByParticipants(currentHandlerId, customerId);
if (chat) {
  chat.participants.push({
    id: targetAgent.socketId,
    username: targetAgent.username,
    role: "agent"
  });
}

      
      customers[customerId] = toAgentId;
      
      if (currentHandler) {
        currentHandler.status = "free";
        currentHandler.currentCustomer = null;
        io.to(currentHandlerId).emit("customer-disconnected");
      }
      
      targetAgent.status = "busy";
      targetAgent.currentCustomer = customerId;
      
      io.to(customerId).emit("chat-message", {
        sender: "System",
        text: `You have been transferred to agent ${targetAgent.username}`,
        time: now(),
      });
      
      if (currentHandler) {
        io.to(currentHandlerId).emit("chat-message", {
          sender: "System",
          text: `Customer ${customerSocket.username} was transferred to ${targetAgent.username}`,
          time: now(),
        });
      }
      
      io.to(toAgentId).emit("chat-message", {
        sender: "System",
        text: `You received customer ${customerSocket.username}`,
        time: now(),
      });
      
      io.to(toAgentId).emit("customer-connected", {
        customerId: customerId,
        username: customerSocket.username
      });
      
      emitAgentList(io);
      console.log("Current customers:", customers);

      socket.emit("transfer-success", {
        message: `Customer ${customerUsername} transferred to ${targetAgent.username}`
      });
    });

    // --- AGENT MESSAGE ---
    socket.on("agent-message", (msg) => {
      const customerId = Object.keys(customers).find(
        (id) => customers[id] === socket.id
      );
      if (customerId) {
        sendMessage(io, socket, customerId, msg);
        addMessageToChat(socket.id, customerId, {
          sender: socket.id,
          senderUsername: socket.username,
          text: msg,
          time: new Date(),
          type: "text"
        });
      } else {
        socket.emit("chat-message", {
          sender: "System",
          text: "You are not connected to any customer.",
          time: now(),
        });
      }
    });

    // --- FILE MESSAGE ---
    socket.on("send-file", (data) => {
      if (socket.role === "customer") {
        const agentId = customers[socket.id];
        if (agentId) {
          sendFile(io, socket, agentId, data);
          addMessageToChat(socket.id, agentId, {
            sender: socket.id,
            senderUsername: socket.username,
            fileUrl: data.fileUrl,
            originalName: data.originalName,
            mimeType: data.mimeType,
            fileSize: data.fileSize,
            time: new Date(),
            type: "file"
          });
        }
      } else if (socket.role === "agent") {
        const customerId = Object.keys(customers).find(
          (id) => customers[id] === socket.id
        );
        if (customerId) {
          sendFile(io, socket, customerId, data);
          addMessageToChat(socket.id, customerId, {
            sender: socket.id,
            senderUsername: socket.username,
            fileUrl: data.fileUrl,
            originalName: data.originalName,
            mimeType: data.mimeType,
            fileSize: data.fileSize,
            time: new Date(),
            type: "file"
          });
        }
      }
    });

    // --- TYPING INDICATORS ---
    socket.on("typing-start", () => {
      if (socket.role === "customer" && customers[socket.id]) {
        io.to(customers[socket.id]).emit("user-typing", {
          userId: socket.id,
          username: socket.username
        });
      } else if (socket.role === "agent") {
        const customerId = Object.keys(customers).find(
          (id) => customers[id] === socket.id
        );
        if (customerId) {
          io.to(customerId).emit("user-typing", {
            userId: socket.id,
            username: socket.username
          });
        }
      }
    });

    socket.on("typing-stop", () => {
      if (socket.role === "customer" && customers[socket.id]) {
        io.to(customers[socket.id]).emit("user-stop-typing", {
          userId: socket.id
        });
      } else if (socket.role === "agent") {
        const customerId = Object.keys(customers).find(
          (id) => customers[id] === socket.id
        );
        if (customerId) {
          io.to(customerId).emit("user-stop-typing", {
            userId: socket.id
          });
        }
      }
    });

    // --- END CHAT ---
    socket.on("end-chat", () => {
      if (customers[socket.id]) {
        const agentId = customers[socket.id];
        releaseAgent(agents, agentId);
        const agent = getAgentById(agents, agentId);
        if (agent) {
          agent.currentCustomer = null;
          agent.status = "free";
        }

        // Update chat status to ended
        const chat = findChatByParticipants(agentId, socket.id);
        if (chat) {
          chat.status = "ended";
          chat.endTime = new Date();
          addMessageToChat(agentId, socket.id, {
            sender: "system",
            senderUsername: "System",
            text: "Customer ended the chat",
            time: new Date(),
            type: "system"
          });
        }

        io.to(agentId).emit("chat-message", {
          sender: "System",
          text: "Customer ended the chat.",
          time: now(),
        });
        
        io.to(agentId).emit("customer-disconnected");
        
        delete customers[socket.id];
        emitAgentList(io);
        console.log("Current customers:", customers);

      } else {
        const customerId = Object.keys(customers).find(
          (id) => customers[id] === socket.id
        );
        if (customerId) {
          // Update chat status to ended
          const chat = findChatByParticipants(socket.id, customerId);
          if (chat) {
            chat.status = "ended";
            chat.endTime = new Date();
            addMessageToChat(socket.id, customerId, {
              sender: "system",
              senderUsername: "System",
              text: "Agent ended the chat",
              time: new Date(),
              type: "system"
            });
          }
          
          io.to(customerId).emit("chat-message", {
            sender: "System",
            text: "Agent ended the chat.",
            time: now(),
          });
          delete customers[customerId];
        }
        releaseAgent(agents, socket.id);
        const agent = getAgentById(agents, socket.id);
        if (agent) {
          agent.currentCustomer = null;
          agent.status = "free";
        }

        io.to(socket.id).emit("customer-disconnected");
        emitAgentList(io);
        console.log("Current customers:", customers);
      }
      
      // Notify all users of updated chat history
      io.emit("chat-history", { chats: getAllChats() });
    });

    // --- DISCONNECT ---
    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.username || socket.id}`);

      const agentIndex = agents.findIndex((a) => a.socketId === socket.id);
      if (agentIndex !== -1) {
        const agent = agents[agentIndex];
        const customerId = Object.keys(customers).find(
          (id) => customers[id] === socket.id
        );
        if (customerId) {
          // Update chat status to ended
          const chat = findChatByParticipants(socket.id, customerId);
          if (chat) {
            chat.status = "ended";
            chat.endTime = new Date();
            addMessageToChat(socket.id, customerId, {
              sender: "system",
              senderUsername: "System",
              text: "Agent disconnected",
              time: new Date(),
              type: "system"
            });
          }
          
          io.to(customerId).emit("chat-message", {
            sender: "System",
            text: "Agent disconnected. Please wait for another agent.",
            time: now(),
          });
          delete customers[customerId];
        }
        
        agents.splice(agentIndex, 1);
        emitAgentList(io);
        console.log("Current customers:", customers);
        
      } else if (customers[socket.id]) {
        const agentId = customers[socket.id];
        releaseAgent(agents, agentId);
        const agent = getAgentById(agents, agentId);
        if (agent) {
          agent.currentCustomer = null;
          agent.status = "free";
        }
      
        const chat = findChatByParticipants(agentId, socket.id);
        if (chat) {
          chat.status = "ended";
          chat.endTime = new Date();
          addMessageToChat(agentId, socket.id, {
            sender: "system",
            senderUsername: "System",
            text: "Customer disconnected",
            time: new Date(),
            type: "system"
          });
        }
      
        io.to(agentId).emit("chat-message", {
          sender: "System",
          text: "Customer disconnected.",
          time: now(),
        });
      
        io.to(agentId).emit("customer-disconnected");
      
        delete customers[socket.id];
        emitAgentList(io);
      }
      
      
      // Notify all users of updated chat history
      io.emit("chat-history", { chats: getAllChats() });
    });

    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  // --- Helper Functions ---
  function sendMessage(io, socket, targetId, text) {
    const payload = { 
      sender: socket.username, 
      text, 
      time: now(),
      type: "text"
    };
    io.to(targetId).emit("chat-message", payload);
    socket.emit("chat-message", payload);
  }

  function sendFile(io, socket, targetId, fileData) {
    const payload = { 
      sender: socket.username, 
      fileUrl: fileData.fileUrl, 
      originalName: fileData.originalName,
      mimeType: fileData.mimeType,
      fileSize: fileData.fileSize,
      time: now(),
      type: "file"
    };
    io.to(targetId).emit("chat-message", payload);
    socket.emit("chat-message", payload);
  }

  function getAgentList() {
    return agents.map(a => ({
      id: a.socketId,
      username: a.username,
      status: a.status,
      currentCustomer: a.currentCustomer
    }));
  }

  function emitAgentList(io) {
    const list = getAgentList();
    console.log("📤 Emitting agent-list-update:", list);
    io.emit("agent-list-update", { agents: list });
  }
  function connectCustomerToAgent(customerSocket, agent) {
    const customerId = customerSocket.id;
    const agentId = agent.socketId;
  
    // 1. Assign mappings
    customers[customerId] = agentId;
    agent.currentCustomer = customerId;
    agent.status = "busy";
  
    // 2. Create chat if not exists
    let chat = findChatByParticipants(customerId, agentId);
    if (!chat) {
      const chatId = createChat(customerId, agentId);
      chat = findChatByParticipants(customerId, agentId);
    }
  
    // 3. Add system message for connection
    addMessageToChat(customerId, agentId, {
      sender: "system",
      senderUsername: "System",
      text: `Agent ${agent.username} is now connected to you.`,
      time: new Date(),
      type: "system"
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
    customerSocket.emit("chat-history", { chats: getChatHistoryForUser(customerId, "customer") });
    io.to(agentId).emit("chat-history", { chats: getChatHistoryForUser(agentId, "agent") });
  
    // 7. Update agent list for everyone
    emitAgentList(io);
  }
  
  
  function createChat(customerId, agentId) {
    const customerSocket = io.sockets.sockets.get(customerId);
    const agentSocket = io.sockets.sockets.get(agentId);
    
    if (!customerSocket || !agentSocket) return null;
    
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chat = {
      id: chatId,
      participants: [
        {
          id: customerId,
          username: customerSocket.username,
          role: "customer"
        },
        {
          id: agentId,
          username: agentSocket.username,
          role: "agent"
        }
      ],
      messages: [],
      startTime: new Date(),
      status: "active"
    };
    
    chats.push(chat);
    return chatId;
  }
  
  function findChatByParticipants(userA, userB) {
    return chats.find(chat => 
      chat.status === "active" &&
      chat.participants.some(p => p.id === userA) &&
      chat.participants.some(p => p.id === userB)
    );
  }
  
  
  function addMessageToChat(userA, userB, message) {
    const chat = chats.find(
      (c) =>
        c.status === "active" &&
        c.participants.some(p => p.id === userA) &&
        c.participants.some(p => p.id === userB)
    );
    if (chat) chat.messages.push(message);
  }
  
  function addSystemMessage(userA, userB, text) {
    const systemMessage = {
      sender: "system",
      senderUsername: "System",
      text,
      time: new Date(),
      type: "system"
    };
  
    addMessageToChat(userA, userB, systemMessage);
  
    // Broadcast this system message to both participants
    const chat = findChatByParticipants(userA, userB);
    if (chat) {
      chat.participants.forEach((p) => {
        io.to(p.id).emit("chat-message", systemMessage);
      });
    }
  }
  
  
  function getChatHistoryForUser(userId, userRole) {
    if (userRole === "admin") return getAllChats();
  
    return chats
      .filter(chat => chat.participants.some(p => p.id === userId))
      .map(chat => ({
        ...chat,
        messages: chat.messages.slice(-10)
      }));
  }
  
  
  function getAllChats() {
    return chats.map(chat => ({
      ...chat,
      // Don't send full message history for performance
      messages: chat.messages.slice(-10)
    }));
  }
  
  function isUserInChat(userId, userRole, chat) {
    if (userRole === "admin") return true;
    return chat.participants.some(p => p.id === userId);
  }

  function findCustomerSocketByUsername(io, username) {
    const sockets = io.sockets.sockets;
    for (let [socketId, socket] of sockets) {
      if (socket.username === username && socket.role === "customer") {
        return socket;
      }
    }
    return null;
  }

  function now() {
    return new Date().toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit",
      second: "2-digit"
    });
  }
};


