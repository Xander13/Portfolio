module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const symbol = String(req.query?.symbol || '').toUpperCase();
  if (!/^(?:\^[A-Z0-9.-]{1,10}|[A-Z][A-Z0-9.-]{0,9})$/.test(symbol)) {
    return res.status(400).json({ error: 'A valid stock symbol is required' });
  }

  try {
    const yahooUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
    yahooUrl.search = new URLSearchParams({
      range: '1mo',
      interval: '1d',
      includePrePost: 'false'
    });
    const response = await fetch(yahooUrl);
    const body = await response.text();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(response.status).send(body);
  } catch (error) {
    console.error('Unable to load Yahoo stock data', error);
    return res.status(502).json({ error: 'Unable to load stock data' });
  }
};
