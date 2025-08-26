// import React from "react";
// import { SocketProvider } from "./context/SocketContext";
// import ChatPage from "./pages/ChatPage";

// function App() {
//   return (
//     <SocketProvider>
//       <ChatPage />
//     </SocketProvider>
//   );
// }

// export default App;


// src/App.jsx
import React from "react";
import { SocketProvider } from "./context/SocketContext";
import WhatsAppChatPage from "./pages/WhatsAppChatPage";
// import ChatPage from "./pages/ChatPage"; // your old page remains intact

export default function App() {
  return (
    <SocketProvider>
      <WhatsAppChatPage />
       {/* <ChatPage />  */}
    </SocketProvider>
  );
}
