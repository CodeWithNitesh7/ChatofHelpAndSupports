// import React from "react";

// // Normalizes any possible message shape to avoid crashes
// function normalize(msg, me) {
//   // supports {sender,text,time} or {username,message,ts} etc.
//   const sender = msg?.sender ?? msg?.username ?? "Unknown";
//   const text = msg?.text ?? msg?.message ?? "";
//   const time = msg?.time ?? msg?.ts ?? "";
//   const isMe = sender === me || sender === "Me";
//   const isSystem = sender === "System";
//   return { sender, text, time, isMe, isSystem };
// }

// export default function WhatsAppMessage({ msg, me }) {
//   const { sender, text, time, isMe, isSystem } = normalize(msg, me);

//   if (isSystem) {
//     return (
//       <div className="flex justify-center my-2">
//         <span className="text-xs px-3 py-1 rounded-full bg-[#233138] text-[#8696a0]">
//           {text}
//         </span>
//       </div>
//     );
//   }

//   return (
//     <div className={`w-full flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
//       <div
//         className={`relative max-w-[75%] rounded-lg px-3 py-2 text-[15px] leading-snug shadow
//           ${isMe ? "bg-[#005c4b] text-[#e9edef]" : "bg-[#202c33] text-[#e9edef]"}
//         `}
//       >
//         {!isMe && (
//           <div className="text-[11px] text-[#8696a0] mb-0.5">{sender}</div>
//         )}
//         <div className="whitespace-pre-wrap break-words">{text}</div>
//         {time && (
//           <div className="mt-1 text-[10px] text-[#8696a0] text-right">
//             {time}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }













import React, { useState } from "react";

// Normalizes any possible message shape to avoid crashes
function normalize(msg, me) {
  const sender = msg?.sender ?? msg?.username ?? "Unknown";
  
  // Handle different text formats: string, object with text property, or empty
  let text = "";
  let fileUrl = null;
  let originalName = "";
  let mimeType = "";
  
  if (typeof msg?.text === "string") {
    text = msg.text;
  } else if (typeof msg?.text === "object") {
    // Handle object format: could be {text: "message"} or {fileUrl: "...", text: "filename"}
    text = msg.text?.text || "";
    fileUrl = msg.text?.fileUrl || null;
    originalName = msg.text?.originalName || "";
    mimeType = msg.text?.mimeType || "";
  }
  
  // Fallback to root level properties if not found in text object
  fileUrl = fileUrl || msg?.fileUrl || msg?.file || null;
  mimeType = mimeType || msg?.mimeType || "";
  originalName = originalName || msg?.originalName || "";
  
  const time = msg?.time ?? msg?.ts ?? "";
  const isMe = sender === me || sender === "Me";
  const isSystem = sender === "System";
  
  return { sender, text, time, fileUrl, originalName, mimeType, isMe, isSystem };
}

// Helper function to determine file type
function getFileType(mimeType, filename) {
  if (!mimeType && !filename) return 'unknown';
  
  const file = filename || '';
  const type = mimeType || '';
  
  if (type.includes('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file)) {
    return 'image';
  } else if (type.includes('pdf') || /\.pdf$/i.test(file)) {
    return 'pdf';
  } else if (type.includes('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(file)) {
    return 'video';
  } else if (/\.(xlsx|xls|csv)$/i.test(file)) {
    return 'spreadsheet';
  } else if (/\.(doc|docx|txt)$/i.test(file)) {
    return 'document';
  } else {
    return 'other';
  }
}

export default function WhatsAppMessage({ msg, me }) {
  const { sender, text, time, fileUrl, originalName, mimeType, isMe, isSystem } = normalize(msg, me);
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const fileType = getFileType(mimeType, originalName);

  const openImageModal = () => setShowImageModal(true);
  const closeImageModal = () => setShowImageModal(false);

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeImageModal();
    }
  };

  // Close modal with Escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeImageModal();
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs px-3 py-1 rounded-full bg-[#233138] text-[#8696a0]">
          {text}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className={`w-full flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
        <div
          className={`relative max-w-[75%] rounded-lg px-3 py-2 text-[15px] leading-snug shadow
            ${isMe ? "bg-[#005c4b] text-[#e9edef]" : "bg-[#202c33] text-[#e9edef]"}
          `}
        >
          {!isMe && (
            <div className="text-[11px] text-[#8696a0] mb-0.5">{sender}</div>
          )}

          {/* 🔹 Enhanced file and content rendering */}
          {fileUrl ? (
            <div className="max-w-[300px]">
              {/* Image Preview */}
              {fileType === 'image' && !imageError ? (
                <div className="mb-2 rounded-lg overflow-hidden cursor-pointer">
                  <img
                    src={fileUrl}
                    alt={originalName || "Image"}
                    className="max-h-[200px] w-auto object-cover hover:opacity-90 transition-opacity"
                    onError={() => setImageError(true)}
                    onClick={openImageModal}
                  />
                </div>
              ) : null}

              {/* PDF Preview */}
              {fileType === 'pdf' ? (
                <div className="mb-2 p-3 bg-[#2a3942] rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">PDF</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {originalName || "Document.pdf"}
                    </div>
                    <div className="text-[#8696a0] text-xs">PDF Document</div>
                  </div>
                </div>
              ) : null}

              {/* Other file types... (keep your existing code for other file types) */}

              {/* Generic File Download */}
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline block mt-2"
              >
                {fileType === 'image' && imageError ? 'View Image' : 
                 originalName || text || "Download file"}
              </a>
            </div>
          ) : text ? (
            // Text message
            <div className="whitespace-pre-wrap break-words">{text}</div>
          ) : (
            // Fallback for empty or unsupported messages
            <div className="text-red-400">[Unsupported message]</div>
          )}

          {time && (
            <div className="mt-1 text-[10px] text-[#8696a0] text-right">{time}</div>
          )}
        </div>
      </div>

      {/* Image Modal */}
  {showImageModal && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-98 z-50 flex items-center justify-center p-0"
    onClick={handleBackdropClick}
  >
    {/* Close Button */}
    <button
      onClick={closeImageModal}
      className="absolute top-5 right-5 bg-black bg-opacity-80 text-white rounded-full p-3 hover:bg-opacity-100 transition-all duration-200 z-10 shadow-2xl border border-gray-600"
      aria-label="Close image"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    {/* Maximum Size Image with subtle animation */}
    <img
      src={fileUrl}
      alt={originalName || "Image preview"}
      className="max-w-[100vw] max-h-[100vh] object-contain"
      style={{ 
        animation: 'fadeInZoom 0.2s ease-out' 
      }}
    />
  </div>
)}

{/* Add smooth animation */}
<style>
  {`
    @keyframes fadeInZoom {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `}
</style>
    </>
  );
}