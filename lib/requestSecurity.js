export function verifyRequestOrigin(req, res) {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const forwardedProto = req.headers['x-forwarded-proto'];

  if (typeof host !== 'string' || !host) {
    res.status(403).json({ error: 'Invalid request host' });
    return false;
  }

  // Browsers send Origin on cross-origin requests.
  // Reject requests with an Origin that does not match this host.
  if (origin) {
    try {
      const parsed = new URL(origin);
      const protocol = forwardedProto === 'https' ? 'https:' : 'http:';

      if (parsed.protocol !== protocol || parsed.host !== host) {
        res.status(403).json({ error: 'Request origin not allowed' });
        return false;
      }
    } catch {
      res.status(403).json({ error: 'Invalid request origin' });
      return false;
    }
  }

  return true;
}
