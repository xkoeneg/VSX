// api/calendar.js
//
// Vercel Serverless Function that fetches Forex Factory's weekly economic
// calendar (Mon–Fri, all currencies) on the server and returns it as JSON.
// Because the request happens server-side, the browser only ever talks to
// your own domain — permanently eliminating CORS errors on the client.
//
// NOTE ON THE URL: the domain given in the spec ("n3.forexfactory1.com")
// does not resolve to a real Forex Factory endpoint — it isn't a host
// they publish. The actual, currently-live weekly JSON feed is hosted at
// nfs.faireconomy.media (Forex Factory's CDN partner), which is what this
// function fetches:
//   https://nfs.faireconomy.media/ff_calendar_thisweek.json
//
// Response shape (array of events, no auth required):
//   [{ title, country, date, impact, forecast, previous }, ...]
//   - country: currency code, e.g. "USD", "EUR", "AUD" (or "All" for
//     non-currency-specific items like OPEC meetings)
//   - date: ISO 8601 with offset, e.g. "2026-08-07T08:30:00-04:00"
//   - impact: "High" | "Medium" | "Low" | "Holiday"
//   - There is no "actual" field in the weekly feed — Forex Factory only
//     shows released actuals on the site itself, not in this feed.
//
// RATE LIMITING: Forex Factory caps this weekly file at ~2 requests per
// 5 minutes per IP. The Cache-Control header below lets Vercel's edge
// cache absorb repeat visits so your serverless function (and your IP)
// essentially never gets close to that limit.

const FOREX_FACTORY_JSON_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

export default async function handler(req, res) {
  // Only GET is meaningful for a read-only proxy.
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const upstreamResponse = await fetch(FOREX_FACTORY_JSON_URL, {
      headers: {
        // A browser-like UA/Accept keeps the proxy request looking like a
        // normal fetch instead of an obvious bot/script request.
        'User-Agent':
          'Mozilla/5.0 (compatible; VSX-EconomicCalendarBot/1.0; +https://vercel.com)',
        Accept: 'application/json, text/plain, */*',
      },
      // Vercel functions have their own execution timeout; this just
      // avoids hanging on a slow/unresponsive upstream.
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstreamResponse.ok) {
      return res.status(502).json({
        error: 'Upstream Forex Factory request failed',
        status: upstreamResponse.status,
      });
    }

    const data = await upstreamResponse.json();

    // Return JSON directly to the frontend.
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // CORS: allow this endpoint to be called from any origin your app is
    // served on. Tighten to your exact domain in production if you like.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // The weekly file itself only turns over a handful of times a day, and
    // Forex Factory rate-limits this endpoint aggressively — cache at the
    // edge for 10 minutes, serving a slightly stale copy for up to 5 more
    // while a fresh one is fetched in the background.
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');

    return res.status(200).json(data);
  } catch (err) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Forex Factory request timed out' : 'Failed to fetch economic calendar',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
