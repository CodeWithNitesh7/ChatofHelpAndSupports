import React from "react";

export default function ChatMessage({ msg, username }) {
  return (
    <div
      className={`flex ${
        msg.sender === username ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl border ${
          msg.sender === username
            ? "bg-indigo-600 text-white border-indigo-500"
            : msg.sender === "System"
            ? "bg-slate-700 text-slate-300 border-slate-600 text-center italic w-full"
            : "bg-[#24214b]/70 text-slate-100 border-slate-700"
        }`}
      >
        {msg.sender !== "System" && (
          <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">
            {msg.sender}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{msg.text}</div>
        {msg.sender !== "System" && (
          <div className="text-[10px] text-slate-400 mt-1 text-right">
            {msg.time}
          </div>
        )}
      </div>
    </div>
  );
}
