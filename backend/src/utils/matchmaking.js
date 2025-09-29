function assignAgent(agents) {
  return agents.find(a => a.status === "free") || null;
}

function releaseAgent(agents, agentId) {
  const agent = agents.find(a => a.socketId === agentId);
  if (agent) {
    agent.status = "free";
    agent.currentCustomer = null;
  }
}

function getFreeAgents(agents) {
  return agents.filter(a => a.status === "free");
}

function getAgentById(agents, agentId) {
  return agents.find(a => a.socketId === agentId);
}

module.exports = {
  assignAgent,
  releaseAgent,
  getFreeAgents,
  getAgentById
};
