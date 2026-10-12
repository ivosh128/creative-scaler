/* Creative Scaler – sdílená logika: texty, měny, výpočet a vykreslení výsledků.
   Používá ho veřejná část i admin. Nic interního sem nepatří – soubor je veřejně dostupný.
   Všechny peníze se uvnitř počítají v Kč, měna se řeší jen při čtení vstupů a zobrazení. */
window.CS = (function () {
  const DPM = 30.4, WPM = 4.345, MAX_TILE_SETS = 48, FAT_WEEKS = 12;
  const MARKET_KEYS = ['cz', 'sk', 'pl', 'hu', 'de', 'at'];
  const CURRENCIES = ['CZK', 'EUR', 'USD'];
  // rychlé volby rozpočtu v „kulatých“ částkách dané měny
  const PRESETS = { CZK: [30000, 100000, 300000, 1000000, 3000000], EUR: [1500, 5000, 15000, 50000, 120000], USD: [1500, 5000, 15000, 50000, 120000] };
  // denní rychlé volby (v dané měně za den)
  const PRESETS_DAY = { CZK: [1000, 3000, 10000, 30000, 100000], EUR: [50, 150, 500, 1500, 4000], USD: [50, 150, 500, 1500, 4000] };

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
      new_s: '{sets} po {per} kreativách. Počet roste s rozpočtem: čím víc peněz běží, tím rychleji se reklamy okoukají.',
      new_small: 'Při tomto rozpočtu stačí {n} s {per} kreativami měsíčně.',
      new_none: 'Zadejte rozpočet a hned uvidíte doporučení.',
      set_forms: ['testovací sada', 'testovací sady', 'testovacích sad'],
      week_s: 'nových kreativ, zhruba {n} sady týdně', week_s0: 'nových kreativ', sets_s: 'měsíčně, každá za {b}, tedy ≈ {c} na kreativu', sets_s0: 'měsíčně',
      gap_more: 'Dnes přidáváte {c} kreativ měsíčně. Pro tento rozpočet jich potřebujete {n}, tedy o {d} víc.',
      gap_ok: 'S {c} kreativami měsíčně pokrýváte doporučený objem {n}.',
      al_small: 'Na plnohodnotný test je potřeba {m} na sadu. Vaše sada dostane {b} ({d} denně), takže výsledky budou orientační. Naplno test funguje od {s} měsíčně.',
      al_cap: 'U takového rozpočtu už nepřidáváme další sady. Místo toho dostane každá z {n} sad víc peněz ({b}), aby test rychleji ukázal vítěze.',
      al_cpa_pub: 'Při CPA {c} přinese rozpočet zhruba {m} konverzí měsíčně.',
      al_roas: 'Při ROAS {r} odpovídá tento spend tržbám z Mety kolem {t} měsíčně.',
      al_live: 'V účtu dnes běží {a} reklam, doporučeno je {b}.',
      cost_eyebrow: 'Náklady na výrobu', cost_h: 'Kolik to stojí', prices_demo: 'Orientační ceny',
      cost_sub: 'Měsíční výroba doporučeného objemu kreativ s AI.',
      cost_ai: 'AI produkce', cost_cl: 'Klasická produkce', of_spend: '{p} % mediálního rozpočtu', of_rev: '{p} % tržeb z Mety',
      save: 'S AI produkcí ušetříte <b>{s}</b> měsíčně, tedy {p} % nákladů na výrobu.',
      fat_eyebrow: 'Únava kreativ', fat_h: 'Co se stane bez nových kreativ', fat_with: 'S doporučeným testováním', fat_without: 'Bez obměny kreativ',
      fat_sub: 'Když se kreativy neobměňují dost často, publikum je okouká a každá konverze postupně zdražuje. Ani průběžné testování únavu úplně nezastaví, ale výrazně ji zpomalí. Takhle by to vypadalo u vašeho rozpočtu během 12 týdnů.',
      fat_y_cpa: 'Cena za konverzi', fat_y_idx: 'Cena za konverzi (start = 100)',
      fat_loss_conv: 'Oproti doporučenému testování byste za 12 týdnů za stejné peníze dostali o ~{n} konverzí méně ({p} %).',
      fat_loss_pct: 'Oproti doporučenému testování byste za 12 týdnů za stejné peníze dostali o ~{p} % méně konverzí.',
      fat_loss_rev: 'To je zhruba <b>{r}</b> ušlých tržeb. AI kreativy na stejné období stojí {a}.',
      fat_roas_hint: 'Vyplňte ROAS a uvidíte, kolik tržeb by únava kreativ stála.',
      fat_note: 'Odhad: bez obměny roste cena za konverzi o {f} % týdně od {w}. týdne. Doporučený objem nových kreativ tento růst tlumí zhruba o {e} %.',
      week: 'Týden', wk: 'T',
      plan_eyebrow: 'Rytmus testování', plan_h: 'Plán na měsíc', video: 'video', static: 'statika',
      plan_sub: 'Každý blok je jedna testovací sada. Nové sady se spouští průběžně, aby účet nikdy nezůstal bez čerstvých kreativ.',
      cta_eyebrow: 'Další krok', cta_h: 'Připravíme vám je',
      cta_sub: '{n} kreativ měsíčně vyrobíme s AI rychle a v kvalitě, jakou vidíte v ukázkách. Nechte nám kontakt a ozveme se s návrhem.',
      f_name: 'Jméno', f_company: 'Firma', f_email: 'E-mail', f_send: 'Chci kreativy',
      f_sent: 'Díky, máme to. Ozveme se vám s návrhem.', f_err: 'Odeslání se nepovedlo. Zkontrolujte údaje a zkuste to znovu.',
      m_cz: 'Česko', m_sk: 'Slovensko', m_pl: 'Polsko', m_hu: 'Maďarsko', m_de: 'Německo', m_at: 'Rakousko',
      foot: 'Výpočet je orientační a vychází z postupů, které používáme u nejúspěšnějších klientů. Nezahrnuje katalogové kampaně.',
      new_tiny: 'Při tomto rozpočtu stačí jedna testovací sada s {per} kreativami jednou za 2 měsíce.',
      sit_note: ' Kvůli situaci účtu ({s}) počítáme s {f}× větším objemem.',
      al_tiny: 'Pod {s} měsíčně doporučujeme novou testovací sadu jednou za 2 měsíce, aby měl každý test dost dat na vyhodnocení.',
      al_ind: 'Nad {n} kreativ měsíčně připravujeme individuální nabídku. Rozsah i rytmus výroby probereme spolu.',
      al_minlive: 'I při menším objemu doporučujeme mít v účtu současně aspoň {n} živých reklam, aby měl algoritmus z čeho vybírat.',
      sit_label: 'Situace účtu',
      sit_stable: 'Stabilní provoz',
      sit_growth: 'Růst',
      sit_launch: 'Launch / nový směr',
      sit_hint: 'Růst a launch potřebují víc nových kreativ, protože se hledá, co funguje.',
      spend_hint: 'Bez katalogových kampaní (dynamické reklamy z produktového feedu). U e-shopů do nich často jde většina rozpočtu, kreativy ale potřebují hlavně ostatní kampaně.',
      cost_split: '{v} videí a {s} statik měsíčně',
      fat_current: 'Při dnešním tempu ({n} / měs.)',
      ex_eyebrow: 'Ukázky',
      ex_h: 'Takhle vypadají AI kreativy',
      ex_sub: 'Reklamy, které jsme s AI vyrobili pro klienty MAIRA a které běží v kampaních.',
      ind_badge: 'individuální nabídka',
      plan_tiny: 'Při tomto rozpočtu se nová sada spouští každý druhý měsíc, mezi tím běží vítězové z minulého testu.',
      big_k_tiny: 'Nových kreativ každé 2 měsíce', sets_tiny: 'za 2 měsíce',
      cost_split_tiny: '{v} videí a {s} statik jednou za 2 měsíce, cena rozpočítaná na měsíc',
      al_cpa_conv: 'Při CPA {c} vychází na jednu kreativu během testu jen kolem {n} konv. Nevadí to: měkké metriky (CTR, hook rate, přidání do košíku) poslouží jako první síto a vítěze potvrdíme na konverzích za delší období.', al_under20: 'Pod {s} měsíčně má Meta na testování málo dat. Doporučujeme držet rozpočet v jedné kampani a novou sadu kreativ přidávat jednou za 2 měsíce.', al_cost: 'Výroba vychází na {p} % mediálního rozpočtu. U menších rozpočtů je poměr vyšší. Rozsah výroby umíme přizpůsobit, ozvěte se a navrhneme to.', plan_gap: 'Týdny bez nové sady běží na vítězích z předchozích testů.'
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
      new_s: '{sets} po {per} kreatívach. Počet rastie s rozpočtom: čím viac peňazí beží, tým rýchlejšie sa reklamy okukajú.',
      new_small: 'Pri tomto rozpočte stačí {n} s {per} kreatívami mesačne.',
      new_none: 'Zadajte rozpočet a hneď uvidíte odporúčanie.',
      set_forms: ['testovacia sada', 'testovacie sady', 'testovacích sád'],
      week_s: 'nových kreatív, zhruba {n} sady týždenne', week_s0: 'nových kreatív', sets_s: 'mesačne, každá za {b}, teda ≈ {c} na kreatívu', sets_s0: 'mesačne',
      gap_more: 'Dnes pridávate {c} kreatív mesačne. Pre tento rozpočet ich potrebujete {n}, teda o {d} viac.',
      gap_ok: 'S {c} kreatívami mesačne pokrývate odporúčaný objem {n}.',
      al_small: 'Na plnohodnotný test treba {m} na sadu. Vaša sada dostane {b} ({d} denne), takže výsledky budú orientačné. Naplno test funguje od {s} mesačne.',
      al_cap: 'Pri takom rozpočte už nepridávame ďalšie sady. Namiesto toho dostane každá z {n} sád viac peňazí ({b}), aby test rýchlejšie ukázal víťaza.',
      al_cpa_pub: 'Pri CPA {c} prinesie rozpočet zhruba {m} konverzií mesačne.',
      al_roas: 'Pri ROAS {r} zodpovedá tento spend tržbám z Mety okolo {t} mesačne.',
      al_live: 'V účte dnes beží {a} reklám, odporúčaných je {b}.',
      cost_eyebrow: 'Náklady na výrobu', cost_h: 'Koľko to stojí', prices_demo: 'Orientačné ceny',
      cost_sub: 'Mesačná výroba odporúčaného objemu kreatív s AI.',
      cost_ai: 'AI produkcia', cost_cl: 'Klasická produkcia', of_spend: '{p} % mediálneho rozpočtu', of_rev: '{p} % tržieb z Mety',
      save: 'S AI produkciou ušetríte <b>{s}</b> mesačne, teda {p} % nákladov na výrobu.',
      fat_eyebrow: 'Únava kreatív', fat_h: 'Čo sa stane bez nových kreatív', fat_with: 'S odporúčaným testovaním', fat_without: 'Bez obmeny kreatív',
      fat_sub: 'Keď sa kreatívy neobmieňajú dosť často, publikum sa na ne vynadíva a každá konverzia postupne zdražuje. Ani priebežné testovanie únavu úplne nezastaví, ale výrazne ju spomalí. Takto by to vyzeralo pri vašom rozpočte počas 12 týždňov.',
      fat_y_cpa: 'Cena za konverziu', fat_y_idx: 'Cena za konverziu (štart = 100)',
      fat_loss_conv: 'Oproti odporúčanému testovaniu by ste za 12 týždňov za rovnaké peniaze dostali o ~{n} konverzií menej ({p} %).',
      fat_loss_pct: 'Oproti odporúčanému testovaniu by ste za 12 týždňov za rovnaké peniaze dostali o ~{p} % menej konverzií.',
      fat_loss_rev: 'To je zhruba <b>{r}</b> ušlých tržieb. AI kreatívy na rovnaké obdobie stoja {a}.',
      fat_roas_hint: 'Vyplňte ROAS a uvidíte, koľko tržieb by únava kreatív stála.',
      fat_note: 'Odhad: bez obmeny rastie cena za konverziu o {f} % týždenne od {w}. týždňa. Odporúčaný objem nových kreatív tento rast tlmí zhruba o {e} %.',
      week: 'Týždeň', wk: 'T',
      plan_eyebrow: 'Rytmus testovania', plan_h: 'Plán na mesiac', video: 'video', static: 'statika',
      plan_sub: 'Každý blok je jedna testovacia sada. Nové sady sa spúšťajú priebežne, aby účet nikdy nezostal bez čerstvých kreatív.',
      cta_eyebrow: 'Ďalší krok', cta_h: 'Pripravíme vám ich',
      cta_sub: '{n} kreatív mesačne vyrobíme s AI rýchlo a v kvalite, akú vidíte v ukážkach. Nechajte nám kontakt a ozveme sa s návrhom.',
      f_name: 'Meno', f_company: 'Firma', f_email: 'E-mail', f_send: 'Chcem kreatívy',
      f_sent: 'Vďaka, máme to. Ozveme sa vám s návrhom.', f_err: 'Odoslanie sa nepodarilo. Skontrolujte údaje a skúste to znova.',
      m_cz: 'Česko', m_sk: 'Slovensko', m_pl: 'Poľsko', m_hu: 'Maďarsko', m_de: 'Nemecko', m_at: 'Rakúsko',
      foot: 'Výpočet je orientačný a vychádza z postupov, ktoré používame pri najúspešnejších klientoch. Nezahŕňa katalógové kampane.',
      new_tiny: 'Pri tomto rozpočte stačí jedna testovacia sada s {per} kreatívami raz za 2 mesiace.',
      sit_note: ' Kvôli situácii účtu ({s}) počítame s {f}× väčším objemom.',
      al_tiny: 'Pod {s} mesačne odporúčame novú testovaciu sadu raz za 2 mesiace, aby mal každý test dosť dát na vyhodnotenie.',
      al_ind: 'Nad {n} kreatív mesačne pripravujeme individuálnu ponuku. Rozsah aj rytmus výroby preberieme spolu.',
      al_minlive: 'Aj pri menšom objeme odporúčame mať v účte súčasne aspoň {n} živých reklám, aby mal algoritmus z čoho vyberať.',
      sit_label: 'Situácia účtu',
      sit_stable: 'Stabilná prevádzka',
      sit_growth: 'Rast',
      sit_launch: 'Launch / nový smer',
      sit_hint: 'Rast a launch potrebujú viac nových kreatív, pretože sa hľadá, čo funguje.',
      spend_hint: 'Bez katalógových kampaní (dynamické reklamy z produktového feedu). Pri e-shopoch do nich často ide väčšina rozpočtu, kreatívy však potrebujú hlavne ostatné kampane.',
      cost_split: '{v} videí a {s} statík mesačne',
      fat_current: 'Pri dnešnom tempe ({n} / mes.)',
      ex_eyebrow: 'Ukážky',
      ex_h: 'Takto vyzerajú AI kreatívy',
      ex_sub: 'Reklamy, ktoré sme s AI vyrobili pre klientov MAIRA a ktoré bežia v kampaniach.',
      ind_badge: 'individuálna ponuka',
      plan_tiny: 'Pri tomto rozpočte sa nová sada spúšťa každý druhý mesiac, medzitým bežia víťazi z minulého testu.',
      big_k_tiny: 'Nových kreatív každé 2 mesiace', sets_tiny: 'za 2 mesiace',
      cost_split_tiny: '{v} videí a {s} statík raz za 2 mesiace, cena rozpočítaná na mesiac',
      al_cpa_conv: 'Pri CPA {c} vychádza na jednu kreatívu počas testu len okolo {n} konv. Nevadí to: mäkké metriky (CTR, hook rate, pridanie do košíka) poslúžia ako prvé sito a víťaza potvrdíme na konverziách za dlhšie obdobie.', al_under20: 'Pod 20 tis. Kč mesačne má Meta na testovanie málo dát. Odporúčame držať rozpočet v jednej kampani a nové kreatívy pridávať po jednej sade.', al_cost: 'Výroba vychádza na {p} % mediálneho rozpočtu. Pri menších rozpočtoch je pomer vyšší. Rozsah výroby vieme prispôsobiť, ozvite sa a navrhneme to.', plan_gap: 'Týždne bez novej sady bežia na víťazoch z predchádzajúcich testov.'
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
      new_s: '{sets} of {per} creatives each. The number grows with budget: the more money runs, the faster ads wear out.',
      new_small: 'At this budget {n} of {per} creatives a month is enough.',
      new_none: 'Enter a budget to see the recommendation.',
      set_forms: ['test set', 'test sets', 'test sets'],
      week_s: 'new creatives, about {n} sets a week', week_s0: 'new creatives', sets_s: 'a month, {b} each, about {c} per creative', sets_s0: 'a month',
      gap_more: 'You add {c} creatives a month today. This budget needs {n}, that is {d} more.',
      gap_ok: 'With {c} creatives a month you cover the recommended {n}.',
      al_small: 'A full test needs {m} per set. Your set gets {b} ({d} a day), so results will be indicative. The test works fully from {s} a month.',
      al_cap: 'At this budget we stop adding sets. Instead, each of the {n} sets gets more money ({b}) so the test finds a winner faster.',
      al_cpa_pub: 'At a CPA of {c} the budget brings about {m} conversions a month.',
      al_roas: 'At a ROAS of {r} this spend matches about {t} of monthly revenue from Meta.',
      al_live: 'The account runs {a} ads today, {b} are recommended.',
      cost_eyebrow: 'Production cost', cost_h: 'What it costs', prices_demo: 'Indicative prices',
      cost_sub: 'Monthly AI production of the recommended creative volume.',
      cost_ai: 'AI production', cost_cl: 'Classic production', of_spend: '{p}% of media budget', of_rev: '{p}% of Meta revenue',
      save: 'AI production saves you <b>{s}</b> a month, {p}% of production costs.',
      fat_eyebrow: 'Creative fatigue', fat_h: 'What happens without new creatives', fat_with: 'With recommended testing', fat_without: 'No creative refresh',
      fat_sub: 'When creatives are not refreshed often enough, the audience tires of them and every conversion gets more expensive. Continuous testing does not stop fatigue entirely, but slows it down a lot. This is what it would mean for your budget over 12 weeks.',
      fat_y_cpa: 'Cost per conversion', fat_y_idx: 'Cost per conversion (start = 100)',
      fat_loss_conv: 'Compared with recommended testing you would get ~{n} fewer conversions ({p}%) for the same money over 12 weeks.',
      fat_loss_pct: 'Compared with recommended testing you would get ~{p}% fewer conversions for the same money over 12 weeks.',
      fat_loss_rev: 'That is about <b>{r}</b> of missed revenue. AI creatives for the same period cost {a}.',
      fat_roas_hint: 'Fill in ROAS to see how much revenue creative fatigue would cost.',
      fat_note: 'Estimate: without a refresh the cost per conversion rises {f}% a week from week {w}. The recommended volume of new creatives dampens this by about {e}%.',
      week: 'Week', wk: 'W',
      plan_eyebrow: 'Testing rhythm', plan_h: 'Monthly plan', video: 'video', static: 'static',
      plan_sub: 'Each block is one test set. New sets launch continuously so the account never runs out of fresh creatives.',
      cta_eyebrow: 'Next step', cta_h: 'We will make them for you',
      cta_sub: 'We produce {n} creatives a month with AI, quickly and at the quality you see in the examples. Leave your contact and we will get back with a proposal.',
      f_name: 'Name', f_company: 'Company', f_email: 'Email', f_send: 'I want creatives',
      f_sent: 'Thanks, got it. We will get back to you with a proposal.', f_err: 'Sending failed. Check the details and try again.',
      m_cz: 'Czechia', m_sk: 'Slovakia', m_pl: 'Poland', m_hu: 'Hungary', m_de: 'Germany', m_at: 'Austria',
      foot: 'The calculation is indicative and based on the approach we use with our top-performing clients. It excludes catalog campaigns.',
      new_tiny: 'At this budget one test set of {per} creatives every 2 months is enough.',
      sit_note: ' Given the account situation ({s}) we plan {f}× the volume.',
      al_tiny: 'Below {s} a month we recommend a new test set every 2 months, so each test gathers enough data.',
      al_ind: 'Above {n} creatives a month we prepare a custom offer. We will agree the scope and production rhythm together.',
      al_minlive: 'Even at a lower volume we recommend at least {n} live ads at once, so the algorithm has enough to choose from.',
      sit_label: 'Account situation',
      sit_stable: 'Steady state',
      sit_growth: 'Growth',
      sit_launch: 'Launch / new direction',
      sit_hint: 'Growth and launches need more new creatives while you find what works.',
      spend_hint: 'Excluding catalog campaigns (dynamic ads from a product feed). E-shops often put most of the budget there, but creatives matter mainly for the other campaigns.',
      cost_split: '{v} videos and {s} statics a month',
      fat_current: 'At today\'s pace ({n} / mo)',
      ex_eyebrow: 'Examples',
      ex_h: 'This is what AI creatives look like',
      ex_sub: 'Ads we produced with AI for MAIRA clients, running in live campaigns.',
      ind_badge: 'custom offer',
      plan_tiny: 'At this budget a new set launches every other month; in between, the winners from the last test keep running.',
      big_k_tiny: 'New creatives every 2 months', sets_tiny: 'every 2 months',
      cost_split_tiny: '{v} videos and {s} statics every 2 months, cost spread per month',
      al_cpa_conv: 'At a CPA of {c} each creative collects only about {n} conversions during the test. That is fine: soft metrics (CTR, hook rate, add to cart) work as the first filter and we confirm winners on conversions over a longer period.', al_under20: 'Below {s} a month Meta has little data for testing. We recommend keeping the budget in one campaign and adding a new set of creatives every 2 months.', al_cost: 'Production comes to {p}% of the media budget. With smaller budgets the ratio is higher. We can adjust the production scope; get in touch and we will propose it.', plan_gap: 'Weeks without a new set run on winners from earlier tests.'
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

  // situace účtu: násobí doporučený počet kreativ
  const SITUATIONS = ['stable', 'growth', 'launch'];

  /* Výpočet (verze 0.5, podle návrhu z feedbacku):
     počet nových kreativ se odvozuje přímo z rozpočtu – přímka mezi dvěma kotvami
     (výchozí 100 tis. = 10 kreativ, 1 mil. = 50 kreativ), zaokrouhleno na schůdky (5),
     vynásobeno situací účtu. Pod 100 tis. 1 sada měsíčně, pod 50 tis. 1 sada za 2 měsíce.
     Nad horní kotvou je to individuální nabídka. CPA ani trh počet neovlivňují.

     S: spend (Kč/měs.), pct (0–1), days, vid, stat, win, life, cpa (Kč), roas, current, liveNow,
        sit ('stable'|'growth'|'launch'), mult{growth, launch}, rules{lowSpend, lowN, highSpend, highN, step, smallSpend, tinySpend, minLive},
        prices{}, fatigue{pct, start, eff} */
  function calc(S) {
    const r = Object.assign({ lowSpend: 100000, lowN: 10, highSpend: 1000000, highN: 50, step: 5, smallSpend: 100000, tinySpend: 50000, minLive: 6, under20: 20000, costWarnPct: 35, lowConv: 10 }, S.rules || {});
    const sit = SITUATIONS.includes(S.sit) ? S.sit : 'stable';
    const m = Object.assign({ growth: 1.5, launch: 2 }, S.mult || {});
    const factor = sit === 'stable' ? 1 : (Number(m[sit]) || 1);
    const vid = S.vid, stat = S.stat, perSet = Math.max(1, vid + stat);
    const step = Math.max(1, r.step);
    const testBudget = S.spend * S.pct;

    let mode = 'none', sets = 0, base = 0;
    if (S.spend > 0) {
      if (S.spend < r.tinySpend) { mode = 'tiny'; sets = factor >= 2 ? 1 : 0.5; }            // 1 sada za 2 měsíce
      else if (S.spend < r.smallSpend) { mode = 'small'; sets = Math.max(1, Math.round(factor)); } // 1 sada měsíčně
      else {
        mode = 'normal';
        const slope = (r.highN - r.lowN) / Math.max(1, r.highSpend - r.lowSpend);
        base = r.lowN + (S.spend - r.lowSpend) * slope;
        const need = Math.max(step, Math.round(base * factor / step) * step);
        sets = Math.max(1, Math.ceil(need / perSet));
      }
    }
    const newAds = sets * perSet, nV = sets * vid, nS = sets * stat;
    const individual = mode === 'normal' && newAds > r.highN;                  // nad horní kotvou: individuální nabídka
    const setBudget = sets > 0 ? testBudget / Math.max(1, sets) : 0;
    const setDaily = setBudget / S.days;
    const concurrent = sets * S.days / DPM, liveTest = concurrent * perSet, liveWin = sets * S.win * (S.life * 7 / DPM);
    const liveCalc = liveTest + liveWin;
    const live = S.spend > 0 ? Math.max(r.minLive, Math.round(liveCalc)) : 0;
    const liveRaised = S.spend > 0 && Math.round(liveCalc) < r.minLive;
    const perWeek = newAds / WPM;
    // 30 % na testy určuje jen to, kolik peněz dostane každá kreativa (ne kolik jich bude)
    const perCreative = newAds > 0 ? testBudget / newAds : 0;
    const convPerCreative = S.cpa > 0 && perCreative > 0 ? perCreative / S.cpa : 0;
    const p = S.prices || {};
    const costAi = nV * (p.aiVideo || 0) + nS * (p.aiStatic || 0);
    const costClassic = nV * (p.classicVideo || 0) + nS * (p.classicStatic || 0);
    const conv = S.cpa > 0 ? S.spend / S.cpa : 0;
    const revenue = S.roas > 0 ? S.spend * S.roas : 0;

    // únava kreativ za 12 týdnů: index ceny za konverzi (100 = dnes).
    // Obměna kreativ únavu tlumí jen zčásti (účinnost eff), a jen v poměru k doporučenému objemu.
    const fz = S.fatigue || {};
    const f = (fz.pct != null ? fz.pct : 7) / 100;
    const start = fz.start || 3;
    const eff = Math.min(1, Math.max(0, (fz.eff != null ? fz.eff : 70) / 100));
    const curve = rate => {
      const cover = newAds > 0 ? Math.min(1, rate / newAds) : 0, fe = f * (1 - eff * cover), a = [];
      for (let i = 0; i <= FAT_WEEKS; i++) a.push(i < start ? 100 : 100 * Math.pow(1 + fe, i - start + 1));
      return a;
    };
    const withIdx = curve(newAds), withoutIdx = curve(S.current > 0 ? S.current : 0);
    const W = S.spend / WPM;
    let convRatioWith = 0, convRatioWithout = 0;
    for (let i = 1; i <= FAT_WEEKS; i++) { convRatioWith += 100 / withIdx[i]; convRatioWithout += 100 / withoutIdx[i]; }
    const lostPct = convRatioWith > 0 ? Math.max(0, (1 - convRatioWithout / convRatioWith) * 100) : 0;
    const lostConv = S.cpa > 0 ? Math.max(0, W / S.cpa * (convRatioWith - convRatioWithout)) : 0;
    const lostRevenue = S.roas > 0 ? Math.max(0, W * S.roas * (convRatioWith - convRatioWithout)) : 0;
    const aiCost12w = costAi * FAT_WEEKS / WPM;

    const costShare = S.spend > 0 ? costAi / S.spend : 0;
    return { S, rules: r, sit, factor, base, vid, stat, perSet, testBudget, perCreative, convPerCreative, costShare, mode, individual, setBudget, setDaily, sets, newAds, nV, nS,
      concurrent, liveTest, liveWin, liveCalc, live, liveRaised, perWeek, costAi, costClassic, conv, revenue,
      fatigue: { f, start, eff, withIdx, withoutIdx, lostPct, lostConv, lostRevenue, aiCost12w, hasCurrent: S.current > 0 } };
  }

  // rozložení sad do 4 týdnů; půl sady měsíčně = jedna sada v 1. týdnu, každý druhý měsíc
  const weekSplit = sets => { const n = Math.ceil(sets), b = Math.floor(n / 4), e = n % 4; return [0, 1, 2, 3].map(w => b + (w < e ? 1 : 0)); };

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
    const note = $('fatNote'); if (note) note.textContent = t('fat_note', { f: fmt(F2.f * 100, 1), w: F2.start, e: fmt(F2.eff * 100) });
    const lw = $('legWithout'); if (lw) lw.textContent = F2.hasCurrent ? t('fat_current', { n: fmt(S.current) }) : t('fat_without');
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
    const pn = $('planNote'); if (pn) { const gap = R.mode !== 'tiny' && per.some(n => n === 0); pn.hidden = R.mode !== 'tiny' && !gap; pn.textContent = R.mode === 'tiny' ? t('plan_tiny') : (gap ? t('plan_gap') : ''); }
  }

  function renderCost(R) {
    if (!$('cAi')) return;
    const { S } = R, ai = R.costAi, cl = R.costClassic;
    // podíl nákladů: proti tržbám, když známe ROAS, jinak proti mediálnímu rozpočtu
    const share = v => R.revenue > 0 ? t('of_rev', { p: fmt(v / R.revenue * 100, 1) }) : (S.spend > 0 ? t('of_spend', { p: fmt(v / S.spend * 100, 1) }) : '');
    $('cAi').textContent = money(ai); $('cAiS').textContent = share(ai);
    const split = $('cSplit'); if (split) split.textContent = R.newAds <= 0 ? '' : (R.sets < 1 ? t('cost_split_tiny', { v: fmt(R.vid), s: fmt(R.stat) }) : t('cost_split', { v: fmt(R.nV), s: fmt(R.nS) }));
    // srovnání s klasickou produkcí jen tam, kde na stránce je (admin)
    if ($('cCl')) {
      $('cCl').textContent = money(cl); $('cClS').textContent = share(cl);
      const mx = Math.max(ai, cl, 1);
      $('bAi').style.width = (ai / mx * 100) + '%'; $('bCl').style.width = (cl / mx * 100) + '%';
      $('cSave').innerHTML = cl > ai ? t('save', { s: esc(money(cl - ai)), p: fmt((cl - ai) / cl * 100) }) : '';
    }
  }

  /* opts.internal: admin (podrobnosti o fázi učení), opts.cpaHint, opts.dailyHint(R) */
  function render(R, opts = {}) {
    const { S } = R;
    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    // malý rozpočet: ukazujeme jednu sadu za 2 měsíce, ne „2,5 kreativy měsíčně“
    const tiny = R.mode === 'tiny' && R.sets < 1;
    set('bigK', t(tiny ? 'big_k_tiny' : 'big_k'));
    set('rNew', fmt(tiny ? R.perSet : R.newAds) + (R.individual ? '+' : ''));
    set('rVid', fmt(tiny ? R.vid : R.nV)); set('rStat', fmt(tiny ? R.stat : R.nS)); set('rYear', fmt(R.newAds * 12));
    const ib = $('rInd'); if (ib) ib.hidden = !R.individual;
    const sitNote = R.sit !== 'stable' && R.mode !== 'tiny' ? t('sit_note', { s: t('sit_' + R.sit).toLowerCase(), f: fmt(R.factor, 1) }) : '';
    set('rNewS', R.mode === 'none' ? t('new_none')
      : R.mode === 'tiny' ? t('new_tiny', { per: R.perSet })
      : R.mode === 'small' ? t('new_small', { n: fmt(R.sets) + ' ' + pf(R.sets), per: R.perSet }) + sitNote
      : t('new_s', { sets: fmt(R.sets) + ' ' + pf(R.sets), per: R.perSet }) + sitNote);
    set('rLive', fmt(R.live)); set('rLiveNow', S.liveNow > 0 ? t('live_now', { n: fmt(S.liveNow) }) : '');
    set('rWeek', tiny ? '–' : fmt(R.perWeek, R.perWeek < 3 ? 1 : 0));
    set('rWeekS', R.sets >= 1 ? t('week_s', { n: fmt(R.sets / WPM, 1) }) : t('week_s0'));
    set('rSets', tiny ? '1' : fmt(R.sets)); if (tiny) set('rSetsS', t('sets_tiny')); else set('rSetsS', R.setBudget > 0 ? t('sets_s', { b: money(R.setBudget), c: money(R.perCreative) }) : t('sets_s0'));
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
    const under20 = S.spend > 0 && S.spend < R.rules.under20;
    if (R.mode === 'tiny' && !under20) al.push(['', t('al_tiny', { s: money(R.rules.tinySpend) })]);
    if (R.individual) al.push(['good', t('al_ind', { n: fmt(R.rules.highN) })]);
    if (R.liveRaised) al.push(['', t('al_minlive', { n: fmt(R.rules.minLive) })]);
    if (S.liveNow > 0 && R.live > 0 && S.liveNow < R.live * 0.9) al.push(['', t('al_live', { a: fmt(S.liveNow), b: fmt(R.live) })]);
    if (under20) al.push(['', t('al_under20', { s: money(R.rules.under20) })]);
    if (R.costShare * 100 > R.rules.costWarnPct) al.push(['', t('al_cost', { p: fmt(R.costShare * 100) })]);
    if (S.cpa > 0 && S.spend > 0) {
      al.push(['good', t('al_cpa_pub', { c: money(S.cpa), m: fmt(R.conv) })]);
      if (R.convPerCreative > 0 && R.convPerCreative < R.rules.lowConv) al.push(['', t('al_cpa_conv', { c: money(S.cpa), n: fmt(R.convPerCreative, R.convPerCreative < 3 ? 1 : 0) })]);
    }
    if (R.revenue > 0) al.push(['good', t('al_roas', { r: fmt(S.roas, 2), t: money(R.revenue) })]);
    const ae = $('alerts'); if (ae) ae.innerHTML = al.map(([c, x]) => `<div class="alert ${c}">${esc(x)}</div>`).join('');

    renderCost(R); renderChart(R); renderPlan(R);
    set('ctaSub', t('cta_sub', { n: fmt(R.newAds) + (R.individual ? '+' : '') }));
  }

  // ukázky AI kreativ (spravují se v adminu); prázdný seznam = sekce se skryje
  function renderExamples(list, boxId = 'examples', sectionId = 'exSection') {
    const box = $(boxId), sec = $(sectionId); if (!box) return;
    const items = (list || []).filter(x => x && x.src);
    if (sec) sec.hidden = !items.length;
    const isVideo = x => x.kind === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(x.src);
    box.innerHTML = items.map(x => {
      const media = isVideo(x)
        ? `<video src="${esc(x.src)}" ${x.poster ? `poster="${esc(x.poster)}"` : ''} muted loop playsinline controls preload="metadata"></video>`
        : `<img src="${esc(x.src)}" alt="${esc(x.title || '')}" loading="lazy">`;
      const fmtCls = x.ratio === '9:16' ? 'r916' : (x.ratio === '16:9' ? 'r169' : (x.ratio === '4:5' ? 'r45' : 'r11'));
      return `<figure class="ex ${fmtCls}"><div class="media">${media}</div><figcaption>${x.title ? `<b>${esc(x.title)}</b>` : ''}${x.client ? `<span>${esc(x.client)}</span>` : ''}${x.result ? `<span class="res">${esc(x.result)}</span>` : ''}</figcaption></figure>`;
    }).join('');
  }

  function tidy(el) { if (el.value.trim() === '') return; el.value = fmtIn(num(el.value), 2); }

  return { I, DPM, WPM, MARKET_KEYS, CURRENCIES, PRESETS, PRESETS_DAY, setLang, getLang, setCurrency, getCurrency, setRates, rate, toCZK, fromCZK, curSymbol,
    num, fmt, fmtIn, money, kc, t, pf, esc, applyTexts, marketOptions, calc, render, renderExamples, weekSplit, tidy, SITUATIONS };
})();
