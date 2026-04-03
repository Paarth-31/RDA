// // // import {useEffect, useState, useCallback} from "react";
// // // import {io, Socket} from "socket.io-client";
// // // import peer from "../services/peer";

// // // const SERVER_URL = "https://rda-signaling.duckdns.org";
// // // export const usePeerConnection = (myEmail: string, roomId:string) => {
// // // 	const [socket, setSocket] = useState<Socket | null>(null);
// // // 	const [myStream, setMyStream] = useState<MediaStream | null>(null);
// // // 	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
// // // 	const [connectedUser, setConnectedUser] = useState<string | null>(null);
// // // 	const [status, setStatus] = useState("Disconnected");

// // // 	//Setup Socket Connection
// // // 	useEffect(() => {
// // // 		const newSocket = io(SERVER_URL, {
// // // 			rejectUnauthorized: false
// // // 		});
// // // 		setSocket(newSocket);
// // // 		newSocket.on('connect', () => setStatus("Connected"));
// // // 		newSocket.on('disconnect', () => setStatus("Disconnected"));
// // // 		return () => { newSocket.disconnect(); };
// // // 	}, []);

// // // 	//Handle Incoming Signals
// // // 	useEffect(() => {
// // // 		if(!socket) return;
// // // 		//Join the room
// // // 		socket.emit("join-room", {roomId, emailId: myEmail });
// // // 		//Someone joined -> We can now call them
// // // 		socket.on("user-joined", ({emailId, id}) => {
// // // 			console.log(`User joined: ${emailId}`);
// // // 			setConnectedUser(id);
// // // 		});

// // // 		//Incoming call (User B receives offer)
// // // 		socket.on("incoming-call", async ({from, signal }) => {
// // // 			console.log("Receiving call from", from);
// // // 			const answer = await peer.getAnswer(signal);
// // // 			socket.emit("answer-call", {to:from, signal: answer});
// // // 			setConnectedUser(from);
// // // 		});

// // // 		//Call Accepted (User A receives answer)
// // // 		socket.on("call-accepted", async (signal) => {
// // // 			console.log("Call accepted!!");
// // // 			await peer.setLocalDescription(signal);
// // // 		});

// // // 		//ICE Candidates (Handling network path)
// // // 		socket.on("ice-candidate", async ({candidate}) => {
// // // 			if(peer.peer) await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
// // // 		});

// // // 		//Handle Remote Stream (When video arrives)
// // // 		if(myVideoRef.current) {
// // // 			myVideoRef.current.srcObject = stream;
// // // 		}
// // // 		if(peer.peer){
// // // 			peer.peer.addEventListener("track", (ev) => {
// // // 				console.log("Remote Stream Received!!");
// // // 				setRemoteStream(ev.streams[0]);
// // // 			});

// // // 			//Send out ICE candidates to the other peer
// // // 			peer.peer.onicecandidate = (event) => {
// // // 				if(event.candidate){
// // // 					socket.emit("ice-candidate", {
// // // 						target: connectedUser,
// // // 						candidate: event.candidate,
// // // 					});
// // // 				}
// // // 			};
// // // 		}
// // // 		return () => {
// // // 			socket.off("user-joined");
// // // 			socket.off("incoming-call");
// // // 			socket.off("call-accepted");
// // // 			socket.off("ice-candidate");
// // // 		};
// // // 	}, [socket, myEmail, roomId, connectedUser]);

// // // 	//Screen Share Trigger
// // // 	const startScreenShare = useCallback(async () => {
// // // 		try{
// // // 			const stream = await navigator.mediaDevices.getDisplayMedia({
// // // 				video: true,
// // // 				audio: false,
// // // 			});
// // // 			setMyStream(stream);
// // // 			peer.addStream(stream);

// // // 			//Initiate call if someone is connected
// // // 			if(connectedUser && socket){
// // // 				const offer = await peer.getOffer();
// // // 				socket.emit("call-user", {
// // // 					    userToCall: connectedUser,
// // // 					    from: socket.id,
// // // 					    signalData: offer
// // // 				});
// // // 			}
// // // 		} catch(err){
// // // 			console.error("Failed to get screen stream:", err);
// // // 		}
// // // 	}, [socket, connectedUser]);

