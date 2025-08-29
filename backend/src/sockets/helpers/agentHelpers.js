function getAgentList(agents) {
    return agents.map(a => ({
      id: a.socketId,
      username: a.username,
      status: a.status,
      currentCustomer: a.currentCustomer
    }));
  }
  
  function emitAgentList(io, agents) {
    const list = getAgentList(agents);
    console.log("📤 Emitting agent-list-update:", list);
    io.emit("agent-list-update", { agents: list });
  }
  
  function getAgentById(agents, id) {
    return agents.find(a => a.socketId === id);
  }
  
  module.exports = { getAgentList, emitAgentList, getAgentById };
  