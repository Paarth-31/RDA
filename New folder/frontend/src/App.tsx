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




// import { useState } from 'react';
// import ReactPlayer from 'react-player'; //Paarth - import player
// import { Navbar } from '@/components/layout/Navbar';
// import { HeroSection } from '@/components/sections/HeroSection';
// import { HostCard } from '@/components/sections/HostCard';
// import { JoinCard } from '@/components/sections/Joincard';
// import { RecentSessions } from '@/components/sections/RecentSessions'; // New File
// import { ContextDropdown } from '@/components/sections/ContextDropdown'; // New File
// import { usePeerConnection } from './hooks/usePeerConnection'; //Paarth - importing hook for connection 

// export default function App() {
// 	const [myId, setMyId] = useState("00675699665");
// 	const [remoteId, setRemoteId] = useState("");

// 	//Paarth - WebRTC Initialise for screen share
// 	const{
// 		startScreenShare, myStream, remoteStream, connectionStatus
// 	} = usePeerConnection(myId, remoteId);
	

//   const handleGenerateId = () => {
//     setMyId(Math.floor(10000000000 + Math.random() * 90000000000).toString());
//   };

//   const handleJoin = () => {
//     alert(`Ready to connect to ${remoteId}...`);
//   };

//   return (
//     <div className="min-h-screen bg-background text-foreground bg-grid font-sans selection:bg-primary/30 flex flex-col overflow-hidden">
//       <Navbar />
      
//       <main className="flex-1 flex flex-col items-center justify-start pt-16 px-4 relative z-10">
        
//         <HeroSection myId={myId} />

// 		{/* Paarth - Status indicator for Connection Status*/}
// 		<div className={`mb-4 px-4 py-2 rounded-full text-sm font-semibold ${
// 			connectionStatus === 'Connected' ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'
// 		}`}>
// 			Status: {connectionStatus}
// 		</div>

// 		{/* If stream exists, we show video player, otherwise card grid.*/}
// 		{(myStream || remoteStream) ? (
// 			<div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in">
// 				{/* My Screen*/}
// 				<div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden relative aspect-video">
// 					<p className="absolute top-2 left-2 bg-black/60 px-2 rounded text-xs">My Screen</p>
// 					{myStream && <ReactPlayer playing muted url={myStream} width="100%" height="100%" />}
// 				</div>

// 				{/* Remote Screen*/}
// 				<div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden relative aspect-video">
// 					<p className="absolute top-2 left-2 bg-black/60 px-2 rounded text-xs">Remote Screen</p>
// 					{remoteStream ? (
// 						<ReactPlayer playing url={remoteStream} width="100%" height="100%" />
// 					) : (
// 						<div className="flex items-center justify-center h-full text-gray-500">Waiting for stream...</div>
// 					)}
// 				</div>
				
// 				{/*Button to stop/reset could go here*/}
// 				<button onClick={() => window.location.reload()} className="col-span-full md:col-span-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 oy-2 rounded transition">
// 					End Session
// 				</button>
// 			</div>
// 		) : (
// 			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative">
// 				<div className="flex flex-col gap-2">
// 					<HostCard handleGenerateId={handleGenerateId} />
// 	  				{/*Paarth -screen share button*/}
// 	  				<button onClick={startScreenShare} className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium transition">
// 						📷 Start Screen Share
// 	  				</button>
// 				</div>
				
// 				{/*Aayushi code - UI*/}
// 				<JoinCard remoteId={remoteId} setRemoteId={setRemoteId} handleJoin={handleJoin} />
// 				{/* This places the menu exactly where it is in the screenshot */}
// 				<ContextDropdown />
// 			</div>
// 		)}

//         {/* The bottom list from the screenshot */}
//         <div className="mt-12 w-full max-w-4xl">
// 			<RecentSessions />
// 		</div>
		
//       </main>
//     </div>
//   );
// }






import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { HostCard } from '@/components/sections/HostCard';
import { JoinCard } from '@/components/sections/Joincard';
import { RecentSessions } from '@/components/sections/RecentSessions';
import { ContextDropdown } from '@/components/sections/ContextDropdown';
import { usePeerConnection } from './hooks/usePeerConnection';

export default function App() {
    const [myId, setMyId] = useState("00675699665");
    const [remoteId, setRemoteId] = useState("");

    // Refs for the video elements
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // WebRTC Hook
    const {
        startScreenShare, myStream, remoteStream, connectionStatus, connectToPeer // Assuming your hook will export this for the Join button
    } = usePeerConnection(myId, remoteId);

    // Effect to attach local stream to the "My Screen" video tag
    useEffect(() => {
        if (myStream && myVideoRef.current) {
            myVideoRef.current.srcObject = myStream;
        }
    }, [myStream]);

    // Effect to attach remote stream to the "Remote Screen" video tag
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handleGenerateId = () => {
        setMyId(Math.floor(10000000000 + Math.random() * 90000000000).toString());
    };

    const handleJoin = () => {
        if (!remoteId) {
            alert("Please enter a valid Remote ID to connect.");
            return;
        }
        // Logic to initiate WebRTC offer
        if (connectToPeer) {
            connectToPeer(remoteId);
        } else {
            console.warn("connectToPeer function not found in usePeerConnection hook.");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground bg-grid font-sans selection:bg-primary/30 flex flex-col overflow-hidden">
            <Navbar />
            
            <main className="flex-1 flex flex-col items-center justify-start pt-16 px-4 relative z-10">
                
                <HeroSection myId={myId} />

                {/* Connection Status Indicator */}
                <div className={`mb-4 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
                    connectionStatus === 'Connected' ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'
                }`}>
                    Status: {connectionStatus}
                </div>

                {/* Video Stream Section */}
                {(myStream || remoteStream) ? (
                    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-500">
                        
                        {/* My Local Screen Container */}
                        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden relative aspect-video shadow-2xl">
                            <p className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded text-xs font-medium z-20 border border-white/5">
                                My Screen (Broadcasting)
                            </p>
                            <video 
                                ref={myVideoRef}
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Remote Screen Container */}
                        <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden relative aspect-video shadow-2xl">
                            <p className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded text-xs font-medium z-20 border border-white/5">
                                Remote Screen
                            </p>
                            {remoteStream ? (
                                <video 
                                    ref={remoteVideoRef}
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-contain bg-black"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm">Waiting for incoming stream...</span>
                                </div>
                            )}
                        </div>
                        
                        {/* End Session Button */}
                        <button 
                            onClick={() => window.location.reload()} 
                            className="col-span-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-lg border border-red-500/20 transition-all font-medium"
                        >
                            End Remote Session
                        </button>
                    </div>
                ) : (
                    /* Setup Section */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative">
                        <div className="flex flex-col gap-4">
                            <HostCard handleGenerateId={handleGenerateId} />
                            
                            <button 
                                onClick={startScreenShare} 
                                className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
                            >
                                📺 Start Broadcasting My Screen
                            </button>
                        </div>
                        
                        <JoinCard 
                            remoteId={remoteId} 
                            setRemoteId={setRemoteId} 
                            handleJoin={handleJoin} 
                        />
                        
                        <ContextDropdown />
                    </div>
                )}

                <div className="mt-12 w-full max-w-4xl">
                    <RecentSessions />
                </div>
                
            </main>
        </div>
    );
}