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
//   const [showTransferModal, setShowTransferModal] = useState(false);
//   const [freeAgents, setFreeAgents] = useState([]);
//   const [currentCustomer, setCurrentCustomer] = useState(null);

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

//   // Request free agents
//   const requestFreeAgents = () => {
//     socket.emit("request-free-agents");
//   };

//   // Handle transfer
//   const handleTransfer = (toAgentId) => {
//     if (!currentCustomer) return;
//     socket.emit("transfer-customer", { 
//       customerId: currentCustomer, 
//       toAgentId 
//     });
//     setShowTransferModal(false);
//   };

//   // receive messages
//   useEffect(() => {
//     if (!socket) return;

//     const onMsg = (data) => {
//       setChat((prev) => [...prev, data]);
//     };

//     socket.on("chat-message", onMsg);
//     return () => {
//       socket.off("chat-message", onMsg);
//     };
//   }, [socket]);

//   // Agent-specific socket listeners
//   useEffect(() => {
//     if (!socket || role !== "agent") return;

//     const onFreeAgentsList = (data) => {
//       setFreeAgents(data.agents);
//     };

//     const onTransferFailed = (data) => {
//       alert(data.message);
//     };

//     const onCustomerConnected = (customerData) => {
//       setCurrentCustomer(customerData);
//     };

//     const onCustomerDisconnected = () => {
//       setCurrentCustomer(null);
//     };

//     socket.on("free-agents-list", onFreeAgentsList);
//     socket.on("transfer-failed", onTransferFailed);
//     socket.on("customer-connected", onCustomerConnected);
//     socket.on("customer-disconnected", onCustomerDisconnected);

//     return () => {
//       socket.off("free-agents-list", onFreeAgentsList);
//       socket.off("transfer-failed", onTransferFailed);
//       socket.off("customer-connected", onCustomerConnected);
//       socket.off("customer-disconnected", onCustomerDisconnected);
//     };
//   }, [socket, role]);

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
        
//         {/* Main chat area with transfer functionality for agents */}
//         <div className="flex-1 flex flex-col relative">
//           {/* Transfer Button for Agents */}
//           {role === "agent" && currentCustomer && (
//             <button
//               onClick={() => {
//                 requestFreeAgents();
//                 setShowTransferModal(true);
//               }}
//               className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-md text-sm z-10"
//             >
//               Transfer
//             </button>
//           )}
          
//           <WhatsAppChatWindow username={username} chat={chat} onSend={handleSend} />
//         </div>
//       </div>

//       {/* Transfer Modal */}
//       {showTransferModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-[#202c33] p-6 rounded-lg w-80">
//             <h3 className="text-white text-lg mb-4">Transfer to Agent</h3>
//             <div className="max-h-60 overflow-y-auto">
//               {freeAgents.map(agent => (
//                 <div key={agent.id} className="flex justify-between items-center p-2 hover:bg-[#2a3942] rounded">
//                   <span className="text-white">{agent.username}</span>
//                   <button 
//                     onClick={() => handleTransfer(agent.id)}
//                     className="bg-green-600 text-white px-3 py-1 rounded text-sm"
//                   >
//                     Transfer
//                   </button>
//                 </div>
//               ))}
//               {freeAgents.length === 0 && (
//                 <p className="text-[#8696a0] text-center">No available agents</p>
//               )}
//             </div>
//             <button 
//               onClick={() => setShowTransferModal(false)}
//               className="mt-4 bg-gray-600 text-white px-4 py-2 rounded w-full"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




















import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import WhatsAppJoinForm from "../components/WhatsApp/WhatsAppJoinForm";
import WhatsAppSidebar from "../components/WhatsApp/WhatsAppSidebar";
import WhatsAppChatWindow from "../components/WhatsApp/WhatsAppChatWindow";

