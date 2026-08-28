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
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://duckduckgo.com/'
      }
    });

    const htmlText = await response.text();
    const $ = cheerio.load(htmlText);
    const results = [];

    $('.result').each((i, el) => {
      if (results.length >= 5) return false;
      const titleElem = $(el).find('.result__a').first();
      const snippetElem = $(el).find('.result__snippet').first();

      if (titleElem.length && titleElem.attr('href')) {
        results.push({
          title: titleElem.text().trim(),
          url: titleElem.attr('href'),
          snippet: snippetElem.text().trim()
        });
      }
    });

    if (results.length === 0) {
      // DuckDuckGo occasionally serves a bot-check page instead of results; log for diagnosis
      console.error('Web search returned zero results', { query, status: response.status, htmlLength: htmlText.length, htmlPreview: htmlText.slice(0, 300) });
    }

    return res.status(200).json({ query, results });
  } catch (error) {
    return res.status(500).json({ error: `Search execution failed: ${error.message}` });
  }
};
