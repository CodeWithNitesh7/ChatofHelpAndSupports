

// import React, { useState, useEffect } from "react";
// import { useSocket } from "../../context/SocketContext";
// import WhatsappMessage from "./WhatsAppMessage";
// import WhatsappComposer from "./WhatsAppComposer";

// const WhatsappAgentChat = ({ currentCustomer, onTransferComplete, agentName }) => {
//   const [freeAgents, setFreeAgents] = useState([]);
//   const [showTransferModal, setShowTransferModal] = useState(false);
//   const { socket,messages, sendMessage } = useSocket();

//   const [transferStatus, setTransferStatus] = useState(null);

//   // Register agent role once socket is ready
//   useEffect(() => {
//     if (!socket || !agentName) return;

//     console.log("🔑 Setting role for agent:", agentName);
//     socket.emit("set-role", { role: "agent", username: agentName });
//     console.log("⚡️ Emitting set-role:", { username: agentName, role: "agent" });

//     // Request agents list immediately
//     socket.emit("request-free-agents");
//   }, [socket, agentName]);

//   useEffect(() => {
//     console.log("🌀 Agents state changed:", freeAgents);
//   }, [freeAgents]);

//   // ✅ handleTransfer
//   const handleTransfer = (targetAgentId) => {
//     if (!currentCustomer?.socketId) {
//       alert("No customer selected or customer connection issue");
//       return;
//     }
//     socket.emit("transfer-customer", {
//       customerId: currentCustomer.socketId,
//       toAgentId: targetAgentId,
//     });
//     setShowTransferModal(false);
//   };

//   // ✅ handleAdminTransfer
//   const handleAdminTransfer = (targetAgentId) => {
//     if (!currentCustomer?.username) {
//       alert("Customer information not available");
//       return;
//     }
//     socket.emit("admin-transfer-customer", {
//       customerUsername: currentCustomer.username,
//       toAgentId: targetAgentId,
//     });
//     setShowTransferModal(false);
//   };

//   // ✅ Listeners
//   useEffect(() => {
//     if (!socket) return;

//     // const handleTransferSuccess = (data) => {
//     //   setTransferStatus({ type: "success", message: data.message });
//     //   setTimeout(() => setTransferStatus(null), 3000);
//     //   onTransferComplete?.();
//     // };

//     // const handleTransferFailed = (data) => {
//     //   setTransferStatus({ type: "error", message: data.message });
//     //   setTimeout(() => setTransferStatus(null), 3000);
//     // };

//     // const handleChatMessage = (message) => {
//     //   setChatMessages((prev) => [...prev, message]);
//     // };

//     // const handleAgentListUpdate = (data) => {
//     //   setFreeAgents(data.agents || []);
//     // };

//     // socket.on("transfer-success", handleTransferSuccess);
//     // socket.on("transfer-failed", handleTransferFailed);
//     // socket.on("agent-list-update", handleAgentListUpdate);

//     // return () => {
//     //   socket.off("transfer-success", handleTransferSuccess);
//     //   socket.off("transfer-failed", handleTransferFailed);
//     //   socket.off("chat-message", handleChatMessage);
//     //   socket.off("agent-list-update", handleAgentListUpdate);
//     // };
//   }, [socket, onTransferComplete]);

//   // ✅ Request free agents
//   const requestFreeAgents = () => {
//     socket.emit("request-free-agents");
//     setShowTransferModal(true);
//   };

//   // ✅ Send messages
//   const handleSendMessage = (messageData) => {
//     if (messageData.text) {
//       socket.emit("agent-message", messageData.text);
//       setChatMessages((prev) => [
//         ...prev,
//         { sender: "You", text: messageData.text, time: new Date().toLocaleTimeString(), type: "outgoing" },
//       ]);
//     } else if (messageData.fileUrl) {
//       socket.emit("send-file", { file: messageData });
//       setChatMessages((prev) => [
//         ...prev,
//         { sender: "You", fileUrl: messageData.fileUrl, originalName: messageData.originalName, mimeType: messageData.mimeType, time: new Date().toLocaleTimeString(), type: "file" },
//       ]);
//     }
//   };

//   // ✅ Reset chat when customer changes
//   useEffect(() => {
//     setChatMessages([]);
//   }, [currentCustomer]);

//   return (
//     <div className="flex-1 bg-[#0b141a] flex flex-col relative">
//       {/* Transfer Status */}
//       {transferStatus && (
//         <div
//           className={`fixed top-4 right-4 px-4 py-2 rounded-md z-50 ${
//             transferStatus.type === "success" ? "bg-green-600" : "bg-red-600"
//           } text-white`}
//         >
//           {transferStatus.message}
//         </div>
//       )}

