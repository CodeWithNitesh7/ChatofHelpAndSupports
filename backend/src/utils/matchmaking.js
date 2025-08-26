function assignAgent(agents) {
  const freeAgent = agents.find(agent => agent.status === "free");
  if (freeAgent) {
    freeAgent.status = "busy";
    return freeAgent;
  }
  return null;
}

function releaseAgent(agents, agentId) {
  const agent = agents.find(a => a.socketId === agentId);
  if (agent) {
    agent.status = "free";
    agent.currentCustomer = null;
  }
}

function getFreeAgents(agents) {
  return agents.filter(agent => agent.status === "free");
}

function getAgentById(agents, agentId) {
  return agents.find(agent => agent.socketId === agentId);
}

// Make sure to export all functions correctly
module.exports = {
  assignAgent,
  releaseAgent,
  getFreeAgents,
  getAgentById
};