// api/calendar.js
//
// Vercel Serverless Function that fetches the Myfxbook economic calendar
// RSS feed on the server and streams the raw XML back to the browser.
// Because the request to myfxbook.com happens server-side (not from the
// user's browser), the browser is only ever talking to your own domain —
// permanently eliminating CORS errors on the client.
//
// NOTE: the correct, currently-live feed path is
// "forex-economic-calendar-events" (not "forex-economic-calendar" — that
// one 404s). This function fetches that path.

const MYFXBOOK_RSS_URL = 'https://www.myfxbook.com/rss/forex-economic-calendar-events';

export default async function handler(req, res) {
  // Only GET is meaningful for a read-only proxy.
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const upstreamResponse = await fetch(MYFXBOOK_RSS_URL, {
      headers: {
        // Some sites block requests without a browser-like UA/Accept —
        // this keeps the proxy request looking like a normal RSS fetch.
        'User-Agent':
          'Mozilla/5.0 (compatible; VSX-EconomicCalendarBot/1.0; +https://vercel.com)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      // Vercel functions have their own execution timeout; this just
      // avoids hanging on a slow/unresponsive upstream.
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstreamResponse.ok) {
      return res.status(502).json({
        error: 'Upstream Myfxbook request failed',
        status: upstreamResponse.status,
      });
    }

    const xml = await upstreamResponse.text();

    // Let the browser (and, more importantly, Vercel's edge/CDN cache)
    // treat this as an XML document.
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');

    // CORS: allow this endpoint to be called from any origin your app is
    // served on. Tighten to your exact domain in production if you like.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // Cache at the edge for 5 minutes, and allow serving a slightly stale
    // copy for up to a minute while a fresh one is fetched in the
    // background — keeps the calendar fast without hammering Myxbook.
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

    return res.status(200).send(xml);
  } catch (err) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Myfxbook request timed out' : 'Failed to fetch economic calendar',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
