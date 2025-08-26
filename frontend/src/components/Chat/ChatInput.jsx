import React, { useState } from "react";

export default function ChatInput({ onSend }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700 flex gap-2">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 rounded-lg bg-[#13112c] border border-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
      />
      <button
        type="submit"
        className="rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-semibold"
      >
        Send
      </button>
    </form>
  );
}
