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
    prices: { ...DEFAULT_CONFIG.prices, ...(saved.prices || {}) }
  };
}

function saveConfig(cfg) {
  const out = { ...cfg, updatedAt: new Date().toISOString() };
  writeJson('config.json', out);
  return out;
}

function getLeads() { return readJson('leads.json', []); }
function saveLeads(list) { writeJson('leads.json', list); }

module.exports = { DATA_DIR, DEFAULT_CONFIG, getConfig, saveConfig, getLeads, saveLeads };
