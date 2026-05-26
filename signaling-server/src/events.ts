// signaling-server/src/events.ts
import { Server, Socket } from 'socket.io';
import { isValidRoomId, isValidSDP, isValidCandidate } from './validators';

export const setupSocketEvents = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // 1. Join Room
    socket.on('join-room', (roomId: string) => {
      if (!isValidRoomId(roomId)) {
        socket.emit('error', 'Invalid room ID');
        return;
      }
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room && room.size >= 2) {
        socket.emit('error', 'Room is full (max 2 peers)');
        return;
      }
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', socket.id);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // 2. Relay offer (initiator → receiver)
    socket.on('call-user', (data) => {
      const { userToCall, signalData, from } = data;
      if (!isValidSDP(signalData)) {
        console.warn(`Invalid SDP from ${socket.id}`);
        return;
      }
      io.to(userToCall).emit('incoming-call', { signal: signalData, from });
    });

    // 3. Relay answer (receiver → initiator)
    socket.on('answer-call', (data) => {
      const { to, signal } = data;
      if (!isValidSDP(signal)) {
        console.warn(`Invalid answer SDP from ${socket.id}`);
        return;
      }
      io.to(to).emit('call-accepted', { signal });
    });

    // 4. Relay ICE candidates
    socket.on('ice-candidate', (data) => {
      const { target, candidate } = data;
      if (!isValidCandidate(candidate)) return;
      io.to(target).emit('ice-candidate', { candidate, from: socket.id });
    });

    // 5. Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};