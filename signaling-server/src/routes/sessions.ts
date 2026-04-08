// // signaling-server/src/routes/sessions.ts

// import { Router, Request, Response } from 'express';
// import { authenticate } from './auth';
// import {
//   createSession, endSession, getSessionsByUser,
//   getSessionById, saveSessionStats
// } from '../db/sessions';
// import { checkSessionLimits, logUserAction } from '../db/admin';

// const router = Router();

// // POST /sessions — start a new session
// router.post('/', authenticate, async (req: Request, res: Response) => {
//   const userId = (req as any).userId;
//   const { hostDisplayId, screenAudio, videoCall, controlEnabled } = req.body;

//   const check = await checkSessionLimits(userId);
//   if (!check.allowed) {
//     return res.status(429).json({ error: check.reason });
//   }

//   const session = await createSession({
//     hostId: userId,
//     hostDisplayId,
//     screenAudio,
//     videoCall,
//     controlEnabled,
//   });

//   await logUserAction({
//     userId, sessionId: session.id,
//     action: 'session_start',
//     ipAddress: req.ip,
//   });

//   res.status(201).json(session);
// });

// // PATCH /sessions/:id/end
// router.patch('/:id/end', authenticate, async (req: Request, res: Response) => {
//   const { summary, stats } = req.body;
//   const sessionId = req.params.id as string;
//   const session = await endSession(sessionId, summary);
//   if (!session) return res.status(404).json({ error: 'Session not found' });

//  if (stats) await saveSessionStats(sessionId, stats);

//   await logUserAction({
//     userId: (req as any).userId,
//     sessionId: sessionId,
//     action: 'session_end',
//   });

//   res.json(session);
// });

// // GET /sessions — list my sessions
// router.get('/', authenticate, async (req: Request, res: Response) => {
//   const sessions = await getSessionsByUser((req as any).userId);
//   res.json(sessions);
// });

// // GET /sessions/:id
// router.get('/:id', authenticate, async (req: Request, res: Response) => {
// const sessionId = req.params.id as string; 
//   const session = await getSessionById(sessionId);
//   if (!session) return res.status(404).json({ error: 'Not found' });
//   res.json(session);
// });

// export default router;



// signaling-server/src/routes/sessions.ts

import { Router, Request, Response } from 'express';
import { authenticate } from './auth';
import {
  createSession,
  endSession,
  getSessionsByUser,
  getSessionById,
  saveSessionStats,
} from '../db/sessions';
import { checkSessionLimits, logUserAction } from '../db/admin';

const router = Router();

// ── POST /sessions — start a new session ─────────────────────────────────
router.post('/', authenticate, async (req: Request, res: Response) => {
  // Guard: body may be empty if Content-Type header was missing in Postman
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Request body is required' });
  }

  const {
    hostDisplayId,
    screenAudio    = false,
    videoCall      = false,
    controlEnabled = false,
    qualityPreset  = '720p',
  } = req.body;

  if (!hostDisplayId) {
    return res.status(400).json({ error: 'hostDisplayId is required' });
  }

  const userId = (req as any).userId;

  try {
    // Check if user has hit their session limits
    const check = await checkSessionLimits(userId);
    if (!check.allowed) {
      return res.status(429).json({ error: check.reason });
    }

    const session = await createSession({
      hostId: userId,
      hostDisplayId,
      screenAudio,
      videoCall,
      controlEnabled,
      qualityPreset,
    });

    await logUserAction({
      userId,
      sessionId:  session.id,
      action:     'session_start',
      ipAddress:  req.ip,
      metadata:   { hostDisplayId },
    });

    return res.status(201).json(session);
  } catch (e: any) {
    console.error('[Sessions] Create error:', e.message);
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

// ── GET /sessions — list my sessions ─────────────────────────────────────
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string ?? '20');
    const sessions = await getSessionsByUser((req as any).userId, limit);
    return res.json(sessions);
  } catch (e: any) {
    console.error('[Sessions] List error:', e.message);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ── GET /sessions/:id — get one session ──────────────────────────────────
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const session = await getSessionById(req.params.id as string);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    return res.json(session);
  } catch (e: any) {
    console.error('[Sessions] Get error:', e.message);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// ── PATCH /sessions/:id/end — end a session ───────────────────────────────
router.patch('/:id/end', authenticate, async (req: Request, res: Response) => {
  const { summary, stats } = req.body ?? {};

  try {
    const session = await endSession(req.params.id as string, summary);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or already ended' });
    }

    if (stats) {
      await saveSessionStats(req.params.id as string, stats);
    }

    await logUserAction({
      userId:    (req as any).userId,
      sessionId: req.params.id as string,
      action:    'session_end',
      ipAddress: req.ip,
      metadata:  { summary: summary ?? null },
    });

    return res.json(session);
  } catch (e: any) {
    console.error('[Sessions] End error:', e.message);
    return res.status(500).json({ error: 'Failed to end session' });
  }
});

export default router;