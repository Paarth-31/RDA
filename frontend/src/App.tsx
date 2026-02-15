// // src/App.tsx
// import { useState } from 'react';
// import { useSocket } from './context/SocketContext'; // Keep this relative since it's nearby
// import { v4 as uuidv4 } from 'uuid';

// // Use the @ alias for components to avoid path confusion
// import { Navbar } from '@/components/layout/Navbar';
// import { HostCard } from '@/components/sections/HostCard';
// import { JoinCard } from '@/components/sections/Joincard';

// function App() {
//   const socket = useSocket();
//   const [myId, setmyId] = useState("");
//   const [remoteId, setremoteId] = useState("");
//   const [isCopied, setIsCopied] = useState(false);

//   const handleCreateId = () => {
//     const newId = uuidv4().slice(0, 8);
//     setmyId(newId);
//     socket?.emit("join-room", { roomId: newId, emailId: "host@test.com" });
//   };

//   const handleJoinId = () => {
//     if (!remoteId) return alert("Enter Peer ID");
//     socket?.emit("join-room", { roomId: remoteId, emailId: "guest@test.com" });
//   };

//   const copyToClipboard = () => {
//     if (myId) {
//       navigator.clipboard.writeText(myId);
//       setIsCopied(true);
//       setTimeout(() => setIsCopied(false), 2000);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
//       <Navbar />
//       <main className="flex-1 flex flex-col items-center justify-center p-6">
//         <h1 className="text-6xl font-bold tracking-tighter text-white mb-16">
//           Stream<span className="text-primary">Link.</span>
//         </h1>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
//           <HostCard myId={myId} handleCreateId={handleCreateId} copyToClipboard={copyToClipboard} isCopied={isCopied} />
//           <JoinCard remoteId={remoteId} setRemoteId={setremoteId} handleJoinId={handleJoinId} />
//         </div>
//       </main>
//     </div>
//   );
// }
// export default App;




import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { HostCard } from '@/components/sections/HostCard';
import { JoinCard } from '@/components/sections/Joincard';
import { RecentSessions } from '@/components/sections/RecentSessions'; // New File
import { ContextDropdown } from '@/components/sections/ContextDropdown'; // New File

export default function App() {
  const [myId, setMyId] = useState("00675699665");
  const [remoteId, setRemoteId] = useState("");

  const handleGenerateId = () => {
    setMyId(Math.floor(10000000000 + Math.random() * 90000000000).toString());
  };

  const handleJoin = () => {
    alert(`Connecting to ${remoteId}...`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid font-sans selection:bg-primary/30 flex flex-col overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-start pt-16 px-4 relative z-10">
        
        <HeroSection myId={myId} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative">
          <HostCard handleGenerateId={handleGenerateId} />
          <JoinCard remoteId={remoteId} setRemoteId={setRemoteId} handleJoin={handleJoin} />
          
          {/* This places the menu exactly where it is in the screenshot */}
          <ContextDropdown />
        </div>

        {/* The bottom list from the screenshot */}
        <RecentSessions />

      </main>
    </div>
  );
}