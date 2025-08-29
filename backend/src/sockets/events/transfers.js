module.exports = function transferEvents(io, socket) {
    socket.on("transfer-customer", ({ customerId, toAgentId }) => {
      // … logic copied from your sockethandler.js …
    });
  
    socket.on("admin-transfer-customer", ({ customerUsername, toAgentId }) => {
      // … logic copied from your sockethandler.js …
    });
  };
  