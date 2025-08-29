// import React, { useState } from "react";

// // Normalizes any possible message shape to avoid crashes
// function normalize(msg, me) {
//   const sender = msg?.sender ?? msg?.username ?? "Unknown";
  
//   // Handle different text formats: string, object with text property, or empty
//   let text = "";
//   let fileUrl = null;
//   let originalName = "";
//   let mimeType = "";
  
//   if (typeof msg?.text === "string") {
//     text = msg.text;
//   } else if (typeof msg?.text === "object") {
//     text = msg.text?.text || "";
//     fileUrl = msg.text?.fileUrl || null;
//     originalName = msg.text?.originalName || "";
//     mimeType = msg.text?.mimeType || "";
//   }
  
//   fileUrl = fileUrl || msg?.fileUrl || msg?.file || null;
//   mimeType = mimeType || msg?.mimeType || "";
//   originalName = originalName || msg?.originalName || "";
  
//   const time = msg?.time ?? msg?.ts ?? "";
//   const isMe = sender === me || sender === "Me";
//   const isSystem = sender === "System";
  
//   return { sender, text, time, fileUrl, originalName, mimeType, isMe, isSystem };
// }

// // Helper function to determine file type
// function getFileType(mimeType, filename) {
//   if (!mimeType && !filename) return "unknown";
  
//   const file = filename || "";
//   const type = mimeType || "";
  
//   if (type.includes("image/") || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file)) {
//     return "image";
//   } else if (type.includes("pdf") || /\.pdf$/i.test(file)) {
//     return "pdf";
//   } else if (type.includes("video/") || /\.(mp4|mov|avi|mkv|webm)$/i.test(file)) {
//     return "video";
//   } else if (/\.(xlsx|xls|csv)$/i.test(file)) {
//     return "spreadsheet";
//   } else if (/\.(doc|docx|txt)$/i.test(file)) {
//     return "document";
//   } else {
//     return "other";
//   }
// }

// export default function WhatsAppMessage({ msg, me }) {
//   const { sender, text, time, fileUrl, originalName, mimeType, isMe, isSystem } =
//     normalize(msg, me);
//   const [imageError, setImageError] = useState(false);
//   const [showImageModal, setShowImageModal] = useState(false);
//   const fileType = getFileType(mimeType, originalName);

//   const openImageModal = () => setShowImageModal(true);
//   const closeImageModal = () => setShowImageModal(false);

//   const handleBackdropClick = (e) => {
//     if (e.target === e.currentTarget) {
//       closeImageModal();
//     }
//   };

//   React.useEffect(() => {
//     const handleEscape = (e) => {
//       if (e.key === "Escape") {
//         closeImageModal();
//       }
//     };

//     if (showImageModal) {
//       document.addEventListener("keydown", handleEscape);
//       document.body.style.overflow = "hidden";
//     }

//     return () => {
//       document.removeEventListener("keydown", handleEscape);
//       document.body.style.overflow = "unset";
//     };
//   }, [showImageModal]);

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
//     <>
//       <div className={`w-full flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
//       <div
//   className={`relative z-50 max-w-[75%] px-3 py-2 text-[15px] leading-snug shadow
//     ${isMe 
//       ? "bg-[#005c4b] text-[#e9edef] rounded-lg ml-auto" 
//       : "bg-[#202c33] text-[#e9edef] rounded-lg mr-auto"
//     }
//   `}
// >
//   {!isMe && (
//     <div className="absolute left-[-8px] top-0 w-0 h-0 
//                     border-t-[12px] border-t-transparent 
//                     border-r-[12px] border-r-[#202c33] 
//                     border-b-[0px] border-b-transparent">
//     </div>
//   )}
//   {isMe && (
//     <div className="absolute right-[-8px] top-0 w-0 h-0 
//                     border-t-[12px] border-t-transparent 
//                     border-l-[12px] border-l-[#005c4b] 
//                     border-b-[0px] border-b-transparent">
//     </div>
//   )}

//   {/* Message content goes here */}
//   {!isMe && <div className="text-[11px] text-[#8696a0] mb-0.5">{sender}</div>}
//   {fileUrl ? (
//     <div className="whitespace-pre-wrap break-words">{originalName || text}</div>
//   ) : (
//     <div className="whitespace-pre-wrap break-words">{text}</div>
//   )}
//   {time && (
//     <div className="mt-1 text-[10px] text-[#8696a0] text-right">{time}</div>
//   )}
// </div>

//       </div>

//       {/* Image Modal */}
//       {showImageModal && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-98 z-50 flex items-center justify-center p-0"
//           onClick={handleBackdropClick}
//         >
//           <button
//             onClick={closeImageModal}
//             className="absolute top-5 right-5 bg-black bg-opacity-80 text-white rounded-full p-3 hover:bg-opacity-100 transition-all duration-200 z-10 shadow-2xl border border-gray-600"
//             aria-label="Close image"
//           >
//             <svg
//               className="w-6 h-6"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2.5}
//                 d="M6 18L18 6M6 6l12 12"
//               />
//             </svg>
//           </button>

