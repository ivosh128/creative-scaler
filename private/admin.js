/* Creative Scaler – admin (dostupné jen po přihlášení adminem) */
(function () {
  const { num, fmt, fmtIn, kc, esc, calc, render, marketOptions, weekSplit, tidy, t } = CS;
  const $ = id => document.getElementById(id);
  CS.setLang('cs');

  const ACCOUNTS = {
    a: { name: 'Demo · E-shop s elektronikou', spend: 1000000, cpa: 420, roas: 6.2, current: 8, liveNow: 14, market: 'cz' },
    b: { name: 'Demo · Módní značka', spend: 450000, cpa: 310, roas: 4.1, current: 6, liveNow: 9, market: 'cz' },
    c: { name: 'Demo · Leadgen reality', spend: 200000, cpa: 950, roas: '', current: 3, liveNow: 5, market: 'cz' },
    d: { name: 'Demo · DTC expanze do Německa', spend: 1800000, cpa: 780, roas: 3.4, current: 12, liveNow: 18, market: 'de' }
  };
  const FUNNEL = ['tofu', 'mofu', 'bofu'];
  const ANGLES = ['problem', 'benefit', 'srovnani', 'social-proof', 'recenze'];
  const VSTYLE = ['ai-ugc', 'ai-motion', 'ai-avatar'];
  const SSTYLE = ['foto', 'grafika'];
  const BRIEF_PREVIEW = 8;
  const SHARE_KEYS = ['spend', 'market', 'cpa', 'roas', 'current', 'liveNow'];

  let cfg = null, last = null, briefAll = false;
  const slug = s => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  async function api(url, opts = {}) {
    const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
    if (r.status === 401) { location.href = '/login?admin=1&next=/admin'; throw new Error('auth'); }
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.error || 'Chyba'), { data });
    return data;
  }

  async function copy(text, toast) {
    try { await navigator.clipboard.writeText(text); toast.textContent = 'Zkopírováno'; }
    catch (e) { toast.textContent = 'Kopírování nešlo, označte text ručně'; }
    setTimeout(() => { toast.textContent = ''; }, 2400);
  }

  /* ---------- záložky ---------- */
  const tabs = ['calc', 'settings', 'leads'];
  function showTab(name) {
    tabs.forEach(n => { $('tab-' + n).setAttribute('aria-selected', String(n === name)); $('p-' + n).hidden = n !== name; });
    if (name === 'leads') loadLeads();
    try { history.replaceState(null, '', '#' + name); } catch (e) {}
  }
  tabs.forEach(n => $('tab-' + n).addEventListener('click', () => showTab(n)));

  /* ---------- kalkulačka ---------- */
  function fillAssumptions() {
    const m = cfg.markets[$('market').value] || cfg.markets.cz;
    $('pct').value = fmtIn(cfg.testPct); $('daily').value = fmtIn(m.daily); $('days').value = fmtIn(cfg.testDays);
    $('vid').value = fmtIn(cfg.videosPerSet); $('stat').value = fmtIn(cfg.staticsPerSet);
    $('win').value = fmtIn(cfg.winnersPerSet); $('life').value = fmtIn(cfg.winnerLifeWeeks);
    $('maxSets').value = fmtIn(cfg.maxSetsPerMonth);
  }

  function read() {
    return {
      spend: num($('spend').value), pct: num($('pct').value) / 100, market: $('market').value || 'cz',
      daily: num($('daily').value), days: Math.max(1, num($('days').value)),
      vid: Math.max(0, Math.round(num($('vid').value))), stat: Math.max(0, Math.round(num($('stat').value))),
      win: Math.max(0, num($('win').value)), life: Math.max(0, num($('life').value)),
      cpa: num($('cpa').value), roas: num($('roas').value), current: num($('current').value), liveNow: num($('liveNow').value),
      useCpa: $('useCpa').checked, prices: cfg.prices,
      maxSets: Math.max(1, num($('maxSets').value) || cfg.maxSetsPerMonth), fatigue: { pct: cfg.fatigueWeeklyPct, start: cfg.fatigueStartWeek }
    };
  }

  function update() {
    if (!cfg) return;
    last = calc(read());
    render(last, {
      internal: true,
      cpaHint: ' Zvažte navýšení budgetu sady podle CPA.',
      dailyHint: R => `≈ ${kc(R.S.spend / CS.DPM)} denně, z toho ${kc(R.testBudget / CS.DPM)} na testování`
    });
    $('pricesBadge').hidden = !cfg.pricesAreDemo;
    renderChain(last); renderBrief(last); renderShare();
  }

  function renderChain(R) {
    const { S } = R;
    const verified = !!(cfg.markets[S.market] || {}).verified;
    const rows = [
      ['Měsíční spend bez katalogu', kc(S.spend), 'Vstup od klienta.', null],
      ['Rozpočet na testování', kc(R.testBudget), `${fmt(S.pct * 100)} % spendu jde na testování nových reklam, jinak výkon postupně padá únavou kreativ.`, 'd'],
      ['Minimální budget sady', kc(R.minSet), R.cpaRaised ? `Navýšeno podle CPA: ${kc(S.cpa)} × 50 konverzí týdně × ${fmt(S.days)} dní testu.` : `${kc(S.daily)} denně × ${fmt(S.days)} dní. Minimum pro relevantní vyhodnocení na trhu ${t('m_' + S.market)}.`, (R.cpaRaised || !verified) ? 'p' : 'd'],
      ['Testovacích sad měsíčně', fmt(R.sets),
        R.mode === 'small' ? `Rozpočet nestačí ani na jednu plnou sadu (minimum ${kc(R.minSet)}), proto doporučujeme 1 sadu s nižším denním budgetem ${kc(R.setDaily)}${R.mini ? ' a menším počtem kreativ' : ''}.`
        : R.mode === 'capped' ? `Rozpočet by stačil na víc sad, ale strop je ${fmt(R.maxSets)} měsíčně. Každá sada proto dostane ${kc(R.setBudget)} (${kc(R.setDaily)} denně).`
        : 'Rozpočet na testování dělený minimálním budgetem sady, zaokrouhleno dolů. Zbytek se rozdělí mezi sady.', R.mode === 'normal' ? 'd' : 'p'],
      ['Kreativ v sadě', `${R.perSet} (${S.vid} + ${S.stat})`, `${S.vid}× video s různým hookem nebo verzí, ${R.stat}× statika, která se liší vizuálem i tématem, ne jen textem.`, 'd'],
      ['Nových kreativ měsíčně', fmt(R.newAds), 'Počet sad krát kreativy v sadě.', 'd'],
      ['Týdenní kadence', `${fmt(Math.round(R.perWeek))} / týden`, 'Nové kreativy rozložené rovnoměrně do měsíce.', 'p'],
      ['Živých kreativ v účtu', fmt(R.live), `Zhruba ${fmt(R.liveTest)} právě v testu (souběžně běží ${fmt(R.concurrent, 1)} sady) a ${fmt(R.liveWin)} vítězů, z nichž každý jede asi ${fmt(S.life)} týdny, než se unaví.`, 'p']
    ];
    $('chain').innerHTML = rows.map(([l, v, w, s]) => `<li><span class="lbl">${esc(l)}${s ? `<span class="src ${s}">${s === 'd' ? 'z praxe' : 'návrh'}</span>` : ''}</span><span class="val">${esc(v)}</span><span class="why">${esc(w)}</span></li>`).join('');
  }

  function briefRows(R) {
    const { S } = R;
    const themes = $('themes').value.split(',').map(slug).filter(Boolean);
    if (!themes.length) themes.push('tema');
    const persona = slug($('persona').value) || 'persona';
    const d = new Date(), ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const rows = []; let setNo = 0;
    weekSplit(R.sets).forEach((n, w) => {
      for (let k = 0; k < n; k++) {
        const theme = themes[setNo % themes.length], funnel = FUNNEL[setNo % 3], angle = ANGLES[setNo % ANGLES.length];
        for (let v = 0; v < S.vid; v++) rows.push({ w: w + 1, s: setNo + 1, f: 'vid', name: [ym, funnel, persona, 'vid', VSTYLE[v % VSTYLE.length], angle, theme, 'v' + (v + 1)].join('_') });
        for (let v = 0; v < S.stat; v++) rows.push({ w: w + 1, s: setNo + 1, f: 'sta', name: [ym, funnel, persona, 'sta', SSTYLE[v % SSTYLE.length], angle, theme, 'v' + (v + 1)].join('_') });
        setNo++;
      }
    });
    return rows;
  }

  function renderBrief(R) {
    const rows = briefRows(R);
    const vis = rows.filter(r => briefAll || r.s <= BRIEF_PREVIEW);
    $('briefBody').innerHTML = vis.map((r, i) => {
      const first = i === 0 || vis[i - 1].s !== r.s;
      return `<tr class="${first ? 'first' : ''}"><td>${first ? r.w : ''}</td><td>${first ? r.s : ''}</td><td><span class="fmt" style="background:${r.f === 'vid' ? 'var(--accent)' : 'var(--tile-static)'}"></span>${r.f === 'vid' ? 'video' : 'statika'}</td><td class="code">${esc(r.name)}</td></tr>`;
    }).join('') || '<tr><td colspan="4" class="empty">–</td></tr>';
    const sa = $('showAll');
    if (R.sets > BRIEF_PREVIEW) { sa.hidden = false; sa.textContent = briefAll ? 'Zobrazit méně' : `Zobrazit všech ${R.sets} sad`; } else sa.hidden = true;
  }

  // předpoklady, které se v tomto výpočtu liší od nastavení, jdou do odkazu, aby klient viděl stejná čísla
  const OVERRIDE_FIELDS = [['pct', 'testPct', 'podíl na testování'], ['days', 'testDays', 'délka testu'], ['vid', 'videosPerSet', 'videí v sadě'], ['stat', 'staticsPerSet', 'statik v sadě'], ['win', 'winnersPerSet', 'vítězů ze sady'], ['life', 'winnerLifeWeeks', 'životnost vítěze'], ['maxSets', 'maxSetsPerMonth', 'max. sad']];
  function shareParams() {
    const p = new URLSearchParams(), diff = [];
    SHARE_KEYS.forEach(k => { const v = $(k).value; if (String(v).trim() !== '') p.set(k, k === 'market' ? v : String(num(v))); });
    OVERRIDE_FIELDS.forEach(([id, key, label]) => { const v = num($(id).value); if (v !== Number(cfg[key])) { p.set(id, String(v)); diff.push(label); } });
    const mDaily = (cfg.markets[$('market').value] || cfg.markets.cz).daily;
    if (num($('daily').value) !== mDaily) { p.set('daily', String(num($('daily').value))); diff.push('denní budget sady'); }
    if ($('useCpa').checked && num($('cpa').value) > 0) { p.set('cpa50', '1'); diff.push('navýšení podle CPA'); }
    p.set('lang', $('shareLang').value); p.set('cur', $('shareCur').value);
    return { url: location.origin + '/?' + p.toString(), diff };
  }
  const shareUrl = () => shareParams().url;
  function renderShare() {
    const { url, diff } = shareParams();
    $('shareUrl').textContent = url; $('openShare').href = url;
    $('shareDiff').hidden = !diff.length;
    $('shareDiff').textContent = diff.length ? 'Odkaz přenáší i upravené předpoklady: ' + diff.join(', ') + '.' : '';
  }

  document.querySelectorAll('#f .in input').forEach(el => {
    el.addEventListener('input', () => { if (el.id === 'spend') $('spendR').value = num(el.value); update(); });
    el.addEventListener('blur', () => tidy(el));
  });
  $('spendR').addEventListener('input', e => { $('spend').value = fmtIn(num(e.target.value)); update(); });
  $('useCpa').addEventListener('change', update);
  $('market').addEventListener('change', () => { $('daily').value = fmtIn((cfg.markets[$('market').value] || cfg.markets.cz).daily); update(); });
  $('account').addEventListener('change', e => {
    const a = ACCOUNTS[e.target.value];
    if (a) {
      $('spend').value = fmtIn(a.spend); $('spendR').value = a.spend; $('cpa').value = fmtIn(a.cpa); $('roas').value = a.roas === '' ? '' : fmtIn(a.roas, 2);
      $('current').value = fmtIn(a.current); $('liveNow').value = fmtIn(a.liveNow); $('market').value = a.market;
      $('daily').value = fmtIn((cfg.markets[a.market] || cfg.markets.cz).daily);
    }
    update();
  });
  document.querySelectorAll('#f [data-p]').forEach(b => b.addEventListener('click', () => { $('spend').value = fmtIn(num(b.dataset.p)); $('spendR').value = b.dataset.p; update(); }));
  $('f').addEventListener('submit', e => e.preventDefault());
  $('resetAssump').addEventListener('click', () => { fillAssumptions(); update(); });
  $('themes').addEventListener('input', () => last && renderBrief(last));
  $('persona').addEventListener('input', () => last && renderBrief(last));
  $('showAll').addEventListener('click', () => { briefAll = !briefAll; renderBrief(last); });
  $('copyNames').addEventListener('click', () => copy(briefRows(last).map(r => r.name).join('\n'), $('briefToast')));
  $('copyTsv').addEventListener('click', () => copy(['Týden\tSada\tFormát\tNázev kreativy'].concat(briefRows(last).map(r => [r.w, r.s, r.f, r.name].join('\t'))).join('\n'), $('briefToast')));
  $('shareLang').addEventListener('change', () => { $('shareCur').value = $('shareLang').value === 'cs' ? 'CZK' : 'EUR'; renderShare(); });
  $('shareCur').addEventListener('change', renderShare);
  $('copyShare').addEventListener('click', () => copy(shareUrl(), $('shareToast')));

  /* ---------- nastavení ---------- */
  function fillSettings() {
    document.querySelectorAll('#settingsForm [data-k]').forEach(el => { el.value = fmtIn(cfg[el.dataset.k], 2); });
    document.querySelectorAll('#settingsForm [data-price]').forEach(el => { el.value = fmtIn(cfg.prices[el.dataset.price]); });
    $('s_demo').checked = !!cfg.pricesAreDemo;
    document.querySelectorAll('#settingsForm [data-rate]').forEach(el => { el.value = fmtIn(cfg.rates[el.dataset.rate], 3); });
    $('marketsBox').innerHTML = CS.MARKET_KEYS.map(k => {
      const m = cfg.markets[k] || { daily: 5000, verified: false };
      return `<div class="mkt"><span class="nm">${esc(t('m_' + k))}</span>
        <div class="in"><input id="m_${k}" data-m="${k}" type="text" inputmode="numeric" value="${esc(fmtIn(m.daily))}" aria-label="Denní budget sady – ${esc(t('m_' + k))}"><span class="u">Kč / den</span></div>
        <label class="check" for="mv_${k}"><input id="mv_${k}" data-mv="${k}" type="checkbox" ${m.verified ? 'checked' : ''}><span>Ověřeno</span></label></div>`;
    }).join('');
    $('savedAt').textContent = cfg.updatedAt ? 'Naposledy uloženo ' + new Date(cfg.updatedAt).toLocaleString('cs-CZ') : 'Zatím se používají výchozí hodnoty.';
  }

  $('settingsForm').addEventListener('submit', async e => {
    e.preventDefault();
    const body = { prices: {}, markets: {}, pricesAreDemo: $('s_demo').checked };
    document.querySelectorAll('#settingsForm [data-k]').forEach(el => { body[el.dataset.k] = num(el.value); });
    document.querySelectorAll('#settingsForm [data-price]').forEach(el => { body.prices[el.dataset.price] = num(el.value); });
    body.rates = {}; document.querySelectorAll('#settingsForm [data-rate]').forEach(el => { body.rates[el.dataset.rate] = num(el.value); });
    document.querySelectorAll('#settingsForm [data-m]').forEach(el => { body.markets[el.dataset.m] = { daily: num(el.value), verified: $('mv_' + el.dataset.m).checked }; });
    const msg = $('saveMsg'); $('saveBtn').disabled = true;
    try {
      cfg = await api('/api/admin/config', { method: 'PUT', body: JSON.stringify(body) });
      msg.className = 'msg ok'; msg.textContent = 'Uloženo. Veřejná část už počítá s novými hodnotami.';
      fillSettings(); fillAssumptions(); update();
    } catch (err) {
      msg.className = 'msg err';
      msg.textContent = err.data && err.data.fields ? 'Zkontrolujte hodnoty: ' + err.data.fields.join(', ') : 'Uložení se nepovedlo.';
    } finally { $('saveBtn').disabled = false; setTimeout(() => { if (msg.className === 'msg ok') msg.textContent = ''; }, 4000); }
  });
  document.addEventListener('blur', e => { if (e.target.matches && e.target.matches('#settingsForm .in input')) tidy(e.target); }, true);

  /* ---------- poptávky ---------- */
  async function loadLeads() {
    try {
      const list = await api('/api/admin/leads');
      const fresh = list.filter(l => l.status === 'new').length;
      $('leadCount').hidden = !fresh; $('leadCount').textContent = fresh;
      if (!list.length) { $('leadsBody').innerHTML = '<tr><td colspan="4" class="empty-state">Zatím žádné poptávky. Objeví se tu, jakmile klient odešle formulář „Chci kreativy“.</td></tr>'; return; }
      $('leadsBody').innerHTML = list.map(l => {
        const c = l.calc || {};
        return `<tr>
          <td class="nowrap">${esc(new Date(l.createdAt).toLocaleString('cs-CZ'))}<span class="sm">${esc((l.lang || 'cs').toUpperCase())}</span></td>
          <td><b>${esc(l.name)}</b><span class="sm">${esc(l.company)}</span><span class="sm" style="user-select:all">${esc(l.email)}</span></td>
          <td>${c.spend ? esc(kc(c.spend)) + ' / měs.' : '–'}<span class="sm">${esc((c.market || 'cz').toUpperCase())} · doporučeno ${esc(fmt(c.newAds))} kreativ${c.current ? ', dnes ' + esc(fmt(c.current)) : ''}</span></td>
          <td class="nowrap"><span class="chip ${l.status === 'done' ? 'done' : 'new'}">${l.status === 'done' ? 'Vyřízeno' : 'Nová'}</span><br><button type="button" class="linkbtn" data-lead="${esc(l.id)}" data-to="${l.status === 'done' ? 'new' : 'done'}">${l.status === 'done' ? 'Vrátit mezi nové' : 'Označit jako vyřízené'}</button></td>
        </tr>`;
      }).join('');
    } catch (e) { if (e.message !== 'auth') $('leadsBody').innerHTML = '<tr><td colspan="4" class="empty-state">Poptávky se nepodařilo načíst.</td></tr>'; }
  }
  $('leadsBody').addEventListener('click', async e => {
    const b = e.target.closest('[data-lead]'); if (!b) return;
    b.disabled = true;
    try { await api('/api/admin/leads/' + encodeURIComponent(b.dataset.lead), { method: 'PATCH', body: JSON.stringify({ status: b.dataset.to }) }); } catch (err) {}
    loadLeads();
  });
  $('reloadLeads').addEventListener('click', loadLeads);

  /* ---------- start ---------- */
  $('account').innerHTML = '<option value="">Ruční zadání</option>' + Object.entries(ACCOUNTS).map(([k, a]) => `<option value="${k}">${esc(a.name)}</option>`).join('');
  marketOptions($('market'));
  api('/api/admin/config').then(c => {
    cfg = c; fillAssumptions(); fillSettings(); update(); loadLeads();
    const h = location.hash.slice(1); if (tabs.includes(h)) showTab(h);
  }).catch(() => {});
})();