//       {/* Header */}
//       <div className="h-14 px-4 border-b border-[#233138] bg-[#202c33] flex items-center justify-between">
//         <div>
//           <div className="text-[#e9edef] font-medium">
//             {currentCustomer ? `Chat with ${currentCustomer.username}` : "Live Support - Waiting for customer"}
//           </div>
//           <div className="text-xs text-[#8696a0]">
//             {currentCustomer ? `Customer ID: ${currentCustomer.socketId}` : "No active customer connection"}
//           </div>
//         </div>

//         {currentCustomer && (
//           <button
//             onClick={requestFreeAgents}
//             className="bg-[#128C7E] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0C6B58] transition-colors"
//           >
//             🔄 Transfer
//           </button>
//         )}
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto px-6 py-4">
//       {messages.length > 0 ? (
//   messages.map((message, index) => (
//     <WhatsappMessage key={index} msg={message} me={agentName || "You"} />
//   ))
// ) : (
//   <div className="h-full flex items-center justify-center">
//     <div className="text-[#8696a0] text-sm text-center">
//       {currentCustomer ? "No messages yet — start the conversation 👋" : "Waiting for customer connection..."}
//     </div>
//   </div>
// )}

//       </div>

//       {/* Composer */}
//       <WhatsappComposer username={agentName || "Agent"} disabled={!currentCustomer} />


//       {/* Transfer Modal */}
//       {showTransferModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-[#202c33] p-6 rounded-lg w-96 max-w-90vw">
//             <h3 className="text-white text-lg font-semibold mb-4">Transfer Customer</h3>

//             <div className="max-h-60 overflow-y-auto mb-4">
//               {freeAgents.length === 0 ? (
//                 <p className="text-[#8696a0] text-center">No available agents</p>
//               ) : (
//                 freeAgents.map((agent) => (
//                   <div
//                     key={agent.id}
//                     className="flex justify-between items-center p-3 hover:bg-[#2a3942] rounded mb-2"
//                   >
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
//                 className="bg-[#128C7E] text-white px-4 py-2 rounded text-sm hover:bg-[#0C6B58]"
//               >
//                 Refresh
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default WhatsappAgentChat;














import React, { useState, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import WhatsappMessage from "./WhatsAppMessage";
import WhatsappComposer from "./WhatsAppComposer";

const WhatsappAgentChat = ({ currentCustomer, onTransferComplete, agentName }) => {
  const [freeAgents, setFreeAgents] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferStatus, setTransferStatus] = useState(null);

  const { socket, messages, sendMessage } = useSocket();

  // Register agent role once socket is ready
  useEffect(() => {
    if (!socket || !agentName) return;

    console.log("🔑 Setting role for agent:", agentName);
    socket.emit("set-role", { role: "agent", username: agentName });
    socket.emit("request-free-agents");
  }, [socket, agentName]);

  useEffect(() => {
    console.log("🌀 Free agents state changed:", freeAgents);
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

  // ✅ Request free agents
  const requestFreeAgents = () => {
    socket.emit("request-free-agents");
    setShowTransferModal(true);
  };

  // ✅ Send messages via context
  const handleSendMessage = (messageData) => {
    if (messageData.text) {
      sendMessage({
        text: messageData.text,
        sender: agentName || "Agent",
        timestamp: Date.now(),
      });
    } else if (messageData.fileUrl) {
      sendMessage({
        fileUrl: messageData.fileUrl,
        originalName: messageData.originalName,
        mimeType: messageData.mimeType,
        size: messageData.size,
        sender: agentName || "Agent",
        timestamp: Date.now(),
      });
    }
  };

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
            {currentCustomer
              ? `Chat with ${currentCustomer.username}`
              : "Live Support - Waiting for customer"}
          </div>
          <div className="text-xs text-[#8696a0]">
            {currentCustomer
              ? `Customer ID: ${currentCustomer.socketId}`
              : "No active customer connection"}
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
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <WhatsappMessage key={index} msg={message} me={agentName || "You"} />
          ))
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-[#8696a0] text-sm text-center">
              {currentCustomer
                ? "No messages yet — start the conversation 👋"
                : "Waiting for customer connection..."}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <WhatsappComposer
        username={agentName || "Agent"}
        disabled={!currentCustomer}
      />

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#202c33] p-6 rounded-lg w-96 max-w-90vw">
            <h3 className="text-white text-lg font-semibold mb-4">
              Transfer Customer
            </h3>

            <div className="max-h-60 overflow-y-auto mb-4">
              {freeAgents.length === 0 ? (
                <p className="text-[#8696a0] text-center">
                  No available agents
                </p>
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
