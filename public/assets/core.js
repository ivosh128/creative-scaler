/* Creative Scaler – sdílená logika: texty, měny, výpočet a vykreslení výsledků.
   Používá ho veřejná část i admin. Nic interního sem nepatří – soubor je veřejně dostupný.
   Všechny peníze se uvnitř počítají v Kč, měna se řeší jen při čtení vstupů a zobrazení. */
window.CS = (function () {
  const DPM = 30.4, WPM = 4.345, MAX_TILE_SETS = 48, FAT_WEEKS = 12;
  const MARKET_KEYS = ['cz', 'sk', 'pl', 'hu', 'de', 'at'];
  const CURRENCIES = ['CZK', 'EUR', 'USD'];
  // rychlé volby rozpočtu v „kulatých“ částkách dané měny
  const PRESETS = { CZK: [100000, 500000, 1000000, 3000000], EUR: [5000, 20000, 50000, 120000], USD: [5000, 20000, 50000, 120000] };

  const I = {
    cs: {
      eyebrow_hero: 'Kalkulačka kreativ pro Meta Ads', h1a: 'Kolik kreativ', h1b: 'opravdu', h1c: 'potřebujete?',
      lead: 'Zadejte, kolik utrácíte na Metě. Spočítáme, kolik nových reklam musíte každý měsíc otestovat, kolik jich má být v účtu živých a kolik to bude stát, aby výkon nepadal únavou kreativ.',
      by: 'by MAIRA', cta_btn: 'Chci kreativy', loading: 'Načítám…',
      calc_eyebrow: 'Kalkulačka', calc_h: 'Spočítejte si to',
      spend_eyebrow: 'Rozpočet na Metě', cur_label: 'Měna', mode_month: 'Měsíčně', mode_day: 'Denně',
      spend_label: 'Měsíční spend bez katalogu', spend_label_day: 'Denní spend bez katalogu',
      per_month: '/ měs.', per_day: '/ den', u_pcs: 'ks', u_pcs_m: 'ks / měs.',
      hint_month: '≈ {a} denně', hint_day: '≈ {a} měsíčně',
      market: 'Trh', perf_eyebrow: 'Výkon účtu · nepovinné',
      conv: 'Konverzí měsíčně', conv_hint: 'Stačí vyplnit CPA, nebo počet konverzí. Druhé se dopočítá.',
      current: 'Nových kreativ dnes', liveNow: 'Živých reklam dnes',
      big_k: 'Nových kreativ každý měsíc', videos: 'videí', statics: 'statik', per_year: 'za rok',
      kpi_live: 'Živých v účtu', kpi_live_s: 'doporučeno současně, testy i vítězové', kpi_week: 'Každý týden', kpi_sets: 'Testovacích sad',
      live_now: 'dnes {n}',
      new_s: '{sets} po {per} kreativách. Tolik jich účet potřebuje, aby {p} % rozpočtu šlo do testování nových variant.',
      new_small: 'S tímto rozpočtem doporučujeme začít jednou testovací sadou měsíčně s {per} kreativami.',
      new_none: 'Zadejte rozpočet a hned uvidíte doporučení.',
      set_forms: ['testovací sada', 'testovací sady', 'testovacích sad'],
      week_s: 'nových kreativ, zhruba {n} sady týdně', week_s0: 'nových kreativ', sets_s: 'měsíčně, každá za {b}', sets_s0: 'měsíčně',
      gap_more: 'Dnes přidáváte {c} kreativ měsíčně. Pro tento rozpočet jich potřebujete {n}, tedy o {d} víc.',
      gap_ok: 'S {c} kreativami měsíčně pokrýváte doporučený objem {n}.',
      al_small: 'Na plnohodnotný test je potřeba {m} na sadu. Vaše sada dostane {b} ({d} denně), takže výsledky budou orientační. Naplno test funguje od {s} měsíčně.',
      al_cap: 'U takového rozpočtu už nepřidáváme další sady. Místo toho dostane každá z {n} sad víc peněz ({b}), aby test rychleji ukázal vítěze.',
      al_cpa_pub: 'Při CPA {c} přinese rozpočet zhruba {m} konverzí měsíčně.',
      al_cpa: 'Při CPA {c} přinese rozpočet zhruba {m} konverzí měsíčně. Jedna sada nasbírá během testu asi {s} konverzí, tedy {w} týdně.',
      al_cpa_low: ' To je pod hranicí ~50 týdně, kdy Meta obvykle opouští fázi učení.',
      al_roas: 'Při ROAS {r} odpovídá tento spend tržbám z Mety kolem {t} měsíčně.',
      al_live: 'V účtu dnes běží {a} reklam, doporučeno je {b}.',
      cost_eyebrow: 'Náklady na výrobu', cost_h: 'Kolik to stojí', prices_demo: 'Orientační ceny',
      cost_sub: 'Měsíční výroba doporučeného objemu kreativ. Díky AI produkci je pravidelné testování dostupné i pro menší rozpočty.',
      cost_ai: 'AI produkce', cost_cl: 'Klasická produkce', of_spend: '{p} % mediálního rozpočtu', of_rev: '{p} % tržeb z Mety',
      save: 'S AI produkcí ušetříte <b>{s}</b> měsíčně, tedy {p} % nákladů na výrobu.',
      fat_eyebrow: 'Únava kreativ', fat_h: 'Co se stane bez nových kreativ', fat_with: 'S průběžným testováním', fat_without: 'Bez obměny kreativ',
      fat_sub: 'Když se kreativy neobměňují, publikum je okouká a každá konverze postupně zdražuje. Takhle by to vypadalo u vašeho rozpočtu během 12 týdnů.',
      fat_y_cpa: 'Cena za konverzi', fat_y_idx: 'Cena za konverzi (start = 100)',
      fat_loss_conv: 'Bez obměny byste za 12 týdnů za stejné peníze dostali o ~{n} konverzí méně ({p} %).',
      fat_loss_pct: 'Bez obměny byste za 12 týdnů za stejné peníze dostali o ~{p} % méně konverzí.',
      fat_loss_rev: 'To je zhruba <b>{r}</b> ztracených tržeb. AI kreativy na stejné období stojí {a}.',
      fat_roas_hint: 'Vyplňte ROAS a uvidíte, kolik tržeb by únava kreativ stála.',
      fat_note: 'Odhad: bez obměny roste cena za konverzi o {f} % týdně od {w}. týdne, s průběžným testováním zůstává stabilní.',
      week: 'Týden', wk: 'T',
      plan_eyebrow: 'Rytmus testování', plan_h: 'Plán na měsíc', video: 'video', static: 'statika',
      plan_sub: 'Každý blok je jedna testovací sada. Nové sady se spouští průběžně, aby účet nikdy nezůstal bez čerstvých kreativ.',
      cta_eyebrow: 'Další krok', cta_h: 'Připravíme vám je',
      cta_sub: '{n} kreativ měsíčně zvládneme vyrobit s AI rychle a za zlomek ceny klasické produkce. Nechte nám kontakt a ozveme se s návrhem.',
      f_name: 'Jméno', f_company: 'Firma', f_email: 'E-mail', f_send: 'Chci kreativy',
      f_sent: 'Díky, máme to. Ozveme se vám s návrhem.', f_err: 'Odeslání se nepovedlo. Zkontrolujte údaje a zkuste to znovu.',
      m_cz: 'Česko', m_sk: 'Slovensko', m_pl: 'Polsko', m_hu: 'Maďarsko', m_de: 'Německo', m_at: 'Rakousko',
      foot: 'Výpočet je orientační a vychází z postupů, které používáme u nejúspěšnějších klientů. Nezahrnuje katalogové kampaně.'
    },
    sk: {
      eyebrow_hero: 'Kalkulačka kreatív pre Meta Ads', h1a: 'Koľko kreatív', h1b: 'naozaj', h1c: 'potrebujete?',
      lead: 'Zadajte, koľko míňate na Mete. Spočítame, koľko nových reklám musíte každý mesiac otestovať, koľko ich má byť v účte živých a koľko to bude stáť, aby výkon neklesal únavou kreatív.',
      by: 'by MAIRA', cta_btn: 'Chcem kreatívy', loading: 'Načítavam…',
      calc_eyebrow: 'Kalkulačka', calc_h: 'Spočítajte si to',
      spend_eyebrow: 'Rozpočet na Mete', cur_label: 'Mena', mode_month: 'Mesačne', mode_day: 'Denne',
      spend_label: 'Mesačný spend bez katalógu', spend_label_day: 'Denný spend bez katalógu',
      per_month: '/ mes.', per_day: '/ deň', u_pcs: 'ks', u_pcs_m: 'ks / mes.',
      hint_month: '≈ {a} denne', hint_day: '≈ {a} mesačne',
      market: 'Trh', perf_eyebrow: 'Výkon účtu · nepovinné',
      conv: 'Konverzií mesačne', conv_hint: 'Stačí vyplniť CPA alebo počet konverzií. Druhé sa dopočíta.',
      current: 'Nových kreatív dnes', liveNow: 'Živých reklám dnes',
      big_k: 'Nových kreatív každý mesiac', videos: 'videí', statics: 'statík', per_year: 'za rok',
      kpi_live: 'Živých v účte', kpi_live_s: 'odporúčané súčasne, testy aj víťazi', kpi_week: 'Každý týždeň', kpi_sets: 'Testovacích sád',
      live_now: 'dnes {n}',
      new_s: '{sets} po {per} kreatívach. Toľko ich účet potrebuje, aby {p} % rozpočtu išlo do testovania nových variantov.',
      new_small: 'S týmto rozpočtom odporúčame začať jednou testovacou sadou mesačne s {per} kreatívami.',
      new_none: 'Zadajte rozpočet a hneď uvidíte odporúčanie.',
      set_forms: ['testovacia sada', 'testovacie sady', 'testovacích sád'],
      week_s: 'nových kreatív, zhruba {n} sady týždenne', week_s0: 'nových kreatív', sets_s: 'mesačne, každá za {b}', sets_s0: 'mesačne',
      gap_more: 'Dnes pridávate {c} kreatív mesačne. Pre tento rozpočet ich potrebujete {n}, teda o {d} viac.',
      gap_ok: 'S {c} kreatívami mesačne pokrývate odporúčaný objem {n}.',
      al_small: 'Na plnohodnotný test treba {m} na sadu. Vaša sada dostane {b} ({d} denne), takže výsledky budú orientačné. Naplno test funguje od {s} mesačne.',
      al_cap: 'Pri takom rozpočte už nepridávame ďalšie sady. Namiesto toho dostane každá z {n} sád viac peňazí ({b}), aby test rýchlejšie ukázal víťaza.',
      al_cpa_pub: 'Pri CPA {c} prinesie rozpočet zhruba {m} konverzií mesačne.',
      al_cpa: 'Pri CPA {c} prinesie rozpočet zhruba {m} konverzií mesačne. Jedna sada nazbiera počas testu asi {s} konverzií, teda {w} týždenne.',
      al_cpa_low: ' To je pod hranicou ~50 týždenne, keď Meta zvyčajne opúšťa fázu učenia.',
      al_roas: 'Pri ROAS {r} zodpovedá tento spend tržbám z Mety okolo {t} mesačne.',
      al_live: 'V účte dnes beží {a} reklám, odporúčaných je {b}.',
      cost_eyebrow: 'Náklady na výrobu', cost_h: 'Koľko to stojí', prices_demo: 'Orientačné ceny',
      cost_sub: 'Mesačná výroba odporúčaného objemu kreatív. Vďaka AI produkcii je pravidelné testovanie dostupné aj pre menšie rozpočty.',
      cost_ai: 'AI produkcia', cost_cl: 'Klasická produkcia', of_spend: '{p} % mediálneho rozpočtu', of_rev: '{p} % tržieb z Mety',
      save: 'S AI produkciou ušetríte <b>{s}</b> mesačne, teda {p} % nákladov na výrobu.',
      fat_eyebrow: 'Únava kreatív', fat_h: 'Čo sa stane bez nových kreatív', fat_with: 'S priebežným testovaním', fat_without: 'Bez obmeny kreatív',
      fat_sub: 'Keď sa kreatívy neobmieňajú, publikum sa na ne vynadíva a každá konverzia postupne zdražuje. Takto by to vyzeralo pri vašom rozpočte počas 12 týždňov.',
      fat_y_cpa: 'Cena za konverziu', fat_y_idx: 'Cena za konverziu (štart = 100)',
      fat_loss_conv: 'Bez obmeny by ste za 12 týždňov za rovnaké peniaze dostali o ~{n} konverzií menej ({p} %).',
      fat_loss_pct: 'Bez obmeny by ste za 12 týždňov za rovnaké peniaze dostali o ~{p} % menej konverzií.',
      fat_loss_rev: 'To je zhruba <b>{r}</b> stratených tržieb. AI kreatívy na rovnaké obdobie stoja {a}.',
      fat_roas_hint: 'Vyplňte ROAS a uvidíte, koľko tržieb by únava kreatív stála.',
      fat_note: 'Odhad: bez obmeny rastie cena za konverziu o {f} % týždenne od {w}. týždňa, s priebežným testovaním zostáva stabilná.',
      week: 'Týždeň', wk: 'T',
      plan_eyebrow: 'Rytmus testovania', plan_h: 'Plán na mesiac', video: 'video', static: 'statika',
      plan_sub: 'Každý blok je jedna testovacia sada. Nové sady sa spúšťajú priebežne, aby účet nikdy nezostal bez čerstvých kreatív.',
      cta_eyebrow: 'Ďalší krok', cta_h: 'Pripravíme vám ich',
      cta_sub: '{n} kreatív mesačne zvládneme vyrobiť s AI rýchlo a za zlomok ceny klasickej produkcie. Nechajte nám kontakt a ozveme sa s návrhom.',
      f_name: 'Meno', f_company: 'Firma', f_email: 'E-mail', f_send: 'Chcem kreatívy',
      f_sent: 'Vďaka, máme to. Ozveme sa vám s návrhom.', f_err: 'Odoslanie sa nepodarilo. Skontrolujte údaje a skúste to znova.',
      m_cz: 'Česko', m_sk: 'Slovensko', m_pl: 'Poľsko', m_hu: 'Maďarsko', m_de: 'Nemecko', m_at: 'Rakúsko',
      foot: 'Výpočet je orientačný a vychádza z postupov, ktoré používame pri najúspešnejších klientoch. Nezahŕňa katalógové kampane.'
    },
    en: {
      eyebrow_hero: 'Creative calculator for Meta Ads', h1a: 'How many creatives', h1b: 'do you really', h1c: 'need?',
      lead: 'Enter your Meta spend. We calculate how many new ads you need to test each month, how many should be live in the account and what it costs, so performance does not drop from creative fatigue.',
      by: 'by MAIRA', cta_btn: 'I want creatives', loading: 'Loading…',
      calc_eyebrow: 'Calculator', calc_h: 'Run the numbers',
      spend_eyebrow: 'Meta budget', cur_label: 'Currency', mode_month: 'Monthly', mode_day: 'Daily',
      spend_label: 'Monthly spend excluding catalog', spend_label_day: 'Daily spend excluding catalog',
      per_month: '/ mo', per_day: '/ day', u_pcs: 'pcs', u_pcs_m: '/ mo',
      hint_month: '≈ {a} a day', hint_day: '≈ {a} a month',
      market: 'Market', perf_eyebrow: 'Account performance · optional',
      conv: 'Conversions a month', conv_hint: 'Fill in CPA or the number of conversions. The other one is calculated.',
      current: 'New creatives today', liveNow: 'Live ads today',
      big_k: 'New creatives every month', videos: 'videos', statics: 'statics', per_year: 'per year',
      kpi_live: 'Live in account', kpi_live_s: 'recommended at once, tests and winners', kpi_week: 'Every week', kpi_sets: 'Test sets',
      live_now: 'today {n}',
      new_s: '{sets} of {per} creatives each. That is what the account needs so {p}% of budget goes into testing new variants.',
      new_small: 'With this budget we recommend starting with one test set of {per} creatives a month.',
      new_none: 'Enter a budget to see the recommendation.',
      set_forms: ['test set', 'test sets', 'test sets'],
      week_s: 'new creatives, about {n} sets a week', week_s0: 'new creatives', sets_s: 'a month, {b} each', sets_s0: 'a month',
      gap_more: 'You add {c} creatives a month today. This budget needs {n}, that is {d} more.',
      gap_ok: 'With {c} creatives a month you cover the recommended {n}.',
      al_small: 'A full test needs {m} per set. Your set gets {b} ({d} a day), so results will be indicative. The test works fully from {s} a month.',
      al_cap: 'At this budget we stop adding sets. Instead, each of the {n} sets gets more money ({b}) so the test finds a winner faster.',
      al_cpa_pub: 'At a CPA of {c} the budget brings about {m} conversions a month.',
      al_cpa: 'At a CPA of {c} the budget brings about {m} conversions a month. One set collects about {s} conversions during the test, {w} a week.',
      al_cpa_low: ' That is below the ~50 a week at which Meta usually exits the learning phase.',
      al_roas: 'At a ROAS of {r} this spend matches about {t} of monthly revenue from Meta.',
      al_live: 'The account runs {a} ads today, {b} are recommended.',
      cost_eyebrow: 'Production cost', cost_h: 'What it costs', prices_demo: 'Indicative prices',
      cost_sub: 'Monthly production of the recommended creative volume. AI production makes steady testing affordable even for smaller budgets.',
      cost_ai: 'AI production', cost_cl: 'Classic production', of_spend: '{p}% of media budget', of_rev: '{p}% of Meta revenue',
      save: 'AI production saves you <b>{s}</b> a month, {p}% of production costs.',
      fat_eyebrow: 'Creative fatigue', fat_h: 'What happens without new creatives', fat_with: 'With continuous testing', fat_without: 'No creative refresh',
      fat_sub: 'When creatives are not refreshed, the audience tires of them and every conversion gets more expensive. This is what it would mean for your budget over 12 weeks.',
      fat_y_cpa: 'Cost per conversion', fat_y_idx: 'Cost per conversion (start = 100)',
      fat_loss_conv: 'Without a refresh you would get ~{n} fewer conversions ({p}%) for the same money over 12 weeks.',
      fat_loss_pct: 'Without a refresh you would get ~{p}% fewer conversions for the same money over 12 weeks.',
      fat_loss_rev: 'That is about <b>{r}</b> of lost revenue. AI creatives for the same period cost {a}.',
      fat_roas_hint: 'Fill in ROAS to see how much revenue creative fatigue would cost.',
      fat_note: 'Estimate: without a refresh the cost per conversion rises {f}% a week from week {w}; with continuous testing it stays stable.',
      week: 'Week', wk: 'W',
      plan_eyebrow: 'Testing rhythm', plan_h: 'Monthly plan', video: 'video', static: 'static',
      plan_sub: 'Each block is one test set. New sets launch continuously so the account never runs out of fresh creatives.',
      cta_eyebrow: 'Next step', cta_h: 'We will make them for you',
      cta_sub: 'With AI we can produce {n} creatives a month quickly and for a fraction of classic production costs. Leave your contact and we will get back with a proposal.',
      f_name: 'Name', f_company: 'Company', f_email: 'Email', f_send: 'I want creatives',
      f_sent: 'Thanks, got it. We will get back to you with a proposal.', f_err: 'Sending failed. Check the details and try again.',
      m_cz: 'Czechia', m_sk: 'Slovakia', m_pl: 'Poland', m_hu: 'Hungary', m_de: 'Germany', m_at: 'Austria',
      foot: 'The calculation is indicative and based on the approach we use with our top-performing clients. It excludes catalog campaigns.'
    }
  };

  let lang = 'cs', cur = 'CZK', rates = { CZK: 1, EUR: 24.35, USD: 21.36 };
  const setLang = l => { if (I[l]) lang = l; };
  const getLang = () => lang;
  const setCurrency = c => { if (CURRENCIES.includes(c)) cur = c; };
  const getCurrency = () => cur;
  const setRates = r => { if (r) rates = { CZK: 1, EUR: Number(r.EUR) || rates.EUR, USD: Number(r.USD) || rates.USD }; };
  const rate = () => rates[cur] || 1;
  const toCZK = v => v * rate();
  const fromCZK = v => v / rate();

  const num = v => { const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
  const loc = () => lang === 'en' ? 'en-US' : (lang === 'sk' ? 'sk-SK' : 'cs-CZ');
  const fmt = (n, d = 0) => Number(n || 0).toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: 0 });
  // hodnoty ve formulářích se píšou vždy česky (mezera pro tisíce, čárka pro desetiny), aby přepnutí jazyka nerozbilo čísla
  const fmtIn = (n, d = 0) => Number(n || 0).toLocaleString('cs-CZ', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const curSymbol = () => ({ CZK: lang === 'en' ? 'CZK' : 'Kč', EUR: '€', USD: '$' }[cur]);
  // částka v Kč → text ve zvolené měně
  const money = (czk, dMax) => {
    const v = fromCZK(czk), d = dMax !== undefined ? dMax : (Math.abs(v) < 100 && cur !== 'CZK' ? 2 : 0);
    return new Intl.NumberFormat(loc(), { style: 'currency', currency: cur, maximumFractionDigits: d, minimumFractionDigits: 0 }).format(v);
  };
  const kc = money; // zpětná kompatibilita
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

  /* S: spend (Kč/měs.), pct (0–1), daily (min. denní budget sady, Kč), days, vid, stat, win, life,
        cpa (Kč), roas, current, liveNow, useCpa, prices{}, maxSets, fatigue{pct, start} */
  function calc(S) {
    const useCpa = !!S.useCpa && S.cpa > 0;
    const testBudget = S.spend * S.pct;
    const baseSet = S.daily * S.days;
    const cpaSet = S.cpa > 0 ? S.cpa * 50 * S.days / 7 : 0;
    const cpaRaised = useCpa && cpaSet > baseSet;
    const minSet = useCpa ? Math.max(baseSet, cpaSet) : baseSet;
    const maxSets = Math.max(1, Math.round(S.maxSets || 20));
    let sets = minSet > 0 ? Math.floor(testBudget / minSet) : 0, mode = 'normal';
    if (sets === 0 && testBudget > 0) { sets = 1; mode = 'small'; }           // malý rozpočet: aspoň jedna sada
    else if (sets > maxSets) { sets = maxSets; mode = 'capped'; }              // velký rozpočet: víc peněz na sadu
    // velmi malý rozpočet (méně než půlka minima): menší sada se 3 kreativami (2 videa + 1 statika)
    const mini = mode === 'small' && testBudget < minSet * 0.5;
    const vid = mini ? Math.min(S.vid, 2) : S.vid, stat = mini ? Math.min(S.stat, 1) : S.stat, perSet = vid + stat;
    const setBudget = sets > 0 ? testBudget / sets : 0;                         // celý rozpočet na testování se rozdělí
    const setDaily = setBudget / S.days;
    const fullFrom = S.pct > 0 ? minSet / S.pct : 0;                            // od jakého spendu funguje test naplno
    const newAds = sets * perSet, nV = sets * vid, nS = sets * stat;
    const concurrent = sets * S.days / DPM, liveTest = concurrent * perSet, liveWin = sets * S.win * (S.life * 7 / DPM);
    const live = Math.round(liveTest + liveWin), perWeek = newAds / WPM;
    const p = S.prices || {};
    const costAi = nV * (p.aiVideo || 0) + nS * (p.aiStatic || 0);
    const costClassic = nV * (p.classicVideo || 0) + nS * (p.classicStatic || 0);
    const conv = S.cpa > 0 ? S.spend / S.cpa : 0;
    const revenue = S.roas > 0 ? S.spend * S.roas : 0;

    // únava kreativ za 12 týdnů: index ceny za konverzi (100 = dnes)
    const f = (S.fatigue && S.fatigue.pct != null ? S.fatigue.pct : 7) / 100;
    const start = S.fatigue && S.fatigue.start ? S.fatigue.start : 3;
    const withIdx = [], withoutIdx = [];
    for (let i = 0; i <= FAT_WEEKS; i++) { withIdx.push(100); withoutIdx.push(i < start ? 100 : 100 * Math.pow(1 + f, i - start + 1)); }
    const W = S.spend / WPM;
    let convRatioWith = 0, convRatioWithout = 0;
    for (let i = 1; i <= FAT_WEEKS; i++) { convRatioWith += 100 / withIdx[i]; convRatioWithout += 100 / withoutIdx[i]; }
    const lostPct = convRatioWith > 0 ? (1 - convRatioWithout / convRatioWith) * 100 : 0;
    const lostConv = S.cpa > 0 ? W / S.cpa * (convRatioWith - convRatioWithout) : 0;
    const lostRevenue = S.roas > 0 ? W * S.roas * (convRatioWith - convRatioWithout) : 0;
    const aiCost12w = costAi * FAT_WEEKS / WPM;

    return { S, useCpa, vid, stat, mini, perSet, testBudget, baseSet, cpaSet, cpaRaised, minSet, maxSets, mode, fullFrom, setBudget, setDaily, sets, newAds, nV, nS,
      concurrent, liveTest, liveWin, live, perWeek, costAi, costClassic, conv, revenue,
      fatigue: { f, start, withIdx, withoutIdx, lostPct, lostConv, lostRevenue, aiCost12w } };
  }

  const weekSplit = sets => { const b = Math.floor(sets / 4), e = sets % 4; return [0, 1, 2, 3].map(w => b + (w < e ? 1 : 0)); };

  function renderChart(R) {
    const c = $('chart'); if (!c) return;
    const { S } = R, F = R.fatigue, useMoney = S.cpa > 0;
    const w = F.withIdx, wo = F.withoutIdx;
    const W = 960, H = 360, m = { l: 84, r: 20, t: 24, b: 36 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const maxV = Math.max(125, Math.ceil(Math.max(...wo) / 25) * 25), minV = 75;
    const x = i => m.l + i / FAT_WEEKS * iw, y = v => m.t + (1 - (v - minV) / (maxV - minV)) * ih;
    const val = v => useMoney ? money(S.cpa * v / 100) : fmt(v);
    const step = maxV - minV > 150 ? 50 : 25;
    let g = '';
    for (let v = minV; v <= maxV; v += step) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${m.l - 12}" y="${y(v) + 5}" text-anchor="end">${esc(useMoney ? money(S.cpa * v / 100, fromCZK(S.cpa * v / 100) < 10 ? 1 : 0) : fmt(v))}</text>`;
    for (let i = 0; i <= FAT_WEEKS; i += 2) g += `<text x="${x(i)}" y="${H - 10}" text-anchor="middle">${esc(t('wk'))}${i}</text>`;
    const path = a => a.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const area = `${path(wo)} L${x(FAT_WEEKS)} ${y(w[FAT_WEEKS])} ${w.slice().reverse().map((v, j) => 'L' + x(FAT_WEEKS - j).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ')} Z`;
    c.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('fat_h'))}">${g}
      <path d="${area}" fill="var(--orange)" fill-opacity=".16"/>
      <path d="${path(wo)}" fill="none" stroke="var(--neutral-line)" stroke-width="2.5" stroke-dasharray="7 6"/>
      <path d="${path(w)}" fill="none" stroke="var(--orange)" stroke-width="3"/>
      <circle cx="${x(FAT_WEEKS)}" cy="${y(wo[FAT_WEEKS])}" r="5" fill="var(--neutral-line)" stroke="var(--bg)" stroke-width="2"/>
      <circle cx="${x(FAT_WEEKS)}" cy="${y(w[FAT_WEEKS])}" r="5" fill="var(--orange)" stroke="var(--bg)" stroke-width="2"/>
      <text class="lab" x="${x(FAT_WEEKS) - 10}" y="${y(wo[FAT_WEEKS]) - 12}" text-anchor="end">${esc(val(wo[FAT_WEEKS]))}</text>
      <text class="lab" x="${x(FAT_WEEKS) - 10}" y="${y(w[FAT_WEEKS]) - 12}" text-anchor="end">${esc(val(w[FAT_WEEKS]))}</text>
      <line id="xh" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--line-strong)" stroke-width="1" visibility="hidden"/>
      <rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent" id="hit"/>
    </svg><div class="tip" id="tip" hidden></div>`;
    const hit = c.querySelector('#hit'), xh = c.querySelector('#xh'), tip = c.querySelector('#tip'), sv = c.querySelector('svg');
    const move = e => {
      const r = sv.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W;
      const i = Math.max(0, Math.min(FAT_WEEKS, Math.round((px - m.l) / iw * FAT_WEEKS)));
      xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.setAttribute('visibility', 'visible');
      tip.hidden = false;
      tip.style.left = (x(i) / W * r.width) + 'px'; tip.style.top = (y(Math.max(wo[i], w[i])) / H * r.height) + 'px';
      tip.innerHTML = `${esc(t('week'))} ${i}<br><span style="color:var(--orange)">●</span> <b>${esc(val(w[i]))}</b><br><span style="color:#8a9a95">●</span> <b>${esc(val(wo[i]))}</b>`;
    };
    hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { tip.hidden = true; xh.setAttribute('visibility', 'hidden'); });

    // co únava stojí
    const F2 = R.fatigue, parts = [];
    if (S.spend > 0) {
      parts.push(S.cpa > 0 ? t('fat_loss_conv', { n: fmt(F2.lostConv), p: fmt(F2.lostPct) }) : t('fat_loss_pct', { p: fmt(F2.lostPct) }));
      if (S.roas > 0) parts.push(t('fat_loss_rev', { r: esc(money(F2.lostRevenue)), a: esc(money(F2.aiCost12w)) }));
    }
    const out = $('fatOut'); if (out) out.innerHTML = parts.map(p => esc(p).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>')).join(' ');
    const hint = $('fatHint'); if (hint) hint.hidden = S.roas > 0 || !(S.spend > 0);
    const note = $('fatNote'); if (note) note.textContent = t('fat_note', { f: fmt(F2.f * 100, 1), w: F2.start });
  }

  function renderPlan(R) {
    const el = $('weeks'); if (!el) return;
    const per = weekSplit(R.sets);
    const setHtml = '<span class="set">' + '<i class="v"></i>'.repeat(R.vid) + '<i class="s"></i>'.repeat(R.stat) + '</span>';
    el.innerHTML = per.map((n, w) => {
      const shown = Math.min(n, Math.ceil(MAX_TILE_SETS / 4));
      const body = n === 0 ? '<span class="empty">–</span>' : setHtml.repeat(shown) + (n > shown ? `<span class="more">+${n - shown}</span>` : '');
      return `<div class="week"><div class="wh"><span class="wl">${esc(t('week'))} ${w + 1}</span><span class="wc">${fmt(n * R.perSet)}</span></div><div class="sets">${body}</div></div>`;
    }).join('');
  }

  function renderCost(R) {
    if (!$('cAi')) return;
    const { S } = R, ai = R.costAi, cl = R.costClassic;
    $('cAi').textContent = money(ai); $('cCl').textContent = money(cl);
    // podíl nákladů: proti tržbám, když známe ROAS, jinak proti mediálnímu rozpočtu
    const share = v => R.revenue > 0 ? t('of_rev', { p: fmt(v / R.revenue * 100, 1) }) : (S.spend > 0 ? t('of_spend', { p: fmt(v / S.spend * 100, 1) }) : '');
    $('cAiS').textContent = share(ai); $('cClS').textContent = share(cl);
    const mx = Math.max(ai, cl, 1);
    $('bAi').style.width = (ai / mx * 100) + '%'; $('bCl').style.width = (cl / mx * 100) + '%';
    $('cSave').innerHTML = cl > ai ? t('save', { s: esc(money(cl - ai)), p: fmt((cl - ai) / cl * 100) }) : '';
  }

  /* opts.internal: admin (podrobnosti o fázi učení), opts.cpaHint, opts.dailyHint(R) */
  function render(R, opts = {}) {
    const { S } = R;
    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    set('rNew', fmt(R.newAds)); set('rVid', fmt(R.nV)); set('rStat', fmt(R.nS)); set('rYear', fmt(R.newAds * 12));
    set('rNewS', R.sets === 0 ? t('new_none') : (R.mode === 'small' ? t('new_small', { per: R.perSet }) : t('new_s', { sets: fmt(R.sets) + ' ' + pf(R.sets), per: R.perSet, p: fmt(S.pct * 100) })));
    set('rLive', fmt(R.live)); set('rLiveNow', S.liveNow > 0 ? t('live_now', { n: fmt(S.liveNow) }) : '');
    set('rWeek', fmt(Math.round(R.perWeek)));
    set('rWeekS', R.sets > 0 ? t('week_s', { n: fmt(R.sets / WPM, 1) }) : t('week_s0'));
    set('rSets', fmt(R.sets)); set('rSetsS', R.setBudget > 0 ? t('sets_s', { b: money(R.setBudget) }) : t('sets_s0'));
    if (opts.dailyHint) set('dailyHint', S.spend > 0 ? opts.dailyHint(R) : '');

    const gb = $('gapBox');
    if (gb) {
      if (S.current > 0 && R.newAds > 0) {
        const r = R.newAds / S.current; gb.hidden = false;
        if (r > 1.05) { set('gapN', fmt(r, 1) + '×'); set('gapT', t('gap_more', { c: fmt(S.current), n: fmt(R.newAds), d: fmt(R.newAds - S.current) })); }
        else { set('gapN', 'OK'); set('gapT', t('gap_ok', { c: fmt(S.current), n: fmt(R.newAds) })); }
      } else gb.hidden = true;
    }

    const al = [];
    if (R.mode === 'small') al.push(['', t('al_small', { m: money(R.minSet), b: money(R.setBudget), d: money(R.setDaily), s: money(R.fullFrom) })]);
    if (R.mode === 'capped') al.push(['good', t('al_cap', { n: fmt(R.sets), b: money(R.setBudget) })]);
    if (S.liveNow > 0 && R.live > 0 && S.liveNow < R.live * 0.9) al.push(['', t('al_live', { a: fmt(S.liveNow), b: fmt(R.live) })]);
    if (S.cpa > 0 && S.spend > 0) {
      if (opts.internal) {
        const cs = R.setBudget / S.cpa, cw = cs / S.days * 7;
        let tx = t('al_cpa', { c: money(S.cpa), m: fmt(R.conv), s: fmt(cs), w: fmt(cw) });
        if (!R.useCpa && cw < 50) { tx += t('al_cpa_low') + (opts.cpaHint || ''); al.push(['', tx]); } else al.push(['good', tx]);
      } else al.push(['good', t('al_cpa_pub', { c: money(S.cpa), m: fmt(R.conv) })]);
    }
    if (R.revenue > 0) al.push(['good', t('al_roas', { r: fmt(S.roas, 2), t: money(R.revenue) })]);
    const ae = $('alerts'); if (ae) ae.innerHTML = al.map(([c, x]) => `<div class="alert ${c}">${esc(x)}</div>`).join('');

    renderCost(R); renderChart(R); renderPlan(R);
    set('ctaSub', t('cta_sub', { n: fmt(R.newAds) }));
  }

  function tidy(el) { if (el.value.trim() === '') return; el.value = fmtIn(num(el.value), 2); }

  return { I, DPM, WPM, MARKET_KEYS, CURRENCIES, PRESETS, setLang, getLang, setCurrency, getCurrency, setRates, rate, toCZK, fromCZK, curSymbol,
    num, fmt, fmtIn, money, kc, t, pf, esc, applyTexts, marketOptions, calc, render, weekSplit, tidy };
})();
