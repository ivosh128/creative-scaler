/* Creative Scaler – veřejná část */
(function () {
  const { num, fmt, fmtIn, t, applyTexts, marketOptions, calc, render, setLang, getLang, tidy } = CS;
  const $ = id => document.getElementById(id);
  let cfg = null, last = null;

  function read() {
    const market = $('market').value || 'cz';
    return {
      spend: num($('spend').value), pct: cfg.testPct / 100, market,
      daily: (cfg.markets[market] || cfg.markets.cz).daily, days: cfg.testDays,
      vid: cfg.videosPerSet, stat: cfg.staticsPerSet, win: cfg.winnersPerSet, life: cfg.winnerLifeWeeks,
      cpa: num($('cpa').value), roas: num($('roas').value), current: num($('current').value), liveNow: num($('liveNow').value),
      useCpa: false, prices: cfg.prices
    };
  }

  function update() { if (!cfg) return; last = calc(read()); render(last); }

  function texts() {
    applyTexts();
    marketOptions($('market'));
    document.querySelectorAll('#langSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  }

  // parametry z odkazu od týmu (?spend=…&market=…&lang=…)
  const q = new URLSearchParams(location.search);
  if (['cs', 'sk', 'en'].includes(q.get('lang'))) setLang(q.get('lang'));
  texts();
  ['spend', 'cpa', 'roas', 'current', 'liveNow'].forEach(k => { if (q.has(k)) $(k).value = fmtIn(num(q.get(k)), 2); });
  if (q.has('market')) $('market').value = q.get('market');
  if (q.has('spend')) $('spendR').value = num(q.get('spend'));

  // události
  document.querySelectorAll('#f .in input').forEach(el => {
    el.addEventListener('input', () => { if (el.id === 'spend') $('spendR').value = num(el.value); update(); });
    el.addEventListener('blur', () => tidy(el));
  });
  $('spendR').addEventListener('input', e => { $('spend').value = fmtIn(num(e.target.value)); update(); });
  $('market').addEventListener('change', update);
  document.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { $('spend').value = fmtIn(num(b.dataset.p)); $('spendR').value = b.dataset.p; update(); }));
  $('f').addEventListener('submit', e => e.preventDefault());
  document.querySelectorAll('#langSeg button').forEach(b => b.addEventListener('click', () => { setLang(b.dataset.lang); texts(); update(); }));

  // poptávka
  $('ctaForm').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('ctaMsg'), btn = $('ctaBtn');
    const body = {
      name: $('cName').value, company: $('cCompany').value, email: $('cEmail').value, website: $('cWeb').value, lang: getLang(),
      calc: last ? { spend: last.S.spend, market: last.S.market, cpa: last.S.cpa, roas: last.S.roas, current: last.S.current, liveNow: last.S.liveNow, newAds: last.newAds, live: last.live, sets: last.sets, costAi: last.costAi, costClassic: last.costClassic } : {}
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
  fetch('/api/config').then(r => { if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search); throw new Error('auth'); } return r.json(); })
    .then(c => { cfg = c; $('pricesBadge').hidden = !c.pricesAreDemo; update(); })
    .catch(() => {});
})();
