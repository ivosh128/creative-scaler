// Jednoduché úložiště v JSON souborech. Na Railway patří DATA_DIR na připojený volume (/data),
// jinak se data při každém nasazení smažou.
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const DEFAULT_CONFIG = {
  testPct: 30,
  testDays: 6,
  videosPerSet: 3,
  staticsPerSet: 2,
  winnersPerSet: 1,
  winnerLifeWeeks: 4,
  maxSetsPerMonth: 20, // starý výpočet (do v0.4), dnes se nepoužívá
  fatigueWeeklyPct: 7,
  fatigueStartWeek: 3,
  refreshEffPct: 70,   // o kolik % doporučená obměna kreativ tlumí únavu
  // počet nových kreativ podle rozpočtu: přímka mezi dvěma kotvami, zaokrouhleno na schůdky
  rules: { lowSpend: 100000, lowN: 10, highSpend: 1000000, highN: 50, step: 5, smallSpend: 100000, tinySpend: 50000, minLive: 6, under20: 20000, costWarnPct: 35, lowConv: 10 },
  situations: { growth: 1.5, launch: 2 },
  // ukázky AI kreativ ve veřejné části: { title, client, result, src, poster, kind: 'video'|'image', ratio: '1:1'|'9:16'|'4:5'|'16:9' }
  examples: [],
  rates: { EUR: 24.35, USD: 21.36 },
  markets: {
    cz: { daily: 5000, verified: true },
    sk: { daily: 3500, verified: false },
    pl: { daily: 4000, verified: false },
    hu: { daily: 3500, verified: false },
    de: { daily: 9000, verified: false },
    at: { daily: 8000, verified: false }
  },
  prices: { aiVideo: 3500, classicVideo: 18000, aiStatic: 900, classicStatic: 3500 },
  pricesAreDemo: true,
  updatedAt: null
};

function file(name) { return path.join(DATA_DIR, name); }

function readJson(name, fallback) {
  try { return JSON.parse(fs.readFileSync(file(name), 'utf8')); }
  catch (e) { return fallback; }
}

function writeJson(name, data) {
  const tmp = file(name + '.tmp');
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file(name));
}

function getConfig() {
  const saved = readJson('config.json', {});
  return {
    ...DEFAULT_CONFIG,
    ...saved,
    markets: { ...DEFAULT_CONFIG.markets, ...(saved.markets || {}) },
    prices: { ...DEFAULT_CONFIG.prices, ...(saved.prices || {}) },
    rates: { ...DEFAULT_CONFIG.rates, ...(saved.rates || {}) },
    rules: { ...DEFAULT_CONFIG.rules, ...(saved.rules || {}) },
    situations: { ...DEFAULT_CONFIG.situations, ...(saved.situations || {}) },
    examples: Array.isArray(saved.examples) ? saved.examples : []
  };
}

function saveConfig(cfg) {
  const out = { ...cfg, updatedAt: new Date().toISOString() };
  writeJson('config.json', out);
  return out;
}

function getLeads() { return readJson('leads.json', []); }
function saveLeads(list) { writeJson('leads.json', list); }

const MEDIA_DIR = path.join(DATA_DIR, 'media');
fs.mkdirSync(MEDIA_DIR, { recursive: true });

module.exports = { DATA_DIR, MEDIA_DIR, DEFAULT_CONFIG, getConfig, saveConfig, getLeads, saveLeads };
