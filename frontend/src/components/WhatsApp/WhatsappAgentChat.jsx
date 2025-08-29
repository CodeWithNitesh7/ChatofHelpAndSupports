// import React, { useState, useEffect } from 'react';
// import { useSocket } from '../../context/SocketContext';
// import WhatsAppMessage from './WhatsAppMessage';
// import WhatsAppComposer from './WhatsAppComposer';

// const WhatsAppAgentChat = ({ currentCustomer, onTransferComplete, agentName }) => {
//   const { socket } = useSocket();
//   const [freeAgents, setFreeAgents] = useState([]);
//   const [showTransferModal, setShowTransferModal] = useState(false);
//   const [chatMessages, setChatMessages] = useState([]);
//   const [transferStatus, setTransferStatus] = useState(null);

//   // Register agent role once socket is ready
//   useEffect(() => {
//     if (!socket || !agentName) return;

//     console.log("🔑 Setting role for agent:", agentName);
//     socket.emit("set-role", { role: "agent", username: agentName });
//     console.log("⚡️ Emitting set-role:", { username, role });


//     // Request agents list immediately
//     socket.emit("request-free-agents");

//   }, [socket, agentName]);
//   useEffect(() => {
//     console.log("🌀 Agents state changed:", agents);
//   }, [agents]);
  
//   // Handle transfer
//   const handleTransfer = (targetAgentId) => {
//     if (!currentCustomer || !currentCustomer.socketId) {
//       alert('No customer selected or customer connection issue');
//       return;
//     }

//     console.log('➡️ Transfer initiated:', {
//       customer: currentCustomer.username,
//       customerSocketId: currentCustomer.socketId,
//       targetAgentId
//     });

//     socket.emit("transfer-customer", {
//       customerId: currentCustomer.socketId,
//       toAgentId: targetAgentId
//     });
    
//     setShowTransferModal(false);
//   };

//   // Admin transfer using username
//   const handleAdminTransfer = (targetAgentId) => {
//     if (!currentCustomer || !currentCustomer.username) {
//       alert('Customer information not available');
//       return;
//     }

//     console.log("👑 Admin transfer:", {
//       customerUsername: currentCustomer.username,
//       targetAgentId
//     });

//     socket.emit("admin-transfer-customer", {
//       customerUsername: currentCustomer.username,
//       toAgentId: targetAgentId
//     });
    
//     setShowTransferModal(false);
//   };

//   // Listen for transfer responses and messages
//   useEffect(() => {
//     if (!socket) return;

//     const handleTransferSuccess = (data) => {
//       console.log("✅ Transfer success:", data);
//       setTransferStatus({ type: 'success', message: data.message });
//       setTimeout(() => setTransferStatus(null), 3000);
//       if (onTransferComplete) onTransferComplete();
//     };

//     const handleTransferFailed = (data) => {
//       console.error("❌ Transfer failed:", data);
//       setTransferStatus({ type: 'error', message: data.message });
//       setTimeout(() => setTransferStatus(null), 3000);
//     };

//     const handleChatMessage = (message) => {
//       console.log("💬 Incoming message:", message);
//       setChatMessages(prev => [...prev, message]);
//     };

//     const handleAgentListUpdate = (data) => {
//       console.log("📋 Agent list update:", data.agents);
//       setFreeAgents(data.agents || []);
//     };

//     // Event listeners
//     socket.on("transfer-success", handleTransferSuccess);
//     socket.on("transfer-failed", handleTransferFailed);
//     socket.on("chat-message", handleChatMessage);

//     // ✅ Listen to the correct event
//     socket.on("agent-list-update", handleAgentListUpdate);

//     // Cleanup
//     return () => {
//       socket.off("transfer-success", handleTransferSuccess);
//       socket.off("transfer-failed", handleTransferFailed);
//       socket.off("chat-message", handleChatMessage);
//       socket.off("agent-list-update", handleAgentListUpdate);
//     };
//   }, [socket, onTransferComplete]);

//   // Request free agents list
//   const requestFreeAgents = () => {
//     console.log("🔄 Requesting free agents...");
//     socket.emit("request-free-agents");
//     setShowTransferModal(true);
//   };

//   // Send messages
//   const handleSendMessage = (messageData) => {
//     if (messageData.text) {
//       console.log("📤 Sending text:", messageData.text);
//       socket.emit("agent-message", messageData.text);

//       // Local echo
//       setChatMessages(prev => [...prev, {
//         sender: "You",
//         text: messageData.text,
//         time: new Date().toLocaleTimeString(),
//         type: "outgoing"
//       }]);
//     } else if (messageData.fileUrl) {
//       console.log("📤 Sending file:", messageData);
//       socket.emit("send-file", { file: messageData });

