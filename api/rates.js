// Vercel serverless function for GET /api/rates
// Env var needed on Vercel: EXCHANGERATES_API_KEY
let cache = null;
const TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data };
}

export default async function handler(req, res) {
  const send = (c, source) =>
    res.status(200).json({
      base: 'JOD',
      rates: c.rates,
      fetchedAt: c.fetchedAt,
      source,
      attribution: c.attribution,
      attributionUrl: c.attributionUrl,
    });

  if (cache && Date.now() - new Date(cache.fetchedAt).getTime() < TTL) {
    return send(cache, 'live');
  }

  // Provider 1: exchangeratesapi.io (EUR base on the free plan -> convert to JOD base)
  const key = (process.env.EXCHANGERATES_API_KEY || '').trim();
  if (key) {
    try {
      const { ok, status, data } = await getJson(
        `https://api.exchangeratesapi.io/v1/latest?access_key=${encodeURIComponent(key)}`
      );
      const eur = data && data.rates;
      const jodPerEur = Number(eur && eur.JOD);
      if (ok && data.success === true && eur && jodPerEur > 0) {
        const rates = {};
        for (const [code, value] of Object.entries(eur)) {
          const v = Number(value);
          if (Number.isFinite(v) && v > 0) rates[code] = v / jodPerEur;
        }
        rates.EUR = 1 / jodPerEur;
        rates.JOD = 1;
        cache = {
          rates,
          fetchedAt: new Date().toISOString(),
          attribution: 'Rates by Exchange Rates API',
          attributionUrl: 'https://exchangeratesapi.io',
        };
        return send(cache, 'live');
      }
      console.warn('[rates] exchangeratesapi.io failed', status, data && data.error && data.error.type);
    } catch (e) {
      console.warn('[rates] exchangeratesapi.io error', e && e.message);
    }
  }

  // Provider 2 (backup, no key): already JOD-based
  try {
    const { ok, data } = await getJson('https://open.er-api.com/v6/latest/JOD');
    if (ok && data && data.result === 'success' && data.rates) {
      cache = {
        rates: data.rates,
        fetchedAt: new Date().toISOString(),
        attribution: 'Rates By Exchange Rate API',
        attributionUrl: 'https://www.exchangerate-api.com',
      };
      return send(cache, 'live');
    }
  } catch (e) {}

  if (cache) return send(cache, 'stale');
  return res.status(200).json({
    base: 'JOD',
    rates: {},
    fetchedAt: new Date().toISOString(),
    source: 'unavailable',
    attribution: 'Rates By Exchange Rate API',
    attributionUrl: 'https://www.exchangerate-api.com',
  });
}
