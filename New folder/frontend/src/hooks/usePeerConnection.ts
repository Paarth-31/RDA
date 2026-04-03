// import {useEffect, useState, useCallback} from "react";
// import {io, Socket} from "socket.io-client";
// import peer from "../services/peer";

// const SERVER_URL = "https://rda-signaling.duckdns.org";
// export const usePeerConnection = (myEmail: string, roomId:string) => {
// 	const [socket, setSocket] = useState<Socket | null>(null);
// 	const [myStream, setMyStream] = useState<MediaStream | null>(null);
// 	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
// 	const [connectedUser, setConnectedUser] = useState<string | null>(null);
// 	const [status, setStatus] = useState("Disconnected");

// 	//Setup Socket Connection
// 	useEffect(() => {
// 		const newSocket = io(SERVER_URL, {
// 			rejectUnauthorized: false
// 		});
// 		setSocket(newSocket);
// 		newSocket.on('connect', () => setStatus("Connected"));
// 		newSocket.on('disconnect', () => setStatus("Disconnected"));
// 		return () => { newSocket.disconnect(); };
// 	}, []);

// 	//Handle Incoming Signals
// 	useEffect(() => {
// 		if(!socket) return;
// 		//Join the room
// 		socket.emit("join-room", {roomId, emailId: myEmail });
// 		//Someone joined -> We can now call them
// 		socket.on("user-joined", ({emailId, id}) => {
// 			console.log(`User joined: ${emailId}`);
// 			setConnectedUser(id);
// 		});

// 		//Incoming call (User B receives offer)
// 		socket.on("incoming-call", async ({from, signal }) => {
// 			console.log("Receiving call from", from);
// 			const answer = await peer.getAnswer(signal);
// 			socket.emit("answer-call", {to:from, signal: answer});
// 			setConnectedUser(from);
// 		});

// 		//Call Accepted (User A receives answer)
// 		socket.on("call-accepted", async (signal) => {
// 			console.log("Call accepted!!");
// 			await peer.setLocalDescription(signal);
// 		});

// 		//ICE Candidates (Handling network path)
// 		socket.on("ice-candidate", async ({candidate}) => {
// 			if(peer.peer) await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
// 		});

// 		//Handle Remote Stream (When video arrives)
// 		if(myVideoRef.current) {
// 			myVideoRef.current.srcObject = stream;
// 		}
// 		if(peer.peer){
// 			peer.peer.addEventListener("track", (ev) => {
// 				console.log("Remote Stream Received!!");
// 				setRemoteStream(ev.streams[0]);
// 			});

// 			//Send out ICE candidates to the other peer
// 			peer.peer.onicecandidate = (event) => {
// 				if(event.candidate){
// 					socket.emit("ice-candidate", {
// 						target: connectedUser,
// 						candidate: event.candidate,
// 					});
// 				}
// 			};
// 		}
// 		return () => {
// 			socket.off("user-joined");
// 			socket.off("incoming-call");
// 			socket.off("call-accepted");
// 			socket.off("ice-candidate");
// 		};
// 	}, [socket, myEmail, roomId, connectedUser]);

// 	//Screen Share Trigger
// 	const startScreenShare = useCallback(async () => {
// 		try{
// 			const stream = await navigator.mediaDevices.getDisplayMedia({
// 				video: true,
// 				audio: false,
// 			});
// 			setMyStream(stream);
// 			peer.addStream(stream);

// 			//Initiate call if someone is connected
// 			if(connectedUser && socket){
// 				const offer = await peer.getOffer();
// 				socket.emit("call-user", {
// 					    userToCall: connectedUser,
// 					    from: socket.id,
// 					    signalData: offer
// 				});
// 			}
// 		} catch(err){
// 			console.error("Failed to get screen stream:", err);
// 		}
// 	}, [socket, connectedUser]);

// 	return {
// 		startScreenShare,
// 		myStream,
// 		remoteStream,
// 		connectionStatus: status
// 	};
// };












import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import peer from "../services/peer";

const SERVER_URL = "https://rda-signaling.duckdns.org";

export const usePeerConnection = (myId: string, remoteId: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [connectedUser, setConnectedUser] = useState<string | null>(null);
    const [status, setStatus] = useState("Disconnected");

    // 1. Setup Socket Connection
    useEffect(() => {
        const newSocket = io(SERVER_URL, {
            secure: true,
            reconnection: true,
            rejectUnauthorized: false // Helps with specific self-signed dev issues
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            setStatus("Connected");
            console.log("Socket Connected:", newSocket.id);
            // Join a room based on your ID so others can find you
            newSocket.emit("join-room", { roomId: myId, emailId: myId });
        });

        newSocket.on('disconnect', () => setStatus("Disconnected"));

        return () => {
            newSocket.disconnect();
        };
    }, [myId]);

    // 2. Handle Incoming Signals
    useEffect(() => {
        if (!socket) return;

        // Someone joined your room
        socket.on("user-joined", ({ emailId, id }) => {
            console.log(`User joined your room: ${emailId}`);
            setConnectedUser(id); // Now we know who to call
        });

        // Incoming call (User B receives offer)
        socket.on("incoming-call", async ({ from, signal }) => {
            console.log("Receiving call from", from);
            const answer = await peer.getAnswer(signal);
            socket.emit("answer-call", { to: from, signal: answer });
            setConnectedUser(from);
        });

        // Call Accepted (User A receives answer)
        socket.on("call-accepted", async ({ signal }) => {
            console.log("Call accepted by remote peer!");
            await peer.setRemoteDescription(signal);
        });

        // ICE Candidates
        socket.on("ice-candidate", async ({ candidate }) => {
            if (peer.peer) {
                await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        // Listen for remote tracks
        const handleTrackEvent = (ev: RTCTrackEvent) => {
            console.log("Remote Stream Received!!");
            setRemoteStream(ev.streams[0]);
        };

        if (peer.peer) {
            peer.peer.addEventListener("track", handleTrackEvent);

            peer.peer.onicecandidate = (event) => {
                if (event.candidate && connectedUser) {
                    socket.emit("ice-candidate", {
                        target: connectedUser,
                        candidate: event.candidate,
                    });
                }
            };
        }

        return () => {
            socket.off("user-joined");
            socket.off("incoming-call");
            socket.off("call-accepted");
            socket.off("ice-candidate");
            if (peer.peer) peer.peer.removeEventListener("track", handleTrackEvent);
        };
    }, [socket, connectedUser]);

    // 3. The "Join" Logic (Used by the Invite Button)
    const connectToPeer = useCallback(async (targetId: string) => {
        if (!socket) return;
        
        console.log("Initiating call to:", targetId);
        const offer = await peer.getOffer();
        
        // We emit to the room or specific user ID
        socket.emit("call-user", {
            userToCall: targetId,
            from: socket.id,
            signalData: offer
        });
    }, [socket]);

    // 4. Screen Share Trigger
    const startScreenShare = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });
            
            setMyStream(stream);
            
            // Add tracks to the peer connection
            stream.getTracks().forEach((track) => {
                peer.peer?.addTrack(track, stream);
            });

        } catch (err) {
            console.error("Failed to get screen stream:", err);
        }
    }, []);

    return {
        startScreenShare,
        connectToPeer, // Exported for the Join button in App.tsx
        myStream,
        remoteStream,
        connectionStatus: status
    };
};