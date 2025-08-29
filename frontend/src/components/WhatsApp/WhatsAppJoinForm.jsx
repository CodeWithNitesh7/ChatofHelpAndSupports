import React, { useState } from "react";
import { FiMessageCircle, FiUser, FiShield, FiArrowRight } from "react-icons/fi";

export default function WhatsAppJoinForm({ username, setUsername, role, setRole, onJoin }) {
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!username.trim()) return;
    setLoading(true);
    await onJoin(); // backend call (socket.emit or API)
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b141a] p-4 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[#00a884] rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-[#005c4b] rounded-full blur-2xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-lg bg-[#111b21]/95 rounded-2xl shadow-xl border border-[#233138]/50 p-8 backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00a884] to-[#005c4b] rounded-2xl shadow-lg mb-4">
            <FiMessageCircle className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-[#e9edef]">Welcome to Support</h1>
          <p className="text-sm text-[#8696a0] mt-2">Join as customer or agent to continue</p>
        </div>

        {/* Input Field */}
        <div className="mb-6">
          <label className="block text-xs text-[#8696a0] mb-2 flex items-center">
            <FiUser className="mr-2" /> Your Name
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-4 py-3 rounded-xl bg-[#202c33]/80 border border-[#2a3942] text-[#e9edef] outline-none 
              focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/30"
          />
        </div>

        {/* Role Toggle */}
        <div className="mb-6">
          <label className="block text-xs text-[#8696a0] mb-2 flex items-center">
            <FiShield className="mr-2" /> I am a
          </label>
          <div className="grid grid-cols-2 gap-3">
            {["customer", "agent"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl py-3 border transition-all duration-300 ${
                  role === r
                    ? "border-[#00a884] bg-[#005c4b]/20 text-[#00a884] shadow-md"
                    : "border-[#2a3942] bg-[#202c33]/50 text-[#8696a0] hover:border-[#00a884]/40"
                }`}
              >
                {r === "customer" ? "Customer" : "Agent"}
              </button>
            ))}
          </div>
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={!username.trim() || loading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-[#00a884] to-[#029e7f] 
            text-white font-semibold transition-all duration-300 hover:scale-105 
            disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? "Connecting..." : "Start Chat Session"}
          {!loading && <FiArrowRight />}
        </button>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-[#8696a0]/60 border-t border-[#233138]/40 pt-4">
          Secure • Encrypted • Real-time Support
        </div>
      </div>
    </div>
  );
}
