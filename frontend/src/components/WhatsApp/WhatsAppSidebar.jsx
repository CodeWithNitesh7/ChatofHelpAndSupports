import React from "react";

export default function WhatsAppSidebar({ username, role, onLeave }) {
  return (
    <aside className="w-[360px] bg-[#111b21] border-r border-[#233138] flex flex-col">
      {/* Top bar */}
      <div className="h-14 px-4 flex items-center justify-between bg-[#202c33]">
        <div className="text-[#e9edef] font-semibold">EduExpert Support</div>
        <button
          onClick={onLeave}
          className="text-xs bg-rose-600 hover:bg-rose-500 text-white rounded px-3 py-1"
        >
          Leave
        </button>
      </div>

      {/* User card */}
      <div className="px-4 py-3 border-b border-[#233138]">
        <div className="text-[#e9edef] font-medium">{username || "Guest"}</div>
        <div className="text-xs text-[#8696a0] capitalize">{role}</div>
      </div>

      {/* Placeholder list (could be rooms/threads later) */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 hover:bg-[#202c33] cursor-pointer">
          <div className="text-[#e9edef]">Live Support</div>
          <div className="text-xs text-[#8696a0]">Connected</div>
        </div>
      </div>
    </aside>
  );
}
