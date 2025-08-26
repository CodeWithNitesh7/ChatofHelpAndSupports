// Debug logging for imports
console.log("Importing matchmaking functions...");
const matchmakingUtils = require("./src/utils/matchmaking");
console.log("Imported matchmaking utils:", Object.keys(matchmakingUtils));

// Destructure with fallbacks to avoid crashes
const {
  assignAgent = (agents) => {
    console.warn("assignAgent function not found, using fallback");
    const freeAgent = agents.find(agent => agent.status === "free");
    if (freeAgent) {
      freeAgent.status = "busy";
      return freeAgent;
    }
    return null;
  },
  releaseAgent = (agents, agentId) => {
    console.warn("releaseAgent function not found, using fallback");
    const agent = agents.find(a => a.socketId === agentId);
    if (agent) {
      agent.status = "free";
      agent.currentCustomer = null;
    }
  },
  getFreeAgents = (agents) => {
    console.warn("getFreeAgents function not found, using fallback");
    return agents.filter(agent => agent.status === "free");
  },
  getAgentById = (agents, agentId) => {
    console.warn("getAgentById function not found, using fallback");
    return agents.find(agent => agent.socketId === agentId);
  }
} = matchmakingUtils;

const agents = [];
const customers = {};

module.exports = function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    // --- ROLE SETUP ---
    socket.on("set-role", ({ role, username }) => {
      socket.username = username;
      socket.role = role;

      if (role === "agent") {
        // Check if agent already exists (reconnection)
        const existingAgentIndex = agents.findIndex(a => a.socketId === socket.id);
        if (existingAgentIndex !== -1) {
          agents[existingAgentIndex] = { 
            socketId: socket.id, 
            username, 
            status: "free",
            currentCustomer: null
          };
        } else {
          agents.push({ 
            socketId: socket.id, 
            username, 
            status: "free",
            currentCustomer: null
          });
        }
        
        console.log(`🟢 Agent joined: ${username}`);
        
        // Send current agent list to all agents
        io.emit("agent-list-update", getAgentList());
        
        // Send free agents list to the newly connected agent
        const freeAgents = getFreeAgents(agents).filter(agent => 
          agent.socketId !== socket.id
        );
        socket.emit("free-agents-list", {
          agents: freeAgents.map(agent => ({
            id: agent.socketId,
            username: agent.username
          }))
        });
      } else {
        console.log(`👤 Customer joined: ${username}`);
      }
    });

    // --- CUSTOMER MESSAGE ---
    socket.on("customer-message", (msg) => {
      if (customers[socket.id]) {
        const agentId = customers[socket.id];
        sendMessage(io, socket, agentId, msg);
        return;
      }

      const agent = assignAgent(agents);
      if (agent) {
        customers[socket.id] = agent.socketId;
        agent.currentCustomer = socket.id; // Track current customer
        
        sendMessage(io, socket, agent.socketId, msg);

        socket.emit("chat-message", {
          sender: "System",
          text: `Agent ${agent.username} connected to you`,
          time: now(),
        });

        io.to(agent.socketId).emit("chat-message", {
          sender: "System",
          text: `You are now connected to customer ${socket.username}`,
          time: now(),
        });

        // Emit customer connected event to agent
        io.to(agent.socketId).emit("customer-connected", {
          customerId: socket.id,
          username: socket.username
        });

        // Update agent list and free agents
        io.emit("agent-list-update", getAgentList());
        updateFreeAgentsList();

      } else {
        socket.emit("chat-message", {
          sender: "System",
          text: "All agents are busy. Please wait...",
          time: now(),
        });
      }
    });

    // --- AGENT TRANSFER REQUEST ---
