// Creative Scaler – server
// Veřejná část (/) je pro klienty, admin (/admin) pro tým. Obojí může být pod heslem.
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const store = require('./store');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const PUBLIC_PASSWORD = process.env.PUBLIC_PASSWORD || '';
// Veřejná část je bez hesla otevřená jen tehdy, když to někdo výslovně zapne (PUBLIC_OPEN=true).
// Bez hesla i bez PUBLIC_OPEN je zavřená a pustí jen admina – nic se tak neotevře omylem.
const PUBLIC_OPEN = String(process.env.PUBLIC_OPEN || '').toLowerCase() === 'true'; // má přednost před PUBLIC_PASSWORD
// Admin bez hesla jen po výslovném zapnutí (ADMIN_OPEN=true) – vhodné pro demo.
const ADMIN_OPEN = String(process.env.ADMIN_OPEN || '').toLowerCase() === 'true';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';
let SESSION_SECRET = process.env.SESSION_SECRET || '';
const SESSION_DAYS = 14;

if (ADMIN_OPEN) console.warn('[creative-scaler] Admin je otevřený bez hesla (ADMIN_OPEN=true).');
else if (!ADMIN_PASSWORD) console.warn('[creative-scaler] ADMIN_PASSWORD není nastavené – admin je nedostupný.');
if (!SESSION_SECRET) {
  // Bez SESSION_SECRET si server jednou vygeneruje náhodný klíč a uloží ho vedle dat,
  // takže přihlášení vydrží i restart a nikdo nemusí nic vymýšlet.
  const keyFile = require('path').join(store.DATA_DIR, 'session.key');
  try { SESSION_SECRET = require('fs').readFileSync(keyFile, 'utf8').trim(); } catch (e) {}
  if (!SESSION_SECRET) {
    SESSION_SECRET = crypto.randomBytes(32).toString('hex');
    try { require('fs').writeFileSync(keyFile, SESSION_SECRET, { mode: 0o600 }); }
    catch (e) { console.warn('[creative-scaler] Klíč přihlášení nejde uložit – po restartu se všichni odhlásí.'); }
  }
}
console.log(`[creative-scaler] Data: ${store.DATA_DIR} · veřejná část ${PUBLIC_OPEN ? 'otevřená' : (PUBLIC_PASSWORD ? 'pod heslem' : 'zavřená (jen admin)')}`);

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  next();
});

/* ---------- přihlášení ---------- */
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const pwTag = role => sha(role === 'admin' ? ADMIN_PASSWORD : PUBLIC_PASSWORD).slice(0, 12);
const sign = s => crypto.createHmac('sha256', SESSION_SECRET).update(s).digest('hex');

function safeEqual(a, b) {
  const x = Buffer.from(sha(a)), y = Buffer.from(sha(b));
  return crypto.timingSafeEqual(x, y);
}

function makeToken(role) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  const body = `${role}.${exp}.${pwTag(role)}`;
  return `${body}.${sign(body)}`;
}

function readRole(req) {
  const raw = (req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith('cs_auth='));
  if (!raw) return null;
  const token = decodeURIComponent(raw.slice(8));
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [role, exp, tag, sig] = parts;
  const body = `${role}.${exp}.${tag}`;
  if (!safeEqual(sig, sign(body))) return null;
  if (Number(exp) < Date.now()) return null;
  if (role !== 'admin' && role !== 'public') return null;
  if (tag !== pwTag(role)) return null; // změna hesla odhlásí staré relace
  return role;
}

function setAuthCookie(req, res, role) {
  res.cookie('cs_auth', makeToken(role), {
    httpOnly: true, sameSite: 'lax', secure: req.secure, maxAge: SESSION_DAYS * 864e5, path: '/'
  });
}

// jednoduchá ochrana proti zkoušení hesel: 10 pokusů za 15 minut z jedné IP
const attempts = new Map();
function tooMany(ip) {
  const now = Date.now(), win = 15 * 60e3;
  const list = (attempts.get(ip) || []).filter(t => now - t < win);
  attempts.set(ip, list);
  return list.length >= 10;
}
function noteFail(ip) { (attempts.get(ip) || attempts.set(ip, []).get(ip)).push(Date.now()); }

const safeNext = n => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//')) ? n : '/';

function wantsHtml(req) { return !req.path.startsWith('/api/'); }

function requirePublic(req, res, next) {
  if (PUBLIC_OPEN) return next();
  const role = readRole(req);
  if (role === 'public' || role === 'admin') return next();
  if (wantsHtml(req)) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  res.status(401).json({ error: 'Přihlaste se.' });
}

