// signaling-server/src/db/admin.ts

import { queryService } from './client';
import os from 'os';

export async function recordSystemHealth(
  activeSessions: number,
  activeConnections: number,
  dbPoolUsed: number,
  dbPoolTotal: number
) {
  const cpuUsage = os.loadavg()[0] * 10; // rough % from 1-min load avg
  const totalMem = Math.round(os.totalmem() / 1024 / 1024);
  const freeMem  = Math.round(os.freemem()  / 1024 / 1024);

  await queryService(
    `INSERT INTO system_health
       (cpu_pct, mem_used_mb, mem_total_mb,
        active_sessions, active_connections,
        db_pool_used, db_pool_total)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      cpuUsage.toFixed(2),
      totalMem - freeMem,
      totalMem,
      activeSessions,
      activeConnections,
      dbPoolUsed,
      dbPoolTotal,
    ]
  );
}

export async function getSystemConfig(key: string): Promise<any> {
  const rows = await queryService(
    `SELECT value FROM system_config WHERE key = $1`,
    [key]
  );
  return rows[0]?.value ?? null;
}

export async function setSystemConfig(key: string, value: any, updatedBy: string) {
  await queryService(
    `INSERT INTO system_config (key, value, updated_by)
     VALUES ($1,$2,$3)
     ON CONFLICT (key) DO UPDATE SET
       value      = EXCLUDED.value,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()`,
    [key, JSON.stringify(value), updatedBy]
  );
}

export async function logUserAction(data: {
  userId?: string;
  sessionId?: string;
  action: string;
  level?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: object;
}) {
  await queryService(
    `INSERT INTO user_logs
       (user_id, session_id, action, level, ip_address, user_agent, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      data.userId ?? null,
      data.sessionId ?? null,
      data.action,
      data.level ?? 'info',
      data.ipAddress ?? null,
      data.userAgent ?? null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );
}

export async function getAdminDashboard() {
  const [health, sessions, users, aiCosts] = await Promise.all([
    queryService(`SELECT * FROM v_system_health_latest`),
    queryService(`SELECT * FROM v_active_sessions`),
    queryService(`SELECT * FROM v_user_session_summary ORDER BY total_sessions DESC LIMIT 20`),
    queryService(`SELECT * FROM v_ai_cost_per_user`),
  ]);
  return { health: health[0], sessions, users, aiCosts };
}

export async function checkSessionLimits(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check per-user override first, then global config
  const [limits, global] = await Promise.all([
    queryService(
      `SELECT * FROM user_limits WHERE user_id = $1`,
      [userId]
    ),
    queryService(
      `SELECT value FROM system_config WHERE key IN
         ('max_concurrent_sessions', 'max_sessions_per_day')
       ORDER BY key`
    ),
  ]);

  const userLimit = limits[0] ?? {};
  const globalConfig: Record<string, number> = {};
  for (const row of global as any[]) {
    globalConfig[row.key] = parseInt(row.value);
  }

  const maxConcurrent = userLimit.max_concurrent_sessions
    ?? globalConfig['max_concurrent_sessions']
    ?? 2;
  const maxPerDay = userLimit.max_sessions_per_day
    ?? globalConfig['max_sessions_per_day']
    ?? 20;

  const [concurrentRows, dailyRows] = await Promise.all([
    queryService(
      `SELECT COUNT(*) AS cnt FROM sessions
       WHERE host_id = $1 AND status = 'active'`,
      [userId]
    ),
    queryService(
      `SELECT COUNT(*) AS cnt FROM sessions
       WHERE host_id = $1 AND start_time >= NOW() - INTERVAL '24 hours'`,
      [userId]
    ),
  ]);

  const concurrent = parseInt((concurrentRows[0] as any).cnt);
  const daily      = parseInt((dailyRows[0] as any).cnt);

  if (concurrent >= maxConcurrent) {
    return { allowed: false, reason: `Max ${maxConcurrent} concurrent sessions reached` };
  }
  if (daily >= maxPerDay) {
    return { allowed: false, reason: `Daily session limit of ${maxPerDay} reached` };
  }

  return { allowed: true };
}