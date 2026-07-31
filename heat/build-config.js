#!/usr/bin/env node
/* .env  ->  config.js
 *
 * Run after changing .env:   node heat/build-config.js
 *
 * ⛔ REFUSES rather than emitting a partial config. An empty or missing value would
 * produce a config.js that LOADS FINE and points the pages at nothing, and "pointed at
 * nothing" looks identical to "working" until a customer can't claim their key. So a
 * missing var is an exit 2 with the name of the var, never a silent default.
 *
 * ⚠️ Only PUBLIC values belong here — this file's output is served to every browser.
 * Anything with SERVICE_ROLE or SECRET in the name is refused outright, because the
 * failure mode of leaking one is not recoverable by editing a file afterwards.
 */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const ENV = path.join(DIR, '.env');
const OUT = path.join(DIR, 'config.js');
const PUBLIC_VARS = ['SUPABASE_URL', 'SHARE_URL'];
const FORBIDDEN = /SERVICE_ROLE|SECRET|PASSWORD|PRIVATE/i;

if (!fs.existsSync(ENV)) {
  console.error(`NOT-BUILT: no .env at ${ENV}`);
  console.error('           copy .env.sample to .env and fill it in. config.js left untouched.');
  process.exit(2);
}

const env = {};
for (const raw of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const i = line.indexOf('=');
  if (i < 0) continue;
  env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const missing = PUBLIC_VARS.filter(k => !env[k]);
if (missing.length) {
  console.error(`NOT-BUILT: missing or empty in .env — ${missing.join(', ')}`);
  console.error('           config.js left untouched rather than written half-right.');
  process.exit(2);
}

const leaking = Object.keys(env).filter(k => FORBIDDEN.test(k) && PUBLIC_VARS.includes(k));
if (leaking.length) {
  console.error(`REFUSED: ${leaking.join(', ')} would be served to every browser.`);
  process.exit(2);
}

const body = PUBLIC_VARS.map(k => `  ${k}: ${JSON.stringify(env[k])},`).join('\n');
fs.writeFileSync(OUT, `/* GENERATED — do not hand-edit. Run \`node heat/build-config.js\` after changing .env.
 *
 * This exists so the Supabase URL lives in ONE place instead of being hardcoded inline
 * in assess.html and success.html. It is committed on purpose: a static site serves its
 * config to the browser no matter what, so the .env buys you a single source of truth,
 * NOT secrecy. Anything that must stay secret does not belong in this file or any file
 * this repo serves — it belongs in the edge function's own environment.
 */
window.HEAT_CONFIG = {
${body}
};
`);
console.log(`BUILT: ${OUT}`);
for (const k of PUBLIC_VARS) console.log(`  ${k} = ${env[k]}`);