// --- AGENT TRANSFER REQUEST ---
// --- AGENT TRANSFER REQUEST ---
socket.on("transfer-customer", ({ customerId, toAgentId }) => {
  console.log(`🔄 Transfer request from ${socket.username} (${socket.id}) for customer ${customerId} to agent ${toAgentId}`);
  
  if (socket.role !== "agent") {
    console.log("❌ Transfer failed: Socket is not an agent");
    return;
  }

  const currentAgent = getAgentById(agents, socket.id);
  const targetAgent = getAgentById(agents, toAgentId);
  
  console.log("Current agent:", currentAgent ? currentAgent.username : "Not found");
  console.log("Target agent:", targetAgent ? targetAgent.username : "Not found");
  console.log("Target agent status:", targetAgent ? targetAgent.status : "N/A");
  
  // Debug: Show all customers and their handlers
  console.log("📋 Current customers mapping:");
  Object.keys(customers).forEach(custId => {
    const agent = getAgentById(agents, customers[custId]);
    console.log(`   Customer ${custId} -> Agent: ${agent ? agent.username : 'Unknown'} (${customers[custId]})`);
  });
  
  // Debug: Show all agents and their status
  console.log("📋 All agents status:");
  agents.forEach(agent => {
    console.log(`   Agent ${agent.username} (${agent.socketId}): ${agent.status}, Customer: ${agent.currentCustomer}`);
  });

  if (!currentAgent) {
    console.log("❌ Transfer failed: Current agent not found");
    socket.emit("transfer-failed", {
      message: "Transfer failed. You are not a valid agent."
    });
    return;
  }

  if (!targetAgent) {
    console.log("❌ Transfer failed: Target agent not found");
    socket.emit("transfer-failed", {
      message: "Transfer failed. Target agent not found."
    });
    return;
  }

  if (targetAgent.status !== "free") {
    console.log("❌ Transfer failed: Target agent is not free");
    socket.emit("transfer-failed", {
      message: "Transfer failed. Agent is not available."
    });
    return;
  }

  // Check if customer exists in the system
  if (!customers[customerId]) {
    console.log("❌ Transfer failed: Customer not found in system");
    
    // Try to find customer by username instead of socket ID
    const customerSocket = findCustomerSocketByUsername(customerId);
    if (customerSocket && customers[customerSocket.id]) {
      console.log(`🔄 Found customer by username: ${customerSocket.id}`);
      customerId = customerSocket.id; // Use the actual socket ID
    } else {
      socket.emit("transfer-failed", {
        message: "Customer not found or not connected to any agent."
      });
      return;
    }
  }

  // Check if current agent is handling this customer
  if (customers[customerId] !== socket.id) {
    console.log(`❌ Transfer failed: Customer is handled by ${customers[customerId]}, not by ${socket.id}`);
    
    // Get the actual handler agent
    const actualHandler = getAgentById(agents, customers[customerId]);
    console.log(`   Actual handler: ${actualHandler ? actualHandler.username : 'Unknown'}`);
    
    socket.emit("transfer-failed", {
      message: `You are not handling this customer. Currently handled by ${actualHandler ? actualHandler.username : 'another agent'}.`
    });
    return;
  }

  // Perform transfer
  customers[customerId] = toAgentId;
  currentAgent.status = "free";
  currentAgent.currentCustomer = null;
  targetAgent.status = "busy";
  targetAgent.currentCustomer = customerId;

  // Notify all parties
  io.to(customerId).emit("chat-message", {
    sender: "System",
    text: `You have been transferred to agent ${targetAgent.username}`,
    time: now(),
  });

  io.to(socket.id).emit("chat-message", {
    sender: "System",
    text: `You transferred customer to ${targetAgent.username}`,
    time: now(),
  });

  io.to(toAgentId).emit("chat-message", {
    sender: "System",
    text: `You received a transferred customer from ${currentAgent.username}`,
    time: now(),
  });

  // Emit customer connected event to new agent and disconnected to old agent
  const customerSocket = io.sockets.sockets.get(customerId);
  if (customerSocket) {
    io.to(toAgentId).emit("customer-connected", {
      customerId: customerId,
      username: customerSocket.username,
      socketId: customerId
    });
  }
  io.to(socket.id).emit("customer-disconnected");

  // Update agent list and free agents
  io.emit("agent-list-update", getAgentList());
  updateFreeAgentsList();

  console.log(`✅ Transfer successful: ${currentAgent.username} → ${targetAgent.username} (Customer: ${customerId})`);
  
  // Send confirmation to frontend
  socket.emit("transfer-success", {
    message: `Customer successfully transferred to ${targetAgent.username}`,
    customerId: customerId,
    toAgentId: toAgentId
  });
});

// --- NEW: FIND CUSTOMER BY USERNAME ---
function findCustomerSocketByUsername(username) {
  const sockets = io.sockets.sockets;
  for (let [socketId, socket] of sockets) {
    if (socket.username === username && socket.role === "customer") {
      return socket;
    }
  }
  return null;
}

