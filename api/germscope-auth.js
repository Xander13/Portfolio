const crypto = require('crypto');

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  let password = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    password = String(body.password || '');
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid request' });
  }

  const expected = process.env.GERMSCOPE_PASSWORD;
  if (!expected) {
    return res.status(500).json({ ok: false, error: 'Login is not configured' });
  }

  const providedHash = hash(password);
  const expectedHash = hash(expected);
  const isMatch = providedHash.length === expectedHash.length
    && crypto.timingSafeEqual(providedHash, expectedHash);

  if (!isMatch) {
    return res.status(401).json({ ok: false, error: 'Incorrect password' });
  }

  return res.status(200).json({ ok: true });
};