// // // 	return {
// // // 		startScreenShare,
// // // 		myStream,
// // // 		remoteStream,
// // // 		connectionStatus: status
// // // 	};
// // // };


// // import { useEffect, useState, useCallback, useRef } from "react";
// // import { io, Socket } from "socket.io-client";
// // import peer from "../services/peer";

// // const SERVER_URL = "https://rda-signaling.duckdns.org";

// // export const usePeerConnection = (myId: string, remoteId: string) => {
// //     const [socket, setSocket] = useState<Socket | null>(null);
// //     const [myStream, setMyStream] = useState<MediaStream | null>(null);
// //     const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
// //     const [connectedUser, setConnectedUser] = useState<string | null>(null);
// //     const [status, setStatus] = useState("Disconnected");

// //     // 1. Setup Socket Connection
// //     useEffect(() => {
// //         const newSocket = io(SERVER_URL, {
// //             secure: true,
// //             reconnection: true,
// //             rejectUnauthorized: false // Helps with specific self-signed dev issues
// //         });

// //         setSocket(newSocket);

// //         newSocket.on('connect', () => {
// //             setStatus("Connected");
// //             console.log("Socket Connected:", newSocket.id);
// //             // Join a room based on your ID so others can find you
// //             newSocket.emit("join-room", { roomId: myId, emailId: myId });
// //         });

// //         newSocket.on('disconnect', () => setStatus("Disconnected"));

// //         return () => {
// //             newSocket.disconnect();
// //         };
// //     }, [myId]);

// //     // 2. Handle Incoming Signals
// //     useEffect(() => {
// //         if (!socket) return;

// //         // Someone joined your room
// //         socket.on("user-joined", ({ emailId, id }) => {
// //             console.log(`User joined your room: ${emailId}`);
// //             setConnectedUser(id); // Now we know who to call
// //         });

// //         // Incoming call (User B receives offer)
// //         socket.on("incoming-call", async ({ from, signal }) => {
// //             console.log("Receiving call from", from);
// //             const answer = await peer.getAnswer(signal);
// //             socket.emit("answer-call", { to: from, signal: answer });
// //             setConnectedUser(from);
// //         });

// //         // Call Accepted (User A receives answer)
// //         socket.on("call-accepted", async ({ signal }) => {
// //             console.log("Call accepted by remote peer!");
// //             await peer.setRemoteDescription(signal);
// //         });

// //         // ICE Candidates
// //         socket.on("ice-candidate", async ({ candidate }) => {
// //             if (peer.peer) {
// //                 await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
// //             }
// //         });

// //         // Listen for remote tracks
// //         const handleTrackEvent = (ev: RTCTrackEvent) => {
// //             console.log("Remote Stream Received!!");
// //             setRemoteStream(ev.streams[0]);
// //         };

// //         if (peer.peer) {
// //             peer.peer.addEventListener("track", handleTrackEvent);

// //             peer.peer.onicecandidate = (event) => {
// //                 if (event.candidate && connectedUser) {
// //                     socket.emit("ice-candidate", {
// //                         target: connectedUser,
// //                         candidate: event.candidate,
// //                     });
// //                 }
// //             };
// //         }

// //         return () => {
// //             socket.off("user-joined");
// //             socket.off("incoming-call");
// //             socket.off("call-accepted");
// //             socket.off("ice-candidate");
// //             if (peer.peer) peer.peer.removeEventListener("track", handleTrackEvent);
// //         };
// //     }, [socket, connectedUser]);

// //     // 3. The "Join" Logic (Used by the Invite Button)
// //     const connectToPeer = useCallback(async (targetId: string) => {
// //         if (!socket) return;
        
// //         console.log("Initiating call to:", targetId);
// //         const offer = await peer.getOffer();
        
// //         // We emit to the room or specific user ID
// //         socket.emit("call-user", {
// //             userToCall: targetId,
// //             from: socket.id,
// //             signalData: offer
// //         });
// //     }, [socket]);

// //     // 4. Screen Share Trigger
// //     const startScreenShare = useCallback(async () => {
// //         try {
// //             const stream = await navigator.mediaDevices.getDisplayMedia({
// //                 video: true,
// //                 audio: false,
// //             });
            
