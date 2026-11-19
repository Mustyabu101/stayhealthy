import { getSession } from '../lib/session.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    const user = await getSession(req);

    if (!user) {
      return res.status(401).json({
        authenticated: false,
        error: 'Not authenticated'
      });
    }

    return res.status(200).json({
      authenticated: true,
      user
    });
  } catch (error) {
    console.error('Session verification error:', error);

    return res.status(500).json({
      error: 'Unable to verify session'
    });
  }
}
