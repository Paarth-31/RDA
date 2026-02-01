import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    // Phase 2: We will add WebRTC signal forwarding here
  });
});

console.log('Signaling server running on port 8080');
