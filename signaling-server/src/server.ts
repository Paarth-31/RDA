// // import fs from 'fs';
// // import path from 'path';
// // import http from 'http';
// // import {Server} from 'socket.io';
// // import { setupSocketEvents } from './events';

// // const PORT=8080;

// // // 1. Create the HTTP Server with explicit CORS headers
// // const httpServer = http.createServer((req, res) => {
// //     // Force the raw server to allow cross-origin traffic
// //     res.setHeader('Access-Control-Allow-Origin', '*');
// //     res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
// //     res.setHeader('Access-Control-Allow-Headers', '*');

// //     // Handle the silent CORS preflight check safely
// //     if (req.method === 'OPTIONS') {
// //         res.writeHead(200);
// //         res.end();
// //         return;
// //     }

// //     // Standard response
// //     res.writeHead(200);
// //     res.end('RDA Secure Signaling Server is Live!');
// // });

// // // 2. Attach Socket.io ONCE (Keep this exactly as you have it)
// // const io = new Server(httpServer, {
// //     cors: {
// //         origin: "*", 
// //         methods: ["GET", "POST"]
// //     },
// //     allowEIO3: false,
// // //    transports: ['websocket', 'polling']
// // });

// // //3. Rate Limitng (DoS Protection)
// // const rateMap = new Map<string, number>();
// // setInterval(() => rateMap.clear(), 60_000);

// // io.use((socket, next) => {
// // 	const ip = socket.handshake.address;
// // 	const now = Date.now();
// // 	const lastRequest = rateMap.get(ip) || 0;

// // 	//Limit: Max 1 request every 100 ms per IP\
// // 	if(now-lastRequest<100) {
// // 		return next(new Error("Rate limit exceeded"));
// // 	}
// // 	rateMap.set(ip, now);
// // 	next();
// // });

// // //4. Attach the Logic from events.ts
// // setupSocketEvents(io);

// // httpServer.listen(PORT, () => {
// // 	console.log(`🔒 Secure Signaling Server running on wss://localhost:${PORT}`);
// // });




// // signaling-server/src/server.ts — updated to include DB, routes, health polling

// import 'dotenv/config';
// import http from 'http';
// import { Server } from 'socket.io';
// import express from 'express';
// import cors from 'cors';
// import { setupSocketEvents } from './events';
// import { pool } from './db/client';
// import { recordSystemHealth } from './db/admin';
// import authRouter from './routes/auth';
// import sessionsRouter from './routes/sessions';

// const PORT = 8080;
// const app = express();

// app.use(cors({ origin: '*' }));
// app.use(express.json());

// // ── REST API routes ───────────────────────────────────────────────────────
// app.use('/auth',     authRouter);
// app.use('/sessions', sessionsRouter);

// app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// // ── HTTP + Socket.io ──────────────────────────────────────────────────────
// const httpServer = http.createServer(app);

// const io = new Server(httpServer, {
//   cors: { origin: '*', methods: ['GET', 'POST'] },
// });

// // Rate limiting middleware
// const rateMap = new Map<string, number>();
// setInterval(() => rateMap.clear(), 60_000);

// io.use((socket, next) => {
//   const ip = socket.handshake.address;
//   const now = Date.now();
//   if (now - (rateMap.get(ip) ?? 0) < 100) {
//     return next(new Error('Rate limit exceeded'));
//   }
//   rateMap.set(ip, now);
//   next();
// });

// setupSocketEvents(io);

// // ── System health polling every 30s ──────────────────────────────────────
// setInterval(async () => {
//   try {
//     const poolStats = pool as any;
//     await recordSystemHealth(
//       io.sockets.sockets.size,         // active socket connections
//       io.sockets.sockets.size,
//       poolStats.totalCount - poolStats.idleCount,
//       poolStats.totalCount
//     );
//   } catch (e) {
//     console.error('Health record failed:', e);
//   }
// }, 30_000);

// httpServer.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


// signaling-server/src/server.ts
// Complete working version

import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { setupSocketEvents } from './events';
import { queryService, getPoolStats } from './db/client';
import { recordSystemHealth } from './db/admin';
import authRouter from './routes/auth';
import sessionsRouter from './routes/sessions';
import adminRouter from './routes/admin';

const PORT = parseInt(process.env.PORT ?? '8080');

async function bootstrap() {
  const app = express();

  // ── Middleware — ORDER MATTERS: body parsing must come first ────────────
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '2mb' }));        // ← fixes req.body undefined
  app.use(express.urlencoded({ extended: true })); // ← handles form bodies too

  // ── REST routes ──────────────────────────────────────────────────────────
  app.use('/auth',     authRouter);      // ← plain router, no factory
  app.use('/sessions', sessionsRouter);
  app.use('/admin',    adminRouter);     // ← was missing, causes 404

  // ── Health check (no auth needed) ───────────────────────────────────────
  app.get('/health', async (_req: Request, res: Response) => {
    try {
      const stats = await getPoolStats();
      res.json({
        status:  'ok',
        db_pool: stats,
        ts:      new Date().toISOString(),
      });
    } catch {
      res.status(500).json({ status: 'error' });
    }
  });

  // ── 404 handler for unknown routes ──────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // ── HTTP + Socket.io ─────────────────────────────────────────────────────
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Rate limiting for socket connections
  const rateMap = new Map<string, number>();
  setInterval(() => rateMap.clear(), 60_000);

  io.use((socket, next) => {
    const ip  = socket.handshake.address;
    const now = Date.now();
    if (now - (rateMap.get(ip) ?? 0) < 100) {
      return next(new Error('Rate limit exceeded'));
    }
    rateMap.set(ip, now);
    next();
  });

  setupSocketEvents(io);

  // ── System health polling every 30s ──────────────────────────────────────
  setInterval(async () => {
    try {
      const stats = await getPoolStats();
      await recordSystemHealth(
        io.sockets.sockets.size,
        io.sockets.sockets.size,
        stats.total - stats.idle,
        stats.total
      );
    } catch (e: any) {
      // Never crash the server over a health record failure
      console.warn('[Health] Skipped:', e.message);
    }
  }, 30_000);

  // ── Start listening ──────────────────────────────────────────────────────
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Routes mounted:`);
    console.log(`  POST   /auth/register`);
    console.log(`  POST   /auth/login`);
    console.log(`  POST   /auth/refresh`);
    console.log(`  POST   /auth/logout`);
    console.log(`  GET    /auth/me`);
    console.log(`  GET    /auth/sessions`);
    console.log(`  DELETE /auth/sessions/:id`);
    console.log(`  PATCH  /auth/password`);
    console.log(`  POST   /sessions`);
    console.log(`  GET    /sessions`);
    console.log(`  GET    /sessions/:id`);
    console.log(`  PATCH  /sessions/:id/end`);
    console.log(`  GET    /admin/dashboard`);
    console.log(`  GET    /admin/users`);
    console.log(`  PATCH  /admin/users/:id`);
    console.log(`  GET    /admin/config`);
    console.log(`  PATCH  /admin/config/:key`);
    console.log(`  GET    /admin/health/history`);
    console.log(`  GET    /admin/logs`);
    console.log(`  GET    /health`);
  });
}

bootstrap().catch((err) => {
  console.error('[Boot] Fatal error:', err);
  process.exit(1);
});