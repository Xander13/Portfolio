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

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({});
    const interaction = await ai.interactions.create({
      model: 'gemini-3.8-flash',
      input: prompt
    });

    return res.status(200).json({
      text: interaction.output_text || 'Gemini did not return a response.'
    });
  } catch (error) {
    console.error('Gemini request failed', error);
    return res.status(502).json({ error: 'Gemini is unavailable right now.' });
  }
};
