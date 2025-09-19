import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [assignedAgent, setAssignedAgent] = useState(null);

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
    newSocket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // --- TYPING EVENTS ---
    newSocket.on("typing:start", (userId) => {
      setTypingUsers((prev) => [...new Set([...prev, userId])]);
    });

    newSocket.on("typing:stop", (userId) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    // --- ASSIGNMENT EVENTS ---
    newSocket.on("agent-connected", ({ agentId, username }) => {
      console.log("📩 Connected to agent:", username, agentId);
      setAssignedAgent({ agentId, username });
    });

    newSocket.on("customer-connected", ({ customerId, username }) => {
      console.log("👤 Customer connected:", username, customerId);
    });

    // cleanup
    return () => {
      newSocket.off("chat-message");
      newSocket.off("typing:start");
      newSocket.off("typing:stop");
      newSocket.off("agent-connected");
      newSocket.off("customer-connected");
      newSocket.disconnect();
    };
  }, []);

  // --- HELPERS (emitters) ---
  const sendMessage = useCallback(
    (msg, role = "customer") => {
      if (!socket) return;
      if (role === "agent") {
        socket.emit("agent-message", msg);
      } else {
        socket.emit("customer-message", msg);
      }
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
        assignedAgent,
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
