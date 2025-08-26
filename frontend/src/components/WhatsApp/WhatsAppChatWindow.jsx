import React, { useRef, useEffect } from "react";
import WhatsAppMessage from "./WhatsAppMessage";
import WhatsAppComposer from "./WhatsAppComposer";

export default function WhatsAppChatWindow({ username, chat = [], onSend }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  return (
    <section className="flex-1 bg-[#0b141a] flex flex-col">
      {/* Chat header (contact strip) */}
      <div className="h-14 px-4 border-b border-[#233138] bg-[#202c33] flex items-center">
        <div>
          <div className="text-[#e9edef] font-medium">Live Support</div>
          <div className="text-xs text-[#8696a0]">Chatting as {username}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {Array.isArray(chat) && chat.length > 0 ? (
          chat.map((m, i) => (
            <WhatsAppMessage key={i} msg={m} me={username} />
          ))
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
      <WhatsAppComposer onSend={onSend} />
    </section>
  );
}
