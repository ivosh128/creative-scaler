/* Creative Scaler – sdílená logika: texty, výpočet a vykreslení výsledků.
   Používá ho veřejná část i admin. Nic interního sem nepatří – soubor je veřejně dostupný. */
window.CS = (function () {
  const DPM = 30.4, WPM = 4.345, MAX_TILE_SETS = 48;
  const MARKET_KEYS = ['cz', 'sk', 'pl', 'hu', 'de', 'at'];

  const I = {
    cs: {
      eyebrow_hero: 'Kalkulačka kreativ pro Meta Ads', calc_eyebrow: 'Kalkulačka', calc_h: 'Spočítejte si to', results_eyebrow: 'Výsledek pro váš účet', cost_eyebrow: 'Náklady na výrobu', fat_eyebrow: 'Únava kreativ', plan_eyebrow: 'Rytmus testování', cta_eyebrow: 'Další krok', by: 'by MAIRA', cta_btn: 'Chci kreativy',
      h1a: 'Kolik kreativ', h1b: 'opravdu', h1c: 'potřebujete?',
      lead: 'Zadejte, kolik měsíčně utrácíte na Metě. Spočítáme, kolik nových reklam musíte každý měsíc otestovat, kolik jich má být v účtu živých a kolik to bude stát, aby výkon nepadal únavou kreativ.',
      spend_eyebrow: 'Měsíční spend', spend_label: 'Spend na Metě bez katalogu', u_month: 'Kč / měs.',
      market: 'Trh', perf_eyebrow: 'Výkon účtu · nepovinné',
      current: 'Nových kreativ dnes', liveNow: 'Živých reklam dnes', u_pcs: 'ks', u_pcs_m: 'ks / měs.',
      big_k: 'Nových kreativ každý měsíc', videos: 'videí', statics: 'statik', per_year: 'za rok',
      kpi_live: 'Živých v účtu', kpi_live_s: 'doporučeno současně, testy i vítězové', kpi_week: 'Každý týden', kpi_sets: 'Testovacích sad',
      live_now: 'dnes {n}',
      cost_h: 'Kolik to stojí', prices_demo: 'Orientační ceny',
      cost_sub: 'Měsíční výroba doporučeného objemu kreativ. Díky AI produkci je pravidelné testování dostupné i pro menší rozpočty.',
      cost_ai: 'AI produkce', cost_cl: 'Klasická produkce', of_spend: '{p} % měsíčního spendu',
      save: 'S AI produkcí ušetříte <b>{s}</b> měsíčně, tedy {p} % nákladů na výrobu.',
      fat_h: 'Co se stane bez nových kreativ', fat_with: 'S průběžným testováním', fat_without: 'Bez obměny kreativ',
      fat_sub_cpa: 'Vývoj CPA během tří měsíců. Bez nových kreativ publikum reklamy okouká a každá konverze zdražuje.',
      fat_sub_idx: 'Vývoj ceny za konverzi během tří měsíců (index, start = 100). Bez nových kreativ publikum reklamy okouká a každá konverze zdražuje.',
      fat_end: 'Za 12 týdnů bez obměny by konverze zdražila o ~{p} %.',
      fat_note: 'Ilustrační průběh, ne data z vašeho účtu.',
      week: 'Týden', wk: 'T',
      plan_h: 'Plán na měsíc', video: 'video', static: 'statika',
      plan_sub: 'Každý blok je jedna testovací sada. Nové sady se spouští průběžně, aby účet nikdy nezůstal bez čerstvých kreativ.',
      cta_h: 'Připravíme vám je',
      cta_sub: '{n} kreativ měsíčně zvládneme vyrobit s AI rychle a za zlomek ceny klasické produkce. Nechte nám kontakt a ozveme se s návrhem.',
      f_name: 'Jméno', f_company: 'Firma', f_email: 'E-mail', f_send: 'Chci kreativy',
      f_sent: 'Díky, máme to. Ozveme se vám s návrhem.', f_err: 'Odeslání se nepovedlo. Zkontrolujte údaje a zkuste to znovu.',
      daily_hint: '≈ {a} denně',
      new_s: '{sets} po {per} kreativách. Tolik jich účet potřebuje, aby {p} % rozpočtu šlo do testování nových variant.',
      new_none: 'Rozpočet na testování zatím nepokryje ani jednu testovací sadu.',
      set_forms: ['testovací sada', 'testovací sady', 'testovacích sad'],
      week_s: 'nových kreativ, zhruba {n} sady týdně', week_s0: 'nových kreativ', sets_s: 'měsíčně, každá za {b}', sets_s0: 'měsíčně',
      gap_more: 'Dnes přidáváte {c} kreativ měsíčně. Pro tento rozpočet jich potřebujete {n}, tedy o {d} víc.',
      gap_ok: 'S {c} kreativami měsíčně pokrýváte doporučený objem {n}.',
      al_min: 'Na jednu testovací sadu je potřeba {b}. Při {p} % na testování to znamená měsíční spend aspoň {m}.',
      al_cpa: 'Při CPA {c} přinese rozpočet zhruba {m} konverzí měsíčně. Jedna sada nasbírá během testu asi {s} konverzí, tedy {w} týdně.',
      al_cpa_low: ' To je pod hranicí ~50 týdně, kdy Meta obvykle opouští fázi učení.',
      al_roas: 'Při ROAS {r} odpovídá tento spend tržbám z Mety kolem {t} měsíčně.',
      al_live: 'V účtu dnes běží {a} reklam, doporučeno je {b}.',
      m_cz: 'Česko', m_sk: 'Slovensko', m_pl: 'Polsko', m_hu: 'Maďarsko', m_de: 'Německo', m_at: 'Rakousko',
      foot: 'Výpočet je orientační a vychází z postupů, které používáme u nejúspěšnějších klientů. Nezahrnuje katalogové kampaně.',
      loading: 'Načítám…', logout: 'Odhlásit'
    },
    sk: {
      eyebrow_hero: 'Kalkulačka kreatív pre Meta Ads', calc_eyebrow: 'Kalkulačka', calc_h: 'Spočítajte si to', results_eyebrow: 'Výsledok pre váš účet', cost_eyebrow: 'Náklady na výrobu', fat_eyebrow: 'Únava kreatív', plan_eyebrow: 'Rytmus testovania', cta_eyebrow: 'Ďalší krok', by: 'by MAIRA', cta_btn: 'Chcem kreatívy',
      h1a: 'Koľko kreatív', h1b: 'naozaj', h1c: 'potrebujete?',
      lead: 'Zadajte, koľko mesačne míňate na Mete. Spočítame, koľko nových reklám musíte každý mesiac otestovať, koľko ich má byť v účte živých a koľko to bude stáť, aby výkon neklesal únavou kreatív.',
      spend_eyebrow: 'Mesačný spend', spend_label: 'Spend na Mete bez katalógu', u_month: 'Kč / mes.',
      market: 'Trh', perf_eyebrow: 'Výkon účtu · nepovinné',
      current: 'Nových kreatív dnes', liveNow: 'Živých reklám dnes', u_pcs: 'ks', u_pcs_m: 'ks / mes.',
      big_k: 'Nových kreatív každý mesiac', videos: 'videí', statics: 'statík', per_year: 'za rok',
      kpi_live: 'Živých v účte', kpi_live_s: 'odporúčané súčasne, testy aj víťazi', kpi_week: 'Každý týždeň', kpi_sets: 'Testovacích sád',
      live_now: 'dnes {n}',
      cost_h: 'Koľko to stojí', prices_demo: 'Orientačné ceny',
      cost_sub: 'Mesačná výroba odporúčaného objemu kreatív. Vďaka AI produkcii je pravidelné testovanie dostupné aj pre menšie rozpočty.',
      cost_ai: 'AI produkcia', cost_cl: 'Klasická produkcia', of_spend: '{p} % mesačného spendu',
      save: 'S AI produkciou ušetríte <b>{s}</b> mesačne, teda {p} % nákladov na výrobu.',
      fat_h: 'Čo sa stane bez nových kreatív', fat_with: 'S priebežným testovaním', fat_without: 'Bez obmeny kreatív',
      fat_sub_cpa: 'Vývoj CPA počas troch mesiacov. Bez nových kreatív sa publikum na reklamy vynadíva a každá konverzia zdražuje.',
      fat_sub_idx: 'Vývoj ceny za konverziu počas troch mesiacov (index, štart = 100). Bez nových kreatív sa publikum na reklamy vynadíva a každá konverzia zdražuje.',
      fat_end: 'Za 12 týždňov bez obmeny by konverzia zdražela o ~{p} %.',
      fat_note: 'Ilustračný priebeh, nie dáta z vášho účtu.',
      week: 'Týždeň', wk: 'T',
      plan_h: 'Plán na mesiac', video: 'video', static: 'statika',
      plan_sub: 'Každý blok je jedna testovacia sada. Nové sady sa spúšťajú priebežne, aby účet nikdy nezostal bez čerstvých kreatív.',
      cta_h: 'Pripravíme vám ich',
      cta_sub: '{n} kreatív mesačne zvládneme vyrobiť s AI rýchlo a za zlomok ceny klasickej produkcie. Nechajte nám kontakt a ozveme sa s návrhom.',
      f_name: 'Meno', f_company: 'Firma', f_email: 'E-mail', f_send: 'Chcem kreatívy',
      f_sent: 'Vďaka, máme to. Ozveme sa vám s návrhom.', f_err: 'Odoslanie sa nepodarilo. Skontrolujte údaje a skúste to znova.',
      daily_hint: '≈ {a} denne',
      new_s: '{sets} po {per} kreatívach. Toľko ich účet potrebuje, aby {p} % rozpočtu išlo do testovania nových variantov.',
      new_none: 'Rozpočet na testovanie zatiaľ nepokryje ani jednu testovaciu sadu.',
      set_forms: ['testovacia sada', 'testovacie sady', 'testovacích sád'],
      week_s: 'nových kreatív, zhruba {n} sady týždenne', week_s0: 'nových kreatív', sets_s: 'mesačne, každá za {b}', sets_s0: 'mesačne',
      gap_more: 'Dnes pridávate {c} kreatív mesačne. Pre tento rozpočet ich potrebujete {n}, teda o {d} viac.',
      gap_ok: 'S {c} kreatívami mesačne pokrývate odporúčaný objem {n}.',
      al_min: 'Na jednu testovaciu sadu treba {b}. Pri {p} % na testovanie to znamená mesačný spend aspoň {m}.',
      al_cpa: 'Pri CPA {c} prinesie rozpočet zhruba {m} konverzií mesačne. Jedna sada nazbiera počas testu asi {s} konverzií, teda {w} týždenne.',
      al_cpa_low: ' To je pod hranicou ~50 týždenne, keď Meta zvyčajne opúšťa fázu učenia.',
      al_roas: 'Pri ROAS {r} zodpovedá tento spend tržbám z Mety okolo {t} mesačne.',
      al_live: 'V účte dnes beží {a} reklám, odporúčaných je {b}.',
      m_cz: 'Česko', m_sk: 'Slovensko', m_pl: 'Poľsko', m_hu: 'Maďarsko', m_de: 'Nemecko', m_at: 'Rakúsko',
      foot: 'Výpočet je orientačný a vychádza z postupov, ktoré používame pri najúspešnejších klientoch. Nezahŕňa katalógové kampane.',
      loading: 'Načítavam…', logout: 'Odhlásiť'
    },
    en: {
      eyebrow_hero: 'Creative calculator for Meta Ads', calc_eyebrow: 'Calculator', calc_h: 'Run the numbers', results_eyebrow: 'Result for your account', cost_eyebrow: 'Production cost', fat_eyebrow: 'Creative fatigue', plan_eyebrow: 'Testing rhythm', cta_eyebrow: 'Next step', by: 'by MAIRA', cta_btn: 'I want creatives',
      h1a: 'How many creatives', h1b: 'do you really', h1c: 'need?',
      lead: 'Enter your monthly Meta spend. We calculate how many new ads you need to test each month, how many should be live in the account and what it costs, so performance does not drop from creative fatigue.',
      spend_eyebrow: 'Monthly spend', spend_label: 'Meta spend excluding catalog', u_month: 'CZK / mo',
      market: 'Market', perf_eyebrow: 'Account performance · optional',
      current: 'New creatives today', liveNow: 'Live ads today', u_pcs: 'pcs', u_pcs_m: '/ mo',
      big_k: 'New creatives every month', videos: 'videos', statics: 'statics', per_year: 'per year',
      kpi_live: 'Live in account', kpi_live_s: 'recommended at once, tests and winners', kpi_week: 'Every week', kpi_sets: 'Test sets',
      live_now: 'today {n}',
      cost_h: 'What it costs', prices_demo: 'Indicative prices',
      cost_sub: 'Monthly production of the recommended creative volume. AI production makes steady testing affordable even for smaller budgets.',
      cost_ai: 'AI production', cost_cl: 'Classic production', of_spend: '{p}% of monthly spend',
      save: 'AI production saves you <b>{s}</b> a month, {p}% of production costs.',
      fat_h: 'What happens without new creatives', fat_with: 'With continuous testing', fat_without: 'No creative refresh',
      fat_sub_cpa: 'CPA over three months. Without new creatives the audience tires of the ads and every conversion gets more expensive.',
      fat_sub_idx: 'Cost per conversion over three months (index, start = 100). Without new creatives the audience tires of the ads and every conversion gets more expensive.',
      fat_end: 'After 12 weeks without a refresh, each conversion would cost ~{p}% more.',
      fat_note: 'Illustrative curve, not data from your account.',
      week: 'Week', wk: 'W',
      plan_h: 'Monthly plan', video: 'video', static: 'static',
      plan_sub: 'Each block is one test set. New sets launch continuously so the account never runs out of fresh creatives.',
      cta_h: 'We will make them for you',
      cta_sub: 'With AI we can produce {n} creatives a month quickly and for a fraction of classic production costs. Leave your contact and we will get back with a proposal.',
      f_name: 'Name', f_company: 'Company', f_email: 'Email', f_send: 'I want creatives',
      f_sent: 'Thanks, got it. We will get back to you with a proposal.', f_err: 'Sending failed. Check the details and try again.',
      daily_hint: '≈ {a} a day',
      new_s: '{sets} of {per} creatives each. That is what the account needs so {p}% of budget goes into testing new variants.',
      new_none: 'The testing budget does not cover a single test set yet.',
      set_forms: ['test set', 'test sets', 'test sets'],
      week_s: 'new creatives, about {n} sets a week', week_s0: 'new creatives', sets_s: 'a month, {b} each', sets_s0: 'a month',
      gap_more: 'You add {c} creatives a month today. This budget needs {n}, that is {d} more.',
      gap_ok: 'With {c} creatives a month you cover the recommended {n}.',
      al_min: 'One test set needs {b}. At {p}% for testing, that means at least {m} monthly spend.',
      al_cpa: 'At a CPA of {c} the budget brings about {m} conversions a month. One set collects about {s} conversions during the test, {w} a week.',
      al_cpa_low: ' That is below the ~50 a week at which Meta usually exits the learning phase.',
      al_roas: 'At a ROAS of {r} this spend matches about {t} of monthly revenue from Meta.',
      al_live: 'The account runs {a} ads today, {b} are recommended.',
      m_cz: 'Czechia', m_sk: 'Slovakia', m_pl: 'Poland', m_hu: 'Hungary', m_de: 'Germany', m_at: 'Austria',
      foot: 'The calculation is indicative and based on the approach we use with our top-performing clients. It excludes catalog campaigns.',
      loading: 'Loading…', logout: 'Log out'
    }
  };

  let lang = 'cs';
  const setLang = l => { if (I[l]) lang = l; };
  const getLang = () => lang;
  const num = v => { const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
  const loc = () => lang === 'en' ? 'en-US' : (lang === 'sk' ? 'sk-SK' : 'cs-CZ');
  const fmt = (n, d = 0) => Number(n || 0).toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: 0 });
  // Hodnoty ve formulářích se píšou vždy česky (mezera pro tisíce, čárka pro desetiny), aby přepnutí jazyka nerozbilo čísla.
  const fmtIn = (n, d = 0) => Number(n || 0).toLocaleString('cs-CZ', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const kc = n => lang === 'en' ? 'CZK ' + fmt(Math.round(n)) : fmt(Math.round(n)) + ' Kč';
  const t = (k, v = {}) => String(I[lang][k] ?? I.cs[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
  const pf = n => { const f = I[lang].set_forms; return n === 1 ? f[0] : (n >= 2 && n <= 4 ? f[1] : f[2]); };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = id => document.getElementById(id);

  function applyTexts(root = document) {
    document.documentElement.lang = lang;
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  }

  function marketOptions(sel) {
    const v = sel.value || 'cz';
    sel.innerHTML = MARKET_KEYS.map(k => `<option value="${k}">${esc(t('m_' + k))}</option>`).join('');
    sel.value = v;
  }

  /* S: spend, pct (0–1), daily, days, vid, stat, win, life, cpa, roas, current, liveNow, useCpa, prices{} */
  function calc(S) {
    const useCpa = !!S.useCpa && S.cpa > 0;
    const perSet = S.vid + S.stat, testBudget = S.spend * S.pct, baseSet = S.daily * S.days;
    const cpaSet = S.cpa > 0 ? S.cpa * 50 * S.days / 7 : 0;
    const cpaRaised = useCpa && cpaSet > baseSet;
    const setBudget = useCpa ? Math.max(baseSet, cpaSet) : baseSet;
    const sets = setBudget > 0 ? Math.floor(testBudget / setBudget) : 0;
    const newAds = sets * perSet, nV = sets * S.vid, nS = sets * S.stat;
    const concurrent = sets * S.days / DPM, liveTest = concurrent * perSet, liveWin = sets * S.win * (S.life * 7 / DPM);
    const live = Math.round(liveTest + liveWin), perWeek = newAds / WPM;
    const p = S.prices || {};
    const costAi = nV * (p.aiVideo || 0) + nS * (p.aiStatic || 0);
    const costClassic = nV * (p.classicVideo || 0) + nS * (p.classicStatic || 0);
    return { S, useCpa, perSet, testBudget, baseSet, cpaSet, cpaRaised, setBudget, sets, newAds, nV, nS, concurrent, liveTest, liveWin, live, perWeek, costAi, costClassic };
  }

  const weekSplit = sets => { const b = Math.floor(sets / 4), e = sets % 4; return [0, 1, 2, 3].map(w => b + (w < e ? 1 : 0)); };

  /* ilustrační únava: bez obměny po 2 týdnech +7 % týdně, s testováním mírně klesá */
  function curves() {
    const w = [], wo = [];
    for (let i = 0; i <= 12; i++) { wo.push(i <= 2 ? 100 : 100 * Math.pow(1.07, i - 2)); w.push(Math.max(88, 100 * Math.pow(0.99, i))); }
    return { w, wo };
  }

  function renderChart(R) {
    const c = $('chart'); if (!c) return;
    const { S } = R, base = S.cpa > 0 ? S.cpa : 100, useKc = S.cpa > 0;
    const { w, wo } = curves();
    const W = 960, H = 360, m = { l: 64, r: 20, t: 24, b: 36 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const maxV = Math.ceil(Math.max(...wo) / 25) * 25, minV = 75;
    const x = i => m.l + i / 12 * iw, y = v => m.t + (1 - (v - minV) / (maxV - minV)) * ih;
    const val = v => useKc ? kc(base * v / 100) : fmt(v);
    let g = '';
    for (let v = minV; v <= maxV; v += 25) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${m.l - 12}" y="${y(v) + 5}" text-anchor="end">${esc(useKc ? fmt(Math.round(base * v / 100)) : fmt(v))}</text>`;
    for (let i = 0; i <= 12; i += 2) g += `<text x="${x(i)}" y="${H - 10}" text-anchor="middle">${esc(t('wk'))}${i}</text>`;
    const path = a => a.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    c.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('fat_h'))}">${g}
      <path d="${path(wo)}" fill="none" stroke="var(--neutral-line)" stroke-width="2" stroke-dasharray="6 5"/>
      <path d="${path(w)}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
      <circle cx="${x(12)}" cy="${y(wo[12])}" r="4.5" fill="var(--neutral-line)" stroke="var(--surface)" stroke-width="2"/>
      <circle cx="${x(12)}" cy="${y(w[12])}" r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>
      <text class="lab" x="${x(12) - 8}" y="${y(wo[12]) - 10}" text-anchor="end">${esc(val(wo[12]))}</text>
      <text class="lab" x="${x(12) - 8}" y="${y(w[12]) - 10}" text-anchor="end">${esc(val(w[12]))}</text>
      <line id="xh" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--line-strong)" stroke-width="1" visibility="hidden"/>
      <rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent" id="hit"/>
    </svg><div class="tip" id="tip" hidden></div>`;
    const sub = $('fatSub'); if (sub) sub.textContent = (useKc ? t('fat_sub_cpa') : t('fat_sub_idx')) + ' ' + t('fat_end', { p: fmt(wo[12] - 100) });
    const hit = c.querySelector('#hit'), xh = c.querySelector('#xh'), tip = c.querySelector('#tip'), sv = c.querySelector('svg');
    const move = e => {
      const r = sv.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W;
      const i = Math.max(0, Math.min(12, Math.round((px - m.l) / iw * 12)));
      xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.setAttribute('visibility', 'visible');
      tip.hidden = false;
      tip.style.left = (x(i) / W * r.width) + 'px'; tip.style.top = (y(Math.max(wo[i], w[i])) / H * r.height) + 'px';
      tip.innerHTML = `${esc(t('week'))} ${i}<br><span style="color:var(--accent)">●</span> <b>${esc(val(w[i]))}</b><br><span style="color:var(--neutral-line)">●</span> <b>${esc(val(wo[i]))}</b>`;
    };
    hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { tip.hidden = true; xh.setAttribute('visibility', 'hidden'); });
  }

  function renderPlan(R) {
    const el = $('weeks'); if (!el) return;
    const { S } = R, per = weekSplit(R.sets);
    const setHtml = '<span class="set">' + '<i class="v"></i>'.repeat(S.vid) + '<i class="s"></i>'.repeat(S.stat) + '</span>';
    el.innerHTML = per.map((n, w) => {
      const shown = Math.min(n, Math.ceil(MAX_TILE_SETS / 4));
      const body = n === 0 ? '<span class="empty">–</span>' : setHtml.repeat(shown) + (n > shown ? `<span class="more">+${n - shown}</span>` : '');
      return `<div class="week"><div class="wh"><span class="wl">${esc(t('week'))} ${w + 1}</span><span class="wc">${fmt(n * R.perSet)}</span></div><div class="sets">${body}</div></div>`;
    }).join('');
  }

  function renderCost(R) {
    if (!$('cAi')) return;
    const { S } = R, ai = R.costAi, cl = R.costClassic;
    $('cAi').textContent = kc(ai); $('cCl').textContent = kc(cl);
    const share = v => S.spend > 0 ? t('of_spend', { p: fmt(v / S.spend * 100, 1) }) : '';
    $('cAiS').textContent = share(ai); $('cClS').textContent = share(cl);
    const mx = Math.max(ai, cl, 1);
    $('bAi').style.width = (ai / mx * 100) + '%'; $('bCl').style.width = (cl / mx * 100) + '%';
    $('cSave').innerHTML = cl > ai ? t('save', { s: esc(kc(cl - ai)), p: fmt((cl - ai) / cl * 100) }) : '';
  }

  /* opts.extraAlerts(R) → [[třída, text]], opts.cpaHint → text k nízkému počtu konverzí */
  function render(R, opts = {}) {
    const { S } = R;
    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    set('rNew', fmt(R.newAds)); set('rVid', fmt(R.nV)); set('rStat', fmt(R.nS)); set('rYear', fmt(R.newAds * 12));
    set('rNewS', R.sets > 0 ? t('new_s', { sets: fmt(R.sets) + ' ' + pf(R.sets), per: R.perSet, p: fmt(S.pct * 100) }) : t('new_none'));
    set('rLive', fmt(R.live)); set('rLiveNow', S.liveNow > 0 ? t('live_now', { n: fmt(S.liveNow) }) : '');
    set('rWeek', fmt(Math.round(R.perWeek)));
    set('rWeekS', R.sets > 0 ? t('week_s', { n: fmt(R.sets / WPM, 1) }) : t('week_s0'));
    set('rSets', fmt(R.sets)); set('rSetsS', R.setBudget > 0 ? t('sets_s', { b: kc(R.setBudget) }) : t('sets_s0'));
    set('dailyHint', S.spend > 0 ? (opts.dailyHint ? opts.dailyHint(R) : t('daily_hint', { a: kc(S.spend / DPM) })) : '');
    document.querySelectorAll('[data-p]').forEach(b => b.setAttribute('aria-pressed', String(num(b.dataset.p) === S.spend)));

    const gb = $('gapBox');
    if (gb) {
      if (S.current > 0 && R.newAds > 0) {
        const r = R.newAds / S.current; gb.hidden = false;
        if (r > 1.05) { set('gapN', fmt(r, 1) + '×'); set('gapT', t('gap_more', { c: fmt(S.current), n: fmt(R.newAds), d: fmt(R.newAds - S.current) })); }
        else { set('gapN', 'OK'); set('gapT', t('gap_ok', { c: fmt(S.current), n: fmt(R.newAds) })); }
      } else gb.hidden = true;
    }

    const al = [];
    if (S.spend > 0 && R.sets === 0) al.push(['', t('al_min', { b: kc(R.setBudget), p: fmt(S.pct * 100), m: kc(R.setBudget / Math.max(S.pct, 0.01)) })]);
    if (S.liveNow > 0 && R.live > 0 && S.liveNow < R.live * 0.9) al.push(['', t('al_live', { a: fmt(S.liveNow), b: fmt(R.live) })]);
    if (S.cpa > 0) {
      const cs = R.setBudget / S.cpa, cw = cs / S.days * 7;
      let tx = t('al_cpa', { c: kc(S.cpa), m: fmt(S.spend / S.cpa), s: fmt(cs), w: fmt(cw) });
      if (!R.useCpa && cw < 50) { tx += t('al_cpa_low') + (opts.cpaHint || ''); al.push(['', tx]); } else al.push(['good', tx]);
    }
    if (S.roas > 0 && S.spend > 0) al.push(['good', t('al_roas', { r: fmt(S.roas, 2), t: kc(S.spend * S.roas) })]);
    if (opts.extraAlerts) al.push(...opts.extraAlerts(R));
    const ae = $('alerts'); if (ae) ae.innerHTML = al.map(([c, x]) => `<div class="alert ${c}">${esc(x)}</div>`).join('');

    renderCost(R); renderChart(R); renderPlan(R);
    set('ctaSub', t('cta_sub', { n: fmt(R.newAds) }));
  }

  function tidy(el) { if (el.value.trim() === '') return; el.value = fmtIn(num(el.value), 2); }

  return { I, DPM, WPM, MARKET_KEYS, setLang, getLang, num, fmt, fmtIn, kc, t, pf, esc, applyTexts, marketOptions, calc, render, weekSplit, tidy };
})();
