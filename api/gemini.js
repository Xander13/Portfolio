module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  let prompt = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    prompt = String(body.input || '').trim();
  } catch {
    return res.status(400).json({ error: 'Invalid request' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'A prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on Vercel.' });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      input: prompt
    });

    return res.status(200).json({
      text: interaction.output_text || 'Gemini did not return a response.'
    });
  } catch (error) {
    console.error('Gemini request failed', error);
    const errorMessage = String(error?.message || '');
    const isModelError = /model|not found|unsupported|invalid/i.test(errorMessage);
    return res.status(502).json({
      error: isModelError
        ? 'The configured Gemini model is unavailable. Set GEMINI_MODEL to a model enabled for your API key.'
        : 'Gemini is unavailable right now. Check the Vercel API key and deployment logs.'
    });
  }
};
