import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import JoinForm from "../components/Chat/JoinForm";
import ChatWindow from "../components/Chat/ChatWindow";

export default function ChatPage() {
  const socket = useSocket();
  const [step, setStep] = useState("join"); // "join" | "chat"
  const [role, setRole] = useState("customer");
  const [username, setUsername] = useState("");
  const [chat, setChat] = useState([]);

  // join chat
  const handleJoin = () => {
    if (!username.trim()) return;
    socket.emit("set-role", { role, username });
    setStep("chat");
  };

  // send message
  const handleSend = (text) => {
    if (role === "customer") {
      socket.emit("customer-message", text);
    } else {
      socket.emit("agent-message", text);
    }
  };

  // listen for messages
  useEffect(() => {
    if (!socket) return;

    socket.on("chat-message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    return () => socket.off("chat-message");
  }, [socket]);

  return (
    <div className="min-h-screen bg-[#13112c] text-slate-100 flex items-center justify-center p-4">
      {step === "join" ? (
        <JoinForm
          username={username}
          setUsername={setUsername}
          role={role}
          setRole={setRole}
          onJoin={handleJoin}
        />
      ) : (
        <ChatWindow
          username={username}
          role={role}
          chat={chat}
          onSend={handleSend}
          onLeave={() => window.location.reload()}
        />
      )}
    </div>
  );
}
