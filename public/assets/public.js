/* Creative Scaler – veřejná část */
(function () {
  const { num, fmt, fmtIn, t, applyTexts, marketOptions, calc, render, setLang, getLang, setCurrency, getCurrency, setRates,
    toCZK, fromCZK, money, curSymbol, tidy, DPM, PRESETS } = CS;
  const $ = id => document.getElementById(id);
  let cfg = null, last = null;
  const state = { spend: 1000000, mode: 'month', cpa: 0, conv: 0, convSource: 'cpa', over: {} }; // peníze v Kč, spend měsíčně

  /* ---------- předpoklady: z nastavení adminu, případně z odkazu od týmu ---------- */
  const q = new URLSearchParams(location.search);
  const OVERRIDES = { pct: [1, 100], daily: [100, 1e7], days: [1, 60], vid: [0, 20], stat: [0, 20], win: [0, 20], life: [0, 52], maxSets: [1, 200] };
  Object.entries(OVERRIDES).forEach(([k, [lo, hi]]) => {
    if (!q.has(k)) return; const v = num(q.get(k)); if (v >= lo && v <= hi) state.over[k] = v;
  });
  if (state.over.vid !== undefined && state.over.stat !== undefined && state.over.vid + state.over.stat < 1) { delete state.over.vid; delete state.over.stat; }
  state.over.useCpa = q.get('cpa50') === '1';

  function read() {
    const market = $('market').value || 'cz', o = state.over;
    const cpa = state.cpa;
    return {
      spend: state.spend, pct: (o.pct ?? cfg.testPct) / 100, market,
      daily: o.daily ?? (cfg.markets[market] || cfg.markets.cz).daily, days: o.days ?? cfg.testDays,
      vid: o.vid ?? cfg.videosPerSet, stat: o.stat ?? cfg.staticsPerSet, win: o.win ?? cfg.winnersPerSet, life: o.life ?? cfg.winnerLifeWeeks,
      maxSets: o.maxSets ?? cfg.maxSetsPerMonth, fatigue: { pct: cfg.fatigueWeeklyPct, start: cfg.fatigueStartWeek },
      cpa, roas: num($('roas').value), current: num($('current').value), liveNow: num($('liveNow').value),
      useCpa: !!o.useCpa, prices: cfg.prices
    };
  }

  /* ---------- zobrazení vstupů ---------- */
  const round = v => getCurrency() === 'CZK' ? Math.round(v) : Math.round(v);
  function showSpend() {
    const v = fromCZK(state.mode === 'day' ? state.spend / DPM : state.spend);
    $('spend').value = fmtIn(round(v));
    $('spendR').value = Math.min(5000000, Math.max(10000, state.spend));
  }
  function showCpa() {
    // pole, které uživatel nevyplnil, ukazuje dopočítanou hodnotu jako nápovědu
    if (state.convSource === 'cpa') {
      $('cpa').value = state.cpa > 0 ? fmtIn(fromCZK(state.cpa), 2) : '';
      $('conv').value = ''; $('conv').placeholder = state.cpa > 0 ? '≈ ' + fmtIn(state.spend / state.cpa) : '1 000';
      $('cpa').placeholder = '450';
    } else {
      $('conv').value = state.conv > 0 ? fmtIn(state.conv) : '';
      $('cpa').value = ''; $('cpa').placeholder = state.cpa > 0 ? '≈ ' + fmtIn(fromCZK(state.cpa), 2) : '450';
      $('conv').placeholder = '1 000';
    }
  }
  function presets() {
    const list = PRESETS[getCurrency()];
    $('presetSeg').innerHTML = list.map(v => `<button type="button" data-v="${v}">${v >= 1e6 ? fmt(v / 1e6, 1) + 'M' : fmt(v / 1000) + 'k'}</button>`).join('');
    markPresets();
  }
  function markPresets() {
    const monthly = Math.round(fromCZK(state.spend));
    $('presetSeg').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === monthly)));
  }
  function labels() {
    const sym = curSymbol();
    $('spendLabel').textContent = t(state.mode === 'day' ? 'spend_label_day' : 'spend_label');
    $('spendUnit').textContent = sym + ' ' + t(state.mode === 'day' ? 'per_day' : 'per_month');
    document.querySelectorAll('.cur-sym').forEach(e => { e.textContent = sym; });
    document.querySelectorAll('#curSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cur === getCurrency())));
    document.querySelectorAll('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    document.querySelectorAll('#langSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  }
  function texts() { applyTexts(); marketOptions($('market')); labels(); presets(); }

  function syncConv() {
    if (state.convSource === 'conv' && state.cpa > 0) { state.conv = state.spend / state.cpa; $('conv').value = fmtIn(state.conv); }
  }
  function update() {
    if (!cfg) return;
    syncConv();
    last = calc(read());
    render(last, renderOpts());
    afterRender();
  }
  function renderOpts() { return { dailyHint: R => state.mode === 'day' ? t('hint_day', { a: money(R.S.spend) }) : t('hint_month', { a: money(R.S.spend / DPM) }) }; }
  function afterRender() {
    markPresets();
    if (state.convSource === 'cpa' && state.cpa > 0) $('conv').placeholder = '≈ ' + fmtIn(state.spend / state.cpa);
    if (state.convSource === 'conv' && state.cpa > 0) $('cpa').placeholder = '≈ ' + fmtIn(fromCZK(state.cpa), 2);
  }

  /* ---------- start ---------- */
  if (['cs', 'sk', 'en'].includes(q.get('lang'))) setLang(q.get('lang'));
  setCurrency(q.get('cur') || (getLang() === 'cs' ? 'CZK' : 'EUR'));
  if (q.has('spend')) state.spend = Math.max(0, num(q.get('spend')));
  if (q.has('cpa')) state.cpa = Math.max(0, num(q.get('cpa')));
  ['roas', 'current', 'liveNow'].forEach(k => { if (q.has(k)) $(k).value = fmtIn(num(q.get(k)), 2); });
  if (q.has('market')) { marketOptions($('market')); $('market').value = q.get('market'); }

  /* ---------- události ---------- */
  $('spend').addEventListener('input', () => { const v = num($('spend').value); state.spend = toCZK(state.mode === 'day' ? v * DPM : v); $('spendR').value = Math.min(5000000, Math.max(10000, state.spend)); update(); });
  $('spend').addEventListener('blur', () => tidy($('spend')));
  $('spendR').addEventListener('input', e => { state.spend = num(e.target.value); showSpend(); update(); });
  $('presetSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.spend = toCZK(Number(b.dataset.v)); showSpend(); update(); });
  $('cpa').addEventListener('input', () => { state.cpa = toCZK(num($('cpa').value)); state.convSource = 'cpa'; state.conv = 0; $('conv').value = ''; update(); });
  $('conv').addEventListener('input', () => { state.conv = num($('conv').value); state.convSource = 'conv'; state.cpa = state.conv > 0 ? state.spend / state.conv : 0; $('cpa').value = ''; last = calc(read()); render(last, renderOpts()); afterRender(); });
  ['cpa', 'conv', 'roas', 'current', 'liveNow'].forEach(id => $(id).addEventListener('blur', () => tidy($(id))));
  ['roas', 'current', 'liveNow'].forEach(id => $(id).addEventListener('input', update));
  $('market').addEventListener('change', update);
  document.querySelectorAll('#curSeg button').forEach(b => b.addEventListener('click', () => { setCurrency(b.dataset.cur); texts(); showSpend(); showCpa(); update(); }));
  document.querySelectorAll('#modeSeg button').forEach(b => b.addEventListener('click', () => { state.mode = b.dataset.mode; labels(); showSpend(); update(); }));
  document.querySelectorAll('#langSeg button').forEach(b => b.addEventListener('click', () => { setLang(b.dataset.lang); texts(); update(); }));
  $('f').addEventListener('submit', e => e.preventDefault());

  // poptávka
  $('ctaForm').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('ctaMsg'), btn = $('ctaBtn');
    const body = {
      name: $('cName').value, company: $('cCompany').value, email: $('cEmail').value, website: $('cWeb').value, lang: getLang(),
      calc: last ? { spend: last.S.spend, market: last.S.market, cpa: last.S.cpa, roas: last.S.roas, current: last.S.current, liveNow: last.S.liveNow, newAds: last.newAds, live: last.live, sets: last.sets, costAi: last.costAi, costClassic: last.costClassic, currency: getCurrency() } : {}
    };
    if (!body.name.trim() || !body.company.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) { msg.hidden = false; msg.style.color = 'var(--warn)'; msg.textContent = t('f_err'); return; }
    btn.disabled = true;
    try {
      const r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error();
      $('ctaForm').hidden = true; msg.hidden = false; msg.style.color = ''; msg.textContent = t('f_sent');
    } catch (err) { msg.hidden = false; msg.style.color = 'var(--warn)'; msg.textContent = t('f_err'); btn.disabled = false; }
  });

  // nastavení z adminu
  texts();
  fetch('/api/config').then(r => { if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search); throw new Error('auth'); } return r.json(); })
    .then(c => {
      cfg = c; setRates(c.rates); $('pricesBadge').hidden = !c.pricesAreDemo;
      if (q.has('market')) $('market').value = q.get('market');
      showSpend(); showCpa(); update();
    })
    .catch(() => {});
})();
