const cheerio = require('cheerio');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input } = req.body || {};
  if (!input) {
    return res.status(400).json({ error: 'Missing input' });
  }

  const trimmed = String(input).trim();
  const match = trimmed.match(/^-[dD]:\s*(.+)$/);

  if (!match) {
    return res.status(400).json({ error: 'Invalid command prefix. Use -d: or -D:' });
  }

  const query = match[1].trim();
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const htmlText = await response.text();
    const $ = cheerio.load(htmlText);
    const results = [];

    $('.result').slice(0, 5).each((i, el) => {
      const titleElem = $(el).find('.result__a');
      const snippetElem = $(el).find('.result__snippet');

      if (titleElem.length) {
        results.push({
          title: titleElem.text().trim(),
          url: titleElem.attr('href'),
          snippet: snippetElem.text().trim()
        });
      }
    });

    return res.status(200).json({ query, results });
  } catch (error) {
    return res.status(500).json({ error: `Search execution failed: ${error.message}` });
  }
};
