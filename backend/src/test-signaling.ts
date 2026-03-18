import { io, Socket } from "socket.io-client";

const SERVER_URL = "https://rda-signaling.duckdns.org";
const ROOM_ID = "test-secure-room";

//Options for Self-Signed Certs(Development Only)
const OPTIONS = {
	transports: ["websocket"], //Force WebSocket
	rejectUnauthorized: false, //Trust self-signed certs
};

//Helper to create a client
const createClient = (email:string) => {
	const socket = io(SERVER_URL, OPTIONS);

	socket.on("connect_error", (err) => {
		console.error(`❌ [${email}] Connection Error: ${err.message}`);
	});

	return socket;
};

//Main test flow
async function runTest() {
	console.log("🚀 Starting Secure WSS Signaling Test...");

	//1. Initialise 2 users
	console.log("🔹 Creating User A...");
	const userA = createClient("UserA@test.com");

	await new Promise(resolve => setTimeout(resolve, 500));
	console.log("🔹 Creating User B...");
	const userB = createClient("UserB@test.com");

	//2. Setup Listeners for User B(Receiver)
	const userB_Promise = new Promise<void>((resolve) => {
		//Listen for 'user-joined' to know when A is ready
		userB.on("user-joined", ({emailId}) => {
			console.log(`✅ [User B] saw ${emailId} join the room.`);
		});

		//Listen for the incoming call (The critical WebRTC signal)
		userB.on("incoming-call", ({ from, signal }) => {
			console.log(`📞 [User B] Received CALL from ${from}`);
			console.log(` Signal Data: `, signal);
			console.log("✅ TEST PASSED: Signaling relay works secure!");
			resolve();
		});
	});

	//3. Connect & Join Room
	userA.on("connect", () => {
		console.log(`🔹 [User A] Connected (${userA.id})`);
		userA.emit("join-room", {roomId: ROOM_ID, emailId: "UserA@test.com" });
	});
	userB.on("connect", () => {
		console.log(`🔹 [User B] Connected (${userB.id})`);
		userB.emit("join-room", {roomId: ROOM_ID, emailId: "UserB@test.com" });
	});

	//4. Trigget the Call
	setTimeout(() => {
		console.log("📤 [User A] Sending Offer to User B...");
		if(userB.id){
			userA.emit("call-user", {
				userToCall: userB.id,
				from: userA.id,
				signalData: { type: "offer", sdp: "v=0..." }
			});
		}
	}, 1500);

	//5. Cleanup after success
	await userB_Promise;
	userA.disconnect();
	userB.disconnect();
	process.exit(0);
}

runTest();
