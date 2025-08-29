// import React, { useState, useEffect } from "react";

// export default function WhatsAppSidebar({ username, role, onLeave, socket }) {
//   const [agents, setAgents] = useState([]);
//   const [chats, setChats] = useState([]);
//   const [activeSection, setActiveSection] = useState("chats");
//   const [isSocketConnected, setIsSocketConnected] = useState(false);
//   const [isChatConnected, setIsChatConnected] = useState(false);
//   const [connectedUser, setConnectedUser] = useState(null);

//   useEffect(() => {
//     if (!socket) return;
    
//     // Check if socket is connected
//     setIsSocketConnected(socket.connected);
    
//     const handleConnect = () => {
//       console.log("✅ Socket connected");
//       setIsSocketConnected(true);
//     };
    
//     const handleDisconnect = () => {
//       console.log("❌ Socket disconnected");
//       setIsSocketConnected(false);
//       setIsChatConnected(false);
//       setConnectedUser(null);
//     };

//     // Listen to connection events
//     socket.on("connect", handleConnect);
//     socket.on("disconnect", handleDisconnect);

//     // Listen for chat connection events
//     socket.on("customer-connected", (data) => {
//       console.log("✅ Agent connected to customer:", data);
//       setIsChatConnected(true);
//       setConnectedUser(data);
//     });

//     socket.on("agent-connected", (data) => {
//       console.log("✅ Customer connected to agent:", data);
//       setIsChatConnected(true);
//       setConnectedUser(data);
//     });

//     socket.on("customer-disconnected", () => {
//       console.log("❌ Chat disconnected from customer");
//       setIsChatConnected(false);
//       setConnectedUser(null);
//     });

//     socket.on("agent-disconnected", () => {
//       console.log("❌ Chat disconnected from agent");
//       setIsChatConnected(false);
//       setConnectedUser(null);
//     });

//     console.log("🔌 Sidebar setting up listeners");

//     // Handle agent-list-update
//     socket.on("agent-list-update", (data) => {
//       console.log("📥 Received agent-list-update:", data);
//       if (data && Array.isArray(data.agents)) {
//         setAgents(data.agents);
//       } else if (data && data.agents && Array.isArray(data.agents)) {
//         setAgents(data.agents);
//       }
//     });

//     // Handle chat-history
//     socket.on("chat-history", (data) => {
//       console.log("📥 Received chat-history:", data);
//       if (data && Array.isArray(data.chats)) {
//         setChats(data.chats);
//       } else if (data && data.chats && Array.isArray(data.chats)) {
//         setChats(data.chats);
//       }
//     });

//     // Ask for initial data if socket is connected
//     if (socket.connected) {
//       socket.emit("request-agent-list");
//       socket.emit("request-chat-history");
      
//       // Also request current connection status
//       socket.emit("request-connection-status");
//     }

//     return () => {
//       socket.off("connect", handleConnect);
//       socket.off("disconnect", handleDisconnect);
//       socket.off("customer-connected");
//       socket.off("agent-connected");
//       socket.off("customer-disconnected");
//       socket.off("agent-disconnected");
//       socket.off("agent-list-update");
//       socket.off("chat-history");
//     };
//   }, [socket, role]);

//   const handleRefresh = () => {
//     if (!socket || !isSocketConnected) {
//       console.error("Socket is not connected, cannot refresh");
//       return;
//     }
    
//     try {
//       socket.emit("request-agent-list");
//       socket.emit("request-chat-history");
//       socket.emit("request-connection-status");
//     } catch (error) {
//       console.error("Error emitting refresh events:", error);
//     }
//   };

//   const handleChatClick = (chat) => {
//     if (!socket || !isSocketConnected) {
//       console.error("Socket is not connected, cannot load chat");
//       return;
//     }
    
//     try {
//       socket.emit("load-chat", { chatId: chat.id });
//     } catch (error) {
//       console.error("Error loading chat:", error);
//     }
//   };

//   const getStatusColor = (status) => {
//     return status === "free" ? "bg-green-500" : "bg-red-500";
//   };

//   const getStatusText = (status) => {
//     return status === "free" ? "Available" : "Busy";
//   };

//   const formatTime = (timeValue) => {
//     if (!timeValue) return '';
    
//     try {
//       if (typeof timeValue === 'string' || typeof timeValue === 'number') {
//         const date = new Date(timeValue);
//         return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//       }
//       return timeValue;
//     } catch (e) {
//       return timeValue;
//     }
//   };

