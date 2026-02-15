import { Server, Socket } from 'socket.io';
import { isValidRoomId, isValidSDP, isValidCandidate } from './validators';

export const setupSocketEvents = (io: Server) => {
	io.on('connection', (socket: Socket) => {
		console.log(`User connected: ${socket.id}`);

		// 1. Join Room
		socket.on('join-room', (roomId: string) => {
			if(!isValidRoomId(roomId)) {
				socket.emit('error', 'Invalid room ID');
				return;
			}

			const room = io.sockets.adapter.rooms.get(roomId);
			if(room && room.size>=2) {
				return socket.emit('error', 'Room is full (Max 2 peers)');
			}
			socket.join(roomId);
			socket.to(roomId).emit('user-connected', socket.id);
			console.log(`User ${socket.id} joined room ${roomId}`);
		});

		//2. Relay Offer (Call-User)
		socket.on('call-user', (data) => {
			const { userToCall, signalData, from } = data;

			//Security: Validate Payload
			if(!isValidSDP(signalData)) {
				console.warn(`Malicious SDP from ${socket.id}`);
				return;
			}

			//Relay: "Hey User B, here is the Offer from User A"
			io.to(userToCall).emit('incoming-call', {
				signal: signalData,
				from
			});
		});

		//3. Relay Answer (Accept-Call)
		socket.on('answer-call', (data) => {
			const { to, signal } = data;

			if(!isValidSDP(signal)) return;

			//Relay: "Hey User A, User B accepted your call"
			io.to(to).emit('call-accepted', signal);
		});

		//4. Relay ICE Candidate
		socket.on('ice-candidate', (data) => {
			const { target, candidate } = data;

			if(!isValidCandidate(candidate)) return;

			io.to(target).emit('ice-candidate', { candidate, from:socket.id});
		});
	});
};