//       setChatMessages(prev => [...prev, {
//         sender: "You",
//         fileUrl: messageData.fileUrl,
//         originalName: messageData.originalName,
//         mimeType: messageData.mimeType,
//         time: new Date().toLocaleTimeString(),
//         type: "file"
//       }]);
//     }
//   };

//   // Reset chat when customer changes
//   useEffect(() => {
//     setChatMessages([]);
//   }, [currentCustomer]);

//   return (
//     <div className="flex-1 bg-[#0b141a] flex flex-col relative">
//       {/* Transfer Status */}
//       {transferStatus && (
//         <div className={`fixed top-4 right-4 px-4 py-2 rounded-md z-50 ${
//           transferStatus.type === "success" ? "bg-green-600" : "bg-red-600"
//         } text-white`}>
//           {transferStatus.message}
//         </div>
//       )}

//       {/* Chat header */}
//       <div className="h-14 px-4 border-b border-[#233138] bg-[#202c33] flex items-center justify-between">
//         <div>
//           <div className="text-[#e9edef] font-medium">
//             {currentCustomer 
//               ? `Chat with ${currentCustomer.username}` 
//               : 'Live Support - Waiting for customer'}
//           </div>
//           <div className="text-xs text-[#8696a0]">
//             {currentCustomer 
//               ? `Customer ID: ${currentCustomer.socketId}` 
//               : 'No active customer connection'}
//           </div>
//         </div>

//         {currentCustomer && (
//           <button 
//             onClick={requestFreeAgents}
//             className="bg-[#128C7E] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0C6B58] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             🔄 Transfer
//           </button>
//         )}
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto px-6 py-4">
//         {chatMessages.length > 0 ? (
//           chatMessages.map((message, index) => (
//             <WhatsAppMessage key={index} msg={message} me="You" />
//           ))
//         ) : (
//           <div className="h-full flex items-center justify-center">
//             <div className="text-[#8696a0] text-sm text-center">
//               {currentCustomer 
//                 ? "No messages yet — start the conversation 👋" 
//                 : "Waiting for customer connection..."}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Composer */}
//       <WhatsAppComposer 
//         onSend={handleSendMessage} 
//         disabled={!currentCustomer}
//         placeholder={currentCustomer ? "Type a message" : "Waiting for customer..."}
//       />

//       {/* Transfer Modal */}
//       {showTransferModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-[#202c33] p-6 rounded-lg w-96 max-w-90vw">
//             <h3 className="text-white text-lg font-semibold mb-4">Transfer Customer</h3>

//             <div className="max-h-60 overflow-y-auto mb-4">
//               <h4 className="text-white text-sm font-medium mb-2">Available Agents:</h4>
//               {freeAgents.length === 0 ? (
//                 <p className="text-[#8696a0] text-center">No available agents</p>
//               ) : (
//                 freeAgents.map(agent => (
//                   <div key={agent.id} className="flex justify-between items-center p-3 hover:bg-[#2a3942] rounded mb-2">
//                     <span className="text-white">{agent.username}</span>
//                     <div className="flex gap-2">
//                       <button 
//                         onClick={() => handleTransfer(agent.id)}
//                         className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
//                       >
//                         Transfer
//                       </button>
//                       <button 
//                         onClick={() => handleAdminTransfer(agent.id)}
//                         className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
//                       >
//                         Admin
//                       </button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>

//             <div className="flex justify-between">
//               <button 
//                 onClick={() => setShowTransferModal(false)}
//                 className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
//               >
//                 Cancel
//               </button>
//               <button 
//                 onClick={requestFreeAgents}
//                 className="bg-[#128C7E] text-white px-4 py-2 rounded text-sm hover:bg-[#0C6B58]">
//                 Refresh
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default WhatsAppAgentChat;