// --- NEW: MANUAL TRANSFER (ADMIN OVERRIDE) ---
socket.on("admin-transfer-customer", ({ customerUsername, toAgentId }) => {
  if (socket.role !== "agent") return;
  
  console.log(`🛠️ Admin transfer request for customer ${customerUsername} to agent ${toAgentId}`);
  
  const targetAgent = getAgentById(agents, toAgentId);
  if (!targetAgent || targetAgent.status !== "free") {
    socket.emit("transfer-failed", {
      message: "Target agent not available for transfer."
    });
    return;
  }
  
  // Find customer by username
  const customerSocket = findCustomerSocketByUsername(customerUsername);
  if (!customerSocket || !customers[customerSocket.id]) {
    socket.emit("transfer-failed", {
      message: "Customer not found or not connected."
    });
    return;
  }
  
  const customerId = customerSocket.id;
  const currentHandlerId = customers[customerId];
  const currentHandler = getAgentById(agents, currentHandlerId);
  
  // Perform transfer
  customers[customerId] = toAgentId;
  
  // Update old agent status if they exist
  if (currentHandler) {
    currentHandler.status = "free";
    currentHandler.currentCustomer = null;
    io.to(currentHandlerId).emit("customer-disconnected");
  }
  
  // Update new agent
  targetAgent.status = "busy";
  targetAgent.currentCustomer = customerId;
  
  // Notify all parties
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
    text: `You received customer ${customerSocket.username}${currentHandler ? ` from ${currentHandler.username}` : ''}`,
    time: now(),
  });
  
  io.to(toAgentId).emit("customer-connected", {
    customerId: customerId,
    username: customerSocket.username,
    socketId: customerId
  });
  
  // Update agent list
  io.emit("agent-list-update", getAgentList());
  updateFreeAgentsList();
  
  console.log(`✅ Admin transfer successful: ${customerUsername} → ${targetAgent.username}`);
  socket.emit("transfer-success", {
    message: `Customer ${customerUsername} transferred to ${targetAgent.username}`
  });
});

    // --- GET FREE AGENTS LIST ---
    socket.on("request-free-agents", () => {
      if (socket.role !== "agent") return;
      
      const freeAgents = getFreeAgents(agents).filter(agent => 
        agent.socketId !== socket.id // Exclude current agent
      );
      
      console.log(`📋 Free agents requested by ${socket.username}:`, freeAgents.map(a => a.username));
      
      socket.emit("free-agents-list", {
        agents: freeAgents.map(agent => ({
          id: agent.socketId,
          username: agent.username
        }))
      });
    });

    // --- AGENT MESSAGE ---
    socket.on("agent-message", (msg) => {
      const customerId = Object.keys(customers).find(
        (id) => customers[id] === socket.id
      );
      if (customerId) {
        sendMessage(io, socket, customerId, msg);
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
        } else {
          socket.emit("chat-message", {
            sender: "System",
            text: "No agent available to receive file.",
            time: now(),
          });
        }
      } else if (socket.role === "agent") {
        const customerId = Object.keys(customers).find(
          (id) => customers[id] === socket.id
        );
        if (customerId) {
          sendFile(io, socket, customerId, data);
        } else {
          socket.emit("chat-message", {
            sender: "System",
            text: "You are not connected to any customer.",
            time: now(),
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
        // Customer ending chat
        const agentId = customers[socket.id];
        releaseAgent(agents, agentId);
        const agent = getAgentById(agents, agentId);
        if (agent) agent.currentCustomer = null;

        io.to(agentId).emit("chat-message", {
          sender: "System",
          text: "Customer ended the chat.",
          time: now(),
        });
        
        // Emit customer disconnected event to agent
        io.to(agentId).emit("customer-disconnected");
        
        delete customers[socket.id];

        // Update agent list and free agents
        io.emit("agent-list-update", getAgentList());
        updateFreeAgentsList();

      } else {
        // Agent ending chat
        const customerId = Object.keys(customers).find(
          (id) => customers[id] === socket.id
        );
        if (customerId) {
          io.to(customerId).emit("chat-message", {
            sender: "System",
            text: "Agent ended the chat.",
            time: now(),
          });
          delete customers[customerId];
        }
        releaseAgent(agents, socket.id);
        const agent = getAgentById(agents, socket.id);
        if (agent) agent.currentCustomer = null;

        // Emit customer disconnected event to agent
        io.to(socket.id).emit("customer-disconnected");

        // Update agent list and free agents
        io.emit("agent-list-update", getAgentList());
        updateFreeAgentsList();
      }
    });

    // --- DISCONNECT ---
    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.username || socket.id}`);

      const agentIndex = agents.findIndex((a) => a.socketId === socket.id);
      if (agentIndex !== -1) {
        // Agent disconnected
        const agent = agents[agentIndex];
        
        // Release any customer this agent was handling
        const customerId = Object.keys(customers).find(
          (id) => customers[id] === socket.id
        );
        if (customerId) {
          io.to(customerId).emit("chat-message", {
            sender: "System",
            text: "Agent disconnected. Please wait for another agent.",
            time: now(),
          });
          delete customers[customerId];
        }
        
        agents.splice(agentIndex, 1);
        
        // Update agent list and free agents
        io.emit("agent-list-update", getAgentList());
        updateFreeAgentsList();
        
      } else if (customers[socket.id]) {
        // Customer disconnected
        const agentId = customers[socket.id];
        releaseAgent(agents, agentId);
        const agent = getAgentById(agents, agentId);
        if (agent) agent.currentCustomer = null;

        io.to(agentId).emit("chat-message", {
          sender: "System",
          text: "Customer disconnected.",
          time: now(),
        });
        
        // Emit customer disconnected event to agent
        io.to(agentId).emit("customer-disconnected");
        
        delete customers[socket.id];

        // Update agent list and free agents
        io.emit("agent-list-update", getAgentList());
        updateFreeAgentsList();
      }
    });

    // --- PING/PONG for connection health ---
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  // Helper function to update free agents list for all agents
  function updateFreeAgentsList() {
    const freeAgents = getFreeAgents(agents);
    io.emit("free-agents-update", {
      agents: freeAgents.map(agent => ({
        id: agent.socketId,
        username: agent.username
      }))
    });
  }
};

// --- Helpers ---
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
  return {
    agents: agents.map(a => ({
      id: a.socketId,
      username: a.username,
      status: a.status,
      currentCustomer: a.currentCustomer
    }))
  };
}

function now() {
  return new Date().toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit"
  });
}