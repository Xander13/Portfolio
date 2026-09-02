export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const symbol = String(searchParams.get("symbol") || "").toUpperCase();

    if (!/^(?:\^[A-Z0-9.-]{1,10}|[A-Z][A-Z0-9.-]{0,9})$/.test(symbol)) {
        return Response.json({ error: "A valid stock symbol is required" }, { status: 400 });
    }

    try {
        const yahooUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
        yahooUrl.search = new URLSearchParams({
            range: "1mo",
            interval: "1d",
            includePrePost: "false"
        });
        const response = await fetch(yahooUrl, { next: { revalidate: 60 } });
        const body = await response.text();

        return new Response(body, {
            status: response.status,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
            }
        });
    } catch {
        return Response.json({ error: "Unable to load stock data" }, { status: 502 });
    }
}