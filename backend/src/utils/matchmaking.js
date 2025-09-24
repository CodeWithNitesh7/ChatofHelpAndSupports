const User = require("../models/User"); // adjust path if needed

// Assign a free agent from DB
async function assignAgent(customerId) {
  try {
    // Find one free agent and mark them busy
    const freeAgent = await User.findOneAndUpdate(
      { role: "agent", isAvailable: true },
      { isAvailable: false, currentCustomer: customerId },
      { new: true }
    ).lean();

    return freeAgent; // null if none found
  } catch (err) {
    console.error("❌ Error in assignAgent:", err);
    return null;
  }
}

// Release an agent in DB
async function releaseAgent(agentSocketId) {
  try {
    const agent = await User.findOneAndUpdate(
      { socketId: agentSocketId, role: "agent" },
      { isAvailable: true, currentCustomer: null },
      { new: true }
    ).lean();

    return agent;
  } catch (err) {
    console.error("❌ Error in releaseAgent:", err);
    return null;
  }
}

// Get all free agents
async function getFreeAgents() {
  try {
    const freeAgents = await User.find({ role: "agent", isAvailable: true }).lean();
    return freeAgents;
  } catch (err) {
    console.error("❌ Error in getFreeAgents:", err);
    return [];
  }
}

// Get agent by socketId
async function getAgentById(agentSocketId) {
  try {
    const agent = await User.findOne({ socketId: agentSocketId, role: "agent" }).lean();
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
