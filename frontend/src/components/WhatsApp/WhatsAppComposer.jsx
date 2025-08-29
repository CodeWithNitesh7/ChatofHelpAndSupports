// import React, { useState } from "react";
// import { FiSend, FiPaperclip } from "react-icons/fi";

// export default function WhatsAppComposer({ onSend }) {
//   const [text, setText] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!text.trim()) return;
//     onSend(text);
//     setText("");
//   };

//   const handleFileUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     // send file up to parent (or socket)
//     onSend({ file });
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="h-[62px] px-3 bg-[#111b21] border-t border-[#233138] flex items-center"
//     >
//       <div className="flex-1 relative">
//         {/* File Upload (left inside input) */}
//         <label className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8696a0] cursor-pointer">
//           <FiPaperclip size={18} />
//           <input
//             type="file"
//             className="hidden"
//             onChange={handleFileUpload}
//           />
//         </label>

//         {/* Text Input */}
//         <input
//           type="text"
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           placeholder="Type a message"
//           className="w-full bg-[#202c33] border border-[#2a3942] rounded-md pl-9 pr-10 py-2 text-[#e9edef] placeholder:text-[#8696a0] outline-none focus:border-[#00a884]"
//         />

//         {/* Send Button (right inside input) */}
//         <button
//           type="submit"
//           className="absolute right-2 top-1/2 -translate-y-1/2 text-[#00a884] hover:text-[#029e7f]"
//         >
//           <FiSend size={18} />
//         </button>
//       </div>
//     </form>
//   );
// }



















// import React, { useState } from "react";
// import { FiSend, FiPaperclip } from "react-icons/fi";
// import axios from "axios";

// export default function WhatsAppComposer({ onSend }) {
//   const [text, setText] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!text.trim()) return;
//     onSend({ text });
//     setText("");
//   };

//   const handleFileUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const res = await axios.post("http://localhost:9000/api/uploads/upload", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       // Send complete file data including MIME type for proper preview
//       onSend({
//         fileUrl: res.data.fileUrl,
//         originalName: res.data.originalName,
//         mimeType: res.data.mimeType, // ✅ Added MIME type
//         size: res.data.size,
//       });
//     } catch (err) {
//       console.error("File upload error:", err);
//     } finally {
//       // Reset the file input to allow uploading the same file again
//       e.target.value = "";
//     }
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="h-[62px] px-3 bg-[#111b21] border-t border-[#233138] flex items-center"
//     >
//       <div className="flex-1 relative">
//         {/* File Upload (left inside input) */}
//         <label className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8696a0] cursor-pointer hover:text-[#00a884] transition-colors">
//           <FiPaperclip size={18} />
//           <input
//             type="file"
//             className="hidden"
//             onChange={handleFileUpload}
//             accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" // Optional: restrict file types
//           />
//         </label>

//         {/* Text Input */}
//         <input
//           type="text"
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           placeholder="Type a message"
//           className="w-full bg-[#202c33]  rounded-md pl-9 pr-10 py-2 text-[#e9edef] placeholder:text-[#8696a0] outline-none focus:border-[#00a884]"
//         />

//         {/* Send Button */}
//         <button
//           type="submit"
//           className="absolute right-2 top-1/2 -translate-y-1/2 text-[#00a884] hover:text-[#029e7f] disabled:text-[#8696a0] disabled:cursor-not-allowed"
//           disabled={!text.trim()} // Disable when empty
//         >
//           <FiSend size={18} />
//         </button>
//       </div>
//     </form>
//   );
// }
























import React, { useState, useEffect } from "react";
import { FiSend, FiPaperclip } from "react-icons/fi";
import axios from "axios";
import { useSocket } from "../../context/SocketContext"; // ✅ use context

export default function WhatsAppComposer({ username }) {
  const [text, setText] = useState("");
  const { sendMessage, startTyping, stopTyping } = useSocket();

  // Debounced stopTyping (fires when user pauses typing)
  useEffect(() => {
    if (!text) {
      stopTyping();
      return;
    }

    startTyping(username);

    const timeout = setTimeout(() => stopTyping(username), 1500);
    return () => clearTimeout(timeout);
  }, [text]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    sendMessage({
      text,
      sender: username,
      timestamp: Date.now(),
    });

    setText("");
    stopTyping(username);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("http://localhost:9000/api/uploads/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Send file as a chat message
      sendMessage({
        fileUrl: res.data.fileUrl,
        originalName: res.data.originalName,
        mimeType: res.data.mimeType,
        size: res.data.size,
        sender: username,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="h-[62px] px-3 bg-[#111b21] border-t border-[#233138] flex items-center"
    >
      <div className="flex-1 relative">
        {/* File Upload */}
        <label className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8696a0] cursor-pointer hover:text-[#00a884] transition-colors">
          <FiPaperclip size={18} />
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
        </label>

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          className="w-full bg-[#202c33] rounded-md pl-9 pr-10 py-2 text-[#e9edef] placeholder:text-[#8696a0] outline-none focus:border-[#00a884]"
        />

        {/* Send Button */}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#00a884] hover:text-[#029e7f] disabled:text-[#8696a0] disabled:cursor-not-allowed"
          disabled={!text.trim()}
        >
          <FiSend size={18} />
        </button>
      </div>
    </form>
  );
}