//           <img
//             src={fileUrl}
//             alt={originalName || "Image preview"}
//             className="max-w-[100vw] max-h-[100vh] object-contain"
//             style={{ animation: "fadeInZoom 0.2s ease-out" }}
//           />
//         </div>
//       )}

//       <style>
//         {`
//           @keyframes fadeInZoom {
//             from { opacity: 0; transform: scale(0.95); }
//             to { opacity: 1; transform: scale(1); }
//           }
//         `}
//       </style>
//     </>
//   );
// }




















import React, { useState, useEffect } from "react";

// Normalize any possible message shape to avoid crashes
function normalize(msg, me) {
  const sender = msg?.sender ?? msg?.username ?? "Unknown";

  let text = "";
  let fileUrl = null;
  let originalName = "";
  let mimeType = "";

  if (typeof msg?.text === "string") {
    text = msg.text;
  } else if (typeof msg?.text === "object") {
    text = msg.text?.text || "";
    fileUrl = msg.text?.fileUrl || null;
    originalName = msg.text?.originalName || "";
    mimeType = msg.text?.mimeType || "";
  }

  fileUrl = fileUrl || msg?.fileUrl || msg?.file || null;
  mimeType = mimeType || msg?.mimeType || "";
  originalName = originalName || msg?.originalName || "";

  const time = msg?.time ?? msg?.ts ?? "";
  const isMe = sender === me || sender === "Me";
  const isSystem = sender === "System";

  return { sender, text, time, fileUrl, originalName, mimeType, isMe, isSystem };
}

// Detect file type
function getFileType(mimeType, filename) {
  if (!mimeType && !filename) return "unknown";

  const file = filename || "";
  const type = mimeType || "";

  if (type.includes("image/") || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file)) {
    return "image";
  } else if (type.includes("pdf") || /\.pdf$/i.test(file)) {
    return "pdf";
  } else if (type.includes("video/") || /\.(mp4|mov|avi|mkv|webm)$/i.test(file)) {
    return "video";
  } else if (/\.(xlsx|xls|csv)$/i.test(file)) {
    return "spreadsheet";
  } else if (/\.(doc|docx|txt)$/i.test(file)) {
    return "document";
  } else {
    return "other";
  }
}

export default function WhatsAppMessage({ msg, me }) {
  const { sender, text, time, fileUrl, originalName, mimeType, isMe, isSystem } =
    normalize(msg, me);
  const [showImageModal, setShowImageModal] = useState(false);
  const fileType = getFileType(mimeType, originalName);

  const openImageModal = () => setShowImageModal(true);
  const closeImageModal = () => setShowImageModal(false);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeImageModal();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") closeImageModal();
    };

    if (showImageModal) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
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
          className={`relative z-50 max-w-[75%] px-3 py-2 text-[15px] leading-snug shadow
            ${isMe 
              ? "bg-[#005c4b] text-[#e9edef] rounded-lg ml-auto" 
              : "bg-[#202c33] text-[#e9edef] rounded-lg mr-auto"
            }
          `}
        >
          {/* Bubble tail */}
          {!isMe && (
            <div className="absolute left-[-8px] top-0 w-0 h-0 
                            border-t-[12px] border-t-transparent 
                            border-r-[12px] border-r-[#202c33]"></div>
          )}
          {isMe && (
            <div className="absolute right-[-8px] top-0 w-0 h-0 
                            border-t-[12px] border-t-transparent 
                            border-l-[12px] border-l-[#005c4b]"></div>
          )}

          {/* Sender label */}
          {!isMe && (
            <div className="text-[11px] text-[#8696a0] mb-0.5">{sender}</div>
          )}

          {/* Message content */}
          {fileUrl ? (
            <>
              {fileType === "image" && (
                <img
                  src={fileUrl}
                  alt={originalName || "Image"}
                  className="rounded-md max-w-[200px] cursor-pointer"
                  onClick={openImageModal}
                />
              )}

              {fileType === "video" && (
                <video
                  src={fileUrl}
                  controls
                  className="rounded-md max-w-[250px]"
                />
              )}

              {fileType === "pdf" && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#111b21] text-[#00a884] px-3 py-2 rounded-md hover:underline"
                >
                  📄 {originalName || "PDF Document"}
                </a>
              )}

              {(fileType === "document" || fileType === "spreadsheet" || fileType === "other") && (
                <a
                  href={fileUrl}
                  download={originalName}
                  className="block bg-[#111b21] text-[#00a884] px-3 py-2 rounded-md hover:underline"
                >
                  📎 {originalName || "Download file"}
                </a>
              )}
            </>
          ) : (
            <div className="whitespace-pre-wrap break-words">{text}</div>
          )}

          {/* Time */}
          {time && (
            <div className="mt-1 text-[10px] text-[#8696a0] text-right">{time}</div>
          )}
        </div>
      </div>

      {/* Fullscreen image modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={handleBackdropClick}
        >
          <button
            onClick={closeImageModal}
            className="absolute top-5 right-5 bg-black bg-opacity-70 text-white rounded-full p-2 hover:bg-opacity-100"
          >
            ✕
          </button>
          <img
            src={fileUrl}
            alt={originalName || "Image preview"}
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        </div>
      )}
    </>
  );
}
