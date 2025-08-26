// import React, { useEffect, useState } from "react";
// import { useSocket } from "../context/SocketContext";
// import WhatsAppJoinForm from "../components/WhatsApp/WhatsAppJoinForm";
// import WhatsAppSidebar from "../components/WhatsApp/WhatsAppSidebar";
// import WhatsAppChatWindow from "../components/WhatsApp/WhatsAppChatWindow";

// export default function WhatsAppChatPage() {
//   const socket = useSocket();
//   const [step, setStep] = useState("join"); // "join" | "chat"
//   const [role, setRole] = useState("customer");
//   const [username, setUsername] = useState("");
//   const [chat, setChat] = useState([]); // messages [{sender,text,time}]

//   // join
//   const handleJoin = () => {
//     if (!username.trim()) return;
//     socket.emit("set-role", { role, username });
//     setStep("chat");
//   };

//   // send
//   const handleSend = (text) => {
//     if (role === "customer") socket.emit("customer-message", text);
//     else socket.emit("agent-message", text);
//   };

//   // receive
//   useEffect(() => {
//     if (!socket) return;

//     const onMsg = (data) => {
//       // data from backend: { sender, text, time }
//       setChat((prev) => [...prev, data]);
//     };

//     socket.on("chat-message", onMsg);
//     return () => {
//       socket.off("chat-message", onMsg);
//     };
//   }, [socket]);

//   if (step === "join") {
//     return (
//       <WhatsAppJoinForm
//         username={username}
//         setUsername={setUsername}
//         role={role}
//         setRole={setRole}
//         onJoin={handleJoin}
//       />
//     );
//   }

//   return (
//     <div className="h-screen w-screen bg-[#0b141a] overflow-hidden">
//       <div className="mx-auto h-full max-w-[1600px] flex">
//         <WhatsAppSidebar username={username} role={role} onLeave={() => window.location.reload()} />
//         <WhatsAppChatWindow username={username} chat={chat} onSend={handleSend} />
//       </div>
//     </div>
//   );
// }


// src/pages/WhatsAppChatPage.jsx
