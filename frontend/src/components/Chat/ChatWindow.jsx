import React, { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

export default function ChatWindow({ username, role, chat, onSend, onLeave }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  return (
    <div className="flex justify-center items-center h-screen">
      {/* Outer Box - 90% of screen */}
      <div className="flex w-[95vw] h-[90vh] rounded-2xl overflow-hidden shadow-2xl p-3  border-gray-300">
        
        {/* Left Sidebar */}
        <aside className="w-64 bg-[#13112c] text-white p-6  mr-2 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-6">Live Support</h1>
            <p className="text-sm text-slate-400">Welcome to the help desk</p>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-slate-400">
              Signed in as{" "}
              <span className="text-navyblue-400">{username}</span> ({role})
            </div>
            <button
              onClick={onLeave}
              className="w-full text-sm bg-rose-600 hover:bg-rose-500 rounded px-3 py-2"
            >
              Leave
            </button>
          </div>
        </aside>

        {/* Main Chat Window */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <header className="p-2 border-b border-gray-200 text-white flex justify-center items-center">
            <div>
              {/* <div className="font-semibold text-black">Live Support Chat</div> */}
              <div className="text-black opacity-80">Chatting as {username}</div>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-white">
            {chat.map((msg, idx) => (
              <ChatMessage key={idx} msg={msg} username={username} />
            ))}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <div className=" border-gray-200 p-2 bg-white">
            <ChatInput onSend={onSend} />
          </div>
        </div>
      </div>
    </div>
  );
}