export default function WhatsAppChatPage() {
  const { socket, isConnected } = useSocket(); // ✅ get actual socket
  const [step, setStep] = useState("join"); // "join" | "chat"
  const [role, setRole] = useState("customer");
  const [username, setUsername] = useState("");
  const [chat, setChat] = useState([]); // messages [{sender,text,time}]
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [freeAgents, setFreeAgents] = useState([]);
  const [currentCustomer, setCurrentCustomer] = useState(null);

  // --- Join ---
  const handleJoin = () => {
    if (!username.trim()) return;
    if (socket && socket.emit) {
      socket.emit("set-role", { role, username });
      setStep("chat");
    }
  };

  // --- Send message ---
  const handleSend = (text) => {
    if (!socket || !socket.emit) return;

    if (role === "customer") socket.emit("customer-message", text);
    else socket.emit("agent-message", text);
  };

  // --- Request free agents ---
  const requestFreeAgents = () => {
    if (socket && socket.emit) socket.emit("request-free-agents");
  };

  // --- Transfer ---
  const handleTransfer = (toAgentId) => {
    if (!currentCustomer || !socket || !socket.emit) return;

    socket.emit("transfer-customer", {
      customerId: currentCustomer,
      toAgentId,
    });
    setShowTransferModal(false);
  };

  // --- Chat message listener ---
  useEffect(() => {
    if (!socket || !socket.on) return;

    const onMsg = (data) => {
      setChat((prev) => [...prev, data]);
    };

    socket.on("chat-message", onMsg);
    return () => {
      socket.off("chat-message", onMsg);
    };
  }, [socket]);

  // --- Agent-specific socket listeners ---
  useEffect(() => {
    if (!socket || !socket.on || role !== "agent") return;

    const onFreeAgentsList = (data) => {
      setFreeAgents(data.agents || []);
    };

    const onTransferFailed = (data) => {
      alert(data.message);
    };

    const onCustomerConnected = (customerData) => {
      setCurrentCustomer(customerData);
    };

    const onCustomerDisconnected = () => {
      setCurrentCustomer(null);
    };

    socket.on("free-agents-list", onFreeAgentsList);
    socket.on("transfer-failed", onTransferFailed);
    socket.on("customer-connected", onCustomerConnected);
    socket.on("customer-disconnected", onCustomerDisconnected);

    return () => {
      socket.off("free-agents-list", onFreeAgentsList);
      socket.off("transfer-failed", onTransferFailed);
      socket.off("customer-connected", onCustomerConnected);
      socket.off("customer-disconnected", onCustomerDisconnected);
    };
  }, [socket, role]);

  if (step === "join") {
    return (
      <WhatsAppJoinForm
        username={username}
        setUsername={setUsername}
        role={role}
        setRole={setRole}
        onJoin={handleJoin}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0b141a] overflow-hidden">
      <div className="mx-auto h-full max-w-[1600px] flex">
        <WhatsAppSidebar
          username={username}
          role={role}
          socket={socket}
          onLeave={() => window.location.reload()}
        />

        {/* Main chat area */}
        <div className="flex-1 flex flex-col relative">
          {/* Transfer Button */}
          {role === "agent" && currentCustomer && (
            <button
              onClick={() => {
                requestFreeAgents();
                setShowTransferModal(true);
              }}
              className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-md text-sm z-10"
            >
              Transfer
            </button>
          )}

          <WhatsAppChatWindow username={username} chat={chat} onSend={handleSend} />
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#202c33] p-6 rounded-lg w-80">
            <h3 className="text-white text-lg mb-4">Transfer to Agent</h3>
            <div className="max-h-60 overflow-y-auto">
              {freeAgents.length === 0 ? (
                <p className="text-[#8696a0] text-center">No available agents</p>
              ) : (
                freeAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex justify-between items-center p-2 hover:bg-[#2a3942] rounded"
                  >
                    <span className="text-white">{agent.username}</span>
                    <button
                      onClick={() => handleTransfer(agent.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Transfer
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowTransferModal(false)}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
