import fs from 'fs';
import path from 'path';
import https from 'https';
import {Server} from 'socket.io';
import { setupSocketEvents } from './events';

const PORT=8080;

const sslOptions = {
	key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
	cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem')),
};

const httpsServer = https.createServer(sslOptions, (req,res) => {
	res.writeHead(200);
	res.end('RDA Secure Signaling Server');
});

const io=new Server(httpsServer, {
	cors:{
		//SECURITY: Only allow Frontend and Electron app
		origin: ["https://localhost:3000", "file://"],
		methods:["GET","POST"],
		credentials: true
	},
	allowEIO3: false, //Disable older, less secure protocol versions
	transports: ['websocket'],
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

httpsServer.listen(PORT, () => {
	console.log(`🔒 Secure Signaling Server running on wss://localhost:${PORT}`);
});