//   const getChatTitle = (chat) => {
//     if (chat.participants && chat.participants.length > 0) {
//       if (role === 'customer') {
//         const agents = chat.participants.filter(p => p.role === 'agent');
//         if (agents.length > 0) {
//           return agents.map(a => a.username).join(', ');
//         }
//       } else if (role === 'agent') {
//         const customers = chat.participants.filter(p => p.role === 'customer');
//         if (customers.length > 0) {
//           return customers.map(c => c.username).join(', ');
//         }
//       }
      
//       return chat.participants
//         .filter(p => p.id !== socket?.id)
//         .map(p => p.username)
//         .join(', ');
//     }
//     return 'Unknown Chat';
//   };

//   const getLastMessage = (chat) => {
//     if (chat.messages && chat.messages.length > 0) {
//       const lastMsg = chat.messages[chat.messages.length - 1];
//       if (lastMsg.type === 'file') {
//         return `📎 ${lastMsg.originalName || 'File'}`;
//       }
//       return lastMsg.text || 'No message content';
//     }
//     return 'No messages yet';
//   };

//   const getConnectionStatus = () => {
//     if (!isSocketConnected) return "Socket Disconnected";
//     return isChatConnected ? "In active chat" : "Available";
//   };

//   const getConnectionStatusColor = () => {
//     if (!isSocketConnected) return "bg-red-500";
//     return isChatConnected ? "bg-green-500" : "bg-yellow-500";
//   };

//   const getConnectedUserInfo = () => {
//     if (!isChatConnected || !connectedUser) return null;
    
//     if (role === "customer") {
//       return `Connected to agent: ${connectedUser.username}`;
//     } else {
//       return `Connected to customer: ${connectedUser.username}`;
//     }
//   };

//   return (
//     <aside className="w-[360px] bg-[#111b21] border-r border-[#233138] flex flex-col">
//       {/* Top bar */}
//       <div className="h-14 px-4 flex items-center justify-between bg-[#202c33]">
//         <div className="text-[#e9edef] font-semibold">EduExpert Support</div>
//         <div className="flex items-center">
//           <div className={`w-2 h-2 rounded-full mr-2 ${getConnectionStatusColor()}`}></div>
//           <button
//             onClick={onLeave}
//             className="text-xs bg-rose-600 hover:bg-rose-500 text-white rounded px-3 py-1"
//           >
//             Leave
//           </button>
//         </div>
//       </div>

//       {/* User card */}
//       <div className="px-4 py-3 border-b border-[#233138]">
//         <div className="text-[#e9edef] font-medium">{username || "Guest"}</div>
//         <div className="text-xs text-[#8696a0] capitalize">{role}</div>
//         <div className="text-xs text-[#8696a0]">
//           Status: {getConnectionStatus()}
//         </div>
//         {isChatConnected && connectedUser && (
//           <div className="text-xs text-green-400 mt-1">
//             {getConnectedUserInfo()}
//           </div>
//         )}
//       </div>


//       {/* Section selector */}
//       <div className="flex border-b border-[#233138]">
//         <button
//           className={`flex-1 py-2 text-sm font-medium ${
//             activeSection === "chats" 
//               ? "text-[#e9edef] border-b-2 border-green-500" 
//               : "text-[#8696a0] hover:text-[#e9edef]"
//           }`}
//           onClick={() => setActiveSection("chats")}
//         >
//           Chats
//         </button>
//         <button
//           className={`flex-1 py-2 text-sm font-medium ${
//             activeSection === "agents" 
//               ? "text-[#e9edef] border-b-2 border-green-500" 
//               : "text-[#8696a0] hover:text-[#e9edef]"
//           }`}
//           onClick={() => setActiveSection("agents")}
//         >
//           Agents
//         </button>
//       </div>

//       {/* Content area */}
//       <div className="flex-1 overflow-y-auto">
//         {activeSection === "agents" ? (
//           <div className="p-4">
//             <div className="text-[#e9edef] font-medium mb-2">Agents Status</div>
//             <div className="text-xs text-[#8696a0] mb-3">
//               {agents.filter(a => a.status === 'free').length} of {agents.length} agents available
//             </div>
            
//             {agents.length === 0 ? (
//               <div className="text-center text-[#8696a0] text-sm py-4">
//                 No agents available
//               </div>
//             ) : (
//               agents.map((agent) => (
//                 <div key={agent.id} className="flex items-center mb-3 p-2 rounded hover:bg-[#202c33]">
//                   <div className="relative mr-3">
//                     <div className="w-10 h-10 rounded-full bg-[#6a7175] flex items-center justify-center text-white">
//                       {agent.username ? agent.username.charAt(0).toUpperCase() : "A"}
//                     </div>
//                     <div 
//                       className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111b21] ${getStatusColor(agent.status)}`}
//                     ></div>
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="text-[#e9edef] truncate">{agent.username}</div>
//                     <div className="text-xs text-[#8696a0]">
//                       {getStatusText(agent.status)}
//                       {agent.currentCustomer && " • In conversation"}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         ) : (
//           <div>
//             <div className="p-4 border-b border-[#233138]">
//               <div className="text-[#e9edef] font-medium mb-1">Chat History</div>
//               <div className="text-xs text-[#8696a0]">
//                 {chats.length} conversation{chats.length !== 1 ? 's' : ''}
//               </div>
//             </div>
            
