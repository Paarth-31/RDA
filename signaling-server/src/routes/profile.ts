// signaling-server/src/routes/profile.ts

import { Router, Request, Response } from 'express';
import { authenticate } from './auth';
import { getUserProfile, updateProfile } from '../db/users';
import { queryService } from '../db/client';

const router = Router();

// GET /profile — full profile with joined user_profiles row
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const profile = await getUserProfile((req as any).userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    return res.json(profile);
  } catch (e: any) {
    console.error('[Profile] Get error:', e.message);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH /profile — update display_name, bio, timezone, etc.
router.patch('/', authenticate, async (req: Request, res: Response) => {
  const allowed = [
    'display_name', 'full_name', 'bio',
    'timezone', 'locale', 'preferred_lang',
    'phone', 'country_code',
  ];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  try {
    await updateProfile((req as any).userId, updates);
    const profile = await getUserProfile((req as any).userId);
    return res.json(profile);
  } catch (e: any) {
    console.error('[Profile] Update error:', e.message);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /profile/stats — session counts for the profile page
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  try {
    const rows = await queryService(
      `SELECT
         COUNT(*)::INT                                            AS total_sessions,
         COALESCE(SUM(duration_seconds), 0)::INT                AS total_duration_seconds,
         COALESCE(AVG(duration_seconds) FILTER (
           WHERE duration_seconds > 0
         ), 0)::INT                                              AS avg_duration_seconds,
         MAX(start_time)                                         AS last_session_at,
         COUNT(*) FILTER (
           WHERE start_time > NOW() - INTERVAL '24 hours'
         )::INT                                                  AS sessions_today
       FROM sessions
       WHERE host_id = $1`,
      [userId]
    );
    return res.json(rows[0] ?? {
      total_sessions: 0,
      total_duration_seconds: 0,
      avg_duration_seconds: 0,
      last_session_at: null,
      sessions_today: 0,
    });
  } catch (e: any) {
    console.error('[Profile] Stats error:', e.message);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;