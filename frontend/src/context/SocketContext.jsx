// import React, { createContext, useContext, useEffect, useState } from "react";
// import { io } from "socket.io-client";

// const SocketContext = createContext();

// export function SocketProvider({ children }) {
//   const [socket, setSocket] = useState(null);

//   useEffect(() => {
//     const newSocket = io("http://localhost:9000/"); // change to live backend when deployed
//     setSocket(newSocket);

//     return () => newSocket.close();
//   }, []);

//   return (
//     <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
//   );
// }

// export const useSocket = () => useContext(SocketContext);














import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const newSocket = io("http://localhost:9000", {
      transports: ["websocket"], // faster, avoids polling
    });

    setSocket(newSocket);

    // --- CONNECTION EVENTS ---
    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("✅ Connected to server:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("❌ Disconnected from server");
    });

    // --- MESSAGING EVENTS ---
    newSocket.on("message:new", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // --- TYPING EVENTS ---
    newSocket.on("typing:start", (userId) => {
      setTypingUsers((prev) => [...new Set([...prev, userId])]);
    });

    newSocket.on("typing:stop", (userId) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    // cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // --- HELPERS (emitters) ---
  const sendMessage = useCallback(
    (msg) => {
      if (!socket) return;
      socket.emit("message:send", msg);
    },
    [socket]
  );

  const startTyping = useCallback(
    (userId) => {
      if (!socket) return;
      socket.emit("typing:start", userId);
    },
    [socket]
  );

  const stopTyping = useCallback(
    (userId) => {
      if (!socket) return;
      socket.emit("typing:stop", userId);
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        messages,
        typingUsers,
        sendMessage,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
