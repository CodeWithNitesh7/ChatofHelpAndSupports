import React, { useState } from "react";
import { FiMessageCircle, FiUser, FiShield, FiArrowRight } from "react-icons/fi";

export default function WhatsAppJoinForm({ username, setUsername, role, setRole, onJoin }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b141a] via-[#111b21] to-[#1c2b35] p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#00a884] rounded-full blur-3xl animate-pulse" style={{
          animation: 'pulse-slow 6s ease-in-out infinite'
        }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-[#005c4b] rounded-full blur-2xl animate-pulse" style={{
          animation: 'pulse-medium 4s ease-in-out infinite'
        }}></div>
      </div>

      <div className="relative w-full max-w-2xl bg-[#111b21]/90 backdrop-blur-md rounded-2xl shadow-2xl border border-[#233138]/50 p-8 transition-all duration-300 hover:shadow-lg hover:shadow-[#00a884]/20">
        {/* Header with icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00a884] to-[#005c4b] rounded-2xl mb-4 shadow-lg">
            <FiMessageCircle className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-[#e9edef]">
            <span className="bg-gradient-to-r from-[#00a884] to-[#029e7f] bg-clip-text text-transparent">
              Expert Support
            </span>
          </h1>
          <p className="text-sm text-[#8696a0] mt-2 font-light">
            Connect instantly with our support team or join as an agent
          </p>
        </div>

        {/* Form container */}
        <div className="space-y-6">
          {/* Username field */}
          <div className="relative">
            <label className="text-xs uppercase tracking-wider text-[#8696a0] mb-3 font-medium flex items-center">
              <FiUser className="mr-2" />
              Your Name
            </label>
              <div className="relative">
                <FiUser className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-10 transition-colors duration-300 ${isFocused ? 'text-[#00a884]' : 'text-[#8696a0]'}`} />
                <input
                  className="w-full rounded-xl bg-[#202c33]/80 border-2 border-[#2a3942]/50 px-4 py-3 pl-12 pr-4 text-[#e9edef] outline-none transition-all duration-300 
                    focus:border-[#00a884] focus:bg-[#202c33] focus:ring-2 focus:ring-[#00a884]/30
                    placeholder:text-[#8696a0]/60"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name..."
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  style={{ textIndent: '32px' }} // ← This is the key fix!
                />
              </div>
          </div>

          {/* Role selection */}
          <div className="relative">
            <label className="text-xs uppercase tracking-wider text-[#8696a0] mb-3 font-medium flex items-center">
              <FiShield className="mr-2" />
              I am a
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`rounded-xl p-4 border-2 transition-all duration-300 hover:scale-105 ${
                  role === "customer"
                    ? "border-[#00a884] bg-[#005c4b]/20 text-[#00a884] shadow-lg shadow-[#00a884]/10"
                    : "border-[#2a3942]/50 bg-[#202c33]/50 text-[#8696a0] hover:border-[#00a884]/30"
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold mb-1">Customer</div>
                  <div className="text-xs opacity-70">Get support</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setRole("agent")}
                className={`rounded-xl p-4 border-2 transition-all duration-300 hover:scale-105 ${
                  role === "agent"
                    ? "border-[#00a884] bg-[#005c4b]/20 text-[#00a884] shadow-lg shadow-[#00a884]/10"
                    : "border-[#2a3942]/50 bg-[#202c33]/50 text-[#8696a0] hover:border-[#00a884]/30"
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold mb-1">Agent</div>
                  <div className="text-xs opacity-70">Provide support</div>
                </div>
              </button>
            </div>
          </div>

          {/* Join button */}
          <button
            onClick={onJoin}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={!username.trim()}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#00a884] to-[#029e7f] hover:from-[#029e7f] hover:to-[#00a884] 
              text-white font-semibold py-4 px-6 transition-all duration-500 hover:scale-105 
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
            style={{
              boxShadow: isHovered ? '0 20px 40px -10px rgba(0, 168, 132, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <span className="relative z-10 flex items-center justify-center">
              Start Chat Session
              <FiArrowRight className={`ml-2 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </span>
            
            {/* Shine effect */}
            <div 
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)'
              }}
            ></div>
          </button>
        </div>

        {/* Footer note */}
        <div className="text-center mt-6 pt-4 border-t border-[#233138]/30">
          <p className="text-xs text-[#8696a0]/60">
            Secure • Encrypted • Real-time Support
          </p>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 0.15; }
          }
          @keyframes pulse-medium {
            0%, 100% { opacity: 0.08; }
            50% { opacity: 0.12; }
          }
        `}
      </style>
    </div>
  );
}