// //             setMyStream(stream);
            
// //             // Add tracks to the peer connection
// //             stream.getTracks().forEach((track) => {
// //                 peer.peer?.addTrack(track, stream);
// //             });

// //         } catch (err) {
// //             console.error("Failed to get screen stream:", err);
// //         }
// //     }, []);

// //     return {
// //         startScreenShare,
// //         connectToPeer, // Exported for the Join button in App.tsx
// //         myStream,
// //         remoteStream,
// //         connectionStatus: status
// //     };
// // };


// import { useEffect, useState, useCallback, useRef } from "react";
// import { io, Socket } from "socket.io-client";
// import peer from "../services/peer";

// const SERVER_URL = "https://rda-signaling.duckdns.org";

// export const usePeerConnection = (myId: string, remoteId: string) => {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [myStream, setMyStream] = useState<MediaStream | null>(null);
//   const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
//   const [status, setStatus] = useState("Disconnected");
//   const connectedUserRef = useRef<string | null>(null); // <-- ref, not state

//   useEffect(() => {
//     peer.reset(); // fresh peer on every mount
//     const newSocket = io(SERVER_URL, { rejectUnauthorized: false });
//     setSocket(newSocket);

//     newSocket.on('connect', () => {
//       setStatus("Connected");
//       newSocket.emit("join-room", myId);
//     });
//     newSocket.on('disconnect', () => setStatus("Disconnected"));

//     // Someone joined your room
//     newSocket.on("user-connected", (userId: string) => {
//       connectedUserRef.current = userId;
//     });


//     newSocket.on("incoming-call", async ({ from, signal }) => {
//       console.log("incoming-call received, from:", from);
//       console.log("incoming-call signal type:", signal?.type);
//       connectedUserRef.current = from;
//       const answer = await peer.getAnswer(signal);
//       console.log("emitting answer-call to:", from, "answer type:", answer?.type);        // ← add this
//       newSocket.emit("answer-call", { to: from, signal: answer });
//     });
    
//     // Call accepted (User A) — fixed destructuring
//     newSocket.on("call-accepted", async (data) => {
//       const signal = data?.signal ?? data;
//       await peer.setRemoteDescription(signal);
//     });

//     // ICE candidates
//     newSocket.on("ice-candidate", async ({ candidate }) => {
//       if (peer.peer) await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
//     });

//     // Remote track
//     if (peer.peer) {
//       peer.peer.addEventListener("track", (ev: RTCTrackEvent) => {
//         setRemoteStream(ev.streams[0]);
//       });

//       // ICE candidate handler uses ref so it always has the latest peer ID
//       peer.peer.onicecandidate = (event) => {
//         if (event.candidate && connectedUserRef.current) {
//           newSocket.emit("ice-candidate", {
//             target: connectedUserRef.current,
//             candidate: event.candidate,
//           });
//         }
//       };
//     }

//     return () => { newSocket.disconnect(); };
//   }, [myId]);

//   // startScreenShare now also initiates the call — tracks MUST be added before offer
//   const startScreenShare = useCallback(async () => {
//     if (!socket) return;
//     try {
//       const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
//       setMyStream(stream);

//       // 1. Add tracks FIRST
//       stream.getTracks().forEach(track => peer.peer?.addTrack(track, stream));

//       // 2. Then create and send offer (only if someone is already in the room)
//       if (connectedUserRef.current) {
//         const offer = await peer.getOffer();
//         socket.emit("call-user", {
//           userToCall: connectedUserRef.current,
//           from: socket.id,
//           signalData: offer,
//         });
//       }
//     } catch (err) {
//       console.error("Screen share failed:", err);
//     }
//   }, [socket]);

//   // connectToPeer: used by the Join button — triggers the offer when joining someone else's room
//   const connectToPeer = useCallback(async (targetId: string) => {
//     if (!socket) return;
//     connectedUserRef.current = targetId;
//     const offer = await peer.getOffer();
//     socket.emit("call-user", { userToCall: targetId, from: socket.id, signalData: offer });
//   }, [socket]);

//   return { startScreenShare, connectToPeer, myStream, remoteStream, connectionStatus: status };
// };





import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import peer from "../services/peer";

