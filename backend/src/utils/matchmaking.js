const User = require("../models/User");

async function assignAgent(customerId) {
  try {
    const freeAgent = await User.findOneAndUpdate(
      { role: "agent", status: "free" },
      { 
        status: "busy", 
        currentCustomer: mongoose.Types.ObjectId(customerId) 
      },
      { new: true }
    ).lean();

    return freeAgent;
  } catch (err) {
    console.error("❌ Error in assignAgent:", err);
    return null;
  }
}

async function releaseAgent(agentSocketId) {
  try {
    const agent = await User.findOneAndUpdate(
      { socketId: agentSocketId, role: "agent" },
      { 
        status: "free", 
        currentCustomer: null 
      },
      { new: true }
    ).lean();

    return agent;
  } catch (err) {
    console.error("❌ Error in releaseAgent:", err);
    return null;
  }
}

async function getFreeAgents() {
  try {
    const freeAgents = await User.find({ 
      role: "agent", 
      status: "free" 
    }).lean();
    return freeAgents;
  } catch (err) {
    console.error("❌ Error in getFreeAgents:", err);
    return [];
  }
}

async function getAgentById(agentSocketId) {
  try {
    const agent = await User.findOne({ 
      socketId: agentSocketId, 
      role: "agent" 
    }).lean();
    return agent;
  } catch (err) {
    console.error("❌ Error in getAgentById:", err);
    return null;
  }
}

module.exports = {
  assignAgent,
  releaseAgent,
  getFreeAgents,
  getAgentById
};