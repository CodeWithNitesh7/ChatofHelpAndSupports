module.exports = function typingEvents(io, socket) {
    socket.on("typing-start", () => {
      // … typing start logic …
    });
  
    socket.on("typing-stop", () => {
      // … typing stop logic …
    });
  };
  