//             {chats.length === 0 ? (
//               <div className="p-4 text-center text-[#8696a0] text-sm">
//                 No chat history yet. Start a conversation to see it here.
//               </div>
//             ) : (
//               chats.map((chat) => (
//                 <div 
//                   key={chat.id}
//                   className="p-3 border-b border-[#233138] cursor-pointer hover:bg-[#202c33]"
//                   onClick={() => handleChatClick(chat)}
//                 >
//                   <div className="flex justify-between items-start mb-1">
//                     <div className="text-[#e9edef] font-medium text-sm truncate max-w-[70%]">
//                       {getChatTitle(chat)}
//                     </div>
//                     <span className="text-xs text-[#8696a0] shrink-0">
//                       {formatTime(chat.startTime)}
//                     </span>
//                   </div>
                  
//                   <div className="text-xs text-[#8696a0] truncate mb-1">
//                     {getLastMessage(chat)}
//                   </div>
                  
//                   <div className="flex justify-between items-center">
//                     <span className={`text-xs ${
//                       chat.status === 'active' ? 'text-green-500' : 'text-[#8696a0]'
//                     }`}>
//                       {chat.status === 'active' ? 'Active' : 'Ended'}
//                     </span>
//                     {chat.messages && chat.messages.length > 0 && (
//                       <span className="text-xs text-[#8696a0]">
//                         {chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         )}
//       </div>

//       {/* Refresh button */}
//       <div className="p-3 border-t border-[#233138]">
//         <button
//           className={`w-full ${isSocketConnected ? 'bg-[#202c33] hover:bg-[#2a3b43]' : 'bg-gray-600 cursor-not-allowed'} text-[#e9edef] py-2 rounded text-sm`}
//           onClick={handleRefresh}
//           disabled={!isSocketConnected}
//         >
//           {isSocketConnected ? 'Refresh' : 'Disconnected'}
//         </button>
//       </div>
//     </aside>
//   );
// }


















































import React, { useState, useEffect } from "react";

