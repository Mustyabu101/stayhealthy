import { verifyRequestOrigin } from '../lib/requestSecurity.js';
import { destroySession } from '../lib/session.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!verifyRequestOrigin(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    await destroySession(req, res);

    return res.status(200).json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);

    return res.status(500).json({
      error: 'Unable to complete logout'
    });
  }
}
