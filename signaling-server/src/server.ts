import fs from 'fs';
import path from 'path';
import http from 'http';
import {Server} from 'socket.io';
import { setupSocketEvents } from './events';

const PORT=8080;

// 1. Create the HTTP Server with explicit CORS headers
const httpServer = http.createServer((req, res) => {
    // Force the raw server to allow cross-origin traffic
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Handle the silent CORS preflight check safely
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Standard response
    res.writeHead(200);
    res.end('RDA Secure Signaling Server is Live!');
});

// 2. Attach Socket.io ONCE (Keep this exactly as you have it)
const io = new Server(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    },
    allowEIO3: false,
    transports: ['websocket', 'polling']
});

//3. Rate Limitng (DoS Protection)
const rateMap = new Map<string, number>();

io.use((socket, next) => {
	const ip = socket.handshake.address;
	const now = Date.now();
	const lastRequest = rateMap.get(ip) || 0;

	//Limit: Max 1 request every 100 ms per IP\
	if(now-lastRequest<100) {
		return next(new Error("Rate limit exceeded"));
	}
	rateMap.set(ip, now);
	next();
});

//4. Attach the Logic from events.ts
setupSocketEvents(io);

httpServer.listen(PORT, () => {
	console.log(`🔒 Secure Signaling Server running on wss://localhost:${PORT}`);
});
