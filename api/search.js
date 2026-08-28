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

  // Decode the common HTML entities DuckDuckGo leaves in titles/snippets
  const decodeEntities = str => str
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

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

    const html = await response.text();
    const results = [];

    // Split the raw HTML into result blocks using DuckDuckGo's class structure
    const blocks = html.split('class="result ');

    for (let i = 1; i < blocks.length && results.length < 5; i++) {
      const block = blocks[i];

      // Extract URL and Title from the result link
      const linkMatch = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/);
      // Extract Snippet (DuckDuckGo renders this as an <a>, not a <span>)
      const snippetMatch = block.match(/class="result__snippet"[^>]*>(.*?)<\/a>/);

      if (linkMatch) {
        // Clean up tags and decode entities from title and snippet
        const title = decodeEntities(linkMatch[2].replace(/<\/?[^>]+(>|$)/g, '').trim());
        const rawUrl = linkMatch[1];

        // DuckDuckGo wraps outbound links, extract the actual target URL if needed
        let cleanUrl = rawUrl;
        if (rawUrl.includes('uddg=')) {
          const urlParam = new URLSearchParams(rawUrl.split('?')[1]);
          cleanUrl = decodeURIComponent(urlParam.get('uddg') || rawUrl);
        }

        const snippet = snippetMatch
          ? decodeEntities(snippetMatch[1].replace(/<\/?[^>]+(>|$)/g, '').trim())
          : '';

        results.push({ title, url: cleanUrl, snippet });
      }
    }

    if (results.length === 0) {
      // DuckDuckGo occasionally serves a bot-check page instead of results; surface a preview for diagnosis
      const debugInfo = { status: response.status, htmlLength: html.length, htmlPreview: html.slice(0, 500) };
      console.error('Web search returned zero results', { query, ...debugInfo });
      return res.status(200).json({ query, results, debug: debugInfo });
    }

    return res.status(200).json({ query, results });
  } catch (error) {
    return res.status(500).json({ error: `Search execution failed: ${error.message}` });
  }
};
