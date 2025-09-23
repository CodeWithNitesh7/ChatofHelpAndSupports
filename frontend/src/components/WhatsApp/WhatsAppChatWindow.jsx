// import React, { useRef, useEffect } from "react";
// import WhatsAppMessage from "./WhatsAppMessage";
// import WhatsAppComposer from "./WhatsAppComposer";
// import WhatsAppAgentChat from "./WhatsappAgentChat"; // Add this import

// export default function WhatsAppChatWindow({ 
//   username, 
//   chat = [], 
//   onSend, 
//   role, 
//   currentCustomer,
//   onRequestTransfer 
// }) {
//   const scrollRef = useRef(null);

//   useEffect(() => {
//     scrollRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [chat]);

//   // If user is an agent, use the AgentChat component
//   if (role === "agent") {
//     return (
//       <WhatsAppAgentChat 
//         currentCustomer={currentCustomer}
//         onTransferComplete={() => {
//           // Handle any cleanup after transfer
//           console.log("Transfer completed");
//         }}
//       />
//     );
//   }

//   // Original customer chat window
//   return (
//     <section className="flex-1 bg-[#0b141a] flex flex-col">
//       {/* Chat header */}
//       <div className="h-14 px-4 border-b border-[#233138] bg-[#202c33] flex items-center">
//         <div>
//           <div className="text-[#e9edef] font-medium">Live Support</div>
//           <div className="text-xs text-[#8696a0]">Chatting as {username}</div>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto px-6 py-4">
//         {Array.isArray(chat) && chat.length > 0 ? (
//           chat.map((m, i) => (
//             <WhatsAppMessage key={i} msg={m} me={username} />
//           ))
//         ) : (
//           <div className="h-full flex items-center justify-center">
//             <div className="text-[#8696a0] text-sm">
//               No messages yet — say hello 👋
//             </div>
//           </div>
//         )}
//         <div ref={scrollRef} />
//       </div>

//       {/* Composer */}
//       <WhatsAppComposer onSend={onSend} />
//     </section>
//   );
// }

























import React, { useRef, useEffect } from "react";
import WhatsAppMessage from "./WhatsAppMessage";
import WhatsAppComposer from "./WhatsAppComposer";
import WhatsAppAgentChat from "./WhatsappAgentChat";

export default function WhatsAppChatWindow({
  username,
  role,
  currentCustomer,
  onRequestTransfer,
  chat = {},           // default to empty object
  activeChatId,        // tells which chat to display
}) {
  const scrollRef = useRef(null);

  // Extract messages for the active chat safely
  const messages = Array.isArray(chat[activeChatId]) ? chat[activeChatId] : [];

  // Auto-scroll to the latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Agent view
  if (role === "agent") {
    return (
      <WhatsAppAgentChat
        currentCustomer={currentCustomer}
        onTransferComplete={() => console.log("Transfer completed")}
        chat={messages}  // pass only active chat messages
      />
    );
  }

  // Customer view
  return (
    <section className="flex-1 bg-[#0b141a] flex flex-col">
      {/* Chat header */}
      <div className="h-14 px-4 border-b border-[#233138] bg-[#202c33] flex items-center">
        <div>
          <div className="text-[#e9edef] font-medium">Live Support</div>
          <div className="text-xs text-[#8696a0]">Chatting as {username}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length > 0 ? (
          messages.map((m, i) => <WhatsAppMessage key={i} msg={m} me={m.role === "customer"} />)
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-[#8696a0] text-sm">
              No messages yet — say hello 👋
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Composer */}
      <WhatsAppComposer username={username} />
    </section>
  );
}