function requireAdmin(req, res, next) {
  if (ADMIN_OPEN) return next();
  if (ADMIN_PASSWORD && readRole(req) === 'admin') return next();
  if (wantsHtml(req)) return res.redirect('/login?admin=1&next=' + encodeURIComponent(req.originalUrl));
  res.status(401).json({ error: 'Jen pro admin.' });
}

const VIEWS = path.join(__dirname, 'views');
// verze souborů v HTML (?v=…), aby prohlížeč po nasazení nenačetl starý kód z mezipaměti
const ASSET_V = (process.env.RAILWAY_GIT_COMMIT_SHA || String(Date.now())).slice(0, 10);
const viewCache = new Map();
function sendView(res, name) {
  if (!viewCache.has(name)) viewCache.set(name, require('fs').readFileSync(path.join(VIEWS, name), 'utf8').replace(/(\/(?:assets|admin)\/[\w.-]+\.(?:js|css))"/g, `$1?v=${ASSET_V}"`));
  res.set('Cache-Control', 'no-cache').type('html').send(viewCache.get(name));
}
const PRIVATE = path.join(__dirname, 'private');

app.get('/login', (req, res) => {
  // když není co hlídat, přihlášení přeskočíme
  const next = safeNext(req.query.next);
  if ((next.startsWith('/admin') && ADMIN_OPEN) || (!next.startsWith('/admin') && PUBLIC_OPEN)) return res.redirect(next);
  res.sendFile(path.join(VIEWS, 'login.html'));
});
app.post('/login', (req, res) => {
  const ip = req.ip;
  const next = safeNext(req.body.next);
  const back = err => res.redirect(`/login?e=${err}&next=${encodeURIComponent(next)}${next.startsWith('/admin') ? '&admin=1' : ''}`);
  if (tooMany(ip)) return back('limit');
  const pw = String(req.body.password || '');
  if (ADMIN_PASSWORD && safeEqual(pw, ADMIN_PASSWORD)) { setAuthCookie(req, res, 'admin'); return res.redirect(next); }
  if (PUBLIC_PASSWORD && safeEqual(pw, PUBLIC_PASSWORD) && !next.startsWith('/admin')) { setAuthCookie(req, res, 'public'); return res.redirect(next); }
  noteFail(ip);
  back('bad');
});
app.get('/logout', (req, res) => { res.clearCookie('cs_auth', { path: '/' }); res.redirect(ADMIN_OPEN ? '/' : '/login'); });
app.get('/api/admin/mode', (req, res) => res.json({ open: ADMIN_OPEN }));

/* ---------- stránky a soubory ---------- */
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: '1h' }));
app.get('/healthz', (req, res) => res.json({ ok: true }));
app.get('/', requirePublic, (req, res) => sendView(res, 'public.html'));
app.get('/admin', requireAdmin, (req, res) => sendView(res, 'admin.html'));
app.get(['/READ_ME', '/read_me', '/readme', '/READ-ME'], requireAdmin, (req, res) => res.sendFile(path.join(VIEWS, 'readme.html')));
app.get('/admin/admin.js', requireAdmin, (req, res) => res.sendFile(path.join(PRIVATE, 'admin.js')));

/* ---------- nastavení ---------- */
app.get('/api/config', requirePublic, (req, res) => {
  const c = store.getConfig();
  // veřejnosti posíláme jen to, co výpočet potřebuje
  res.json({
    testPct: c.testPct, testDays: c.testDays, videosPerSet: c.videosPerSet, staticsPerSet: c.staticsPerSet,
    winnersPerSet: c.winnersPerSet, winnerLifeWeeks: c.winnerLifeWeeks,
    fatigueWeeklyPct: c.fatigueWeeklyPct, fatigueStartWeek: c.fatigueStartWeek, refreshEffPct: c.refreshEffPct, rates: c.rates,
    rules: c.rules, situations: c.situations, examples: c.examples,
    // klasickou produkci veřejnosti neposíláme, srovnání se ve veřejné části neukazuje
    prices: { aiVideo: c.prices.aiVideo, aiStatic: c.prices.aiStatic }, pricesAreDemo: c.pricesAreDemo
  });
});
/* ---------- ukázky: nahrání souboru do DATA_DIR/media ---------- */
const MEDIA_TYPES = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
app.use('/media', requirePublic, express.static(store.MEDIA_DIR, { maxAge: '7d', fallthrough: false }));
app.post('/api/admin/media', requireAdmin, express.raw({ type: Object.keys(MEDIA_TYPES), limit: '80mb' }), (req, res) => {
  const ext = MEDIA_TYPES[String(req.headers['content-type'] || '').split(';')[0].trim()];
  if (!ext || !Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'Nahrajte video (MP4, WEBM, MOV) nebo obrázek (JPG, PNG, WEBP, GIF).' });
  const name = crypto.randomUUID() + '.' + ext;
  require('fs').writeFileSync(path.join(store.MEDIA_DIR, name), req.body);
  res.json({ src: '/media/' + name, kind: ext.match(/mp4|webm|mov/) ? 'video' : 'image' });
});

app.get('/api/admin/config', requireAdmin, (req, res) => res.json(store.getConfig()));

const clip = (s, n) => String(s || '').trim().slice(0, n);
const inRange = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
app.put('/api/admin/config', requireAdmin, (req, res) => {
  const b = req.body || {};
  const cur = store.getConfig();
  const errors = [];
  const pick = (key, lo, hi) => { if (b[key] === undefined) return cur[key]; if (!inRange(b[key], lo, hi)) errors.push(key); return b[key]; };
  const next = {
    testPct: pick('testPct', 1, 100),
    testDays: pick('testDays', 1, 60),
    videosPerSet: pick('videosPerSet', 0, 20),
    staticsPerSet: pick('staticsPerSet', 0, 20),
    winnersPerSet: pick('winnersPerSet', 0, 20),
    winnerLifeWeeks: pick('winnerLifeWeeks', 0, 52),
    maxSetsPerMonth: pick('maxSetsPerMonth', 1, 200),
    fatigueWeeklyPct: pick('fatigueWeeklyPct', 0, 50),
    fatigueStartWeek: pick('fatigueStartWeek', 1, 12),
    refreshEffPct: pick('refreshEffPct', 0, 100),
    rules: { ...cur.rules },
    situations: { ...cur.situations },
    examples: cur.examples,
    rates: { ...cur.rates },
    markets: { ...cur.markets },
    prices: { ...cur.prices },
    pricesAreDemo: typeof b.pricesAreDemo === 'boolean' ? b.pricesAreDemo : cur.pricesAreDemo
  };
  if (b.markets) for (const [k, v] of Object.entries(b.markets)) {
    if (!/^[a-z]{2}$/.test(k) || !v || !inRange(v.daily, 100, 1e7)) { errors.push('markets.' + k); continue; }
    next.markets[k] = { daily: v.daily, verified: !!v.verified };
  }
  if (b.prices) for (const k of ['aiVideo', 'classicVideo', 'aiStatic', 'classicStatic']) {
    if (b.prices[k] === undefined) continue;
    if (!inRange(b.prices[k], 0, 1e7)) errors.push('prices.' + k); else next.prices[k] = b.prices[k];
  }
  if (b.rates) for (const k of ['EUR', 'USD']) {
    if (b.rates[k] === undefined) continue;
    if (!inRange(b.rates[k], 0.01, 1000)) errors.push('rates.' + k); else next.rates[k] = b.rates[k];
  }
  const RULES = { lowSpend: [0, 1e9], lowN: [1, 1000], highSpend: [1, 1e9], highN: [1, 5000], step: [1, 50], smallSpend: [0, 1e9], tinySpend: [0, 1e9], minLive: [0, 500], under20: [0, 1e9], costWarnPct: [1, 1000], lowConv: [0, 1000] };
  if (b.rules) for (const [k, [lo, hi]] of Object.entries(RULES)) {
    if (b.rules[k] === undefined) continue;
    if (!inRange(b.rules[k], lo, hi)) errors.push('rules.' + k); else next.rules[k] = b.rules[k];
  }
  if (next.rules.highSpend <= next.rules.lowSpend) errors.push('rules.highSpend');
  if (next.rules.highN < next.rules.lowN) errors.push('rules.highN');
  if (b.situations) for (const k of ['growth', 'launch']) {
    if (b.situations[k] === undefined) continue;
    if (!inRange(b.situations[k], 0.1, 10)) errors.push('situations.' + k); else next.situations[k] = b.situations[k];
  }
  if (b.examples !== undefined) {
    if (!Array.isArray(b.examples) || b.examples.length > 30) errors.push('examples');
    else {
      const okUrl = u => typeof u === 'string' && (/^https:\/\/[^\s"'<>]+$/.test(u) || /^\/media\/[a-f0-9-]+\.[a-z0-9]+$/.test(u));
      next.examples = b.examples.map(x => ({
        title: clip(x && x.title, 80), client: clip(x && x.client, 80), result: clip(x && x.result, 120),
        src: okUrl(x && x.src) ? x.src : '', poster: okUrl(x && x.poster) ? x.poster : '',
        kind: x && (x.kind === 'image' || (x.kind !== 'video' && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(x.src || ''))) ? 'image' : 'video', ratio: ['1:1', '9:16', '4:5', '16:9'].includes(x && x.ratio) ? x.ratio : '9:16'
      })).filter(x => x.src);
    }
  }
  if (next.videosPerSet + next.staticsPerSet < 1) errors.push('perSet');
  if (errors.length) return res.status(400).json({ error: 'Neplatné hodnoty', fields: errors });
  res.json(store.saveConfig(next));
});

/* ---------- poptávky ---------- */
const leadHits = new Map();
app.post('/api/leads', requirePublic, async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // past na roboty
  const now = Date.now();
  const hits = (leadHits.get(req.ip) || []).filter(t => now - t < 60 * 60e3);
  if (hits.length >= 5) return res.status(429).json({ error: 'Příliš mnoho poptávek, zkuste to později.' });
  const lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'new',
    name: clip(b.name, 120), company: clip(b.company, 160), email: clip(b.email, 200),
    lang: ['cs', 'sk', 'en'].includes(b.lang) ? b.lang : 'cs',
    calc: {}
  };
  if (!lead.name || !lead.company || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) return res.status(400).json({ error: 'Vyplňte jméno, firmu a platný e-mail.' });
  const c = b.calc || {};
  for (const k of ['spend', 'cpa', 'roas', 'current', 'liveNow', 'newAds', 'live', 'sets', 'costAi', 'costClassic']) {
    const v = Number(c[k]); if (isFinite(v)) lead.calc[k] = v;
  }
  if (['stable', 'growth', 'launch'].includes(c.sit)) lead.calc.sit = c.sit;
  if (['CZK', 'EUR', 'USD'].includes(c.currency)) lead.calc.currency = c.currency;
  hits.push(now); leadHits.set(req.ip, hits);
  const list = store.getLeads(); list.unshift(lead); store.saveLeads(list);
  res.json({ ok: true });

  if (SLACK_WEBHOOK_URL) {
    const f = n => (n ?? 0).toLocaleString('cs-CZ');
    const text = `:sparkles: *Nová poptávka z Creative Scaleru*\n${lead.name} · ${lead.company} · ${lead.email}\n` +
      `Spend ${f(lead.calc.spend)} Kč/měs. · ${lead.calc.sit || 'stable'} · doporučeno *${f(lead.calc.newAds)} kreativ měsíčně*` +
      (lead.calc.current ? ` (dnes ${f(lead.calc.current)})` : '');
    fetch(SLACK_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      .catch(e => console.warn('[creative-scaler] Slack se nepodařilo zavolat:', e.message));
  }
});

app.get('/api/admin/leads', requireAdmin, (req, res) => res.json(store.getLeads()));
app.patch('/api/admin/leads/:id', requireAdmin, (req, res) => {
  const list = store.getLeads();
  const lead = list.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Poptávka nenalezena.' });
  if (['new', 'done'].includes(req.body.status)) lead.status = req.body.status;
  store.saveLeads(list);
  res.json(lead);
});
app.get('/admin/leads.csv', requireAdmin, (req, res) => {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['datum', 'stav', 'jmeno', 'firma', 'email', 'jazyk', 'situace', 'spend', 'cpa', 'roas', 'dnes_kreativ', 'doporuceno_kreativ', 'zivych_doporuceno', 'naklady_ai', 'naklady_klasika', 'mena_klienta'];
  const rows = store.getLeads().map(l => [l.createdAt, l.status, l.name, l.company, l.email, l.lang, l.calc.sit || l.calc.market, l.calc.spend, l.calc.cpa, l.calc.roas, l.calc.current, l.calc.newAds, l.calc.live, l.calc.costAi, l.calc.costClassic, l.calc.currency].map(q).join(','));
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="creative-scaler-poptavky.csv"');
  res.send('﻿' + [head.join(','), ...rows].join('\n'));
});

app.use((req, res) => res.status(404).send('Stránka neexistuje.'));

app.listen(PORT, () => console.log(`[creative-scaler] běží na portu ${PORT}`));
