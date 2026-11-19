import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const COOKIE_NAME = 'stayhealthy_session';
const SESSION_DURATION = 60 * 60 * 1000;

function getDatabase() {
  const databaseUrl = process.env.NEON_POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error('Database connection is not configured');
  }

  return neon(databaseUrl);
}

function getCookie(req) {
  const cookies = req.headers.cookie || '';

  const sessionCookie = cookies
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_NAME}=`));

  return sessionCookie
    ? sessionCookie.slice(COOKIE_NAME.length + 1)
    : null;
}

function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

function cookieOptions() {
  const secure = process.env.NODE_ENV === 'production'
    ? '; Secure'
    : '';

  return `HttpOnly${secure}; SameSite=Lax; Path=/`;
}

async function ensureSessionTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function createSession(res, user) {
  if (!user?.id) {
    throw new Error('A valid user ID is required to create a session');
  }

  const sql = getDatabase();

  await ensureSessionTable(sql);

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION
  );

  await sql`
    INSERT INTO user_sessions (
      token_hash,
      user_id,
      expires_at
    )
    VALUES (
      ${tokenHash},
      ${user.id},
      ${expiresAt.toISOString()}
    )
  `;

  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; ${cookieOptions()}; Max-Age=3600`
  );
}

export async function getSession(req) {
  const token = getCookie(req);

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  const sql = getDatabase();

  await ensureSessionTable(sql);

  const tokenHash = hashToken(token);

  const rows = await sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role
    FROM user_sessions s
    INNER JOIN users u
      ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
    LIMIT 1
  `;

  if (!rows.length) {
    return null;
  }

  return {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    role: rows[0].role
  };
}

export async function destroySession(req, res) {
  const token = getCookie(req);

  // Expire the browser cookie even if database deletion fails.
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; ${cookieOptions()}; Max-Age=0`
  );

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return;
  }

  const sql = getDatabase();

  await ensureSessionTable(sql);

  const tokenHash = hashToken(token);

  await sql`
    DELETE FROM user_sessions
    WHERE token_hash = ${tokenHash}
  `;
}
