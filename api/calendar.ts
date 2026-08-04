// api/calendar.ts
//
// Serverless API route: fetches the Forex Factory economic calendar feed
// server-side and returns the parsed JSON to the browser. This removes
// the browser's dependency on public CORS-proxy services (allorigins.win,
// corsproxy.io, etc.) for the *default* feed, since the server has no
// CORS restriction fetching nfs.faireconomy.media directly.
//
// Works as-is on Vercel (any file under /api is auto-deployed as a
// serverless function, no framework required) and is also drop-in
// compatible with a Next.js pages-router API route — same (req, res)
// handler shape — if you move this file to pages/api/calendar.ts instead.
//
// Security note: the target URL is always built from a fixed allowlist
// below, never from arbitrary request input. Do NOT accept a raw "url"
// query param here and fetch it — that would turn this route into an
// open proxy / SSRF vector. User-supplied custom feed URLs are handled
// client-side (in the browser) instead, for exactly this reason.
const ALLOWED_FEEDS: Record<string, string> = {
  lastweek: 'https://nfs.faireconomy.media/ff_calendar_lastweek.json',
  thisweek: 'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
  nextweek: 'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
};

// Minimal req/res typing so this compiles without pulling in
// @vercel/node or next types as a hard dependency. Structurally
// compatible with both.
interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}
interface ApiResponse {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const weekParamRaw = req.query.week;
  const weekParam = (Array.isArray(weekParamRaw) ? weekParamRaw[0] : weekParamRaw) || 'thisweek';
  const targetUrl = ALLOWED_FEEDS[weekParam];

  if (!targetUrl) {
    res.status(400).json({
      error: `Invalid "week" param "${weekParam}". Expected one of: ${Object.keys(ALLOWED_FEEDS).join(', ')}`,
    });
    return;
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!upstream.ok) {
      res.status(502).json({ error: `Upstream feed returned ${upstream.status}` });
      return;
    }

    const data = await upstream.json();

    // Low-frequency-changing feed — cache at the CDN edge for 5 minutes,
    // serve stale for up to an hour while revalidating in the background.
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);
  } catch {
    res.status(502).json({ error: 'Failed to fetch upstream economic calendar feed' });
  }
}
