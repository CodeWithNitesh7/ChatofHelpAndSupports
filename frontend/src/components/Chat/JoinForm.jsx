import React from "react";

export default function JoinForm({ username, setUsername, role, setRole, onJoin }) {
  return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#13112c] p-4">
    <h1 className="text-3xl font-bold text-white mb-5 text-center">
          Welcome to the EduExpert Help & Support
        </h1>
    <div className="w-full max-w-md bg-slate-800/70 rounded-2xl shadow-xl p-6 mt-5 space-y-4 border border-slate-700">
      
      <h1 className="text-2xl font-bold">Join Chat</h1>
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            className="w-full rounded-lg bg-[#13112c] border border-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Role</label>
          <select
            className="w-full rounded-lg bg-[#13112c] border border-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="customer">Customer</option>
            <option value="agent">Agent</option>
          </select>
        </div>
      </div>
      <button
        onClick={onJoin}
        className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-lg py-2 font-semibold transition"
      >
        Join
      </button>
    </div>
  </div>  
  );
}