const SERVER_URL = "https://rda-signaling.duckdns.org";

export const usePeerConnection = (myId: string, remoteId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState("Disconnected");
  const connectedUserRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null); // ref copy so callbacks always have latest socket

  useEffect(() => {
    peer.reset();
    const newSocket = io(SERVER_URL, { rejectUnauthorized: false });
    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setStatus("Connected");
      console.log("Socket connected, my socket ID:", newSocket.id);
      // Join MY room so others can find me by my display ID
      newSocket.emit("join-room", myId);
    });

    newSocket.on('disconnect', () => setStatus("Disconnected"));

    // When someone connects to MY room, I am the Client — auto start sharing
    newSocket.on("user-connected", async (socketId: string) => {
        console.log("Controller connected, their socket ID:", socketId);
        connectedUserRef.current = socketId;
        
        // Auto-start screen share — I am the machine being controlled
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });
            setMyStream(stream);
            stream.getTracks().forEach(track => peer.peer?.addTrack(track, stream));
            const offer = await peer.getOffer();
            newSocket.emit("call-user", {
                userToCall: socketId,
                from: newSocket.id,
                signalData: offer,
            });
        } catch (err) {
            console.error("Auto screen share failed:", err);
        }
    });

    // User B side: receiving an offer from User A
    newSocket.on("incoming-call", async ({ from, signal }) => {
      console.log("incoming-call from socket:", from, "signal type:", signal?.type);
      connectedUserRef.current = from; // ← store User A's socket ID
      const answer = await peer.getAnswer(signal);
      console.log("sending answer back to:", from, "answer type:", answer?.type);
      newSocket.emit("answer-call", { to: from, signal: answer });
    });

    // User A side: User B accepted, finalize connection
    newSocket.on("call-accepted", async (data) => {
      console.log("call-accepted raw data:", data);
      const signal = data?.signal ?? data; // handles both wrapped and unwrapped
      console.log("setting remote description, type:", signal?.type);
      await peer.setRemoteDescription(signal);
    });

    // Both sides: handle incoming ICE candidates
    newSocket.on("ice-candidate", async ({ candidate }) => {
      console.log("received ICE candidate");
      if (peer.peer) {
        await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Listen for remote stream tracks
    if (peer.peer) {
      peer.peer.addEventListener("track", (ev: RTCTrackEvent) => {
        console.log("Remote track received!");
        setRemoteStream(ev.streams[0]);
      });

      // Send our ICE candidates to the remote peer using their socket ID
      peer.peer.onicecandidate = (event) => {
        if (event.candidate && connectedUserRef.current) {
          console.log("sending ICE candidate to:", connectedUserRef.current);
          newSocket.emit("ice-candidate", {
            target: connectedUserRef.current, // ← socket ID, always correct via ref
            candidate: event.candidate,
          });
        }
      };
    }

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [myId]);

  // User B: clicking Join just joins User A's room
  // When User A starts screenshare, user-connected fires and the offer flows
  const connectToPeer = useCallback(async (targetId: string) => {
    if (!socketRef.current) return;
    console.log("Joining room:", targetId);
    // Just join their room — do NOT send offer here
    // The offer goes out from startScreenShare AFTER tracks are added
    socketRef.current.emit("join-room", targetId);
  }, []);

  // User A: start screenshare → add tracks → send offer to whoever joined
  const startScreenShare = useCallback(async () => {
    if (!socketRef.current) return;

    if (!connectedUserRef.current) {
      alert("No remote peer connected yet. Ask them to click Join first.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      setMyStream(stream);

      // 1. Add tracks FIRST before creating offer
      stream.getTracks().forEach(track => {
        console.log("Adding track:", track.kind);
        peer.peer?.addTrack(track, stream);
      });

      // 2. Now create offer with tracks included in SDP
      const offer = await peer.getOffer();
      console.log("Sending offer to:", connectedUserRef.current);

      socketRef.current.emit("call-user", {
        userToCall: connectedUserRef.current, // ← socket ID of the remote peer
        from: socketRef.current.id,
        signalData: offer,
      });

    } catch (err) {
      console.error("Screen share failed:", err);
    }
  }, []);

  return { startScreenShare, connectToPeer, myStream, remoteStream, connectionStatus: status };
};