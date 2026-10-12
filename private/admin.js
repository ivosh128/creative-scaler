/* Creative Scaler – admin (dostupné jen po přihlášení adminem) */
(function () {
  const { num, fmt, fmtIn, kc, esc, calc, render, renderExamples, weekSplit, tidy, t } = CS;
  const $ = id => document.getElementById(id);
  CS.setLang('cs');

  const ACCOUNTS = {
    a: { name: 'Demo · E-shop s elektronikou', spend: 1000000, cpa: 420, roas: 6.2, current: 8, liveNow: 14, sit: 'stable' },
    b: { name: 'Demo · Módní značka', spend: 450000, cpa: 310, roas: 4.1, current: 6, liveNow: 9, sit: 'growth' },
    c: { name: 'Demo · Leadgen reality', spend: 200000, cpa: 950, roas: '', current: 3, liveNow: 5, sit: 'stable' },
    d: { name: 'Demo · Menší e-shop', spend: 45000, cpa: 380, roas: 4.5, current: 2, liveNow: 4, sit: 'stable' },
    e: { name: 'Demo · DTC expanze do Německa', spend: 1800000, cpa: 780, roas: 3.4, current: 12, liveNow: 18, sit: 'launch' }
  };
  const FUNNEL = ['tofu', 'mofu', 'bofu'];
  const ANGLES = ['problem', 'benefit', 'srovnani', 'social-proof', 'recenze'];
  const VSTYLE = ['ai-ugc', 'ai-motion', 'ai-avatar'];
  const SSTYLE = ['foto', 'grafika'];
  const BRIEF_PREVIEW = 8;
  const SHARE_KEYS = ['spend', 'sit', 'cpa', 'roas', 'current', 'liveNow'];

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
    $('pct').value = fmtIn(cfg.testPct); $('days').value = fmtIn(cfg.testDays);
    $('vid').value = fmtIn(cfg.videosPerSet); $('stat').value = fmtIn(cfg.staticsPerSet);
    $('win').value = fmtIn(cfg.winnersPerSet); $('life').value = fmtIn(cfg.winnerLifeWeeks);
  }

  function read() {
    return {
      spend: num($('spend').value), pct: num($('pct').value) / 100, sit: $('sit').value, mult: cfg.situations, rules: cfg.rules,
      days: Math.max(1, num($('days').value)),
      vid: Math.max(0, Math.round(num($('vid').value))), stat: Math.max(0, Math.round(num($('stat').value))),
      win: Math.max(0, num($('win').value)), life: Math.max(0, num($('life').value)),
      cpa: num($('cpa').value), roas: num($('roas').value), current: num($('current').value), liveNow: num($('liveNow').value),
      prices: cfg.prices, fatigue: { pct: cfg.fatigueWeeklyPct, start: cfg.fatigueStartWeek, eff: cfg.refreshEffPct }
    };
  }

  function update() {
    if (!cfg) return;
    last = calc(read());
    render(last, {
      internal: true,
      cpaHint: ' Sada možná nenasbírá dost dat, zvažte delší test nebo méně sad s vyšším budgetem.',
      dailyHint: R => `≈ ${kc(R.S.spend / CS.DPM)} denně, z toho ${kc(R.testBudget / CS.DPM)} na testování`
    });
    $('pricesBadge').hidden = !cfg.pricesAreDemo;
    renderChain(last); renderBrief(last); renderShare();
  }

  function renderChain(R) {
    const { S } = R, r = R.rules;
    const sitName = { stable: 'stabilní provoz', growth: 'růst', launch: 'launch / nový směr' }[R.sit];
    const countWhy = R.mode === 'tiny' ? `Rozpočet pod ${kc(r.tinySpend)}: 1 sada jednou za 2 měsíce${R.factor >= 2 ? ', u launche každý měsíc' : ''}.`
      : R.mode === 'small' ? `Rozpočet pod ${kc(r.smallSpend)}: 1 sada měsíčně${R.factor > 1 ? ` × ${fmt(R.factor, 1)} (${sitName})` : ''}.`
      : `Přímka ${kc(r.lowSpend)} = ${fmt(r.lowN)} a ${kc(r.highSpend)} = ${fmt(r.highN)} kreativ dává pro ${kc(S.spend)} ${fmt(R.base, 1)}`
        + (R.factor !== 1 ? `, × ${fmt(R.factor, 1)} za situaci (${sitName})` : '') + `, zaokrouhleno po ${fmt(r.step)}.`
        + (R.individual ? ` Nad ${fmt(r.highN)} kreativ ukazujeme klientovi štítek „individuální nabídka“.` : '');
    const rows = [
      ['Měsíční spend bez katalogu', kc(S.spend), 'Vstup od klienta. Katalogové kampaně se nezapočítávají.', null],
      ['Situace účtu', R.factor === 1 ? '1×' : fmt(R.factor, 1) + '×', 'Růst a launch potřebují víc nových kreativ, protože se teprve hledá, co funguje.', 'p'],
      ['Nových kreativ měsíčně', fmt(R.newAds, 1), countWhy, 'p'],
      ['Testovacích sad měsíčně', fmt(R.sets, 1), `Nové kreativy po ${R.perSet} v sadě.`, 'd'],
      ['Kreativ v sadě', `${R.perSet} (${S.vid} + ${S.stat})`, `${S.vid}× video s různým hookem nebo verzí, ${S.stat}× statika, která se liší vizuálem i tématem, ne jen textem.`, 'd'],
      ['Budget jedné sady', kc(R.setBudget), `${fmt(S.pct * 100)} % spendu na testování (${kc(R.testBudget)}) děleno počtem sad. Jen informace, počet kreativ to nemění.`, 'p'],
      ['Týdenní kadence', `${fmt(R.perWeek, 1)} / týden`, 'Nové kreativy rozložené rovnoměrně do měsíce.', 'p'],
      ['Živých kreativ v účtu', fmt(R.live), `Zhruba ${fmt(R.liveTest)} právě v testu a ${fmt(R.liveWin)} vítězů, z nichž každý jede asi ${fmt(S.life)} týdny.` + (R.liveRaised ? ` Výpočet dává ${fmt(R.liveCalc, 1)}, doporučujeme ale minimum ${fmt(r.minLive)}.` : ''), 'p'],
      ['Únava kreativ', `${fmt(R.fatigue.f * 100, 1)} % týdně`, `Bez obměny zdražuje konverze od ${R.fatigue.start}. týdne. Doporučený objem ji tlumí o ${fmt(R.fatigue.eff * 100)} %, menší objem úměrně méně.`, 'p']
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
  const OVERRIDE_FIELDS = [['pct', 'testPct', 'podíl na testování'], ['days', 'testDays', 'délka testu'], ['vid', 'videosPerSet', 'videí v sadě'], ['stat', 'staticsPerSet', 'statik v sadě'], ['win', 'winnersPerSet', 'vítězů ze sady'], ['life', 'winnerLifeWeeks', 'životnost vítěze']];
  function shareParams() {
    const p = new URLSearchParams(), diff = [];
    SHARE_KEYS.forEach(k => { const v = $(k).value; if (String(v).trim() !== '' && !(k === 'sit' && v === 'stable')) p.set(k, k === 'sit' ? v : String(num(v))); });
    OVERRIDE_FIELDS.forEach(([id, key, label]) => { const v = num($(id).value); if (v !== Number(cfg[key])) { p.set(id, String(v)); diff.push(label); } });
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
  $('sit').addEventListener('change', update);
  $('account').addEventListener('change', e => {
    const a = ACCOUNTS[e.target.value];
    if (a) {
      $('spend').value = fmtIn(a.spend); $('spendR').value = a.spend; $('cpa').value = fmtIn(a.cpa); $('roas').value = a.roas === '' ? '' : fmtIn(a.roas, 2);
      $('current').value = fmtIn(a.current); $('liveNow').value = fmtIn(a.liveNow); $('sit').value = a.sit;
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
    document.querySelectorAll('#settingsForm [data-r]').forEach(el => { el.value = fmtIn(cfg.rules[el.dataset.r], 2); });
    document.querySelectorAll('#settingsForm [data-x]').forEach(el => { el.value = fmtIn(cfg.situations[el.dataset.x], 2); });
    examples = (cfg.examples || []).map(x => ({ ...x })); renderExList();
    $('savedAt').textContent = cfg.updatedAt ? 'Naposledy uloženo ' + new Date(cfg.updatedAt).toLocaleString('cs-CZ') : 'Zatím se používají výchozí hodnoty.';
  }

  $('settingsForm').addEventListener('submit', async e => {
    e.preventDefault();
    syncExamples();
    const body = { prices: {}, rules: {}, situations: {}, examples, pricesAreDemo: $('s_demo').checked };
    document.querySelectorAll('#settingsForm [data-r]').forEach(el => { body.rules[el.dataset.r] = num(el.value); });
    document.querySelectorAll('#settingsForm [data-x]').forEach(el => { body.situations[el.dataset.x] = num(el.value); });
    document.querySelectorAll('#settingsForm [data-k]').forEach(el => { body[el.dataset.k] = num(el.value); });
    document.querySelectorAll('#settingsForm [data-price]').forEach(el => { body.prices[el.dataset.price] = num(el.value); });
    body.rates = {}; document.querySelectorAll('#settingsForm [data-rate]').forEach(el => { body.rates[el.dataset.rate] = num(el.value); });
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
  document.addEventListener('blur', e => { if (e.target.matches && e.target.matches('#settingsForm .in input[inputmode]')) tidy(e.target); }, true);

  /* ---------- ukázky AI kreativ ---------- */
  let examples = [];
  const RATIOS = ['9:16', '1:1', '4:5', '16:9'];
  function renderExList() {
    $('exList').innerHTML = examples.length ? examples.map((x, i) => `
      <div class="ex-row" data-i="${i}">
        <div class="ex-prev">${x.kind === 'image' ? `<img src="${esc(x.src)}" alt="">` : `<video src="${esc(x.src)}" muted preload="metadata"></video>`}</div>
        <div class="pair">
          <div class="field"><label>Název</label><div class="in"><input data-f="title" type="text" maxlength="80" value="${esc(x.title || '')}" placeholder="např. UGC video s hookem na cenu"></div></div>
          <div class="field"><label>Klient</label><div class="in"><input data-f="client" type="text" maxlength="80" value="${esc(x.client || '')}" placeholder="např. Knuspr"></div></div>
          <div class="field"><label>Výsledek (nepovinné)</label><div class="in"><input data-f="result" type="text" maxlength="120" value="${esc(x.result || '')}" placeholder="např. CPA −32 % proti klasické kreativě"></div></div>
          <div class="field"><label>Formát</label><div class="in"><select data-f="ratio">${RATIOS.map(r => `<option ${r === x.ratio ? 'selected' : ''}>${r}</option>`).join('')}</select></div></div>
        </div>
        <div class="ex-act">
          <button type="button" class="linkbtn" data-move="-1" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="linkbtn" data-move="1" ${i === examples.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="linkbtn" data-del>Odebrat</button>
        </div>
      </div>`).join('') : '<p class="hint" style="margin:0">Zatím žádné ukázky.</p>';
  }
  function syncExamples() {
    document.querySelectorAll('#exList .ex-row').forEach(row => {
      const x = examples[Number(row.dataset.i)]; if (!x) return;
      row.querySelectorAll('[data-f]').forEach(el => { x[el.dataset.f] = el.value; });
    });
  }
  $('exList').addEventListener('click', e => {
    const row = e.target.closest('.ex-row'); if (!row) return;
    const i = Number(row.dataset.i); syncExamples();
    if (e.target.closest('[data-del]')) examples.splice(i, 1);
    const mv = e.target.closest('[data-move]');
    if (mv) { const j = i + Number(mv.dataset.move); if (j >= 0 && j < examples.length) [examples[i], examples[j]] = [examples[j], examples[i]]; }
    renderExList();
  });
  $('exFile').addEventListener('change', async e => {
    const files = [...e.target.files]; e.target.value = '';
    for (const f of files) {
      $('exToast').textContent = `Nahrávám ${f.name}…`;
      try {
        const r = await fetch('/api/admin/media', { method: 'POST', headers: { 'Content-Type': f.type }, body: f });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || 'Nahrání se nepovedlo.');
        syncExamples(); examples.push({ src: d.src, kind: d.kind, ratio: '9:16', title: f.name.replace(/\.[^.]+$/, ''), client: '', result: '' }); renderExList();
        $('exToast').textContent = 'Nahráno. Nezapomeňte uložit nastavení.';
      } catch (err) { $('exToast').textContent = err.message; }
    }
  });
  $('exAddUrl').addEventListener('click', () => {
    const u = (prompt('Odkaz na video (MP4/WEBM) nebo obrázek, začíná https://') || '').trim();
    if (!u) return;
    if (!/^https:\/\//.test(u)) { $('exToast').textContent = 'Odkaz musí začínat https://'; return; }
    syncExamples(); examples.push({ src: u, kind: /\.(mp4|webm|mov)(\?|$)/i.test(u) ? 'video' : 'image', ratio: '9:16', title: '', client: '', result: '' }); renderExList();
  });

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
          <td>${c.spend ? esc(kc(c.spend)) + ' / měs.' : '–'}<span class="sm">${esc({ stable: 'stabilní', growth: 'růst', launch: 'launch' }[c.sit] || (c.market || '').toUpperCase())} · doporučeno ${esc(fmt(c.newAds))} kreativ${c.current ? ', dnes ' + esc(fmt(c.current)) : ''}</span></td>
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
  fetch('/api/admin/mode').then(r => r.json()).then(m => { if (m.open) $('logoutLink').hidden = true; }).catch(() => {});
  api('/api/admin/config').then(c => {
    cfg = c; fillAssumptions(); fillSettings(); update(); loadLeads();
    const h = location.hash.slice(1); if (tabs.includes(h)) showTab(h);
  }).catch(() => {});
})();