export default function WhatsAppSidebar({ 
  username, 
  role, 
  onLeave, 
  socket, 
  onSelectChat, // NEW: parent handles switching chats
  activeChatId   // NEW: highlight selected chat
}) {
  const [agents, setAgents] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeSection, setActiveSection] = useState("chats");
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [connectedUser, setConnectedUser] = useState(null);

  useEffect(() => {
    if (!socket) return;

    setIsSocketConnected(socket.connected);

    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => {
      setIsSocketConnected(false);
      setIsChatConnected(false);
      setConnectedUser(null);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.on("customer-connected", (data) => {
      setIsChatConnected(true);
      setConnectedUser(data);
    });
    socket.on("agent-connected", (data) => {
      setIsChatConnected(true);
      setConnectedUser(data);
    });
    socket.on("customer-disconnected", () => {
      setIsChatConnected(false);
      setConnectedUser(null);
    });
    socket.on("agent-disconnected", () => {
      setIsChatConnected(false);
      setConnectedUser(null);
    });

    socket.on("agent-list-update", (data) => {
      if (data?.agents) setAgents(data.agents);
    });

    socket.on("chat-history", (data) => {
      if (data?.chats) setChats(data.chats);
    });

    if (socket.connected) {
      socket.emit("request-agent-list");
      socket.emit("request-chat-history");
      socket.emit("request-connection-status");
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("customer-connected");
      socket.off("agent-connected");
      socket.off("customer-disconnected");
      socket.off("agent-disconnected");
      socket.off("agent-list-update");
      socket.off("chat-history");
    };
  }, [socket, role]);

  const handleRefresh = () => {
    if (!socket?.connected) return;
    socket.emit("request-agent-list");
    socket.emit("request-chat-history");
    socket.emit("request-connection-status");
  };

  const handleChatClick = (chat) => {
    if (!socket?.connected) return;
    socket.emit("load-chat", { chatId: chat.id });
    onSelectChat?.(chat); // ✅ tell parent which chat is active
  };

  const getStatusColor = (status) =>
    status === "free" ? "bg-green-500" : "bg-red-500";

  const getStatusText = (status) =>
    status === "free" ? "Available" : "Busy";

  const formatTime = (timeValue) => {
    if (!timeValue) return "";
    try {
      return new Date(timeValue).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const getChatTitle = (chat) => {
    if (chat.participants?.length > 0) {
      if (role === "customer") {
        const agents = chat.participants.filter((p) => p.role === "agent");
        return agents.map((a) => a.username).join(", ") || "Agent";
      } else {
        const customers = chat.participants.filter((p) => p.role === "customer");
        return customers.map((c) => c.username).join(", ") || "Customer";
      }
    }
    return "Unknown Chat";
  };

  const getLastMessage = (chat) => {
    if (chat.messages?.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      return lastMsg.type === "file"
        ? `📎 ${lastMsg.originalName || "File"}`
        : lastMsg.text || "No content";
    }
    return "No messages yet";
  };

  return (
    <aside className="w-[360px] bg-[#111b21] border-r border-[#233138] flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between bg-[#202c33]">
        <div className="text-[#e9edef] font-semibold">EduExpert Support</div>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isSocketConnected ? "bg-green-500" : "bg-red-500"}`} />
          <button onClick={onLeave} className="text-xs bg-rose-600 hover:bg-rose-500 text-white rounded px-3 py-1">
            Leave
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-3 border-b border-[#233138]">
        <div className="text-[#e9edef] font-medium">{username || "Guest"}</div>
        <div className="text-xs text-[#8696a0] capitalize">{role}</div>
        <div className="text-xs text-[#8696a0]">
          Status: {isChatConnected ? "In active chat" : "Available"}
        </div>
        {isChatConnected && connectedUser && (
          <div className="text-xs text-green-400 mt-1">
            {role === "customer" ? `Connected to agent: ${connectedUser.username}` : `Connected to customer: ${connectedUser.username}`}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#233138]">
        {["chats", "agents"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`flex-1 py-2 text-sm font-medium ${
              activeSection === tab
                ? "text-[#e9edef] border-b-2 border-green-500"
                : "text-[#8696a0] hover:text-[#e9edef]"
            }`}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === "agents" ? (
          <div className="p-4">
            <div className="text-[#e9edef] font-medium mb-2">Agents Status</div>
            <div className="text-xs text-[#8696a0] mb-3">
              {agents.filter((a) => a.status === "free").length} of {agents.length} available
            </div>
            {agents.length === 0 ? (
              <div className="text-center text-[#8696a0] text-sm py-4">
                No agents online
              </div>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="flex items-center mb-3 p-2 rounded hover:bg-[#202c33] cursor-pointer">
                  <div className="relative mr-3">
                    <div className="w-10 h-10 rounded-full bg-[#6a7175] flex items-center justify-center text-white">
                      {agent.username?.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111b21] ${getStatusColor(agent.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#e9edef] truncate">{agent.username}</div>
                    <div className="text-xs text-[#8696a0]">{getStatusText(agent.status)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <div className="p-4 border-b border-[#233138]">
              <div className="text-[#e9edef] font-medium mb-1">Chat History</div>
              <div className="text-xs text-[#8696a0]">{chats.length} conversation(s)</div>
            </div>
            {chats.length === 0 ? (
              <div className="p-4 text-center text-[#8696a0] text-sm">
                No chat history yet
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className={`p-3 border-b border-[#233138] cursor-pointer hover:bg-[#202c33] ${
                    activeChatId === chat.id ? "bg-[#2a3b43]" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-[#e9edef] font-medium text-sm truncate max-w-[70%]">
                      {getChatTitle(chat)}
                    </div>
                    <span className="text-xs text-[#8696a0]">{formatTime(chat.startTime)}</span>
                  </div>
                  <div className="text-xs text-[#8696a0] truncate mb-1">
                    {getLastMessage(chat)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${chat.status === "active" ? "text-green-500" : "text-[#8696a0]"}`}>
                      {chat.status === "active" ? "Active" : "Ended"}
                    </span>
                    {chat.messages?.length > 0 && (
                      <span className="text-xs text-[#8696a0]">
                        {chat.messages.length} msg
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Refresh */}
      <div className="p-3 border-t border-[#233138]">
        <button
          onClick={handleRefresh}
          disabled={!isSocketConnected}
          className={`w-full ${
            isSocketConnected ? "bg-[#202c33] hover:bg-[#2a3b43]" : "bg-gray-600 cursor-not-allowed"
          } text-[#e9edef] py-2 rounded text-sm`}
        >
          {isSocketConnected ? "Refresh" : "Disconnected"}
        </button>
      </div>
    </aside>
  );
}