import React, { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import WhatsappMessage from "./WhatsAppMessage";
import WhatsappComposer from "./WhatsAppComposer";

const WhatsappAgentChat = ({ currentCustomer, onTransferComplete, agentName }) => {
  const socket = useSocket();
  const [freeAgents, setFreeAgents] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [transferStatus, setTransferStatus] = useState(null);

  // Register agent role once socket is ready
  useEffect(() => {
    if (!socket || !agentName) return;

    console.log("🔑 Setting role for agent:", agentName);
    socket.emit("set-role", { role: "agent", username: agentName });
    console.log("⚡️ Emitting set-role:", { username: agentName, role: "agent" });

    // Request agents list immediately
    socket.emit("request-free-agents");
  }, [socket, agentName]);

  useEffect(() => {
    console.log("🌀 Agents state changed:", freeAgents);
  }, [freeAgents]);

  // ✅ handleTransfer
  const handleTransfer = (targetAgentId) => {
    if (!currentCustomer?.socketId) {
      alert("No customer selected or customer connection issue");
      return;
    }
    socket.emit("transfer-customer", {
      customerId: currentCustomer.socketId,
      toAgentId: targetAgentId,
    });
    setShowTransferModal(false);
  };

  // ✅ handleAdminTransfer
  const handleAdminTransfer = (targetAgentId) => {
    if (!currentCustomer?.username) {
      alert("Customer information not available");
      return;
    }
    socket.emit("admin-transfer-customer", {
      customerUsername: currentCustomer.username,
      toAgentId: targetAgentId,
    });
    setShowTransferModal(false);
  };

  // ✅ Listeners
  useEffect(() => {
    if (!socket) return;

    const handleTransferSuccess = (data) => {
      setTransferStatus({ type: "success", message: data.message });
      setTimeout(() => setTransferStatus(null), 3000);
      onTransferComplete?.();
    };

    const handleTransferFailed = (data) => {
      setTransferStatus({ type: "error", message: data.message });
      setTimeout(() => setTransferStatus(null), 3000);
    };

    const handleChatMessage = (message) => {
      setChatMessages((prev) => [...prev, message]);
    };

    const handleAgentListUpdate = (data) => {
      setFreeAgents(data.agents || []);
    };

    socket.on("transfer-success", handleTransferSuccess);
    socket.on("transfer-failed", handleTransferFailed);
    socket.on("chat-message", handleChatMessage);
    socket.on("agent-list-update", handleAgentListUpdate);

    return () => {
      socket.off("transfer-success", handleTransferSuccess);
      socket.off("transfer-failed", handleTransferFailed);
      socket.off("chat-message", handleChatMessage);
      socket.off("agent-list-update", handleAgentListUpdate);
    };
  }, [socket, onTransferComplete]);

  // ✅ Request free agents
  const requestFreeAgents = () => {
    socket.emit("request-free-agents");
    setShowTransferModal(true);
  };

  // ✅ Send messages
  const handleSendMessage = (messageData) => {
    if (messageData.text) {
      socket.emit("agent-message", messageData.text);
      setChatMessages((prev) => [
        ...prev,
        { sender: "You", text: messageData.text, time: new Date().toLocaleTimeString(), type: "outgoing" },
      ]);
    } else if (messageData.fileUrl) {
      socket.emit("send-file", { file: messageData });
      setChatMessages((prev) => [
        ...prev,
        { sender: "You", fileUrl: messageData.fileUrl, originalName: messageData.originalName, mimeType: messageData.mimeType, time: new Date().toLocaleTimeString(), type: "file" },
      ]);
    }
  };

  // ✅ Reset chat when customer changes
  useEffect(() => {
    setChatMessages([]);
  }, [currentCustomer]);

  return (
    <div className="flex-1 bg-[#0b141a] flex flex-col relative">
      {/* Transfer Status */}
      {transferStatus && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-md z-50 ${
            transferStatus.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white`}
        >
          {transferStatus.message}
        </div>
      )}

      {/* Header */}
      <div className="h-14 px-4 border-b border-[#233138] bg-[#202c33] flex items-center justify-between">
        <div>
          <div className="text-[#e9edef] font-medium">
            {currentCustomer ? `Chat with ${currentCustomer.username}` : "Live Support - Waiting for customer"}
          </div>
          <div className="text-xs text-[#8696a0]">
            {currentCustomer ? `Customer ID: ${currentCustomer.socketId}` : "No active customer connection"}
          </div>
        </div>

        {currentCustomer && (
          <button
            onClick={requestFreeAgents}
            className="bg-[#128C7E] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0C6B58] transition-colors"
          >
            🔄 Transfer
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {chatMessages.length > 0 ? (
          chatMessages.map((message, index) => <WhatsappMessage key={index} msg={message} me="You" />)
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-[#8696a0] text-sm text-center">
              {currentCustomer ? "No messages yet — start the conversation 👋" : "Waiting for customer connection..."}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <WhatsappComposer
        onSend={handleSendMessage}
        disabled={!currentCustomer}
        placeholder={currentCustomer ? "Type a message" : "Waiting for customer..."}
      />

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#202c33] p-6 rounded-lg w-96 max-w-90vw">
            <h3 className="text-white text-lg font-semibold mb-4">Transfer Customer</h3>

            <div className="max-h-60 overflow-y-auto mb-4">
              {freeAgents.length === 0 ? (
                <p className="text-[#8696a0] text-center">No available agents</p>
              ) : (
                freeAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex justify-between items-center p-3 hover:bg-[#2a3942] rounded mb-2"
                  >
                    <span className="text-white">{agent.username}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTransfer(agent.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Transfer
                      </button>
                      <button
                        onClick={() => handleAdminTransfer(agent.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Admin
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setShowTransferModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={requestFreeAgents}
                className="bg-[#128C7E] text-white px-4 py-2 rounded text-sm hover:bg-[#0C6B58]"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsappAgentChat;
