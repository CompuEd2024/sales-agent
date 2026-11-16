// Test for the exchangeratesapi.io key.
// Run in the VS Code terminal (PowerShell), from the project folder:
//   $env:EXCHANGERATES_API_KEY="paste_your_key_here"; node test-rates.mjs
// The key is read from the environment, so it is never saved in a file.

const key = (process.env.EXCHANGERATES_API_KEY || '').trim();
if (!key) {
  console.error('Missing key. Run:  $env:EXCHANGERATES_API_KEY="your_key"; node test-rates.mjs');
  process.exit(1);
}

const BASE = 'https://api.exchangeratesapi.io/v1';

async function call(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}access_key=${encodeURIComponent(key)}`);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function show(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ->  ' + detail : ''}`);
}

const errText = (d) => (d && d.error ? `${d.error.type}: ${d.error.info}` : 'no error details');

try {
  // Test 1: latest rates (default EUR base, allowed on every plan)
  const t1 = await call('/latest?symbols=JOD,USD,SAR,AED,EGP');
  const ok1 = t1.status === 200 && t1.data && t1.data.success === true && t1.data.rates;
  show('Key works (latest rates, base EUR)', ok1, ok1 ? JSON.stringify(t1.data.rates) : errText(t1.data));
  if (!ok1) process.exit(1);

  // Test 2: is JOD available?
  const jodPerEur = Number(t1.data.rates.JOD);
  show('JOD is available', jodPerEur > 0, jodPerEur > 0 ? `1 EUR = ${jodPerEur} JOD` : 'JOD missing from response');
  if (!(jodPerEur > 0)) process.exit(1);

  // Test 3: convert to "1 JOD = X currency", which is what the app needs
  console.log('\n1 JOD equals:');
  for (const code of ['USD', 'SAR', 'AED', 'EGP']) {
    const v = Number(t1.data.rates[code]);
    if (v > 0) console.log(`  ${code}: ${(v / jodPerEur).toFixed(4)}`);
  }
  const sar = Number(t1.data.rates.SAR) / jodPerEur;
  if (sar > 0) {
    console.log('\nExample tier prices in SAR (before the app rounds them):');
    for (const [tier, jod] of [['Bronze', 20], ['Silver', 60], ['Gold', 120], ['Platinum', 200]]) {
      console.log(`  ${tier}: ${(jod * sar).toFixed(2)} SAR`);
    }
  }

  // Test 4 (information only): can this plan switch the base currency to JOD?
  const t4 = await call('/latest?base=JOD&symbols=USD');
  const ok4 = t4.status === 200 && t4.data && t4.data.success === true;
  console.log('');
  console.log(`INFO  Base switching to JOD (not needed by the app)  ->  ` +
    (ok4 ? 'your plan supports it' : errText(t4.data) + '  (fine: the app converts EUR rates itself)'));

  console.log('\nAll required checks passed.');
} catch (err) {
  console.error('FAIL  Could not reach the API:', err && err.message ? err.message : err);
  process.exit(1);
}
