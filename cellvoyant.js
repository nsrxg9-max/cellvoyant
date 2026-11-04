/* Cellvoyant prototype — all market data below is simulated for fictional operators. */
(() => {
'use strict';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
const EDITION = (document.getElementById('cvEdition') || { dataset: {} }).dataset.edition || '';
// a tool target exists on this page (a section id or a console tab)
const hasTarget = t => t.startsWith('#') ? !!document.getElementById(t.slice(1)) : t.startsWith('tab-') ? !!document.getElementById(t) : true;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry(20260924);
const pick = a => a[Math.floor(rand() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtInt = n => Math.round(n).toLocaleString('en-US');
const fmtMoney = v => { const s = v < 0 ? '−' : ''; v = Math.abs(v); if (v >= 1e9) return s + '$' + (v / 1e9).toFixed(2) + 'B'; if (v >= 1e6) return s + '$' + (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return s + '$' + Math.round(v / 1e3) + 'k'; return s + '$' + Math.round(v); };
const pad = n => String(n).padStart(2, '0');
const logit = p => Math.log(p / (1 - p));
const sigmoid = x => 1 / (1 + Math.exp(-x));

/* ---------- simulated world ---------- */
const OPS = {
  nim: { name: 'Nimbus Mobile', short: 'Nimbus', kind: 'MNO · you' },
  vtx: { name: 'Vertex Telecom', short: 'Vertex', kind: 'MNO' },
  arc: { name: 'Arcline Wireless', short: 'Arcline', kind: 'MNO' },
  pls: { name: 'Pulsar Cable Mobile', short: 'Pulsar', kind: 'Cable MVNO' },
  sky: { name: 'Skyreach', short: 'Skyreach', kind: 'Satellite direct-to-device' },
  kte: { name: 'Kite', short: 'Kite', kind: 'Digital MVNO' },
  all: { name: 'Market-wide', short: 'Market', kind: 'Regulator' }
};
const opColor = id => id === 'all' ? 'var(--muted)' : `var(--op-${id})`;
const SCREEN_OP = { vtx: '#9690FF', arc: '#FF80A7', pls: '#E2B84C', sky: '#72B2FF', kte: '#A9D45C', nim: '#3CCFD9' };
const DISTRICTS = ['North district', 'East district', 'Harbor district', 'Old Town', 'Riverside', 'University Heights'];
const SEVL = { crit: 'Critical', high: 'High', watch: 'Watch' };

const TPL = [
  { cls: 'Port-outs', op: 'arc', sev: 'crit', src: 'Port-out analytics (your data)', conf: .96, hl: 24, risk: 1.9e6,
    text: 'Port-outs to Arcline up 38% week-over-week in {d}',
    next: 'Wave spreads to neighboring districts in 5–7 days · 66% (Churn Contagion model)',
    evidence: [['Port-out records: 1,240 vs 898 last week', 'Port-out analytics (your data)', .96], ['Arcline premium price cut detected 6 days ago', 'Tariff crawler', .97], ['Switch-intent searches for "Arcline eSIM" up 2.4×', 'eSIM switch-intent index', .72]],
    plays: [['Contain the wave', 'Retention credits to at-risk lines in {d} and 2 neighboring districts', 'avoids ~60% of extra port-outs', 'Credit cost'], ['Save desk', 'Route port-out calls to a specialist save team', '+12% save rate (est.)', 'Staff time'], ['Open the War room', 'Simulate responses to the Arcline cut before committing', 'decision in hours, not weeks', '—']] },
  { cls: 'Pricing', op: 'arc', sev: 'crit', src: 'Tariff crawler', conf: .97, hl: 36, risk: 2.4e6,
    text: 'Arcline cut Unlimited Premium to $60/mo (−$10) for new lines and port-ins',
    next: 'Extension to family plans within 2–3 weeks · 61%',
    evidence: [['Pricing page changed in 3 regions', 'Tariff crawler', .97], ['Lower-price A/B variant shown to 8% of visitors for 9 days', 'Web change monitor', .88], ['Retail staff trained on a "switch & save" script', 'Frontline reports', .71]],
    plays: [['Targeted retention credit', '$10/mo for 6 months to ~30k high-risk lines only', 'avoids ~62% of extra port-outs', 'Low dilution; needs a churn model'], ['Hold price, add perk', 'Bundle a streaming tier into Unlimited Plus', 'avoids ~55%', 'Brand-positive; perk cost'], ['Full match', 'Reprice the premium tier for everyone', 'avoids ~85%', 'Highest ARPU dilution']] },
  { cls: 'Social', op: 'arc', sev: 'crit', src: 'Social listening', conf: .78, hl: 6, risk: 9e5,
    text: 'Arcline outage complaints up 5.2× in 2 hours ({d})',
    next: 'Churn-intent searches peak in 24–48 h · 70%',
    evidence: [['Complaint volume 5.2× the 30-day baseline', 'Social listening', .78], ['Crowd tests: failed connections up in {d}', 'Crowd speed tests', .83], ['Arcline status page shows "degraded"', 'Web change monitor', .9]],
    plays: [['Make switching easy', 'Promote 4-minute eSIM switching in {d}, without mentioning the outage', '~600 extra port-ins (est.)', 'Keep it tasteful; no disparagement'], ['Staff up the port-in desk', 'Add chat and store capacity for 48 h', 'faster conversion', 'Staff cost'], ['Check your own network', 'Confirm the fault is not shared (common vendor or transport)', 'risk avoided', '—']] },
  { cls: 'Hiring', op: 'vtx', sev: 'high', src: 'Job postings', conf: .9, hl: 240, risk: 3.1e6,
    text: 'Vertex posted 42 fixed-wireless installer roles across 3 cities',
    next: 'Fixed-wireless (FWA) home internet launch in 3 metros within 45–90 days · see Move predictor',
    evidence: [['42 postings for "5G Home installer" in 3 cities', 'Job postings', .9], ['Equipment authorization filed for new outdoor 5G CPE', 'Equipment authorizations', .95], ['App v8.4 strings reference "HomeLink 5G"', 'App release diff', .7]],
    plays: [['Pre-empt with a bundle', 'Mobile + home internet discount in the overlap metros', 'protects ~6k households (est.)', 'Needs FWA or fiber capacity'], ['Price-lock the base', '12-month price guarantee for broadband customers', '−20% churn in overlap (est.)', 'Revenue forgone on price rises'], ['Capacity check', 'Plan sector upgrades in the 2 overlap clusters', 'launch-proof network', 'Capex timing']] },
  { cls: 'Stealth pricing', op: 'vtx', sev: 'high', src: 'Tariff DNA diff', conf: .93, hl: 72, risk: 8e5,
    text: 'Vertex added a $4 "network access fee" to Legacy Plus; headline price unchanged',
    next: 'Complaint spike and win-back window over the next 10 days · 57%',
    evidence: [['Terms PDF revision 14 → 15', 'Tariff DNA diff', .95], ['Billing FAQ updated the same day', 'Web change monitor', .9], ['"Hidden fee" mentions 2.1× baseline', 'Social listening', .64]],
    plays: [['"No hidden fees" comparison ads', 'Geo-target districts with many Vertex legacy customers', '+0.4 pt port-in share (est.)', 'Must stay factual and substantiated'], ['Arm retail with DNA cards', 'Side-by-side effective-price sheets in stores', '+9% store conversion (est.)', 'Training time'], ['Port-in bounty', '$100 credit for Vertex Legacy port-ins', '~1.8k port-ins a month (est.)', 'Acquisition cost']] },
  { cls: 'Devices', op: 'arc', sev: 'high', src: 'Promo tracker', conf: .95, hl: 48, risk: 1.7e6,
    text: 'Arcline launched an $800 trade-in on flagship phones, any condition',
    next: 'Runs to the end of launch season · 80%; Vertex matches · 45%',
    evidence: [['Offer page and T&Cs captured', 'Promo tracker', .95], ['In-store signage reported in 11 stores', 'Frontline reports', .74]],
    plays: [['Match for port-ins only', '$800 trade-in limited to port-in lines', 'avoids ~50% of switch-for-device', 'Device cost'], ['Early upgrade for at-risk base', 'Let high-value at-risk customers upgrade early', 'retains high-value lines', 'Subsidy cost'], ['Sell total cost', '36-month total-cost comparison in retail', 'higher conversion', 'Harder message']] },
  { cls: 'Pricing', op: 'kte', sev: 'high', src: 'Tariff crawler + app store', conf: .95, hl: 96, risk: 1.1e6,
    text: 'Kite launched a $25 eSIM-only unlimited plan with 4-minute in-app sign-up',
    next: 'Youth and second-line segments shift · 55%; Arcline flanker-brand response · 30%',
    evidence: [['New plan page captured', 'Tariff crawler', .95], ['App rank #3 in Utilities, up from #41', 'App store monitor', .85]],
    plays: [['Flanker brand', 'Test your own digital eSIM brand for price-seekers', 'shields the main brand', 'Cannibalization'], ['Second-line offer', '$20 add-a-line for eSIM devices', 'defends multi-line accounts', 'ARPU dilution'], ['Hold for the premium base', 'Kite skews to low-ARPU segments; monitor youth churn', 'no dilution', 'Youth churn risk']] },
  { cls: 'Enterprise', op: 'vtx', sev: 'high', src: 'Public tender feed', conf: .99, hl: 720, risk: 1.2e6,
    text: 'Vertex won the port authority private-5G tender (5-year contract)',
    next: 'Vertex bids on 2 more logistics hubs this quarter · 58%',
    evidence: [['Award notice published', 'Public tender feed', .99], ['Vertex hiring "industrial 5G solution architects"', 'Job postings', .8]],
    plays: [['Chase the next 2 hubs early', 'Assemble a private-5G + edge proposal now', '$3.2M pipeline (est.)', 'Presales capacity'], ['Partner play', 'Team with a systems integrator for logistics', 'higher win rate', 'Margin share'], ['Reference build', 'Offer a discounted pilot to one hub', 'proof point', 'Pilot cost']] },
  { cls: 'Network', op: 'pls', sev: 'watch', src: 'Crowd speed tests', conf: .82, hl: 168, risk: 6e5,
    text: 'Pulsar median 5G download +18% in {d} after new carriers went live',
    next: 'Network-quality ad campaign in {d} within 4 weeks · 52%',
    evidence: [['12.4k tests: median 212 → 250 Mbps', 'Crowd speed tests', .82], ['Site permit filings in the same district', 'Regulatory feed', .8]],
    plays: [['Show your edge', 'Publish independent measurement results for {d}', 'neutralizes the claim', 'Only if you still lead'], ['Targeted upgrade', 'Pull forward a carrier add in 3 sectors', '+22% capacity (est.)', 'Capex'], ['Watch port-outs', 'Track port-outs to Pulsar in {d}', 'early warning', '—']] },
  { cls: 'Regulatory', op: 'all', sev: 'watch', src: 'Regulatory feed', conf: 1, hl: 480, risk: 0,
    text: 'Regulator opened a consultation on 3.8–4.2 GHz shared-spectrum rules; responses due in 45 days',
    next: 'Vertex and Arcline file joint comments · 40%',
    evidence: [['Consultation document published', 'Regulatory feed', 1]],
    plays: [['File a response', 'Model what the band is worth to your network capacity', 'shapes the rules', 'Legal time'], ['Build a coalition', 'Align with enterprise users on shared access', 'stronger voice', '—'], ['Run the Spectrum Oracle', 'Simulate the outcomes for each rule option', 'clear position', '—']] },
  { cls: 'Satellite', op: 'sky', sev: 'watch', src: 'Launch & filings monitor', conf: .9, hl: 336, risk: 9e5,
    text: 'Skyreach expanded its direct-to-phone texting beta to 2 new regions, free for 90 days',
    next: 'Paid tier bundled with a cable MVNO in H1 · see Move predictor',
    evidence: [['Beta region list updated', 'Web change monitor', .9], ['Launch manifest: 24 satellites next month', 'Launch & filings monitor', .85]],
    plays: [['Evaluate a partnership', 'Open talks on satellite texting for premium plans', 'closes the feature gap', 'Wholesale cost'], ['Stress terrestrial reliability', 'Rural coverage proof points', 'defends rural base', '—'], ['Track uptake', 'Add Skyreach to the switch-intent index', 'early warning', '—']] },
  { cls: 'Retail', op: 'pls', sev: 'high', src: 'Retail pulse', conf: .8, hl: 120, risk: 7e5,
    text: 'Pulsar opened 6 pop-up kiosks near your top-churn postcodes',
    next: 'Mobile + broadband bundle push in those postcodes for 6 weeks · 66%',
    evidence: [['6 new kiosk locations from mall listings', 'Retail pulse', .8], ['Pulsar broadband share in those postcodes: 38%', 'Knowledge graph', .9]],
    plays: [['Counter-kiosk', 'Staff pop-ups at 3 of the 6 malls', 'defends walk-ins', 'Rent and staff'], ['Bundle offer', 'Your own home-internet bundle where you have fiber', 'reduces bundle pull', 'Coverage-limited'], ['Retention outreach', 'Contact at-risk lines in those postcodes', '−15% churn (est.)', 'Contact cost']] }
];

/* ---------- sim clock ---------- */
const SIM0 = Math.floor(Date.now() / 60000) * 60000; // simulated market time starts at the viewer's current time
let simMin = 0;
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const simDate = (m = simMin) => new Date(SIM0 + m * 60000);
const fmtClock = () => { const d = simDate(); return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtHM = t => { const d = simDate(t), n = simDate(); const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`; return d.toDateString() === n.toDateString() ? hm : `${DOW[d.getDay()]} ${hm}`; };
const fmtAgo = t => { const a = simMin - t; if (a < 60) return Math.max(1, Math.round(a)) + ' min ago'; if (a < 1440) return Math.round(a / 60) + ' h ago'; return Math.round(a / 1440) + ' d ago'; };
const fmtHL = h => h < 48 ? h + 'h' : Math.round(h / 24) + 'd';

/* ---------- events ---------- */
let nextId = 1031;
const events = [];
function mkEvent(i, t, dist) {
  const T = TPL[i]; const d = dist || pick(DISTRICTS); const sub = s => String(s).replace(/\{d\}/g, d);
  return { id: 'S-' + (nextId++), tpl: T, i, t, dist: d, text: sub(T.text), next: sub(T.next), evidence: T.evidence.map(e => [sub(e[0]), e[1], e[2]]), plays: T.plays.map(p => p.map(sub)) };
}
const fresh = e => Math.pow(2, -((simMin - e.t) / 60) / e.tpl.hl);
const SEVW = { crit: 1.6, high: 1, watch: .7 };
const score = e => (e.tpl.risk || 3e5) * e.tpl.conf * fresh(e) * SEVW[e.tpl.sev];
[[0, -18, 'East district'], [1, -140], [2, -55, 'Harbor district'], [3, -600], [4, -900], [5, -320], [6, -1300], [7, -2000], [8, -2600, 'Harbor district'], [9, -3100]]
  .forEach(([i, t, d]) => events.push(mkEvent(i, t, d)));
let selId = events[0].id;
let netPorts = -1240;

/* ---------- AI (Claude via the artifact runtime) ---------- */
let sample = null;
const DISABLE = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed']);
function setAI(state) {
  const txt = { on: 'AI: Claude connected', off: 'AI: built-in assistant', wait: 'AI: connecting…' }[state];
  const cls = state === 'on' ? 'pill ai-on' : 'pill ai-off';
  const p1 = $('#aiPill'), p2 = $('#aiPill2');
  if (p1) { p1.className = cls; p1.textContent = txt; }
  if (p2) { p2.className = cls; p2.textContent = state === 'on' ? (toolsMax ? 'Claude · tools on' : 'Claude') : state === 'off' ? 'Built-in assistant' : 'connecting…'; }
}
setAI('wait');
const aiReady = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('sample').catch(() => null) : Promise.resolve(null);
aiReady.then(s => { sample = s || null; setAI(sample ? 'on' : 'off'); });
function aiFail(err) {
  const code = (err && err.code) || 'upstream_error';
  if (DISABLE.has(code)) { sample = null; setAI('off'); return 'Claude isn’t available in this view, so the built-in assistant answered.'; }
  if (code === 'rate_limited') return 'Claude is rate-limited right now. Try again in a minute.';
  if (code === 'session_expired') return 'Your Claude session expired. Sign in again to use AI answers.';
  if (code === 'refused') return 'Claude declined this request. Try rephrasing it.';
  return 'Claude could not answer this time (' + code + ').';
}
function mdLite(text) {
  const lines = String(text).split('\n'); let html = '', inList = false, tbl = null;
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const flushT = () => { if (!tbl) return; const rows = tbl.filter(r => !/^\|?[\s:|-]+\|?$/.test(r)).map(r => r.replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()))); html += '<div class="mt-wrap"><table class="mt">' + rows.map((r, i) => '<tr>' + r.map(c => i ? `<td>${c}</td>` : `<th>${c}</th>`).join('') + '</tr>').join('') + '</table></div>'; tbl = null; };
  for (const raw of lines) {
    const l = raw.trim();
    if (l.startsWith('|')) { if (inList) { html += '</ul>'; inList = false; } (tbl = tbl || []).push(l); continue; }
    flushT();
    const m = l.match(/^([-•*]|\d+[.)])\s+(.*)$/);
    if (m) { if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + inline(m[2]) + '</li>'; continue; }
    if (inList) { html += '</ul>'; inList = false; }
    if (l) html += '<p>' + inline(l.replace(/^#+\s*/, '')) + '</p>';
  }
  if (inList) html += '</ul>';
  flushT();
  return html;
}

/* ---------- HERO: market spectrum waterfall ---------- */
function initSpectrum() {
  const cv = $('#spectrum'); if (!cv) return;
  const tick = $('#ticker');
  const ctx = cv.getContext('2d');
  const CLASSES = ['PRICING', 'NETWORK', 'DEVICES', 'ENTERPRISE', 'REGULATORY', 'BRAND'];
  const SHORT = ['PRICE', 'NET', 'DEVICE', 'B2B', 'REG', 'BRAND'];
  const LABELS = [
    ['Arcline · premium unlimited −$10 (new lines)', 'Kite · $25 eSIM-only unlimited', 'Vertex · $4 fee added to legacy plans', 'Pulsar · bundle discount widened to $20'],
    ['Pulsar · median 5G download +18% (Harbor)', 'Vertex · 42 FWA installer jobs posted', 'Skyreach · satellite texting beta expands', 'Arcline · new 2.5 GHz carriers (East)'],
    ['Arcline · $800 trade-in, any condition', 'Vertex · 0% financing extended to 36 mo', 'Kite · bring-your-own-phone $50 credit'],
    ['Vertex · wins port authority private-5G tender', 'Arcline · SD-WAN price list −12%', 'Pulsar · SMB fiber + mobile bundle'],
    ['Regulator · 3.8–4.2 GHz consultation opened', 'Vertex · equipment authorization: outdoor CPE', 'Arcline · 14 site permits filed'],
    ['Arcline · outage complaints 5.2× baseline', 'Kite · app rank #41 → #3', 'Pulsar · 6 pop-up kiosks opened']
  ];
  const OPC = ['#FF80A7', '#72B2FF', '#FF80A7', '#9690FF', '#E2B84C', '#FF80A7'];
  const TOP = 74, BOT = 22, BINS = 120, ROW = 2;
  let W = 0, H = 0, dpr = 1, wf = null, wctx = null, step = 0;
  const peaks = []; const lvl = new Float32Array(BINS); const lines = [];
  const stops = [[0, [13, 30, 42]], [.28, [14, 62, 76]], [.52, [31, 140, 152]], [.72, [60, 207, 217]], [.87, [255, 181, 71]], [1, [255, 241, 214]]];
  const cmap = v => { v = clamp(v, 0, 1); for (let i = 1; i < stops.length; i++) { if (v <= stops[i][0]) { const [a, ca] = stops[i - 1], [b, cb] = stops[i]; const t = (v - a) / (b - a); return `rgb(${ca.map((c, k) => Math.round(c + (cb[k] - c) * t)).join(',')})`; } } return 'rgb(255,241,214)'; };
  const lr = mulberry(7);
  function spawn(record) {
    const ci = Math.floor(lr() * 6);
    const x = (ci + .5 + (lr() - .5) * .62) / 6;
    const label = LABELS[ci][Math.floor(lr() * LABELS[ci].length)];
    peaks.push({ x, amp: .55 + lr() * .45, w: .01 + lr() * .02, life: 38 + lr() * 34, age: 0, c: OPC[ci] });
    if (record) { lines.unshift({ t: fmtHM(simMin), c: CLASSES[ci], label }); lines.length = Math.min(lines.length, 3); }
  }
  function compute() {
    for (let b = 0; b < BINS; b++) {
      const x = (b + .5) / BINS;
      const band = (x * 6) % 1; let v = .05 + lr() * .07 + .05 * Math.exp(-Math.pow((band - .5) / .22, 2));
      for (const p of peaks) { const env = Math.sin(Math.PI * Math.min(1, p.age / p.life)); v += p.amp * env * Math.exp(-Math.pow(x - p.x, 2) / (2 * p.w * p.w)); }
      lvl[b] = lvl[b] * .45 + v * .55;
    }
  }
  function advance(record) {
    if (step % 15 === 0) spawn(record);
    for (const p of peaks) p.age++;
    for (let i = peaks.length - 1; i >= 0; i--) if (peaks[i].age > peaks[i].life) peaks.splice(i, 1);
    compute();
    const h = wf.height, bw = wf.width / BINS, rh = ROW * dpr;
    wctx.drawImage(wf, 0, 0, wf.width, h - rh, 0, rh, wf.width, h - rh);
    for (let b = 0; b < BINS; b++) { wctx.fillStyle = cmap(lvl[b]); wctx.fillRect(Math.floor(b * bw), 0, Math.ceil(bw) + 1, rh); }
    step++;
  }
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0D1E2A'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.scale(dpr, dpr);
    // trace area grid
    ctx.strokeStyle = 'rgba(120,190,205,.14)'; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { const y = 8 + (TOP - 16) * i / 4; ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
    // trace
    const ty = v => TOP - 6 - clamp(v, 0, 1.15) * (TOP - 18);
    ctx.beginPath(); ctx.moveTo(0, TOP - 6);
    for (let b = 0; b < BINS; b++) ctx.lineTo((b + .5) / BINS * W, ty(lvl[b]));
    ctx.lineTo(W, TOP - 6); ctx.closePath();
    const g = ctx.createLinearGradient(0, 8, 0, TOP); g.addColorStop(0, 'rgba(60,207,217,.35)'); g.addColorStop(1, 'rgba(60,207,217,0)');
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); for (let b = 0; b < BINS; b++) { const x = (b + .5) / BINS * W, y = ty(lvl[b]); b ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = '#3CCFD9'; ctx.lineWidth = 1.6; ctx.stroke();
    for (const p of peaks) { if (p.age > p.life * .8) continue; const x = p.x * W; ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x - 4, -2 + 4); ctx.lineTo(x + 4, 2); ctx.closePath(); ctx.fill(); ctx.fillRect(x - .5, 4, 1, 6); }
    // waterfall
    ctx.drawImage(wf, 0, TOP, W, H - TOP - BOT);
    // band separators + labels
    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i <= 6; i++) { const x = Math.round(W * i / 6) + .5; ctx.strokeStyle = 'rgba(120,190,205,.18)'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H - BOT); ctx.stroke(); }
    const narrow = W < 460;
    CLASSES.forEach((c, i) => { ctx.fillStyle = '#7C97A3'; ctx.fillText(narrow ? SHORT[i] : c, W * (i + .5) / 6, H - BOT / 2); });
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(207,227,232,.55)'; ctx.fillText('now', 4, TOP + 8); ctx.fillText('earlier ↓', 4, H - BOT - 10);
  }
  function renderTicker() {
    if (!tick) return;
    tick.innerHTML = lines.map(l => `<div><span class="t">${esc(l.t)}</span>${esc(l.c)} · ${esc(l.label)}</div>`).join('');
  }
  function setup() {
    const r = cv.getBoundingClientRect(); if (!r.width) return false;
    dpr = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    wf = document.createElement('canvas'); wf.width = cv.width; wf.height = Math.max(10, Math.round((H - TOP - BOT) * dpr)); wctx = wf.getContext('2d');
    wctx.fillStyle = '#0D1E2A'; wctx.fillRect(0, 0, wf.width, wf.height);
    peaks.length = 0; step = 0;
    const rows = Math.ceil((H - TOP - BOT) / ROW) + 4;
    for (let i = 0; i < rows; i++) advance(i > rows - 50);
    renderTicker(); draw();
    return true;
  }
  let last = 0, raf = 0;
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (ts - last < 90) return; last = ts;
    const before = lines.length ? lines[0] : null;
    advance(true); draw();
    if (lines[0] !== before) renderTicker();
  }
  function start() { cancelAnimationFrame(raf); if (!setup()) return; if (!RM.matches) raf = requestAnimationFrame(loop); }
  start();
  let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(cv.getBoundingClientRect().width - W) > 2) start(); }, 150); }).observe(cv);
  RM.addEventListener && RM.addEventListener('change', start);
}

/* ---------- DEPARTMENTS, LENS, MISSION-CONTROL DASHBOARD, ANALYST WORKBENCH, ACADEMY ---------- */
const DEPTS = [
  { k: 'pm', name: 'Marketing, Pricing & Sales', short: 'Marketing', mission: 'Win the price and promotion battle without giving away margin.',
    questions: ['A rival just changed a price or promo: do we respond, and how?', 'Which of our plans is most exposed, gene by gene?', 'Is a rival’s stealth price rise a chance to win switchers?'],
    tools: [['Tariff DNA', 'tab-dna'], ['War room', 'tab-war'], ['Right-time engagement studio', '#challenge'], ['Command center', 'tab-cc'], ['AI assistant', 'tab-ask']],
    kpis: ['Premium price gap vs the cheapest rival', 'Port-in / port-out balance', 'Revenue at risk from open pricing signals', 'Promotion intensity by rival'],
    rhythm: [['Daily', 'Act-by priorities and pricing alerts'], ['Weekly', 'War-room review of rival promotions'], ['Quarterly', 'Tariff DNA re-baseline of the market']], teams: [['Pricing strategy', 'Plan design, price-response decisions and Tariff DNA reviews'], ['Campaigns & CRM', 'Offers, timing and next-best-action for every customer'], ['Brand & digital', 'Share of voice, app store and digital acquisition'], ['Sales & distribution', 'Dealers, partners, online and telesales']], ws: 'ws_tariff' },
  { k: 'st', name: 'Strategy & Corporate Development', short: 'Strategy', mission: 'See rival moves 30–90 days early and shape the market instead of reacting to it.',
    questions: ['What will each rival do next quarter?', 'Which merger or partnership could change the market?', 'Where should our next big bet go?'],
    tools: [['Move predictor', 'tab-pred'], ['Positioning quadrants', '#positioning'], ['Capital radar', 'tab-cap'], ['Landscape', '#landscape']],
    kpis: ['Probability of the top rival moves', 'Quadrant position against peers', 'Capital moves in the market', 'Time-to-insight on major launches'],
    rhythm: [['Weekly', 'Move-predictor review with signal what-ifs'], ['Monthly', 'Positioning and capital-moves update'], ['Quarterly', 'Executive foresight session']], teams: [['Corporate strategy', 'Long-range plan and portfolio choices'], ['M&A & partnerships', 'Deal screening and partner moves'], ['Competitive intelligence', 'Rival tracking, battlecards and early warnings'], ['New business', 'Fintech, satellite, AI and data-center bets']], ws: 'ws_foresight' },
  { k: 'nw', name: 'Network Planning', short: 'Network', mission: 'Put capex where rivals are about to attack, and keep every coverage claim true.',
    questions: ['Where are rivals adding capacity or new carriers?', 'Is our coverage claim still true in each district?', 'Where would a rival fixed-wireless or fiber launch hit us first?'],
    tools: [['Geo radar', 'tab-geo'], ['Move predictor', 'tab-pred'], ['Operator workspace', 'tab-ws'], ['Command center', 'tab-cc']],
    kpis: ['Measured vs advertised 5G per hex cell', 'Rival site permits and carrier adds', 'Outage signals, ours and rivals’'],
    rhythm: [['Daily', 'Outage and coverage-truth alerts'], ['Monthly', 'Capex priority list for contested cells'], ['Quarterly', 'Network truth sprint']], teams: [['RAN & capacity planning', 'Where to add sites, carriers and spectrum'], ['Fiber & fixed wireless', 'Home broadband build and FWA capacity'], ['Network performance', 'Speed, outages and coverage truth'], ['Sites & infrastructure', 'Towers, permits and network sharing']], ws: 'ws_network' },
  { k: 'b2b', name: 'Enterprise & B2B', short: 'Enterprise', mission: 'Win the next private-5G, IoT and enterprise deal before a rival locks it in.',
    questions: ['Which tenders and private-5G deals are rivals chasing?', 'Where can we pre-empt a rival’s enterprise bundle?', 'Which accounts are at risk after a rival win?'],
    tools: [['Command center', 'tab-cc'], ['Operator workspace', 'tab-ws'], ['AI assistant', 'tab-ask'], ['Landscape', '#landscape']],
    kpis: ['Open tenders by rival', 'Rival wins and likely next bids', 'Enterprise churn signals'],
    rhythm: [['Weekly', 'Tender and win/loss scan'], ['Monthly', 'Account-risk review'], ['Quarterly', 'Partner and bid strategy']], teams: [['Large enterprise & government', 'Strategic accounts and public sector'], ['SME & business mobile', 'Small-business bundles and churn'], ['IoT & private networks', 'Private 5G, IoT and edge deals'], ['Bids & tenders', 'Tender tracking, pricing and win/loss']], ws: 'ws_copilot' },
  { k: 'rg', name: 'Regulatory, Privacy & Spectrum', short: 'Regulatory', mission: 'Shape the rules and the spectrum map before they shape you.',
    questions: ['Which consultations and auctions change our position?', 'What will rivals bid, and what can they afford?', 'Are rival offers compliant with consumer-protection rules?'],
    tools: [['Command center', 'tab-cc'], ['Capital radar', 'tab-cap'], ['AI assistant', 'tab-ask']],
    kpis: ['Open consultations and deadlines', 'Rival spectrum holdings and balance-sheet headroom', 'Stealth-fee and transparency issues'],
    rhythm: [['Weekly', 'Consultation and filing tracker'], ['Monthly', 'Rival spectrum-position review'], ['Before auctions', 'Spectrum auction simulation']], teams: [['Regulatory affairs', 'Consultations, filings and regulator relations'], ['Spectrum strategy', 'Holdings, auctions and renewals'], ['Data privacy & consumer protection', 'Consent, contact rules and data protection'], ['Competition law & compliance', 'Fair competition and information barriers']], ws: 'ws_spectrum' },
  { k: 'fi', name: 'Finance & Investor Relations', short: 'Finance', mission: 'Explain every valuation move and quantify the revenue at risk from rivals.',
    questions: ['How do we compare with listed peers on value and growth?', 'What do activist and private-equity moves say about rivals?', 'How much revenue is at risk from current rival moves?'],
    tools: [['Analyst workbench', 'tab-wb'], ['Capital radar', 'tab-cap'], ['Landscape', '#landscape']],
    kpis: ['Market cap ÷ revenue against peers', 'Revenue at risk from open signals', 'Capital moves and activist stakes'],
    rhythm: [['Weekly', 'Peer valuation pulse'], ['Quarterly', 'Earnings-season competitor pack'], ['Annually', 'Capital & valuation lab']], teams: [['Financial planning & analysis', 'Budgets, forecasts and revenue at risk'], ['Investor relations', 'Peer valuation and the market story'], ['Treasury & capital markets', 'Funding, ratings and capital moves'], ['Revenue assurance', 'Leakage, fraud and billing accuracy']], ws: 'ws_capital' },
  { k: 'cx', name: 'Customer Experience & Retention', short: 'CX & Retention', mission: 'Stop churn where it starts: in the district, the store and the first call.',
    questions: ['Where is churn spreading, district by district?', 'What are customers hearing in stores this week?', 'Who needs a retention offer today?'],
    tools: [['Right-time engagement studio', '#challenge'], ['Operator workspace', 'tab-ws'], ['Geo radar', 'tab-geo'], ['Command center', 'tab-cc']],
    kpis: ['Port-outs per 10k lines by district', 'Rival retail pressure', 'Save-desk conversion'],
    rhythm: [['Daily', 'Churn hotspots and save-desk priorities'], ['Weekly', 'Store intel round-up'], ['Monthly', 'Churn contagion clinic']], teams: [['Retention & save desk', 'Save offers and win-back'], ['Customer care & contact center', 'Calls, chat and first-contact resolution'], ['Retail stores & franchise', 'Store network and rival retail pressure'], ['CX insights & voice of customer', 'Surveys, complaints and journey analytics']], ws: 'ws_churn' },
  { k: 'an', name: 'Market & Investment Analysts', short: 'Analysts', mission: 'Answer any question about operators, owners and markets with sourced numbers in minutes.',
    questions: ['How do operators compare across regions?', 'Who owns whom, and where is the capital moving?', 'What are the unit economics of a market or a response?'],
    tools: [['Analyst workbench', 'tab-wb'], ['Positioning quadrants', '#positioning'], ['Landscape', '#landscape'], ['AI assistant', 'tab-ask']],
    kpis: ['Peer revenue, growth and valuation', 'Innovation checklist coverage', 'State, private-equity and hedge-fund stakes'],
    rhythm: [['Daily', 'Signal scan and peer moves'], ['Weekly', 'Benchmark refresh'], ['Ongoing', 'Certified analyst program']], teams: [['Market research', 'Market sizing, surveys and forecasts'], ['Equity & credit research', 'Listed operators, towers and debt'], ['Benchmarking & data', 'Peer KPIs and data quality'], ['Investment analytics', 'Private-equity, infrastructure and hedge-fund lens']], ws: 'ws_cert' }
];
DEPTS.splice(7, 0, { k: 'da', name: 'Consumer Analytics & Data Science', short: 'Analytics', mission: 'Turn behavioral, transactional and contextual data into models every team can trust and act on.',
  questions: ['When is each customer most likely to engage, and on which channel?', 'Which customers are about to churn, and why?', 'Did the last campaign actually change behavior?'],
  tools: [['Right-time engagement studio', '#challenge'], ['Operator workspace', 'tab-ws'], ['Analyst workbench', 'tab-wb'], ['AI assistant', 'tab-ask']],
  kpis: ['Model ranking quality (AUC) and calibration', 'Engagement uplift vs fixed schedules', 'Contacts per customer per week', 'Opt-out and complaint rates'],
  rhythm: [['Daily', 'Score customers and refresh contact windows'], ['Weekly', 'Model monitoring: drift, accuracy and fairness'], ['Quarterly', 'Retrain and A/B test the contact policy']],
  teams: [['Customer analytics', 'Segments, churn scores and customer value'], ['Data science & ML', 'Contact-time, churn and uplift models'], ['Data engineering & platform', 'Tokenized pipelines and feature store'], ['Experimentation & measurement', 'A/B tests and campaign uplift']], ws: 'ws_rte' });
const DEPT = Object.fromEntries(DEPTS.map(d => [d.k, d]));
const WORKSHOPS = [
  { k: 'ws_signals', name: 'Competitive signals 101', level: 'Foundation', aud: ['op', 'an'], dur: 'Half day (3 h)', format: 'Remote, live', size: '10–30 people', depts: ['pm', 'st', 'cx', 'an'],
    desc: 'How Cellvoyant turns 41 sources into ranked signals: evidence chains, confidence, freshness and half-life.',
    agenda: ['Anatomy of a signal: source, evidence, confidence', 'Freshness and half-life: why old news loses value', 'Triage drill on the live console', 'Writing a three-line signal brief'], outcome: 'Everyone can triage the feed and write a signal brief.' },
  { k: 'ws_tariff', name: 'Tariff DNA & price-response lab', level: 'Practitioner', aud: ['op', 'an'], dur: '1 day', format: 'In person or remote', size: '8–16 people', depts: ['pm', 'fi'],
    desc: 'Decode rival plans gene by gene, spot stealth fee changes and choose a response that protects margin.',
    agenda: ['Reading Tariff DNA and value scores', 'Spotting stealth changes in fees, throttles and contract terms', 'Response options: match, flank, bundle or hold', 'Guardrails: fair comparisons, no price coordination'], outcome: 'A response playbook for your three most dangerous rival plans.' },
  { k: 'ws_churn', name: 'Churn contagion clinic', level: 'Practitioner', aud: ['op'], dur: 'Half day', format: 'Remote or in store', size: '10–25 people', depts: ['cx', 'pm'],
    desc: 'Find where churn is spreading district by district and design save-desk offers that pay back.',
    agenda: ['Churn contagion on the Geo radar', 'Store intel: what customers hear from rivals', 'Retention offer economics in the Analyst workbench', 'Save-desk scripts that stay compliant'], outcome: 'A district hotspot list and a retention offer that clears break-even.' },
  { k: 'ws_rte', name: 'Right-time engagement lab', level: 'Practitioner', aud: ['op', 'an'], dur: '1 day', format: 'Hybrid', size: '8–20 people', depts: ['da', 'cx', 'pm', 'rg'],
    desc: 'Build and govern a contact-timing model: features, evaluation, guardrails and an A/B test plan, using the studio on this page.',
    agenda: ['Behavioral, transactional and contextual features', 'Training and evaluating a contact-time model', 'Guardrails: consent, quiet hours, caps, cooling-off', 'Designing the A/B test and reading the uplift'], outcome: 'A contact policy and a test plan ready for a first pilot.' },
  { k: 'ws_network', name: 'Network truth sprint', level: 'Practitioner', aud: ['op'], dur: '2 days', format: 'Hybrid', size: '6–12 people', depts: ['nw', 'rg'],
    desc: 'Compare advertised and measured coverage, find where rivals will attack and rank capex by competitive risk.',
    agenda: ['Coverage truth on the Geo radar', 'Rival build signals: permits, hiring, new carriers', 'Contested cells and capex ranking', 'Fixing coverage claims before a regulator asks'], outcome: 'A ranked list of contested cells for the next capex cycle.' },
  { k: 'ws_capital', name: 'Capital & valuation lab', level: 'Practitioner', aud: ['an', 'ex'], dur: '1 day', format: 'Remote or in person', size: '8–20 people', depts: ['fi', 'an', 'st'],
    desc: 'Benchmark operators on revenue, growth, valuation and ownership, and read what sovereign, private-equity and activist moves signal.',
    agenda: ['Peer benchmarks in the Analyst workbench', 'Ownership: state, private equity, infrastructure and hedge funds', 'Tower and fiber carve-outs: what they mean', 'Building an investor-ready competitor pack'], outcome: 'A peer benchmark pack you can refresh every quarter.' },
  { k: 'ws_copilot', name: 'AI analyst copilot bootcamp', level: 'Foundation', aud: ['op', 'an'], dur: 'Half day', format: 'Remote', size: '10–40 people', depts: ['b2b', 'pm', 'an', 'cx'],
    desc: 'Get reliable, sourced answers from the AI assistant: prompts, tools, checks, and when to ask a human analyst.',
    agenda: ['What each assistant tool does', 'Prompts for battlecards, briefs and what-ifs', 'Checking numbers and sources', 'When to request Analyst-on-Demand'], outcome: 'A team prompt library for your ten most common questions.' },
  { k: 'wargame', name: 'Rival response war game', level: 'Advanced', aud: ['op', 'ex'], dur: '2 days', format: 'In person', size: '12–24 people', depts: ['st', 'pm', 'cx'],
    desc: 'Teams play against AI-simulated rivals on real market data, then test the winning moves in the War room.',
    agenda: ['Build rival personas from public signals', 'Three rounds of move and counter-move', 'Score outcomes in the War room twin', 'Turn the winning move into a 30-day plan'], outcome: 'A tested 30-day competitive response plan with owners.' },
  { k: 'ws_foresight', name: 'Move-prediction & foresight studio', level: 'Advanced', aud: ['an', 'ex'], dur: '1 day', format: 'In person', size: '8–14 people', depts: ['st', 'an'],
    desc: 'Use the Move predictor to forecast rival launches 30–90 days out and plan pre-emptive moves.',
    agenda: ['Base rates and signal fusion', 'What-if drills: add and remove signals', 'A scenario map for the next two quarters', 'Early-warning alert rules for the console'], outcome: 'A two-quarter scenario map and five live alert rules.' },
  { k: 'ws_spectrum', name: 'Spectrum auction simulation', level: 'Advanced', aud: ['an', 'ex'], dur: '1 day', format: 'In person', size: '8–16 people', depts: ['rg', 'fi', 'st'],
    desc: 'Model rival budgets and bidding strategies before an auction or licence renewal.',
    agenda: ['Spectrum holdings and needs by rival', 'Balance-sheet headroom from the Capital radar', 'Three-round bidding simulation', 'Consultation and regulatory strategy'], outcome: 'A bidding envelope and walk-away price, stress-tested against rivals.' },
  { k: 'ws_exec', name: 'Executive foresight briefing', level: 'Executive', aud: ['ex'], dur: '2 hours', format: 'In person', size: '4–12 people', depts: ['st', 'fi'],
    desc: 'A board-level view of rival moves, capital flows and your place on the positioning quadrant, ending in three decisions.',
    agenda: ['Where you sit on the positioning quadrant', 'The three rival moves most likely next', 'Capital moves that change the market', 'Three decisions for the next 90 days'], outcome: 'Three decisions with owners and dates.' },
  { k: 'ws_cert', name: 'Cellvoyant certified analyst program', level: 'Certification', aud: ['an'], dur: '6 weeks, 2 h a week', format: 'Remote cohort', size: '15–30 people', depts: ['an', 'st', 'fi'],
    desc: 'A structured program in telecom competitive intelligence: sources, signals, benchmarks, forecasting and ethics, with a capstone.',
    agenda: ['Weeks 1–2: sources, evidence and ethics', 'Weeks 3–4: benchmarks, unit economics and valuation', 'Week 5: forecasting and war-gaming', 'Week 6: capstone brief to a review panel'], outcome: 'A Cellvoyant analyst certificate and a capstone brief.' }
];
const wsAnchor = k => 'ws-' + String(k).replace(/^ws_/, '');
const ROUTE = { 'Port-outs': ['cx', 'pm', 'fi', 'da'], 'Pricing': ['pm', 'st', 'fi', 'an'], 'Social': ['pm', 'cx', 'nw', 'da'], 'Hiring': ['st', 'nw', 'an'], 'Stealth pricing': ['pm', 'cx', 'rg'], 'Devices': ['pm', 'cx'], 'Enterprise': ['b2b', 'st'], 'Network': ['nw', 'pm'], 'Regulatory': ['rg', 'st', 'fi'], 'Satellite': ['st', 'nw', 'rg'], 'Retail': ['cx', 'pm', 'da'] };
const routeOf = e => ROUTE[e.tpl.cls] || ['st', 'an'];
const SECTORS = [
  { k: 'mob', ex: 'Unlimited Premium', name: 'Consumer mobile', watch: ['Tariffs, promotions and stealth fees', 'Port-in and port-out flows', 'eSIM switching intent', 'Device and trade-in offers'], tools: [['Tariff DNA', 'tab-dna'], ['War room', 'tab-war'], ['Geo radar', 'tab-geo']], depts: ['pm', 'cx', 'fi'] },
  { k: 'home', ex: 'fixed-wireless', name: 'Home broadband & fixed wireless', watch: ['Fixed-wireless launches and installer hiring', 'Fiber build permits', 'Mobile + home bundle pricing'], tools: [['Move predictor', 'tab-pred'], ['Geo radar', 'tab-geo']], depts: ['nw', 'st', 'pm'], fact: ['Fixed-wireless connections are forecast to grow from 185M (2025) to 350M (2031).', '#src-4'] },
  { k: 'ent', ex: 'private-5G', name: 'Enterprise, private 5G & IoT', watch: ['Public tenders and awards', 'Private-5G deployments', 'Enterprise price lists and bundles'], tools: [['Command center', 'tab-cc'], ['AI assistant', 'tab-ask']], depts: ['b2b', 'st'] },
  { k: 'whl', ex: 'new carriers', name: 'Wholesale, towers & fiber', watch: ['Tower and fiber carve-outs', 'Infrastructure-fund deals', 'Network-sharing agreements'], tools: [['Capital radar', 'tab-cap'], ['Landscape', '#landscape']], depts: ['fi', 'st', 'an'] },
  { k: 'sat', ex: 'direct-to-phone', name: 'Satellite & direct-to-device', watch: ['Launch manifests and filings', 'Operator–satellite partnerships', 'Spectrum transactions'], tools: [['Move predictor', 'tab-pred'], ['Landscape', '#landscape']], depts: ['st', 'rg', 'nw'], fact: ['T-Mobile and Starlink launched commercial satellite-to-phone service in July 2025.', '#src-14'] },
  { k: 'dig', ex: 'in-app sign-up', name: 'Digital services & fintech', watch: ['Wallet and fintech launches', 'Data-center and AI-cloud investments', 'App-store ranking moves'], tools: [['Positioning quadrants', '#positioning'], ['Analyst workbench', 'tab-wb']], depts: ['st', 'an', 'fi'] }
];

/* lens */
let lens = 'all';
try { const v = localStorage.getItem('cv-lens'); if (v && (v === 'all' || DEPT[v])) lens = v; } catch (e) { /* storage unavailable */ }
const lensMatch = e => lens === 'all' || routeOf(e).includes(lens);
const lensScore = e => score(e) * (lensMatch(e) ? 1 : .3);
function setLens(v) {
  lens = v === 'all' || DEPT[v] ? v : 'all';
  try { localStorage.setItem('cv-lens', lens); } catch (e) { /* ignore */ }
  const sel = $('#lensSel'); if (sel) sel.value = lens;
  renderFeed(); renderPriorities(); renderLensBrief(); renderStatus();
}

/* dashboard pieces */
const idxHist = [], sigHist = [], portHist = [], critHist = [];
function pressure() {
  const open = events.filter(e => fresh(e) > .1);
  const r = open.reduce((s, e) => s + (e.tpl.risk || 0) * e.tpl.conf * fresh(e), 0);
  const crit = events.filter(e => e.tpl.sev === 'crit' && fresh(e) > .25).length;
  return { idx: Math.round(100 * (.7 * r / (r + 8e6) + .3 * Math.min(1, crit / 5))), r, crit };
}
const levelOf = v => v >= 75 ? ['Severe', 'crit'] : v >= 55 ? ['High', 'warn'] : v >= 35 ? ['Elevated', 'warn'] : ['Calm', 'up'];
function areaSpark(vals, color) {
  if (vals.length < 2) return '<svg class="area" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true"></svg>';
  const mn = Math.min(...vals), mx = Math.max(...vals), rg = mx - mn || 1;
  const pts = vals.map((v, i) => [(i / (vals.length - 1) * 100).toFixed(2), (30 - (v - mn) / rg * 24).toFixed(2)]);
  const line = pts.map(p => p.join(',')).join(' ');
  return `<svg class="area" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,34 ${line} 100,34" style="fill:${color};opacity:.16"/><polyline points="${line}" vector-effect="non-scaling-stroke" style="fill:none;stroke:${color};stroke-width:1.6"/></svg>`;
}
function deltaChip(hist, fmt, goodUp) {
  if (hist.length < 6) return '<span class="dchip">—</span>';
  const a = hist[Math.max(0, hist.length - 11)], b = hist[hist.length - 1], d = b - a;
  if (Math.abs(d) < 1e-9) return '<span class="dchip">■ flat</span>';
  const cls = goodUp == null ? '' : (goodUp ? d > 0 : d < 0) ? ' g' : ' b';
  return `<span class="dchip${cls}" title="change over the last 10 sim updates">${d > 0 ? '▲' : '▼'} ${fmt(Math.abs(d))}</span>`;
}
function renderPulse(P) {
  const el = $('#pulseBox'); if (!el) return;
  const [lvl, cls] = levelOf(P.idx);
  const t = {}; events.forEach(e => { if (e.tpl.op !== 'all') t[e.tpl.op] = (t[e.tpl.op] || 0) + score(e); });
  const tot = Object.values(t).reduce((a, b) => a + b, 0) || 1;
  const drv = Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const col = cls === 'crit' ? 'var(--crit)' : cls === 'warn' ? 'var(--signal)' : 'var(--good)';
  el.innerHTML = `<div class="pulse-g"><svg viewBox="0 0 200 116" aria-hidden="true">
      <path d="M16 104 A84 84 0 0 1 184 104" fill="none" stroke="var(--surface-2)" stroke-width="14" stroke-linecap="round"/>
      <path d="M16 104 A84 84 0 0 1 184 104" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" pathLength="100" stroke-dasharray="${Math.max(.5, P.idx)} 100"/>
      ${[0, 25, 50, 75, 100].map(v => { const a = Math.PI * (1 - v / 100), x = 100 + Math.cos(a) * 98, y = 104 - Math.sin(a) * 98; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" style="fill:var(--muted)"/>`; }).join('')}
    </svg><div class="pulse-v"><b>${P.idx}</b><span class="${cls}">${lvl}</span></div></div>
    <div class="pulse-t"><span class="label">Competitive pressure index</span>
      <p class="small muted">Revenue at risk, weighted by confidence and freshness, plus critical signals. Updated every second.</p>
      ${areaSpark(idxHist, col)}
      <div class="drv">${drv.map(([o, v]) => `<div><span class="opt" style="--c:${opColor(o)}">${esc(OPS[o].short)}</span><span class="bar"><i style="width:${(v / tot * 100).toFixed(1)}%;background:${opColor(o)}"></i></span><span class="mono tiny">${Math.round(v / tot * 100)}%</span></div>`).join('')}</div></div>`;
}
function renderTape(P) {
  const el = $('#tape'); if (!el) return;
  const sixH = events.filter(e => simMin - e.t <= 360).length / 6;
  const open = events.filter(e => fresh(e) > .1), avgF = open.length ? open.reduce((s, e) => s + fresh(e), 0) / open.length : 0;
  const prem = PLANS.find(p => p.id === 'arc-p'), kite = PLANS.find(p => p.id === 'kte-e'), nim = PLANS.find(p => p.id === 'nim-u');
  const d = deltaChip(idxHist, v => Math.round(v), false);
  const items = [['Pressure', `${P.idx}`, d], ['At risk', fmtMoney(P.r), ''], ['Port bal 7d', (netPorts > 0 ? '+' : '−') + fmtInt(Math.abs(netPorts)), ''], ['Signals/h', sixH.toFixed(1), ''], ['Avg fresh', Math.round(avgF * 100) + '%', ''], ['Critical', String(P.crit), ''],
    ['NIM Unl+', '$' + nim.price, ''], ['ARC Prem', '$' + prem.price, '<span class="dchip b">▼ $10</span>'], ['KITE eSIM', '$' + kite.price, '<span class="dchip">new</span>']];
  el.innerHTML = items.map(([l, v, x]) => `<span class="tp"><span class="tl">${esc(l)}</span><b>${esc(v)}</b>${x}</span>`).join('');
}
function actBy(e) { const due = e.t + e.tpl.hl * 60, left = due - simMin; return { due, left }; }
const fmtLeft = m => m <= 0 ? 'overdue' : m < 60 ? `in ${Math.round(m)} min` : m < 1440 ? `in ${Math.floor(m / 60)}h ${pad(Math.round(m % 60))}m` : `in ${Math.round(m / 1440)}d`;
function renderPriorities() {
  const el = $('#prio'); if (!el) return;
  const top = [...events].filter(e => fresh(e) > .15).sort((a, b) => lensScore(b) - lensScore(a)).slice(0, 3);
  el.innerHTML = top.map((e, i) => {
    const T = e.tpl, a = actBy(e), r = routeOf(e);
    return `<article class="pcard s-${T.sev}"><div class="ph"><span class="mono tiny">Priority ${i + 1}</span><span class="sev ${T.sev}">${SEVL[T.sev]}</span></div>
      <b class="pt">${esc(e.text)}</b>
      <div class="pm"><span class="opt" style="--c:${opColor(T.op)}">${esc(OPS[T.op].short)}</span><span class="mono tiny ${a.left <= 0 ? 'down' : a.left < 240 ? 'warn' : ''}">Act by ${esc(fmtHM(a.due))} · ${fmtLeft(a.left)}</span></div>
      <div class="routes">${r.map(k => `<span class="rt${lens === k ? ' on' : ''}">${esc(DEPT[k].short)}</span>`).join('')}</div>
      <div class="row-btns"><button type="button" class="btn sm" data-open="${e.id}">Open evidence</button><button type="button" class="btn sm" data-wsig="${e.id}">Add to workspace</button></div></article>`;
  }).join('');
}
function renderLensBrief() {
  const el = $('#lensBrief'); if (!el) return;
  if (lens === 'all') { el.innerHTML = `<span class="lb-k">Lens · All departments</span><span class="small">Every signal is routed to the departments that can act on it. Pick a department lens to see its signals first.</span>`; return; }
  const D = DEPT[lens], mine = events.filter(e => routeOf(e).includes(lens) && fresh(e) > .1), crit = mine.filter(e => e.tpl.sev === 'crit').length;
  const next = mine.map(actBy).filter(a => a.left > 0).sort((a, b) => a.left - b.left)[0];
  el.innerHTML = `<span class="lb-k">Lens · ${esc(D.name)}</span><span class="small"><b>${mine.length}</b> open signals routed to you${crit ? `, <b class="down">${crit} critical</b>` : ''}${next ? `. Next act-by ${esc(fmtHM(next.due))} (${fmtLeft(next.left)})` : ''}.</span>
    <span class="lb-tools">${D.tools.filter(t => t[1].startsWith('tab-')).map(t => `<button type="button" class="chip hl" data-tab="${t[1]}">${esc(t[0])}</button>`).join('')}</span>`;
}
function renderStatus() {
  const el = $('#cStatus'); if (!el) return;
  const sixH = events.filter(e => simMin - e.t <= 360).length;
  el.innerHTML = `<span><i class="dot live"></i>41 of 41 sources online</span><span>Signals in the last 6h: ${sixH}</span><span>Lens: ${esc(lens === 'all' ? 'All departments' : DEPT[lens].name)}</span><span>${live ? 'Live · sim clock ×300' : 'Paused'}</span><span>Data: simulated, fictional operators</span>`;
}
function taskFromSignal(id, btn) {
  const e = events.find(x => x.id === id); if (!e) return;
  addTask({ title: e.text, kind: 'signal', ref: e.id, dept: routeOf(e)[0], prio: e.tpl.sev === 'crit' ? 'high' : 'normal', due: fmtHM(actBy(e).due) }, btn);
}
function initDashboard() {
  const sel = $('#lensSel');
  if (sel) { sel.innerHTML = `<option value="all">All departments</option>` + DEPTS.map(d => `<option value="${d.k}">${esc(d.name)}</option>`).join(''); sel.value = lens; sel.onchange = () => setLens(sel.value); }
  $('#prio').addEventListener('click', e => { const w = e.target.closest('[data-wsig]'); if (w) { taskFromSignal(w.dataset.wsig, w); return; } const b = e.target.closest('[data-open]'); if (!b) return; selId = b.dataset.open; renderFeed(); renderDetail(); detailEl.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'center' }); });
  $('#lensBrief').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) selectTab(b.dataset.tab); });
  renderPriorities(); renderLensBrief(); renderStatus();
}

/* ---------- ANALYST WORKBENCH ---------- */
const WB = { sel: [], metric: 'rev' };
const WB_M = { rev: ['Revenue', c => revOf(c), v => fmtMoney(v)], mcap: ['Market cap', c => (c.mcap && c.mcap.usd) || 0, v => fmtMoney(v)], growth: ['Revenue growth', c => c.growth && c.growth.v != null ? +c.growth.v : null, v => pct(v)], innov: ['Innovation (of 7)', c => c.innov ? innovCount(c) : null, v => v + '/7'], mult: ['Mkt cap ÷ revenue', c => { const m = c.mcap && c.mcap.usd, r = revOf(c); return m && r ? m / r : null; }, v => v.toFixed(2) + '×'] };
const wbOps = () => posItems('ops');
function wbPreset(region) {
  const all = wbOps().filter(c => region === 'Global' || c.region === region).sort((a, b) => revOf(b) - revOf(a));
  WB.sel = all.slice(0, region === 'Global' ? 8 : 6).map(c => c.id); wbRender();
}
function wbRender() {
  if (!POS || !$('#wbChart')) return;
  const ops = wbOps(), by = Object.fromEntries(ops.map(c => [c.id, c])), M = WB_M[WB.metric];
  $$('#wbMetric button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === WB.metric)));
  const sel = WB.sel.map(id => by[id]).filter(Boolean);
  $('#wbChips').innerHTML = sel.map(c => `<span class="chip hl wbc">${esc(c.short || c.name)}<button type="button" data-rm="${esc(c.id)}" aria-label="Remove ${esc(c.name)}">×</button></span>`).join('') || '<span class="small muted">Pick a preset or add operators.</span>';
  const rows = sel.map(c => ({ c, v: M[1](c) })).sort((a, b) => (b.v == null) - (a.v == null) || (b.v || 0) - (a.v || 0));
  const W = 640, rh = 30, L = 150, R = 86, H = Math.max(1, rows.length) * rh + 10;
  const vals = rows.map(r => r.v).filter(v => v != null), mx = Math.max(...vals.map(Math.abs), 1e-9), hasNeg = vals.some(v => v < 0);
  const zero = hasNeg ? L + (W - L - R) * .25 : L, span = hasNeg ? (W - L - R) * .75 : W - L - R;
  const svg = $('#wbChart'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = rows.map((r, i) => {
    const y = i * rh + 6, col = r.c.cls === 'c2' ? 'var(--cx-2)' : r.c.cls === 'c3' ? 'var(--cx-3)' : 'var(--cx-1)';
    const mk = r.c.cls === 'c2' ? `<rect x="${L - 14}" y="${y + 7}" width="9" height="9" rx="1.5" style="fill:${col}"/>` : r.c.cls === 'c3' ? `<polygon points="${L - 9.5},${y + 6} ${L - 4.5},${y + 16} ${L - 14.5},${y + 16}" style="fill:${col}"/>` : `<circle cx="${L - 9.5}" cy="${y + 11.5}" r="4.5" style="fill:${col}"/>`;
    const lab = `<text x="${L - 20}" y="${y + 16}" text-anchor="end" style="font:12px var(--f-body);fill:var(--ink-2)">${esc((r.c.short || r.c.name).slice(0, 22))}</text>${mk}`;
    if (r.v == null) return `${lab}<text x="${L}" y="${y + 16}" style="font:11px var(--f-mono);fill:var(--muted)">not disclosed</text>`;
    const w = Math.max(2, Math.abs(r.v) / mx * span), x = r.v < 0 ? zero - w : zero;
    return `<g><title>${esc(r.c.name)}: ${M[2](r.v)}</title>${lab}
      <rect x="${x.toFixed(1)}" y="${y + 4}" width="${w.toFixed(1)}" height="${rh - 12}" rx="4" style="fill:${col}"/>
      <text x="${(r.v < 0 ? zero + 6 : x + w + 6).toFixed(1)}" y="${y + 16}" style="font:600 11.5px var(--f-mono);fill:var(--ink)">${M[2](r.v)}</text></g>`;
  }).join('') + (hasNeg ? `<line x1="${zero}" x2="${zero}" y1="0" y2="${H}" style="stroke:var(--line-strong)"/>` : '');
  $('#wbTable').innerHTML = `<thead><tr><th>Operator</th><th>Region</th><th>Revenue</th><th>Mkt cap</th><th>Growth</th><th>Innovation</th><th>Cap ÷ rev</th><th>Owners</th></tr></thead><tbody>` +
    sel.map(c => `<tr><td>${esc(c.short || c.name)}</td><td>${esc(c.region || '')}</td><td>${revOf(c) ? fmtMoney(revOf(c)) : '—'}</td><td>${c.mcap && c.mcap.usd ? fmtMoney(c.mcap.usd) : '—'}</td><td>${pct(c.growth && c.growth.v)}</td><td>${c.innov ? innovCount(c) + '/7' : '—'}</td><td>${WB_M.mult[1](c) ? WB_M.mult[1](c).toFixed(2) + '×' : '—'}</td><td>${posBadges(c) || '<span class="muted">listed / strategic</span>'}</td></tr>`).join('') + '</tbody>';
}
function wbCSV() {
  const ops = wbOps(), by = Object.fromEntries(ops.map(c => [c.id, c]));
  const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  return ['operator,region,country,revenue_usd,market_cap_usd,revenue_growth_pct,innovation_of_7,state,private_equity_or_infra,hedge_fund'].concat(WB.sel.map(id => by[id]).filter(Boolean).map(c => [q(c.name), q(c.region), q(c.country), revOf(c) || '', (c.mcap && c.mcap.usd) || '', c.growth && c.growth.v != null ? c.growth.v : '', c.innov ? innovCount(c) : '', c.f.state ? 1 : 0, (c.f.pe || c.f.infra) ? 1 : 0, c.f.hf ? 1 : 0].join(','))).join('\n');
}
const UE_DEF = { ueArpu: 46, ueChurn: 1.4, ueMargin: 55, ueCac: 180, ueRisk: 35, ueOffer: 5, ueMonths: 6, ueCut: 30 };
function ueRun() {
  const g = id => +$('#' + id).value;
  const arpu = g('ueArpu'), ch = g('ueChurn') / 100, m = g('ueMargin') / 100, cac = g('ueCac'), risk = g('ueRisk') / 100, off = g('ueOffer'), mo = g('ueMonths'), cut = g('ueCut') / 100;
  const out = { ueArpu: '$' + arpu, ueChurn: (ch * 100).toFixed(1) + '% a month', ueMargin: Math.round(m * 100) + '%', ueCac: '$' + cac, ueRisk: Math.round(risk * 100) + '%', ueOffer: '$' + off + ' a month', ueMonths: mo + ' months', ueCut: Math.round(cut * 100) + '%' };
  Object.entries(out).forEach(([k, v]) => { const o = $('#o-' + k); if (o) o.textContent = v; });
  // CLV = monthly gross margin × expected lifetime (1 ÷ churn); an offer saves CLV on the share of at-risk customers it keeps
  const life = 1 / ch, gm = arpu * m, clv = gm * life, pay = cac / gm, ratio = clv / (cac || 1);
  const cost = off * mo, saved = risk * cut * clv, gain = saved - cost, be = risk * clv > 0 ? cost / (risk * clv) : 1;
  $('#ueOut').innerHTML = [['Customer lifetime', life.toFixed(0) + ' months'], ['Lifetime value (CLV)', fmtMoney(clv)], ['CLV ÷ acquisition cost', ratio.toFixed(1) + '×'], ['Acquisition payback', pay.toFixed(1) + ' months'], ['Net value per targeted customer', (gain >= 0 ? '+' : '') + fmtMoney(gain)], ['Break-even churn cut', be > 1 ? 'over 100%' : Math.max(1, Math.round(be * 100)) + '%']]
    .map(([l, v], i) => `<div class="${i === 4 ? (gain >= 0 ? 'good' : 'bad') : ''}"><span>${l}</span><b>${v}</b></div>`).join('');
  const bars = [['Value saved', saved, 'var(--cx-1)'], ['Offer cost', cost, 'var(--muted)'], ['Net value', gain, gain >= 0 ? 'var(--good)' : 'var(--crit)']], mx = Math.max(...bars.map(b => Math.abs(b[1])), 1);
  $('#ueChart').innerHTML = bars.map((b, i) => { const w = Math.max(2, Math.abs(b[1]) / mx * 380); return `<g><text x="0" y="${i * 30 + 17}" style="font:12px var(--f-body);fill:var(--ink-2)">${b[0]}</text><rect x="110" y="${i * 30 + 5}" width="${w.toFixed(1)}" height="16" rx="4" style="fill:${b[2]}"/><text x="${(116 + w).toFixed(1)}" y="${i * 30 + 17}" style="font:600 11.5px var(--f-mono);fill:var(--ink)">${fmtMoney(b[1])}</text></g>`; }).join('');
  $('#ueNote').textContent = `Offering ${fmtMoney(off)} a month for ${mo} months costs ${fmtMoney(cost)} per targeted customer. It pays back if it cuts the chance of leaving by at least ${be > 1 ? '100' : Math.max(1, Math.round(be * 100))}%. At ${Math.round(cut * 100)}% it ${gain >= 0 ? 'adds' : 'loses'} ${fmtMoney(Math.abs(gain))} per targeted customer.`;
}
function initWorkbench() {
  if (!$('#p-wb')) return;
  const regions = ['Gulf (GCC)', 'Middle East', 'Asia-Pacific', 'Europe', 'Africa', 'Americas', 'Global'];
  $('#wbPreset').innerHTML = regions.map(r => `<button type="button" data-r="${esc(r)}">${esc(r === 'Global' ? 'Global top 8' : r)}</button>`).join('');
  $('#wbPreset').addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (!b) return; $$('#wbPreset button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); wbPreset(b.dataset.r); });
  $('#wbMetric').innerHTML = Object.entries(WB_M).map(([k, m]) => `<button type="button" data-m="${k}" aria-pressed="${k === WB.metric}">${esc(m[0])}</button>`).join('');
  $('#wbMetric').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; WB.metric = b.dataset.m; wbRender(); });
  $('#wbOps').innerHTML = wbOps().map(c => `<option value="${esc(c.name)}"></option>`).join('');
  const add = () => { const v = $('#wbFind').value.trim().toLowerCase(); if (!v) return; const c = wbOps().find(x => x.name.toLowerCase() === v || String(x.short || '').toLowerCase() === v) || wbOps().find(x => x.name.toLowerCase().includes(v)); if (c && !WB.sel.includes(c.id) && WB.sel.length < 12) { WB.sel.push(c.id); wbRender(); } $('#wbFind').value = ''; };
  $('#wbFind').addEventListener('change', add);
  $('#wbFind').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  $('#wbChips').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; WB.sel = WB.sel.filter(id => id !== b.dataset.rm); wbRender(); });
  $('#wbCopy').onclick = async () => { const csv = wbCSV(); try { await navigator.clipboard.writeText(csv); toast('Benchmark copied as CSV'); } catch (e) { showBriefPanel(csv); } };
  $('#wbSave').onclick = async () => { const csv = wbCSV(); if (downloadsNs) { try { await downloadsNs.save({ filename: 'cellvoyant-peer-benchmark.csv', data: csv }); toast('Benchmark saved'); return; } catch (e) { if (e && e.code === 'declined') { toast('Save cancelled'); return; } } } showBriefPanel(csv); };
  Object.keys(UE_DEF).forEach(id => $('#' + id).addEventListener('input', ueRun));
  $('#ueReset').onclick = () => { Object.entries(UE_DEF).forEach(([k, v]) => { $('#' + k).value = v; }); ueRun(); };
  const first = $('#wbPreset [data-r="Gulf (GCC)"]'); if (first) first.setAttribute('aria-pressed', 'true');
  wbPreset('Gulf (GCC)'); ueRun();
}

/* ---------- DEPARTMENTS SECTION ---------- */
let deptMode = 'dept', deptSel = 'pm', sectorSel = 'mob';
function goTool(target, deptKey) {
  if (deptKey) setLens(deptKey);
  if (target.startsWith('#')) { const s = $(target); if (s) s.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); return; }
  selectTab(target); $('#app').scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' });
}
function renderDepts() {
  const root = $('#deptHub'); if (!root) return;
  $$('#deptMode button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === deptMode)));
  if (deptMode === 'dept') {
    const D = DEPT[deptSel], W = WORKSHOPS.find(w => w.k === D.ws);
    const routed = TPL.filter(t => (ROUTE[t.cls] || []).includes(D.k)).length;
    root.innerHTML = `<div class="hub-list" role="group" aria-label="Departments">${DEPTS.map(d => `<button type="button" data-d="${d.k}" aria-pressed="${d.k === deptSel}"><b>${esc(d.name)}</b><span>${d.teams.length} teams · ${esc(d.teams.map(t => t[0]).join(', '))}</span></button>`).join('')}</div>
      <article class="hub-panel">
        <div class="hp-head"><div><span class="label">Department</span><h3>${esc(D.name)}</h3><p class="lede" style="font-size:16px">${esc(D.mission)}</p></div>
          <button type="button" class="btn accent" data-go="tab-cc" data-lens="${D.k}">Open the console with the ${esc(D.short)} lens</button></div>
        <div class="hp-grid">
          <div><span class="label">Questions it answers</span><ul class="cxl">${D.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul></div>
          <div><span class="label">Tools</span><div class="chips" style="margin-top:8px">${D.tools.filter(t => hasTarget(t[1])).map(t => `<button type="button" class="chip hl" data-go="${t[1]}" data-lens="${D.k}">${esc(t[0])}</button>`).join('')}</div>
            <p class="small muted" style="margin-top:10px">${routed} of ${TPL.length} signal types in the console are routed to this department.</p></div>
          <div><span class="label">KPIs it watches</span><ul class="cxl">${D.kpis.map(k => `<li>${esc(k)}</li>`).join('')}</ul></div>
          <div><span class="label">Operating rhythm</span><div class="rhythm">${D.rhythm.map(r => `<div><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`).join('')}</div></div>
        </div>
        <div><span class="label">Teams in this department</span><div class="teams">${D.teams.map(t => `<div><b>${esc(t[0])}</b><span>${esc(t[1])}</span></div>`).join('')}</div></div>
        ${W ? `<div class="hp-ws"><span class="label">Recommended workshop</span><b>${esc(W.name)}</b><span class="small">${esc(W.dur)} · ${esc(W.format)} · ${esc(W.outcome)}</span><a class="small" href="#${wsAnchor(W.k)}">See it in the Academy →</a></div>` : ''}
      </article>`;
  } else {
    const S = SECTORS.find(s => s.k === sectorSel);
    const ex = TPL.find(t => t.text.includes(S.ex));
    root.innerHTML = `<div class="hub-list" role="group" aria-label="Business sectors">${SECTORS.map(s => `<button type="button" data-s="${s.k}" aria-pressed="${s.k === sectorSel}"><b>${esc(s.name)}</b><span>${esc(s.watch[0])}</span></button>`).join('')}</div>
      <article class="hub-panel">
        <div class="hp-head"><div><span class="label">Business sector</span><h3>${esc(S.name)}</h3>${S.fact ? `<p class="small" style="color:var(--ink-2)">${esc(S.fact[0])} <a href="${S.fact[1]}">[source]</a></p>` : ''}</div></div>
        <div class="hp-grid">
          <div><span class="label">Signals Cellvoyant watches</span><ul class="cxl">${S.watch.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>
          <div><span class="label">Tools</span><div class="chips" style="margin-top:8px">${S.tools.filter(t => hasTarget(t[1])).map(t => `<button type="button" class="chip hl" data-go="${t[1]}">${esc(t[0])}</button>`).join('')}</div></div>
          <div><span class="label">Departments involved</span><div class="chips" style="margin-top:8px">${S.depts.map(k => `<button type="button" class="chip" data-d2="${k}">${esc(DEPT[k].name)}</button>`).join('')}</div></div>
          ${ex ? `<div><span class="label">Example signal (simulated)</span><p class="small" style="color:var(--ink-2);margin-top:6px">${esc(ex.text.replace(/\{d\}/g, 'East district'))}</p></div>` : ''}
        </div>
      </article>`;
  }
}
function initDepts() {
  const root = $('#deptHub'); if (!root) return;
  $('#deptMode').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; deptMode = b.dataset.m; renderDepts(); });
  root.addEventListener('click', e => {
    const d = e.target.closest('[data-d]'); if (d) { deptSel = d.dataset.d; renderDepts(); return; }
    const s = e.target.closest('[data-s]'); if (s) { sectorSel = s.dataset.s; renderDepts(); return; }
    const d2 = e.target.closest('[data-d2]'); if (d2) { deptMode = 'dept'; deptSel = d2.dataset.d2; renderDepts(); return; }
    const g = e.target.closest('[data-go]'); if (g) goTool(g.dataset.go, g.dataset.lens);
  });
  renderDepts(); renderRouteMap();
}
function renderRouteMap() {
  const el = $('#routeMap'); if (!el) return;
  el.innerHTML = `<thead><tr><th scope="col">Signal type</th>${DEPTS.map(d => `<th scope="col">${esc(d.short)}</th>`).join('')}</tr></thead><tbody>` +
    Object.keys(ROUTE).map(c => `<tr><th scope="row">${esc(c)}</th>${DEPTS.map(d => { const i = ROUTE[c].indexOf(d.k); return `<td>${i < 0 ? '' : `<i class="rm-dot${i === 0 ? ' lead' : ''}" title="${i === 0 ? 'Lead owner' : 'Informed'}"></i><span class="sr">${i === 0 ? 'Lead owner' : 'Informed'}</span>`}</td>`; }).join('')}</tr>`).join('') + '</tbody>';
}

/* ---------- ACADEMY ---------- */
let acadAud = 'all';
function renderAcademy() {
  const root = $('#wsGrid'); if (!root) return;
  $$('#wsAud button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.a === acadAud)));
  const AUD = { op: 'Operators', an: 'Analysts', ex: 'Executives' };
  root.innerHTML = WORKSHOPS.filter(w => acadAud === 'all' || w.aud.includes(acadAud)).map(w => `<article class="ws" id="${wsAnchor(w.k)}">
    <div class="ws-top"><span class="label">${esc(w.level)}</span><span class="ws-aud">${w.aud.map(a => `<span class="rt">${AUD[a]}</span>`).join('')}</span></div>
    <h4>${esc(w.name)}</h4>
    <div class="ws-meta"><span>${esc(w.dur)}</span><span>${esc(w.format)}</span><span>${esc(w.size)}</span></div>
    <p class="small">${esc(w.desc)}</p>
    <ul class="cxl">${w.agenda.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
    <div class="ws-out"><span class="label">You leave with</span><span class="small">${esc(w.outcome)}</span></div>
    <div class="chips">${w.depts.map(k => `<span class="chip">${esc(DEPT[k].short)}</span>`).join('')}</div>
    <div class="ws-act"><button type="button" class="btn sm accent" data-book="${esc(w.k)}" aria-expanded="false">Request seats</button></div>
    <form class="ws-form" data-k="${esc(w.k)}" hidden>
      <div class="ws-row"><label class="small" for="wsn-${esc(w.k)}">Team size</label><select class="mini" id="wsn-${esc(w.k)}"><option>1–5</option><option>6–12</option><option>13–25</option><option>26+</option></select>
      <label class="small" for="wsm-${esc(w.k)}">Preferred month</label><select class="mini" id="wsm-${esc(w.k)}">${['Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027'].map(m => `<option>${m}</option>`).join('')}</select></div>
      <label class="sr" for="wst-${esc(w.k)}">Notes</label><textarea id="wst-${esc(w.k)}" rows="2" placeholder="Team, location or goals (optional)"></textarea>
      <div class="ws-row"><button type="submit" class="btn sm accent">Send request</button><span class="tiny" data-msg aria-live="polite"></span></div>
    </form></article>`).join('');
}
function initAcademy() {
  if (!$('#wsGrid')) return;
  $('#wsAud').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; acadAud = b.dataset.a; renderAcademy(); });
  $('#wsGrid').addEventListener('click', e => { const b = e.target.closest('[data-book]'); if (!b) return; const f = $(`.ws-form[data-k="${b.dataset.book}"]`); f.hidden = !f.hidden; b.setAttribute('aria-expanded', String(!f.hidden)); if (!f.hidden) $('select', f).focus(); });
  $('#wsGrid').addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target, k = f.dataset.k, msg = $('[data-msg]', f), btn = $('button[type=submit]', f);
    btn.disabled = true;
    try { const r = await createRequest({ service: k, details: `Team size ${$('#wsn-' + k).value} · ${$('#wsm-' + k).value}${$('#wst-' + k).value.trim() ? ' · ' + $('#wst-' + k).value.trim() : ''}`, urgency: 'standard', via: 'academy' }); msg.textContent = `Requested: ${r.label}${r.saved ? '. It’s in the request queue in the AI assistant tab.' : ' (kept for this visit only).'}`; }
    catch (err) { msg.textContent = err.message; }
    finally { btn.disabled = false; }
  });
  renderAcademy();
}

/* ---------- RIGHT-TIME ENGAGEMENT: contact-time model on synthetic, tokenized customers ---------- */
const RT_CH = [['push', 'App push'], ['sms', 'SMS'], ['email', 'Email'], ['call', 'Call'], ['inapp', 'In-app']];
const RT_CHN = Object.fromEntries(RT_CH);
const RT_GOALS = [['retention', 'Retention offer'], ['upsell', 'Upsell'], ['service', 'Service message']];
const RT_GN = Object.fromEntries(RT_GOALS);
const RT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RT_SEG = [
  { k: 'youth', l: 'Prepaid youth', peaks: [[21, 2.2], [13, 2]], wk: 1.25, ch: { push: .9, sms: .3, email: -.4, call: -.9, inapp: 1 }, arpu: 18, risk: .3 },
  { k: 'family', l: 'Postpaid family', peaks: [[20, 1.8], [8, 1.2]], wk: 1.1, ch: { push: .4, sms: .5, email: .4, call: .1, inapp: .3 }, arpu: 62, risk: .12 },
  { k: 'pro', l: 'Business professional', peaks: [[9, 1.5], [18, 1.6]], wk: .7, ch: { push: .2, sms: .3, email: .8, call: .3, inapp: 0 }, arpu: 75, risk: .1 },
  { k: 'senior', l: 'Senior', peaks: [[11, 2.2]], wk: 1, ch: { push: -.5, sms: .7, email: 0, call: .8, inapp: -.6 }, arpu: 35, risk: .08 },
  { k: 'roamer', l: 'Frequent traveller', peaks: [[7, 1.5], [22, 1.8]], wk: .9, ch: { push: .6, sms: .2, email: .5, call: -.3, inapp: .6 }, arpu: 88, risk: .18 },
  { k: 'value', l: 'Value seeker', peaks: [[19, 2.5]], wk: 1.2, ch: { push: .5, sms: .6, email: .2, call: -.5, inapp: .4 }, arpu: 25, risk: .35 }
];
const RT_F = ['Bias', 'Activity at this hour', 'Activity squared (peak sharpness)', 'Hour of day (sine)', 'Hour of day (cosine)', 'Weekend day', 'Weekend × weekend-activity ratio', 'Channel: app push', 'Channel: SMS', 'Channel: email', 'Channel: call', 'Channel: in-app', 'Past response rate on this channel', 'Service message × bill due', 'Bill due within 3 days', 'Retention offer × churn score', 'Goal: upsell', 'Goal: service', 'Contacts in the last 7 days', 'Outage × marketing', 'Outage × service', 'Recent complaint × marketing', 'Roaming × push', 'Roaming × call', 'Call after 20:00', 'Email 07:00–09:00', 'Upsell × high ARPU', 'Push × app usage', 'In-app × app usage'];
const RT_FG = [null, 'act', 'act', 'act', 'act', 'wk', 'wk', 'ch', 'ch', 'ch', 'ch', 'ch', 'rate', 'bill', 'bill', 'risk', 'goal', 'goal', 'fat', 'out', 'out', 'cmp', 'roam', 'roam', 'late', 'morn', 'arpu', 'app', 'app'];
const RT = { seed: 7, ready: false, ctl: { cust: null, ch: 'push', goal: 'retention', outage: false, bill: false, roam: false, ram: false, wknd: 'ss' } };
const rtSig = z => 1 / (1 + Math.exp(-z));
function rtRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function rtAct(c, we, ram, noisy) {
  const key = (we ? 1 : 0) + (ram ? 2 : 0) + (noisy ? 4 : 0);
  if (c.actC[key]) return c.actC[key];
  const pk = c.seg.peaks.map(([h, s]) => [h + c.shift + (ram ? 2.5 : 0), s * (ram ? 1.2 : 1)]);
  const raw = Array.from({ length: 24 }, (_, h) => {
    let v = .3; pk.forEach(([m, s]) => { let d = Math.abs(h - m) % 24; d = Math.min(d, 24 - d); v += Math.exp(-d * d / (2 * s * s)); });
    if (we) v *= h >= 10 ? c.wk : .7; if (ram && h >= 10 && h <= 16) v *= .6;
    return v * (noisy ? c.noise[(we ? 24 : 0) + h] : 1);
  });
  const mx = Math.max(...raw); return (c.actC[key] = raw.map(v => v / mx));
}
function rtTrue(c, h, ch, goal, x) {
  const mk = goal !== 'service';
  let z = -3.0 + 1.3 * rtAct(c, x.we, x.ram, false)[h] + c.aff[ch] + (x.we ? (c.wk - 1) * .8 : 0);
  if (goal === 'service') z += x.billDue ? .9 : .1; if (goal === 'retention') z += 1.6 * c.risk - .2; if (goal === 'upsell') z += c.arpu > 60 ? .3 : -.3;
  z -= .45 * x.c7; if (x.outage) z += mk ? -1.2 : .5; if (x.complaint && mk) z -= 1.5;
  if (x.roam) z += ch === 'push' ? .35 : ch === 'call' ? -.7 : 0;
  if (ch === 'call' && h >= 20) z -= .6; if (ch === 'email' && h >= 7 && h <= 9) z += .35;
  return rtSig(z);
}
function rtX(c, h, ch, goal, x) {
  const a = rtAct(c, x.we, x.ram, true)[h], mk = goal !== 'service';
  return [1, a, a * a, Math.sin(2 * Math.PI * h / 24), Math.cos(2 * Math.PI * h / 24), x.we ? 1 : 0, x.we ? c.wk - 1 : 0,
    ch === 'push' ? 1 : 0, ch === 'sms' ? 1 : 0, ch === 'email' ? 1 : 0, ch === 'call' ? 1 : 0, ch === 'inapp' ? 1 : 0, c.rate[ch],
    goal === 'service' && x.billDue ? 1 : 0, x.billDue ? 1 : 0, goal === 'retention' ? c.risk : 0, goal === 'upsell' ? 1 : 0, goal === 'service' ? 1 : 0,
    x.c7 / 3, x.outage && mk ? 1 : 0, x.outage && !mk ? 1 : 0, x.complaint && mk ? 1 : 0, x.roam && ch === 'push' ? 1 : 0, x.roam && ch === 'call' ? 1 : 0,
    ch === 'call' && h >= 20 ? 1 : 0, ch === 'email' && h >= 7 && h <= 9 ? 1 : 0, goal === 'upsell' && c.arpu > 60 ? 1 : 0, ch === 'push' ? c.app : 0, ch === 'inapp' ? c.app : 0];
}
const rtP = x => { let z = 0; for (let f = 0; f < x.length; f++) z += RT.w[f] * x[f]; return rtSig(z); };
// guardrails run before any score is used; '' means the slot is allowed
function rtBlock(c, h, ch, goal, x) {
  const mk = goal !== 'service';
  if (c.optOut) return 'Opted out of all contact';
  if (!c.consent[ch]) return `No consent for ${RT_CHN[ch]}`;
  if (mk && x.complaint) return 'Cooling-off: complaint in the last 48 hours';
  if (mk && x.outage) return 'Cooling-off: network outage in the customer’s area';
  if (mk && x.c7 >= 2) return 'Frequency cap: 2 marketing contacts in 7 days already used';
  if ((ch === 'call' || ch === 'sms') && (h < 8 || h >= 21)) return 'Quiet hours: calls and SMS only 08:00–21:00';
  if (h < 8 || h >= 22) return 'Quiet hours: no messages 22:00–08:00';
  if (ch === 'call' && x.we) return 'No sales calls on weekend days';
  if (ch === 'call' && x.ram && h >= 17 && h < 20) return 'Ramadan schedule: no calls around sunset';
  return '';
}
const rtWeekend = (d, wknd) => wknd === 'fs' ? d === 4 || d === 5 : d === 5 || d === 6;
const rtToday = () => new Date();
function rtCtx(c, d) {
  const t = RT.ctl, own = c === RT.cur && !RT.sim;
  const daysToBill = (c.bill - rtToday().getDate() + 30) % 30;
  return { we: rtWeekend(d, t.wknd), outage: own ? t.outage : false, billDue: own ? t.bill : daysToBill <= 3, ram: t.ram, c7: c.c7, complaint: c.complaint, roam: own ? t.roam : c.roam };
}
function rtAuc(ps, ys) {
  const ix = ps.map((p, i) => i).sort((a, b) => ps[a] - ps[b]); let pos = 0, rk = 0;
  ix.forEach((i, r) => { if (ys[i]) { pos++; rk += r + 1; } });
  const neg = ys.length - pos; return pos && neg ? (rk - pos * (pos + 1) / 2) / (pos * neg) : .5;
}
function rtBuild() {
  const R = rtRng(RT.seed), N = 1500, gauss = () => Math.sqrt(-2 * Math.log(R() || 1e-9)) * Math.cos(2 * Math.PI * R());
  const hx = () => Math.floor(R() * 0xffffff).toString(16).toUpperCase().padStart(6, '0');
  const cust = Array.from({ length: N }, (_, i) => {
    const S = RT_SEG[Math.floor(R() * RT_SEG.length)];
    return { id: 'C-' + hx(), i, seg: S, shift: gauss() * 1.2, aff: Object.fromEntries(RT_CH.map(([k]) => [k, S.ch[k] + gauss() * .35])),
      consent: { push: R() < .82, sms: R() < .9, email: R() < .75, call: R() < .3, inapp: R() < .88 }, optOut: R() < .03, wk: S.wk * (1 + gauss() * .12),
      bill: 1 + Math.floor(R() * 28), c7: Math.floor(R() * R() * 4), complaint: R() < .05, roam: S.k === 'roamer' ? R() < .4 : R() < .03,
      arpu: Math.round(S.arpu * (.7 + R() * .6)), risk: Math.min(.95, Math.max(.02, S.risk + gauss() * .1)), noise: Array.from({ length: 48 }, () => Math.max(.4, 1 + gauss() * .15)), actC: {} };
  });
  cust.forEach(c => { c.app = Math.min(1, Math.max(0, .5 + .3 * (c.aff.push + c.aff.inapp) / 2 + gauss() * .1)); });
  const histRow = c => {
    const chs = RT_CH.map(x => x[0]).filter(k => c.consent[k]); if (!chs.length) return null;
    const ch = chs[Math.floor(R() * chs.length)], d = Math.floor(R() * 7), h = 8 + Math.floor(R() * 13), goal = RT_GOALS[Math.floor(R() * 3)][0];
    const x = { we: d >= 5, outage: R() < .06, billDue: R() < .12, ram: false, c7: Math.floor(R() * 3), complaint: R() < .05, roam: c.roam && R() < .7 };
    return { c, d, h, ch, goal, x, y: R() < rtTrue(c, h, ch, goal, x) ? 1 : 0 };
  };
  // history A (previous 90 days) gives each customer's channel response rates; history B is the training and holdout set
  cust.forEach(c => {
    const n = {}, e = {}; RT_CH.forEach(([k]) => { n[k] = 0; e[k] = 0; });
    if (!c.optOut) for (let j = 0; j < 16; j++) { const r = histRow(c); if (r) { n[r.ch]++; e[r.ch] += r.y; } }
    c.rate = Object.fromEntries(RT_CH.map(([k]) => [k, (e[k] + .3) / (n[k] + 2)]));
  });
  const rows = []; cust.forEach(c => { if (!c.optOut) for (let j = 0; j < 12; j++) { const r = histRow(c); if (r) { r.v = rtX(c, r.h, r.ch, r.goal, r.x); r.train = c.i < N * .8; rows.push(r); } } });
  const tr = rows.filter(r => r.train), te = rows.filter(r => !r.train), k = RT_F.length;
  const w = new Float64Array(k), idx = tr.map((_, i) => i);
  for (let ep = 0; ep < 10; ep++) {
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    const lr = .12 / (1 + ep * .6);
    for (const ri of idx) { const { v, y } = tr[ri]; let z = 0; for (let f = 0; f < k; f++) z += w[f] * v[f]; const g = rtSig(z) - y; for (let f = 0; f < k; f++) w[f] -= lr * (g * v[f] + (f ? 1e-4 * w[f] : 0)); }
  }
  RT.w = w;
  // baseline: one-size-fits-all engagement rate by channel × hour, learned on the same training rows
  const bN = {}, bE = {}; tr.forEach(r => { const key = r.ch + r.h; bN[key] = (bN[key] || 0) + 1; bE[key] = (bE[key] || 0) + r.y; });
  const ys = te.map(r => r.y), ps = te.map(r => rtP(r.v)), bs = te.map(r => { const key = r.ch + r.h; return ((bE[key] || 0) + 1) / ((bN[key] || 0) + 6); });
  const base = ys.reduce((a, b) => a + b, 0) / ys.length;
  const top = ps.map((p, i) => [p, ys[i]]).sort((a, b) => b[0] - a[0]).slice(0, Math.round(ps.length * .2));
  const cal = Array.from({ length: 8 }, () => [0, 0, 0]); const pmax = Math.max(...ps);
  ps.forEach((p, i) => { const b = Math.min(7, Math.floor(p / pmax * 8)); cal[b][0] += p; cal[b][1] += ys[i]; cal[b][2]++; });
  RT.cust = cust; RT.hold = cust.filter(c => c.i >= N * .8 && !c.optOut);
  RT.m = { auc: rtAuc(ps, ys), bAuc: rtAuc(bs, ys), brier: ps.reduce((s, p, i) => s + (p - ys[i]) ** 2, 0) / ps.length, lift: top.reduce((s, t) => s + t[1], 0) / top.length / base, base,
    nTrain: tr.length, nTest: te.length, nCust: N, cal: cal.filter(b => b[2]).map(b => ({ p: b[0] / b[2], o: b[1] / b[2], n: b[2] })) };
  RT.cur = RT.hold.slice().sort((a, b) => b.risk - a.risk)[3];
  RT.impC = {}; RT.ready = true;
}
const rtEnsure = () => { if (!RT.ready) rtBuild(); };
function rtGrid(c, ch, goal) {
  const cells = [];
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) { const x = rtCtx(c, d), bl = rtBlock(c, h, ch, goal, x); cells.push({ d, h, ch, bl, p: bl ? 0 : rtP(rtX(c, h, ch, goal, x)), x }); }
  return cells;
}
function rtBest(c, goal, ch) {
  let best = null;
  (ch ? [ch] : RT_CH.map(k => k[0])).forEach(k => rtGrid(c, k, goal).forEach(z => { if (!z.bl && (!best || z.p > best.p)) best = z; }));
  return best;
}
function rtFixed(c, goal) {
  const ch = c.consent.sms ? 'sms' : c.consent.email ? 'email' : null; if (!ch) return null;
  const x = rtCtx(c, 1), bl = rtBlock(c, 10, ch, goal, x);
  return { d: 1, h: 10, ch, bl, x, p: bl ? 0 : rtP(rtX(c, 10, ch, goal, x)) };
}
function rtReasons(c, z, goal) {
  const allowed = rtGrid(c, z.ch, goal).filter(q => !q.bl); if (!allowed.length) return [];
  const xb = rtX(c, z.h, z.ch, goal, z.x), avg = new Array(xb.length).fill(0);
  allowed.forEach(q => rtX(c, q.h, q.ch, goal, q.x).forEach((v, f) => { avg[f] += v / allowed.length; }));
  const grp = {}; xb.forEach((v, f) => { const g = RT_FG[f]; if (g) grp[g] = (grp[g] || 0) + RT.w[f] * (v - avg[f]); });
  const L = { act: `Often online around ${pad(z.h)}:00 (app and data sessions)`, wk: z.x.we ? 'More active on weekend days' : 'Weekday routine', rate: `Answered ${Math.round(c.rate[z.ch] * 100)}% of past ${RT_CHN[z.ch]} messages`, bill: 'Bill due within 3 days', risk: `High churn score (${Math.round(c.risk * 100)}%), so retention offers land`, fat: 'Few recent contacts', morn: 'Reads email early in the morning', arpu: 'High-value plan', app: `Uses the app on ${Math.round(c.app * 100)}% of days`, roam: 'Roaming: push reaches them abroad' };
  const out = Object.entries(grp).filter(([g, v]) => v > .04 && L[g]).sort((a, b) => b[1] - a[1]).map(([g]) => L[g]);
  if (c.rate[z.ch] >= .2 && !out.includes(L.rate)) out.push(L.rate);
  return out.slice(0, 3);
}
const rtSlot = z => `${RT_DAYS[z.d]} ${pad(z.h)}:00–${pad((z.h + 1) % 24)}:00`;
function rtImpact(goal) {
  const key = [goal, RT.ctl.wknd, RT.ctl.ram].join('|'); if (RT.impC[key]) return RT.impC[key];
  RT.sim = true;
  let nF = 0, nM = 0, sF = 0, sM = 0, blocked = 0, arpu = 0; const seg = {};
  RT.hold.forEach(c => {
    const f = rtFixed(c, goal), b = rtBest(c, goal), z = seg[c.seg.k] || (seg[c.seg.k] = { n: 0, nF: 0, sF: 0, nM: 0, sM: 0 }); z.n++;
    if (f && !f.bl) { const t = rtTrue(c, f.h, f.ch, goal, f.x); nF++; sF += t; z.nF++; z.sF += t; }
    if (b) { const t = rtTrue(c, b.h, b.ch, goal, b.x); nM++; sM += t; arpu += c.arpu; z.nM++; z.sM += t; } else blocked++;
  });
  const pf = nF ? sF / nF : 0, pm = nM ? sM / nM : 0, avgArpu = nM ? arpu / nM : 0, extra = (pm - pf) * 1e5;
  const money = goal === 'retention' ? extra * .25 * avgArpu * 12 : goal === 'upsell' ? extra * .1 * 5 * 12 : null;
  RT.sim = false;
  return RT.impC[key] = { goal, pf, pm, nF, nM, blocked, n: RT.hold.length, uplift: pf ? pm / pf - 1 : 0, extra, money, avgArpu, seg };
}
function rtQueue(goal, n) {
  RT.sim = true;
  const now = rtToday(), d0 = (now.getDay() + 6) % 7, h0 = now.getHours(), out = [];
  RT.hold.forEach(c => {
    let best = null;
    for (let k = 1; k <= 4; k++) { const h = (h0 + k) % 24, d = (d0 + (h0 + k >= 24 ? 1 : 0)) % 7, x = rtCtx(c, d);
      RT_CH.forEach(([ch]) => { if (rtBlock(c, h, ch, goal, x)) return; const p = rtP(rtX(c, h, ch, goal, x)); if (!best || p > best.p) best = { d, h, ch, p, x }; }); }
    if (!best) return;
    const val = goal === 'retention' ? c.risk * c.arpu * 12 : goal === 'upsell' ? c.arpu * .2 * 12 : 1;
    out.push({ c, z: best, score: best.p * val, val });
  });
  RT.sim = false;
  return out.sort((a, b) => b.score - a.score).slice(0, n || 8);
}

/* studio UI */
function rtHeat() {
  const c = RT.cur, goal = RT.ctl.goal, cells = rtGrid(c, RT.ctl.ch, goal), best = cells.filter(z => !z.bl).sort((a, b) => b.p - a.p)[0];
  const cw = 26, ch = 22, L = 40, T = 20, svg = $('#rtHeat');
  svg.setAttribute('viewBox', `0 0 ${L + 24 * cw + 4} ${T + 7 * ch + 4}`);
  const fill = p => `color-mix(in srgb,var(--accent) ${(6 + 94 * Math.min(1, p / .5)).toFixed(0)}%,var(--surface-2))`;
  svg.innerHTML = `<defs><pattern id="rtHatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" style="fill:var(--surface)"/><line x1="0" y1="0" x2="0" y2="5" style="stroke:var(--line-strong);stroke-width:1.4"/></pattern></defs>` +
    [0, 3, 6, 9, 12, 15, 18, 21].map(h => `<text x="${L + h * cw + 2}" y="13" style="font:10.5px var(--f-mono);fill:var(--muted)">${pad(h)}</text>`).join('') +
    RT_DAYS.map((d, i) => `<text x="${L - 8}" y="${T + i * ch + 15}" text-anchor="end" style="font:11px var(--f-mono);fill:${rtWeekend(i, RT.ctl.wknd) ? 'var(--signal)' : 'var(--ink-2)'}">${d}</text>`).join('') +
    cells.map(z => `<rect x="${L + z.h * cw + 1}" y="${T + z.d * ch + 1}" width="${cw - 2}" height="${ch - 2}" rx="3" style="fill:${z.bl ? 'url(#rtHatch)' : fill(z.p)}"><title>${RT_DAYS[z.d]} ${pad(z.h)}:00 · ${z.bl ? 'blocked: ' + esc(z.bl) : Math.round(z.p * 100) + '% chance of engaging'}</title></rect>`).join('') +
    (best ? `<rect x="${L + best.h * cw}" y="${T + best.d * ch}" width="${cw}" height="${ch}" rx="4" style="fill:none;stroke:var(--ink);stroke-width:2"/>` : '');
  $('#rtHmNote').textContent = `${RT_CHN[RT.ctl.ch]} · ${RT_GN[goal]}`;
  return best;
}
function rtRender() {
  if (!$('#rtApp')) return; rtEnsure();
  const c = RT.cur, goal = RT.ctl.goal, bestCh = rtHeat(), bestAll = rtBest(c, goal), fx = rtFixed(c, goal);
  $$('#rtCh button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ch === RT.ctl.ch)));
  $$('#rtGoal button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.g === goal)));
  const reasons = bestAll ? rtReasons(c, bestAll, goal) : [];
  const x0 = rtCtx(c, 1), rules = [
    ['Consent', RT_CH.filter(([k]) => c.consent[k]).map(k => k[1]).join(', ') || 'none', !c.optOut],
    ['Quiet hours', 'Calls and SMS 08:00–21:00 · other messages 08:00–22:00', true],
    ['Frequency cap', `${c.c7} of 2 marketing contacts used this week`, goal === 'service' || c.c7 < 2],
    ['Cooling-off', x0.complaint ? 'Complaint in the last 48 hours: no marketing' : RT.ctl.outage ? 'Outage today: no marketing' : 'No recent complaint or outage', goal === 'service' || !(x0.complaint || RT.ctl.outage)],
    ['Rest days', `No sales calls on ${RT.ctl.wknd === 'fs' ? 'Fri–Sat' : 'Sat–Sun'}${RT.ctl.ram ? '; none around sunset in Ramadan' : ''}`, true]
  ];
  $('#rtRec').innerHTML = `<div class="box-h"><span><b>Recommendation</b> · ${esc(c.id)}</span><span>${esc(RT_GN[goal])}</span></div><div class="detail">
    ${bestAll ? `<div class="rt-best"><span class="label">Best next contact</span><b>${esc(RT_CHN[bestAll.ch])} · ${esc(rtSlot(bestAll))}</b><span class="rt-p"><span class="mono">${Math.round(bestAll.p * 100)}%</span> predicted chance of engaging</span></div>`
      : `<div class="rt-best"><span class="label">Best next contact</span><b>Do not contact this week</b><span class="small muted">Every slot is blocked by consent, a cap or a cooling-off rule.</span></div>`}
    <div class="rt-cmp">${bestCh ? `<div><span class="label">Best ${esc(RT_CHN[RT.ctl.ch])} slot</span><b>${esc(rtSlot(bestCh))} · ${Math.round(bestCh.p * 100)}%</b></div>` : `<div><span class="label">${esc(RT_CHN[RT.ctl.ch])}</span><b>blocked all week</b></div>`}
      <div><span class="label">Fixed schedule (Tue 10:00 ${fx ? esc(RT_CHN[fx.ch]) : 'SMS'})</span><b>${fx ? (fx.bl ? 'blocked' : Math.round(fx.p * 100) + '%') : 'no channel'}</b></div></div>
    ${reasons.length ? `<div><span class="label">Why this moment</span><ul class="cxl">${reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
    <div><span class="label">Guardrails checked</span><div class="rt-rules">${rules.map(r => `<div class="${r[2] ? 'ok' : 'stop'}"><i aria-hidden="true">${r[2] ? '✓' : '✕'}</i><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`).join('')}</div></div>
    ${bestAll ? `<div class="row-btns"><button type="button" class="btn sm accent" data-wsadd="rt" data-c="${esc(c.id)}">Add to my workspace</button></div>` : ''}
  </div>`;
  const days = (c.bill - rtToday().getDate() + 30) % 30;
  $('#rtProfile').innerHTML = `<div class="box-h"><span><b>Customer profile</b> · tokenized</span><span>${esc(c.id)}</span></div><div class="rt-prof">
    ${[['Segment', c.seg.l], ['Plan value', '$' + c.arpu + ' a month'], ['Churn score', Math.round(c.risk * 100) + '%'], ['Bill due', days === 0 ? 'today' : 'in ' + days + ' days'], ['Contacts this week', c.c7], ['Roaming', c.roam ? 'yes' : 'no']].map(([l, v]) => `<div><span>${esc(l)}</span><b>${esc(String(v))}</b></div>`).join('')}
    </div><div class="rt-act">${areaSpark(rtAct(c, false, RT.ctl.ram, true), 'var(--accent)')}<span class="tiny muted">Weekday activity by hour, 00–23 (behavioral data)</span></div>`;
  rtRenderEval(); rtRenderImpact(); rtRenderQueue(); rtRenderFair(); rtRenderPilot(); renderDeck(); renderSolve();
}
function rtRenderEval() {
  const m = RT.m, W = 260, H = 150, P = 30, mx = Math.max(.05, ...m.cal.map(b => Math.max(b.p, b.o))) * 1.08;
  const sx = v => P + v / mx * (W - P - 8), sy = v => H - 22 - v / mx * (H - 32);
  const wTop = Array.from(RT.w).map((v, f) => [RT_F[f], v]).slice(1).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6), wm = Math.max(...wTop.map(t => Math.abs(t[1])));
  $('#rtEval').innerHTML = `<div class="box-h"><span><b>Model evaluation</b> · held-out customers</span><span>${fmtInt(m.nTest)} contacts</span></div><div class="wb-body">
    <div class="ue-out">${[['AUC (ranking quality)', m.auc.toFixed(3), `vs ${m.bAuc.toFixed(3)} for a one-size-fits-all hour × channel rule`], ['Lift in top 20%', m.lift.toFixed(2) + '×', 'engagement vs the average contact'], ['Brier score', m.brier.toFixed(3), 'lower is better; probabilities are calibrated']].map(([l, v, s]) => `<div><span>${l}</span><b>${v}</b><span>${s}</span></div>`).join('')}</div>
    <div class="rt-two"><svg viewBox="0 0 ${W} ${H}" class="rt-cal" role="img" aria-label="Calibration: predicted versus observed engagement by score band">
      <line x1="${sx(0)}" y1="${sy(0)}" x2="${sx(mx)}" y2="${sy(mx)}" style="stroke:var(--line-strong);stroke-dasharray:4 4"/>
      <line x1="${P}" y1="${H - 22}" x2="${W - 4}" y2="${H - 22}" style="stroke:var(--line)"/><line x1="${P}" y1="6" x2="${P}" y2="${H - 22}" style="stroke:var(--line)"/>
      <polyline points="${m.cal.map(b => sx(b.p).toFixed(1) + ',' + sy(b.o).toFixed(1)).join(' ')}" style="fill:none;stroke:var(--cx-1);stroke-width:1.6"/>
      ${m.cal.map(b => `<circle cx="${sx(b.p).toFixed(1)}" cy="${sy(b.o).toFixed(1)}" r="${(2.5 + Math.sqrt(b.n) / 14).toFixed(1)}" style="fill:var(--cx-1)"><title>predicted ${Math.round(b.p * 100)}% · observed ${Math.round(b.o * 100)}% · ${b.n} contacts</title></circle>`).join('')}
      <text x="${W - 4}" y="${H - 6}" text-anchor="end" style="font:10px var(--f-mono);fill:var(--muted)">predicted →</text><text x="4" y="12" style="font:10px var(--f-mono);fill:var(--muted)">observed</text></svg>
      <div><span class="label">What the model learned (largest weights)</span><div class="rt-w">${wTop.map(([n, v]) => `<div><span>${esc(n)}</span><span class="bar"><i style="width:${(Math.abs(v) / wm * 100).toFixed(0)}%;background:${v >= 0 ? 'var(--good)' : 'var(--crit)'}"></i></span><span class="mono tiny">${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}</span></div>`).join('')}</div></div></div>
    <p class="tiny muted">Logistic regression on ${RT_F.length - 1} behavioral, transactional and contextual features. Trained on ${fmtInt(m.nTrain)} past contacts from ${fmtInt(m.nCust * .8)} customers; tested on customers it never saw.</p></div>`;
}
function rtRenderImpact() {
  const I = rtImpact(RT.ctl.goal); RT.imp = I;
  const bars = [['Fixed schedule', I.pf, 'var(--muted)'], ['Right-time model', I.pm, 'var(--accent)']], mx = Math.max(I.pf, I.pm, .01);
  $('#rtImpact').innerHTML = `<div class="box-h"><span><b>Business impact</b> · policy simulation</span><span>${esc(RT_GN[I.goal])}</span></div><div class="wb-body">
    ${bars.map(b => `<div class="rt-bar"><span>${b[0]}</span><span class="bar"><i style="width:${(b[1] / mx * 100).toFixed(1)}%;background:${b[2]}"></i></span><b class="mono">${(b[1] * 100).toFixed(1)}%</b></div>`).join('')}
    <div class="ue-out">${[['Engagement uplift', (I.uplift >= 0 ? '+' : '') + Math.round(I.uplift * 100) + '%', 'vs Tue 10:00 SMS for everyone'], ['Extra engaged per 100k', '+' + fmtInt(I.extra), 'customers contacted'], [I.money != null ? 'Revenue protected per 100k' : 'Not contacted', I.money != null ? fmtMoney(I.money) + '/yr' : fmtInt(I.blocked) + ' of ' + I.n, I.money != null ? (I.goal === 'retention' ? 'if 25% of extra engaged customers stay' : 'if 10% take a $5/month add-on') : 'blocked by guardrails']].map(([l, v, s]) => `<div><span>${l}</span><b>${v}</b><span>${s}</span></div>`).join('')}</div>
    <p class="tiny muted">Simulated on ${fmtInt(I.n)} held-out synthetic customers using the true (hidden) response model. ${fmtInt(I.blocked)} were not contacted because every slot was blocked. Revenue assumptions are illustrative; the A/B test in the report measures the real effect.</p></div>`;
}
function rtRenderQueue() {
  const q = rtQueue(RT.ctl.goal, 8); RT.q = q;
  $('#rtQueue').innerHTML = `<div class="box-h"><span><b>Contact queue</b> · next 4 hours, ranked by chance × value</span><span>${esc(RT_GN[RT.ctl.goal])}</span></div><div class="tbl-wrap"><table class="wb-table"><thead><tr><th>Customer</th><th>Segment</th><th>When</th><th>Channel</th><th>Chance</th><th>Why</th><th></th></tr></thead><tbody>` +
    (q.length ? q.map(r => `<tr><td class="mono">${esc(r.c.id)}</td><td>${esc(r.c.seg.l)}</td><td class="mono">${esc(rtSlot(r.z))}</td><td>${esc(RT_CHN[r.z.ch])}</td><td class="mono">${Math.round(r.z.p * 100)}%</td><td class="small">${esc((rtReasons(r.c, r.z, RT.ctl.goal)[0]) || '—')}</td><td><button type="button" class="btn sm" data-wsadd="rtq" data-c="${esc(r.c.id)}">Add to workspace</button></td></tr>`).join('')
      : `<tr><td colspan="7" class="muted">Quiet hours: nobody can be contacted in the next 4 hours.</td></tr>`) + '</tbody></table></div>';
}
function rtReport() {
  rtEnsure(); const m = RT.m, I = RT.imp || rtImpact(RT.ctl.goal), d = new Date().toISOString().slice(0, 10);
  const imps = RT_GOALS.map(([g, l]) => { const x = g === RT.ctl.goal ? I : rtImpact(g); return `| ${l} | ${(x.pf * 100).toFixed(1)}% | ${(x.pm * 100).toFixed(1)}% | ${x.uplift >= 0 ? '+' : ''}${Math.round(x.uplift * 100)}% | ${fmtInt(x.blocked)} of ${x.n} |`; }).join('\n');
  return `# Right-time engagement: technical report
Cellvoyant · generated ${d} · model seed ${RT.seed}

> All customers in this report are synthetic and tokenized. No real customer data was used.

## 1. Summary
Telecom companies often contact customers at the wrong moment, which wastes retention and upsell opportunities and annoys customers. This prototype predicts, for every tokenized customer, the hour, day and channel with the highest chance of engagement, and only inside the windows that consent, quiet hours, frequency caps and cooling-off rules allow.

On held-out customers the model ranks contacts with an AUC of **${m.auc.toFixed(3)}** (a one-size-fits-all hour × channel rule scores ${m.bAuc.toFixed(3)}) and the top 20% of its scores engage **${m.lift.toFixed(2)}×** more often than the average contact.

## 2. Problem background
Traditional outreach uses fixed schedules or generic triggers and ignores individual routines and real-time context. As digital interactions grow, customers expect personalized, timely and respectful contact. This responds to the industry trend toward hyper-personalization and data-driven decisions, with the goals of better experience and lower churn.

## 3. Stakeholders
- Customer experience and retention teams: own the save desk and retention offers
- Marketing and sales: own campaigns, upsell and channel mix
- Consumer analytics: own the model, monitoring and experiments
- Customers: receive fewer, better-timed contacts and can opt out at any time
- Regulatory and compliance: consent, privacy and telecom marketing rules

## 4. Data sources (synthetic in this prototype)
| Type | Data | Use |
|---|---|---|
| Behavioral | App and data sessions by hour, weekday and weekend | Activity profile at each hour |
| Behavioral | Past responses by channel (previous 90 days) | Channel response rate |
| Transactional | Bill cycle, plan value (ARPU), churn score | Bill-due and value features |
| Contextual | Network outages, roaming, complaints, rest days, Ramadan schedule | Context features and guardrails |
| Contact history | ${fmtInt(m.nTrain + m.nTest)} past contacts with outcome (engaged or not) | Training and evaluation labels |

Identifiers are random tokens (for example ${RT.hold[0].id}). No names, phone numbers, e-mail addresses or message content are stored or needed.

## 5. Features
${RT_F.slice(1).map((f, i) => `${i + 1}. ${f}`).join('\n')}

## 6. Model
- Logistic regression, L2-regularized, trained with stochastic gradient descent (10 epochs)
- Training set: ${fmtInt(m.nTrain)} contacts from ${fmtInt(m.nCust * .8)} customers; test set: ${fmtInt(m.nTest)} contacts from customers the model never saw (split by customer to avoid leakage)
- Channel response rates are computed from an earlier history window than the training labels, so the label never leaks into its own feature
- Scoring: every allowed (day, hour, channel) slot in the next 7 days is scored; the best slot is recommended with its top reasons

Largest learned weights:
${Array.from(RT.w).map((v, f) => [RT_F[f], v]).slice(1).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 8).map(([n, v]) => `- ${n}: ${v >= 0 ? '+' : ''}${v.toFixed(2)}`).join('\n')}

## 7. Evaluation
| Metric | Value |
|---|---|
| AUC, right-time model | ${m.auc.toFixed(3)} |
| AUC, hour × channel baseline | ${m.bAuc.toFixed(3)} |
| Lift in top 20% of scores | ${m.lift.toFixed(2)}× |
| Brier score | ${m.brier.toFixed(3)} |
| Base engagement rate | ${(m.base * 100).toFixed(1)}% |

Calibration (predicted vs observed):
${m.cal.map(b => `- predicted ${(b.p * 100).toFixed(1)}% → observed ${(b.o * 100).toFixed(1)}% (${b.n} contacts)`).join('\n')}

## 8. Contact policy and guardrails
Guardrails are applied before any score is used, so the model can never recommend a blocked slot.
- Consent per channel; opted-out customers are never contacted
- Quiet hours: calls and SMS only 08:00–21:00 (the US rule for telephone solicitations, 47 CFR 64.1200(c)(1), used as a reference); other messages only 08:00–22:00
- Frequency cap: at most 2 marketing contacts per customer per 7 days
- Cooling-off: no marketing within 48 hours of a complaint or during a network outage in the customer's area
- Rest days: no sales calls on weekend days (configurable: Sat–Sun or Fri–Sat); optional Ramadan schedule with no calls around sunset
- Service messages (for example a bill reminder) skip the marketing cap and cooling-off, but still respect consent and quiet hours

## 9. Findings: policy simulation
Same customers, same guardrails: fixed schedule (Tuesday 10:00 SMS, or e-mail without SMS consent) vs the right-time model.

| Goal | Fixed schedule | Right-time model | Uplift | Not contacted (blocked) |
|---|---|---|---|---|
${imps}

## 10. Business impact (illustrative)
For ${RT_GN[I.goal].toLowerCase()} contacts, the model engages about **${fmtInt(I.extra)} more customers per 100,000 contacted**.${I.money != null ? ` ${I.goal === 'retention' ? 'If 25% of those extra engaged customers stay for another 12 months at the average plan value' : 'If 10% of them take a $5 a month add-on for 12 months'}, that is about **${fmtMoney(I.money)} a year** per 100,000 customers.` : ''} These are simulation results with stated assumptions; a controlled test is needed to measure the real effect.

## 11. Fairness and segment check
Same guardrails for every segment (${RT_GN[RT.ctl.goal].toLowerCase()} contacts).

| Segment | Customers | Reachable | Fixed schedule | Right-time | Change |
|---|---|---|---|---|---|
${rtFairRows(rtImpact(RT.ctl.goal)).map(r => `| ${r.l} | ${r.n} | ${Math.round(r.reach * 100)}% | ${r.pf == null ? '—' : (r.pf * 100).toFixed(1) + '%'} | ${r.pm == null ? '—' : (r.pm * 100).toFixed(1) + '%'} | ${r.d == null ? '—' : (r.d >= 0 ? '+' : '') + Math.round(r.d * 100) + '%'} |`).join('\n')}

## 12. Pilot plan (A/B test)
${(() => { const P = rtPilot(); return `- Groups: fixed schedule (control) vs right-time model (treatment), same offer and the same guardrails
- Sample size: ${fmtInt(P.n)} customers per group to detect ${(P.p1 * 100).toFixed(1)}% → ${(P.p2 * 100).toFixed(1)}% engagement (two-sided 5% significance, ${Math.round(PILOT.pw * 100)}% power)
- Duration: about ${P.days} days at ${fmtInt(PILOT.daily)} contacts a day per group
- A churn effect needs about ${fmtInt(P.nc)} customers per group (1.4% → 1.26% monthly churn), so engagement is the leading metric and churn is confirmed over a longer window
- Success metrics: engagement rate, accepted offers, saves, churn
- Guardrail metrics: opt-outs, complaints, contacts per customer; stop if opt-outs or complaints rise more than 20% vs control`; })()}

## 13. Limitations and next steps
- Synthetic data: retrain and re-evaluate on anonymized or tokenized operator data before any decision
- Run an A/B test (fixed schedule vs right-time) with churn, engagement, opt-out and complaint rates as success and guardrail metrics
- Move from response modeling to uplift modeling (who is changed by the contact, not just who responds)
- Monitor weekly for drift, calibration and fairness across segments; retrain quarterly
- Add channel cost and message fatigue to the objective

## 14. Privacy, ethics and confidentiality
- Use only anonymized or tokenized data; minimize features to what the model needs
- Comply with the data-protection and telecom rules where the operator works (for example the EU GDPR, UAE Federal Decree-Law No. 45 of 2021 and the Saudi Personal Data Protection Law) and with local marketing-call rules
- No intrusive or spam-like contact: guardrails, caps and opt-outs are enforced in code, and every recommendation shows its reasons
- Treat all operator data as highly confidential; respect legal, ethical and cultural norms, including rest days and religious observances
`;
}
async function rtDownload() {
  const md = rtReport();
  if (downloadsNs) { try { await downloadsNs.save({ filename: 'cellvoyant-right-time-technical-report.md', data: md }); toast('Technical report saved'); return; } catch (e) { if (e && e.code === 'declined') { toast('Save cancelled'); return; } } }
  showBriefPanel(md);
}
function initRT() {
  if (!$('#rtApp')) return;
  $('#rtCh').innerHTML = RT_CH.map(([k, l]) => `<button type="button" data-ch="${k}" aria-pressed="false">${esc(l)}</button>`).join('');
  $('#rtGoal').innerHTML = RT_GOALS.map(([k, l]) => `<button type="button" data-g="${k}" aria-pressed="false">${esc(l)}</button>`).join('');
  const fillCust = () => {
    $('#rtCust').innerHTML = RT.hold.slice().sort((a, b) => b.risk - a.risk).slice(0, 40).map(c => `<option value="${esc(c.id)}">${esc(c.id)} · ${esc(c.seg.l)} · churn ${Math.round(c.risk * 100)}%</option>`).join('');
    $('#rtCust').value = RT.cur.id; $('#rtSeed').textContent = 'sample ' + RT.seed;
  };
  const syncCtx = () => { const c = RT.cur, days = (c.bill - rtToday().getDate() + 30) % 30; RT.ctl.bill = days <= 3; RT.ctl.roam = c.roam; RT.ctl.outage = false; $('#rtBill').checked = RT.ctl.bill; $('#rtRoam').checked = RT.ctl.roam; $('#rtOutage').checked = false; };
  const run = () => { rtEnsure(); fillCust(); syncCtx(); rtRender(); };
  $('#rtCust').addEventListener('change', () => { RT.cur = RT.cust.find(c => c.id === $('#rtCust').value) || RT.cur; syncCtx(); rtRender(); });
  $('#rtCh').addEventListener('click', e => { const b = e.target.closest('[data-ch]'); if (!b) return; RT.ctl.ch = b.dataset.ch; rtRender(); });
  $('#rtGoal').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; RT.ctl.goal = b.dataset.g; rtRender(); });
  [['rtOutage', 'outage'], ['rtBill', 'bill'], ['rtRoam', 'roam'], ['rtRam', 'ram']].forEach(([id, k]) => $('#' + id).addEventListener('change', e => { RT.ctl[k] = e.target.checked; if (k === 'ram') RT.cust.forEach(c => { c.actC = {}; }); rtRender(); }));
  $('#rtWknd').addEventListener('change', e => { RT.ctl.wknd = e.target.value; rtRender(); });
  $('#rtRetrain').onclick = () => { RT.seed = RT.seed % 997 + 11; RT.ready = false; run(); toast(`Retrained on sample ${RT.seed}: AUC ${RT.m.auc.toFixed(3)}`); };
  $('#rtPlan').onclick = rtPlanDownload;
  $('#plUp').addEventListener('input', e => { PILOT.up = +e.target.value; rtRenderPilot(); renderDeck(); });
  $('#plDaily').addEventListener('input', e => { PILOT.daily = +e.target.value; rtRenderPilot(); renderDeck(); });
  $('#plPw').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (!b) return; PILOT.pw = +b.dataset.p; rtRenderPilot(); renderDeck(); });
  $('#rtReport').onclick = rtDownload; $$('[data-rtreport]').forEach(b => { b.onclick = rtDownload; });
  $('#rtApp').addEventListener('click', e => { const b = e.target.closest('[data-wsadd]'); if (!b) return; const c = RT.cust.find(x => x.id === b.dataset.c); if (!c) return;
    const z = b.dataset.wsadd === 'rtq' ? (RT.q.find(r => r.c === c) || {}).z : rtBest(c, RT.ctl.goal); if (!z) return;
    addTask({ title: `${RT_GN[RT.ctl.goal]} to ${c.id} by ${RT_CHN[z.ch]}`, kind: 'contact', ref: c.id, dept: RT.ctl.goal === 'upsell' ? 'pm' : 'cx', prio: c.risk >= .3 ? 'high' : 'normal', due: rtSlot(z) }, b); });
  let started = false; const go = () => { if (started) return; started = true; run(); };
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: '600px' }); io.observe($('#rtApp')); }
  setTimeout(go, 5000);
}

/* ---------- OPERATOR WORKSPACE: shared shift board ---------- */
let tasksDb = null, tasks = [], tasksState = 'wait', tasksRO = false;
const localTasks = [];
const TASK_COLS = [['todo', 'To do'], ['doing', 'In progress'], ['done', 'Done']];
const taskList = () => (tasksDb ? tasks : localTasks).filter(t => t.status !== 'archived');
async function addTask(t, btn) {
  if (tasksRO) { toast('View-only access: tasks can’t be added here'); return null; }
  const body = { title: String(t.title || '').slice(0, 200), kind: ['signal', 'contact', 'manual'].includes(t.kind) ? t.kind : 'manual', ref: String(t.ref || '').slice(0, 40), dept: DEPT[t.dept] ? t.dept : 'st', prio: t.prio === 'high' ? 'high' : 'normal', due: String(t.due || '').slice(0, 40), status: 'todo', createdAt: new Date().toISOString() };
  if (!body.title) return null;
  if (btn) btn.disabled = true;
  try {
    if (tasksDb) { const ref = await tasksDb.collection('tasks').add(body); toast('Added to the operator workspace'); return Object.assign({ id: ref.id }, body); }
    const id = 'local' + Date.now().toString(36); localTasks.unshift(Object.assign({ id }, body)); renderWorkspace(); toast('Added to the workspace (this visit only)'); return Object.assign({ id }, body);
  } catch (e) {
    if (e && e.code === 'invalid_argument') { tasksRO = true; renderWorkspace(); toast('View-only access: tasks can’t be added here'); }
    else toast('The task could not be saved. Try again.');
    return null;
  } finally { if (btn) btn.disabled = false; }
}
async function setTaskStatus(id, status) {
  if (tasksDb && !id.startsWith('local')) { try { await tasksDb.doc('tasks/' + id).update({ status }); } catch (e) { toast('Could not update the task'); } }
  else { const t = localTasks.find(x => x.id === id); if (t) t.status = status; renderWorkspace(); }
}
function renderWorkspace() {
  const root = $('#wsBoard'); if (!root) return;
  const list = taskList(), by = s => list.filter(t => t.status === s);
  $('#wsNote').textContent = { on: 'Shared · everyone who can open this page sees this board', wait: 'Connecting…', err: 'Board unavailable right now', off: 'Kept for this visit only' }[tasksState] + (tasksRO ? ' · view-only' : '');
  root.innerHTML = TASK_COLS.map(([k, l], ci) => `<div class="wcol"><div class="wcol-h"><b>${l}</b><span class="mono tiny">${by(k).length}</span></div>${by(k).slice(0, 20).map(t => `<article class="wcard p-${esc(t.prio)}">
      <b>${esc(t.title)}</b>
      <span class="tiny muted mono">${esc(t.kind)}${t.ref ? ' · ' + esc(t.ref) : ''}${t.due ? ' · due ' + esc(t.due) : ''}</span>
      <div class="routes"><span class="rt">${esc((DEPT[t.dept] || DEPT.st).short)}</span>${t.prio === 'high' ? '<span class="sev crit">High</span>' : ''}</div>
      ${tasksRO ? '' : `<div class="wbtns">${ci > 0 ? `<button type="button" class="btn sm" data-mv="${esc(t.id)}" data-to="${TASK_COLS[ci - 1][0]}" aria-label="Move back to ${TASK_COLS[ci - 1][1]}">←</button>` : ''}${ci < 2 ? `<button type="button" class="btn sm" data-mv="${esc(t.id)}" data-to="${TASK_COLS[ci + 1][0]}">${ci === 0 ? 'Start' : 'Done'} →</button>` : `<button type="button" class="btn sm" data-mv="${esc(t.id)}" data-to="archived">Archive</button>`}</div>`}
    </article>`).join('') || '<p class="tiny muted" style="padding:6px 2px">Nothing here.</p>'}</div>`).join('');
  const open = list.filter(t => t.status !== 'done');
  $('#wsStats').innerHTML = [['Open tasks', open.length], ['High priority', open.filter(t => t.prio === 'high').length], ['Done this shift', by('done').length], ['Critical signals', events.filter(e => e.tpl.sev === 'crit' && fresh(e) > .25).length]].map(([l, v]) => `<div><span>${l}</span><b>${v}</b></div>`).join('');
  const tc = $('#taskCount'); if (tc) { tc.textContent = open.length; tc.hidden = !open.length; }
}
function handoverMD() {
  const list = taskList(), top = [...events].sort((a, b) => lensScore(b) - lensScore(a)).slice(0, 5);
  let notes = ''; try { notes = localStorage.getItem('cv-notes') || ''; } catch (e) { /* ignore */ }
  return `# Shift handover · Metro North\n${fmtClock()} (simulated market time) · lens: ${lens === 'all' ? 'all departments' : DEPT[lens].name}\n\n## Signals to watch\n` + top.map(e => `- [${e.id}] ${SEVL[e.tpl.sev]} · ${e.text} · act by ${fmtHM(actBy(e).due)} · owner ${DEPT[routeOf(e)[0]].name}`).join('\n') +
    TASK_COLS.map(([k, l]) => `\n\n## ${l}\n` + (list.filter(t => t.status === k).map(t => `- ${t.prio === 'high' ? '**High** · ' : ''}${t.title}${t.due ? ' (due ' + t.due + ')' : ''} · ${(DEPT[t.dept] || DEPT.st).name}`).join('\n') || '- none')).join('') +
    (notes.trim() ? `\n\n## Notes\n${notes.trim()}` : '') + `\n\n_Data in the console is simulated for fictional operators._\n`;
}
function initWorkspace() {
  if (!$('#wsBoard')) return;
  $('#wsDept').innerHTML = DEPTS.map(d => `<option value="${d.k}">${esc(d.name)}</option>`).join('');
  $('#wsForm').addEventListener('submit', async e => { e.preventDefault(); const t = $('#wsTitle').value.trim(); if (!t) { $('#wsTitle').focus(); return; } const r = await addTask({ title: t, kind: 'manual', dept: $('#wsDept').value, prio: $('#wsPrio').value }, $('#wsForm button[type=submit]')); if (r) $('#wsTitle').value = ''; });
  $('#wsBoard').addEventListener('click', e => { const b = e.target.closest('[data-mv]'); if (b) { b.disabled = true; setTaskStatus(b.dataset.mv, b.dataset.to); } });
  try { $('#wsNotes').value = localStorage.getItem('cv-notes') || ''; } catch (e) { /* ignore */ }
  let nt; $('#wsNotes').addEventListener('input', () => { clearTimeout(nt); nt = setTimeout(() => { try { localStorage.setItem('cv-notes', $('#wsNotes').value); } catch (e) { /* ignore */ } }, 400); });
  $('#wsHandover').onclick = async () => { const md = handoverMD(); if (downloadsNs) { try { await downloadsNs.save({ filename: 'cellvoyant-shift-handover.md', data: md }); toast('Handover note saved'); return; } catch (e) { if (e && e.code === 'declined') { toast('Save cancelled'); return; } } } showBriefPanel(md); };
  $$('#wsQuick [data-go]').forEach(b => { if (!hasTarget(b.dataset.go)) b.remove(); });
  $('#wsQuick').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) goTool(b.dataset.go); });
  (window.claude && typeof window.claude.use === 'function' ? window.claude.use('db').catch(() => null) : Promise.resolve(null)).then(d => {
    tasksDb = d || null; tasksState = tasksDb ? 'on' : 'off';
    if (tasksDb) tasksDb.collection('tasks').orderBy('createdAt', 'desc').limit(60).onSnapshot(s => { tasks = s.docs.map(x => Object.assign({ id: x.id }, x.data())); renderWorkspace(); }, () => { tasksState = 'err'; renderWorkspace(); });
    renderWorkspace();
  });
  renderWorkspace();
}

/* ---------- RESOURCES & TOOLS LIBRARY ---------- */
const RES_TPL = {
  brief: () => `# Signal brief\n\n**Signal ID:** S-____  **Date / time:** ____  **Severity:** Critical / High / Watch\n**Operator:** ____  **Signal type:** ____  **Lead owner:** ____  **Act by:** ____\n\n## What happened (one sentence)\n\n## Evidence (source · reliability)\n- \n- \n\n## So what (impact on us, with numbers)\n\n## Recommended action (owner · by when)\n1. \n2. \n\n## What to watch next\n`,
  battle: () => `# Competitor battlecard: ____\n\n**Updated:** ____  **Owner:** ____\n\n## Their position\n- Quadrant: ____\n- Owners and capital: ____\n- Headline plans and effective prices (incl. fees): ____\n\n## Recent moves (signal IDs)\n- \n\n## Where we win\n- \n\n## Where they win\n- \n\n## Talk track (factual, no disparagement)\n- \n\n## Likely next move and our pre-planned response\n- \n`,
  policy: () => `# Customer contact policy\n\n**Version:** ____  **Approved by (compliance):** ____\n\n## Consent\n- Channels and the consent each needs: push ____ · SMS ____ · e-mail ____ · call ____ · in-app ____\n- Opt-out handling and time to honor: ____\n\n## Quiet hours (local time of the customer)\n- Calls and SMS: 08:00–21:00\n- Other messages: 08:00–22:00\n- Rest days and religious observances: ____\n\n## Frequency caps\n- Marketing contacts per customer per 7 days: 2\n\n## Cooling-off\n- After a complaint: 48 hours with no marketing\n- During a network outage in the customer's area: no marketing\n\n## Data\n- Tokenized IDs only; no names, numbers or message content in models\n- Retention period: ____\n\n## Review\n- Monthly opt-out and complaint review: ____\n`,
  handover: () => `# Shift handover\n\n**Shift:** ____  **From:** ____  **To:** ____\n\n## Signals to watch (ID · act by · owner)\n- \n\n## Tasks in progress\n- \n\n## Decisions taken this shift\n- \n\n## Blockers and escalations\n- \n`,
  model: () => `# Model card: ____\n\n## Intended use\n\n## Not for\n\n## Training data (source, period, anonymization)\n\n## Features\n\n## Evaluation (metric · value · test set)\n\n## Fairness checks (segments compared)\n\n## Guardrails enforced outside the model\n\n## Owner, monitoring and retraining schedule\n`,
  workshop: () => `# Workshop preparation checklist\n\n- [ ] Goal and the decision the workshop should produce\n- [ ] Attendees from each department involved\n- [ ] Data pack: signals, plans, positioning, benchmarks (public or anonymized only)\n- [ ] Competition-law briefing: no confidential information about competitors' future prices\n- [ ] Pre-read sent 3 days before\n- [ ] Owner for every action, with a date\n`
};
const RESOURCES = [
  ['Templates', 'Signal brief', 'One page that turns a signal into a decision: what happened, evidence, impact, action, owner and act-by time.', 'dl:brief'],
  ['Templates', 'Competitor battlecard', 'Position, owners, plans, recent moves, where you win and a factual talk track.', 'dl:battle'],
  ['Templates', 'Customer contact policy', 'Consent, quiet hours, frequency caps and cooling-off rules, ready for compliance sign-off.', 'dl:policy'],
  ['Templates', 'Shift handover note', 'Signals to watch, tasks in progress, decisions and escalations for the next shift.', 'dl:handover'],
  ['Templates', 'Model card', 'Intended use, data, features, evaluation, fairness checks and monitoring for any customer model.', 'dl:model'],
  ['Templates', 'Workshop preparation checklist', 'Everything to prepare before a war game or Academy session, including a competition-law briefing.', 'dl:workshop'],
  ['Tools', 'Operator workspace', 'Shared shift board: add signals and contacts as tasks, move them through the shift, export a handover note.', 'go:tab-ws'],
  ['Tools', 'Right-time engagement studio', 'Predict the best hour, day and channel to contact each tokenized customer, inside the guardrails.', 'go:#challenge'],
  ['Tools', 'Analyst workbench', 'Benchmark 108 real operators and work out retention-offer unit economics.', 'go:tab-wb'],
  ['Tools', 'War room', 'Simulate a rival price cut and compare five responses on lines saved, cost and net impact.', 'go:tab-war'],
  ['Tools', 'Tariff DNA', 'Compare plans gene by gene and catch stealth price rises.', 'go:tab-dna'],
  ['Tools', 'AI assistant', 'Ask questions, run every tool above, write briefs and book services.', 'go:tab-ask'],
  ['Data & regulators', 'ITU ICT statistics', 'Official country-level telecom and internet statistics from the UN agency for ICT.', 'https://www.itu.int/en/ITU-D/Statistics/Pages/default.aspx'],
  ['Data & regulators', 'GSMA Intelligence', 'Operator, connection and market data across the mobile industry (subscription).', 'https://www.gsmaintelligence.com/'],
  ['Data & regulators', 'TDRA (UAE)', 'Telecommunications and Digital Government Regulatory Authority of the UAE.', 'https://tdra.gov.ae/'],
  ['Data & regulators', 'CST (Saudi Arabia)', 'Communications, Space and Technology Commission of Saudi Arabia.', 'https://www.cst.gov.sa/'],
  ['Data & regulators', 'Ofcom (UK)', 'UK communications regulator: market reports, coverage and pricing data.', 'https://www.ofcom.org.uk/'],
  ['Data & regulators', 'FCC (US)', 'US Federal Communications Commission: spectrum, coverage maps and rules.', 'https://www.fcc.gov/'],
  ['Data & regulators', 'BEREC (EU)', 'Body of European Regulators for Electronic Communications: reports and guidelines.', 'https://www.berec.europa.eu/'],
  ['Data & regulators', '3GPP', 'The standards body behind 4G, 5G and satellite direct-to-device specifications.', 'https://www.3gpp.org/'],
  ['Data & regulators', 'Ericsson Mobility Report', 'Twice-yearly forecasts for subscriptions, traffic and fixed wireless.', 'https://www.ericsson.com/en/reports-and-papers/mobility-report'],
  ['Data & regulators', 'Speedtest Global Index', 'Monthly median mobile and fixed speeds by country.', 'https://www.speedtest.net/global-index'],
  ['Privacy & rules', 'EU GDPR (official text)', 'The EU General Data Protection Regulation, Regulation (EU) 2016/679.', 'https://eur-lex.europa.eu/eli/reg/2016/679/oj'],
  ['Privacy & rules', 'UAE personal data protection law', 'Federal Decree-Law No. 45 of 2021 regarding the protection of personal data.', 'https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws'],
  ['Privacy & rules', 'SDAIA (Saudi Arabia)', 'Saudi Data and AI Authority, which oversees the Personal Data Protection Law.', 'https://sdaia.gov.sa/'],
  ['Privacy & rules', 'US calling-hours rule', '47 CFR 64.1200: no telephone solicitations before 8 a.m. or after 9 p.m. local time.', 'https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200'],
  ['Privacy & rules', 'UK ICO: direct marketing guidance', 'How UK privacy and electronic-communications rules apply to marketing calls, texts and e-mail.', 'https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/']
];
const PLAYBOOKS = [
  ['Respond to a rival price cut in 72 hours', ['Hour 0: confirm the cut with Tariff DNA and an Analyst-on-Demand check', 'Hour 4: size the port-out risk in the War room (do nothing vs four responses)', 'Hour 24: targeted credits to at-risk lines in the most exposed districts', 'Hour 48: brief stores and the save desk with a factual talk track', 'Hour 72: review port-outs against the forecast and decide whether to escalate']],
  ['Contain a churn wave in one district', ['Find the wave front on the Geo radar churn layer', 'Check Retail pressure for rival kiosks or promotions nearby', 'Score customers in the district with the right-time model; contact the top of the queue first', 'Cap and cool-off rules stay on: no more than 2 marketing contacts a week', 'Re-measure port-outs per 10k lines after 7 days']],
  ['Launch a right-time retention campaign', ['Agree the contact policy with compliance (template above)', 'Train and evaluate the model; publish the model card', 'A/B test: half fixed schedule, half right-time, same offer', 'Track engagement, churn, opt-outs and complaints daily', 'Scale only if churn falls and opt-outs and complaints do not rise']],
  ['Prepare for a spectrum auction', ['List each rival’s holdings, needs and balance-sheet headroom (Capital radar)', 'Agree the bidding envelope and walk-away price with Finance', 'Run the spectrum simulation workshop with three bidding rounds', 'File consultation responses on time (Regulatory tracker)', 'Brief the board on scenarios and the decision rules']]
];
const GLOSSARY = [
  ['ARPU', 'Average revenue per user (or line) per month.'], ['Churn', 'The share of customers who leave in a period, usually per month.'], ['Port-out / port-in', 'A customer moving their number to (or from) another operator.'],
  ['MNO', 'Mobile network operator: owns its radio network and spectrum.'], ['MVNO', 'Mobile virtual network operator: sells mobile service on another operator’s network.'], ['FWA', 'Fixed wireless access: home broadband delivered over 4G or 5G.'],
  ['Direct-to-device (D2D)', 'Satellite service that reaches ordinary phones without a dish.'], ['5G standalone', '5G with its own 5G core network, enabling features such as network slicing.'], ['CLV', 'Customer lifetime value: monthly margin × expected lifetime in months.'],
  ['CAC', 'Customer acquisition cost: what it costs to win one new line.'], ['Uplift', 'The change caused by an action compared with not taking it, measured with a control group.'], ['AUC', 'Area under the ROC curve: how well a model ranks positives above negatives (0.5 = random, 1 = perfect).'],
  ['Calibration', 'Whether predicted probabilities match observed rates (30% predicted ≈ 30% observed).'], ['Frequency cap', 'The maximum number of marketing contacts a customer can receive in a period.'], ['Quiet hours', 'Hours when customers must not be contacted, by law or by policy.'],
  ['Tokenization', 'Replacing identifiers such as phone numbers with random tokens so data can be analyzed without revealing who it is about.'], ['Signal half-life', 'The time after which a competitor signal has lost half its decision value.'], ['Act-by time', 'The signal time plus its half-life: the latest time to act while the signal is still worth most of its value.']
];
let resCat = 'All', resQ = '';
function renderResources() {
  const root = $('#resGrid'); if (!root) return;
  const cats = ['All', ...new Set(RESOURCES.map(r => r[0])), 'Playbooks', 'Glossary'], q = resQ.toLowerCase();
  const hit = (...s) => !q || s.join(' ').toLowerCase().includes(q);
  $('#resCats').innerHTML = cats.map(c => `<button type="button" data-c="${esc(c)}" aria-pressed="${c === resCat}">${esc(c)}</button>`).join('');
  const show = c => resCat === 'All' || resCat === c;
  const items = RESOURCES.filter(r => show(r[0]) && hit(r[0], r[1], r[2]) && (!r[3].startsWith('go:') || hasTarget(r[3].slice(3))));
  const pb = PLAYBOOKS.filter(p => show('Playbooks') && hit(p[0], ...p[1])), gl = GLOSSARY.filter(g => show('Glossary') && hit(g[0], g[1]));
  root.innerHTML = (items.length ? `<div class="res-grid">${items.map(([c, t, d, a]) => `<article class="res"><span class="label">${esc(c)}</span><h4>${esc(t)}</h4><p class="small">${esc(d)}</p>
      ${a.startsWith('dl:') ? `<button type="button" class="btn sm accent" data-dl="${a.slice(3)}">Download template (.md)</button>` : a.startsWith('go:') ? `<button type="button" class="btn sm" data-go="${a.slice(3)}">Open</button>` : `<a class="btn sm" href="${esc(a)}" target="_blank" rel="noopener noreferrer">Visit site ↗</a>`}</article>`).join('')}</div>` : '') +
    (pb.length ? `<h3 class="res-h">Playbooks</h3><div class="res-pb">${pb.map(([t, s]) => `<details class="panel"><summary><b>${esc(t)}</b></summary><ol class="cxl">${s.map(x => `<li>${esc(x)}</li>`).join('')}</ol></details>`).join('')}</div>` : '') +
    (gl.length ? `<h3 class="res-h">Glossary</h3><dl class="gloss">${gl.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>` : '') +
    (!items.length && !pb.length && !gl.length ? '<p class="muted">No resources match. Try another word.</p>' : '');
}
function initResources() {
  if (!$('#resGrid')) return;
  $('#resCats').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { resCat = b.dataset.c; renderResources(); } });
  let st; $('#resQ').addEventListener('input', e => { clearTimeout(st); st = setTimeout(() => { resQ = e.target.value.trim(); renderResources(); }, 120); });
  $('#resGrid').addEventListener('click', async e => {
    const g = e.target.closest('[data-go]'); if (g) { goTool(g.dataset.go); return; }
    const b = e.target.closest('[data-dl]'); if (!b) return;
    const k = b.dataset.dl, md = RES_TPL[k]();
    if (downloadsNs) { try { await downloadsNs.save({ filename: `cellvoyant-${k}-template.md`, data: md }); toast('Template saved'); return; } catch (err) { if (err && err.code === 'declined') { toast('Save cancelled'); return; } } }
    showBriefPanel(md);
  });
  renderResources();
}

/* ---------- CHALLENGE UPGRADES: fairness check, pilot planner, contact-plan export, findings deck ---------- */
function rtFairRows(I) {
  return RT_SEG.map(S => {
    const z = I.seg[S.k] || { n: 0, nF: 0, sF: 0, nM: 0, sM: 0 }, pf = z.nF ? z.sF / z.nF : null, pm = z.nM ? z.sM / z.nM : null;
    const d = pf != null && pm != null ? pm / pf - 1 : null;
    return { l: S.l, n: z.n, reach: z.n ? z.nM / z.n : 0, pf, pm, d, worse: d != null && d < -.03 };
  });
}
function rtRenderFair() {
  const I = rtImpact(RT.ctl.goal), rows = rtFairRows(I), worse = rows.filter(r => r.worse);
  $('#rtFair').innerHTML = `<div class="box-h"><span><b>Fairness &amp; segment check</b> · same guardrails for everyone</span><span>${esc(RT_GN[I.goal])}</span></div><div class="wb-body">
    <div class="rt-verdict ${worse.length ? 'bad' : 'good'}"><b>${worse.length ? `${worse.length} segment${worse.length > 1 ? 's' : ''} worse off` : 'No segment is worse off'}</b><span class="small">${worse.length ? 'Review before a pilot: ' + esc(worse.map(r => r.l).join(', ')) : 'Every segment engages at least as well as on the fixed schedule, and nobody is contacted beyond the cap.'}</span></div>
    <div class="tbl-wrap"><table class="wb-table"><thead><tr><th>Segment</th><th>Customers</th><th>Reachable</th><th>Fixed</th><th>Right-time</th><th>Change</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.l)}</td><td>${r.n}</td><td>${Math.round(r.reach * 100)}%</td><td>${r.pf == null ? '—' : (r.pf * 100).toFixed(1) + '%'}</td><td>${r.pm == null ? '—' : (r.pm * 100).toFixed(1) + '%'}</td><td class="${r.d == null || Math.abs(r.d) <= .03 ? '' : r.d > 0 ? 'up' : 'down'}">${r.d == null ? '—' : Math.abs(r.d) <= .03 ? 'on par' : (r.d > 0 ? '+' : '') + Math.round(r.d * 100) + '%'}</td></tr>`).join('')}</tbody></table></div>
    <p class="tiny muted">Reachable = share of the segment with at least one allowed slot this week. Changes within ±3% count as on par (about 50 test customers per segment). Customers without consent, or under a cap or cooling-off, are left alone.</p></div>`;
}
const PILOT = { up: 15, pw: .8, daily: 2000 };
// two-proportion sample size per group, two-sided 5% significance
function pilotN(p1, p2, pw) { const pb = (p1 + p2) / 2, zb = pw >= .9 ? 1.2816 : .8416; return Math.ceil((1.96 * Math.sqrt(2 * pb * (1 - pb)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2 / (p2 - p1) ** 2); }
function rtPilot() {
  const I = rtImpact(RT.ctl.goal), p1 = Math.max(.01, I.pf), p2 = Math.min(.99, p1 * (1 + PILOT.up / 100)), n = pilotN(p1, p2, PILOT.pw);
  return { p1, p2, n, days: Math.max(1, Math.ceil(n / PILOT.daily)), nc: pilotN(.014, .0126, PILOT.pw), goal: I.goal };
}
function rtRenderPilot() {
  const el = $('#rtPilotOut'); if (!el) return;
  const P = rtPilot();
  $('#o-plUp').textContent = '+' + PILOT.up + '%'; $('#o-plDaily').textContent = fmtInt(PILOT.daily);
  $$('#plPw button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.p === PILOT.pw)));
  el.innerHTML = [['Customers per group', fmtInt(P.n), `to detect ${(P.p1 * 100).toFixed(1)}% → ${(P.p2 * 100).toFixed(1)}% engagement`], ['Days to run', P.days, `at ${fmtInt(PILOT.daily)} contacts a day per group`], ['For a churn effect', fmtInt(P.nc), 'per group, to detect 1.4% → 1.26% monthly churn']]
    .map(([l, v, s]) => `<div><span>${l}</span><b>${v}</b><span>${s}</span></div>`).join('');
}
function rtPlanCSV() {
  rtEnsure(); const g = RT.ctl.goal, q = v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v;
  RT.sim = true;
  const rows = RT.hold.map(c => { const b = rtBest(c, g); return b ? [c.id, c.seg.l, RT_GN[g], RT_DAYS[b.d], pad(b.h) + ':00', RT_CHN[b.ch], (b.p * 100).toFixed(1), 'contact'] : [c.id, c.seg.l, RT_GN[g], '', '', '', '', 'do_not_contact']; });
  RT.sim = false;
  return ['customer_token,segment,goal,day,hour,channel,engage_probability_pct,action'].concat(rows.map(r => r.map(q).join(','))).join('\n');
}
async function rtPlanDownload() {
  const csv = rtPlanCSV();
  if (downloadsNs) { try { await downloadsNs.save({ filename: 'cellvoyant-contact-plan.csv', data: csv }); toast('Contact plan saved'); return; } catch (e) { if (e && e.code === 'declined') { toast('Save cancelled'); return; } } }
  showBriefPanel(csv);
}

let deckI = 0;
function deckSlides() {
  rtEnsure();
  const m = RT.m, G = RT_GOALS.map(([g, l]) => [l, rtImpact(g)]), I = G[0][1], P = rtPilot(), worse = rtFairRows(rtImpact(RT.ctl.goal)).filter(r => r.worse);
  const stat = a => `<div class="dk-stats">${a.map(([l, v]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
  const mx = Math.max(...G.map(([, x]) => Math.max(x.pf, x.pm)), .01);
  return [
    { t: 'Reach every customer at the right moment', lede: 'An AI model that predicts the best hour, day and channel to contact each customer, inside strict privacy and anti-spam guardrails.',
      viz: stat([['ranking quality (AUC)', m.auc.toFixed(2)], ['retention engagement vs fixed schedule', (I.uplift >= 0 ? '+' : '') + Math.round(I.uplift * 100) + '%'], ['guardrails enforced in code', '5']]),
      pts: [`AUC ${m.auc.toFixed(2)} on customers the model never saw`, `Retention engagement ${(I.pm * 100).toFixed(1)}% vs ${(I.pf * 100).toFixed(1)}% on a fixed schedule`, 'Synthetic, tokenized data in this prototype'] },
    { t: 'The problem', pts: ['Fixed schedules and generic triggers ignore each customer’s routine and context', 'Wrong-moment contacts are ignored, annoy customers and push them toward rivals', 'Customers now expect personal, timely and respectful outreach', 'Retention, upsell and satisfaction all depend on timing'] },
    { t: 'Methodology', viz: `<div class="dk-flow">${['Behavioral, transactional and contextual data', `${RT_F.length - 1} features per hour and channel`, 'Logistic regression, tested on unseen customers', 'Guardrails: consent, quiet hours, caps, cooling-off', 'Best slot, channel and reasons'].map((s, i) => `<div><span class="mono tiny">${i + 1}</span>${esc(s)}</div>`).join('<i aria-hidden="true">→</i>')}</div>`,
      get hp() { return this.pts; }, pts: ['Behavioral: app and data sessions by hour; past responses by channel', 'Transactional: bill cycle, plan value, churn score', 'Contextual: outages, roaming, complaints, rest days, Ramadan schedule', 'Split by customer for testing, so no customer appears in both sets'] },
    { t: 'Model quality', viz: stat([['AUC, right-time model', m.auc.toFixed(3)], ['AUC, one-size-fits-all rule', m.bAuc.toFixed(3)], ['engagement in the top 20% of scores', m.lift.toFixed(2) + '×'], ['Brier score (calibration)', m.brier.toFixed(3)]]),
      pts: [`AUC ${m.auc.toFixed(3)} vs ${m.bAuc.toFixed(3)} for an hour × channel rule`, `Top 20% of scores engage ${m.lift.toFixed(2)}× more than the average contact`, `Brier score ${m.brier.toFixed(3)}; predicted and observed rates line up`] },
    { t: 'Findings', viz: `<div class="dk-bars">${G.map(([l, x]) => `<div class="dk-bg"><span>${esc(l)}</span><div><i style="width:${(x.pf / mx * 100).toFixed(1)}%;background:var(--muted)"></i><b class="mono">${(x.pf * 100).toFixed(1)}%</b></div><div><i style="width:${(x.pm / mx * 100).toFixed(1)}%;background:var(--accent)"></i><b class="mono">${(x.pm * 100).toFixed(1)}%</b></div></div>`).join('')}<div class="dk-key tiny"><span><i style="background:var(--muted)"></i>Fixed schedule (Tue 10:00 SMS)</span><span><i style="background:var(--accent)"></i>Right-time model</span></div></div>`,
      pts: G.map(([l, x]) => `${l}: ${(x.pf * 100).toFixed(1)}% → ${(x.pm * 100).toFixed(1)}% engagement (${x.uplift >= 0 ? '+' : ''}${Math.round(x.uplift * 100)}%)`) },
    { t: 'Business impact', viz: stat([['more engaged customers per 100k contacted', '+' + fmtInt(I.extra)], ['revenue protected per 100k a year', fmtMoney(I.money)], ['held-out customers left alone by guardrails', fmtInt(I.blocked)]]),
      pts: [`About ${fmtInt(I.extra)} more customers engage per 100,000 retention contacts`, `If 25% of them stay 12 more months: about ${fmtMoney(I.money)} a year per 100,000 customers`, 'Illustrative simulation; the pilot measures the real effect'] },
    { t: 'Responsible by design', viz: `<div class="rt-verdict ${worse.length ? 'bad' : 'good'}"><b>${worse.length ? worse.length + ' segment(s) need review' : 'No customer segment is worse off'}</b><span class="small">Fairness check across ${RT_SEG.length} segments</span></div>`,
      get hp() { return this.pts; }, pts: ['Tokenized IDs only: no names, numbers or message content', 'Consent per channel; opt-outs are never contacted', 'Calls and SMS 08:00–21:00; no messages 22:00–08:00', 'At most 2 marketing contacts a week; none after a complaint or during an outage', 'Rest days and a Ramadan schedule are configurable'] },
    { t: 'Next step: a controlled pilot', viz: stat([['customers per group', fmtInt(P.n)], ['days at ' + fmtInt(PILOT.daily) + ' contacts a day', P.days], ['per group for a churn effect', fmtInt(P.nc)]]),
      get hp() { return this.pts.slice(1); }, pts: [`A/B test: fixed schedule vs right-time, same offer, ${fmtInt(P.n)} customers per group to detect +${PILOT.up}% engagement`, 'Success: engagement, saves and churn', 'Guardrails: opt-outs and complaints must not rise', 'Scale to all segments only if both hold'] }
  ];
}
function renderDeck() {
  const st = $('#deckStage'); if (!st || !RT.ready) return;
  const S = deckSlides(); deckI = Math.max(0, Math.min(deckI, S.length - 1)); const s = S[deckI];
  st.innerHTML = `<div class="dk-slide"><span class="label">Right-time engagement · ${deckI + 1} of ${S.length}</span><h3>${esc(s.t)}</h3>${s.lede ? `<p class="dk-lede">${esc(s.lede)}</p>` : ''}${s.viz || ''}${(s.hp || (s.viz ? [] : s.pts)).length ? `<ul>${(s.hp || s.pts).map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}</div>`;
  $('#deckDots').innerHTML = S.map((x, i) => `<button type="button" data-i="${i}" aria-label="Slide ${i + 1}: ${esc(x.t)}"${i === deckI ? ' aria-current="true"' : ''}></button>`).join('');
  $('#deckNum').textContent = `${deckI + 1} / ${S.length}`;
  $('#deckPrev').disabled = deckI === 0; $('#deckNext').disabled = deckI === S.length - 1;
}
const deckMD = () => `# Right-time engagement: findings presentation\nCellvoyant · synthetic, tokenized data · model seed ${RT.seed}\n\n` + deckSlides().map((s, i) => `---\n\n## ${i + 1}. ${s.t}\n\n${s.lede ? s.lede + '\n\n' : ''}${s.pts.map(p => '- ' + p).join('\n')}`).join('\n\n') + '\n';
function initDeck() {
  if (!$('#deck')) return;
  const go = d => { deckI += d; renderDeck(); };
  $('#deckPrev').onclick = () => go(-1); $('#deckNext').onclick = () => go(1);
  $('#deckDots').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { deckI = +b.dataset.i; renderDeck(); } });
  $('#deck').addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
  const fs = $('#deckFs');
  if (!document.fullscreenEnabled) fs.hidden = true;
  else fs.onclick = () => { const d = $('#deck'); (document.fullscreenElement ? document.exitFullscreen() : d.requestFullscreen()).catch(() => toast('Full screen isn’t available here')); };
  document.addEventListener('fullscreenchange', () => { fs.textContent = document.fullscreenElement === $('#deck') ? 'Exit full screen' : 'Present full screen'; });
  $('#deckDl').onclick = async () => { rtEnsure(); const md = deckMD(); if (downloadsNs) { try { await downloadsNs.save({ filename: 'cellvoyant-right-time-presentation.md', data: md }); toast('Presentation saved'); return; } catch (e) { if (e && e.code === 'declined') { toast('Save cancelled'); return; } } } showBriefPanel(md); };
}

/* ---------- CHALLENGE: how each problem was solved (live results) ---------- */
function renderSolve() {
  const el = $('#chSolve'); if (!el) return;
  const R = RT.ready, m = RT.m || {}, G = R ? Object.fromEntries(RT_GOALS.map(([g]) => [g, rtImpact(g)])) : {}, I = G.retention, pc = v => (v * 100).toFixed(1) + '%';
  const up = x => (x.uplift >= 0 ? '+' : '') + Math.round(x.uplift * 100) + '%', wait = '<span class="muted">loading…</span>';
  const worse = R ? rtFairRows(rtImpact(RT.ctl.goal)).filter(r => r.worse) : [];
  const groups = [
    ['The problems', [
      ['Customers are reached at the wrong moment', 'Scores every hour of the week on all five channels (840 slots) for each customer and picks the best slot the guardrails allow', '#rtApp', 'Heatmap & recommendation', R ? `Retention engagement ${pc(I.pf)} → <b>${pc(I.pm)}</b>` : wait],
      ['Fixed schedules and generic triggers', 'Replaces the one-size-fits-all send time with a personal schedule, tested head-to-head against Tuesday 10:00 SMS', '#rtImpact', 'Business impact', R ? `<b>${up(I)}</b> engagement vs the fixed schedule` : wait],
      ['Individual preferences are ignored', 'Learns each customer’s routine (activity by hour, weekday vs weekend) and channel preference (past responses, app usage)', '#rtProfile', 'Customer profile', 'Every recommendation shows its top reasons'],
      ['Real-time context is ignored', 'Context features and switches: network outage, bill due, roaming, rest days and a Ramadan schedule', '#rtApp', 'Context controls', 'The recommendation updates instantly'],
      ['Missed retention (churn)', 'The retention goal weights the churn score; the contact queue ranks customers by chance × value for the next 4 hours', '#rtQueue', 'Contact queue', R ? `+${fmtInt(I.extra)} engaged per 100k; about ${fmtMoney(I.money)}/yr protected (illustrative)` : wait],
      ['Missed upsell and satisfaction', 'Separate upsell and service-message goals with their own signals (plan value, bill due)', '#rtApp', 'Goal switch', R ? `Upsell <b>${up(G.upsell)}</b> · service <b>${up(G.service)}</b>` : wait]]],
    ['Data & model', [
      ['Use behavioral, transactional and contextual data', `${RT_F.length - 1} features from session patterns, channel history and app usage; bill cycle, plan value and churn score; outages, roaming, complaints and calendar`, '#rtEval', 'Model evaluation', R ? `AUC <b>${m.auc.toFixed(3)}</b> vs ${m.bAuc.toFixed(3)} for a fixed rule; top 20% engage ${m.lift.toFixed(2)}×` : wait],
      ['Personalization at scale', 'Scores 1,500 tokenized customers in about a tenth of a second and exports a contact plan any CRM can load', '#rtApp', 'Download contact plan (CSV)', 'One row per customer: day, hour, channel, chance, or do-not-contact']]],
    ['Constraints', [
      ['Anonymized or tokenized data only', 'Customers exist only as random tokens such as C-1A2B3C; no names, numbers or message content are used', '#rtProfile', 'Tokenized profile', 'No personal fields in the model'],
      ['Privacy and telecom rules', 'Consent per channel; calls and SMS only 08:00–21:00 (US calling-hours rule as reference); no messages 22:00–08:00', '#rtRec', 'Guardrails checked', 'Blocked slots are hatched and can never be recommended'],
      ['No intrusive or spam-like contact', 'At most 2 marketing contacts a week; no marketing after a complaint or during an outage; opt-outs never contacted', '#rtRec', 'Guardrails checked', R ? `${fmtInt(I.blocked)} of ${I.n} test customers left alone this week` : wait],
      ['Ethical and cultural guidelines', 'Configurable rest days (Sat–Sun or Fri–Sat), a Ramadan schedule, and a fairness check across customer segments', '#rtFair', 'Fairness check', R ? (worse.length ? `<span class="down">${worse.length} segment(s) need review</span>` : '<span class="up">No segment is worse off</span>') : wait],
      ['Confidentiality', 'Only synthetic data on this page; in production, data stays in the operator’s own environment', '#launch', 'FAQ', 'Treated as highly confidential']]],
    ['Stakeholders', [
      ['CX & retention, marketing & sales', 'Retention queue for the save desk; upsell and service goals for campaigns; tasks go to the operator workspace', '#departments', 'Departments', 'Each team has its own lens and workshop'],
      ['Consumer analytics', 'Model evaluation, fairness check, pilot planner and technical report', '#rtPilot', 'Pilot planner', R ? `${fmtInt(rtPilot().n)} customers per group for the A/B test` : wait],
      ['Customers and regulators', 'Fewer, better-timed contacts with easy opt-out; every rule documented in the report', '#challenge', 'Technical report', 'Section 14: privacy, ethics and confidentiality']]],
    ['Deliverables', [
      ['AI model for optimal contact times', 'Logistic regression trained in the browser, tested on customers it never saw', '#rtEval', 'Model evaluation', '<span class="up">✓ Delivered</span>'],
      ['Prototype or dashboard', 'The right-time engagement studio', '#rtApp', 'Studio', '<span class="up">✓ Delivered</span>'],
      ['Presentation: methodology, findings, impact', '8-slide deck with live numbers, downloadable', '#deck', 'Presentation', '<span class="up">✓ Delivered</span>'],
      ['Technical report', 'Data sources, features, model, evaluation, fairness, pilot plan, privacy', '#challenge', 'Download from the studio', '<span class="up">✓ Delivered</span>']]]
  ];
  el.innerHTML = `<thead><tr><th scope="col">Challenge problem or requirement</th><th scope="col">How we solved it</th><th scope="col">Where to see it</th><th scope="col">Result</th></tr></thead>` +
    groups.map(([g, rows]) => `<tbody><tr class="grp"><th colspan="4" scope="colgroup">${esc(g)}</th></tr>${rows.map(([p, sol, href, where, res]) => `<tr><th scope="row">${esc(p)}</th><td>${esc(sol)}</td><td><a href="${href}">${esc(where)}</a></td><td>${res}</td></tr>`).join('')}</tbody>`).join('');
}

/* ---------- LAUNCH: pilot sign-up ---------- */
function initLaunch() {
  renderSolve();
  const cm = $('#claimMap'); if (cm) cm.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) goTool(b.dataset.go); });
  const f = $('#pilotForm'); if (!f) return;
  const tc = $('#lcTools'); if (tc) tc.textContent = TOOLDEFS.length;
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const mods = $$('input[name=plMod]:checked', f).map(x => x.value), msg = $('#plMsg'), btn = $('button[type=submit]', f);
    if (!mods.length) { msg.textContent = 'Pick at least one module.'; return; }
    btn.disabled = true;
    try {
      const notes = $('#plNotes').value.trim();
      const r = await createRequest({ service: 'pilot', details: `Organization: ${$('#plOrg').value} · Region: ${$('#plReg').value} · Modules: ${mods.join(', ')}${notes ? ' · ' + notes : ''}`, urgency: 'standard', via: 'launch' });
      msg.textContent = `Pilot request ${r.label} sent${r.saved ? '. It’s in the request queue in the console’s AI assistant tab.' : ' (kept for this visit only).'}`; f.reset();
    } catch (err) { msg.textContent = err.message; }
    finally { btn.disabled = false; }
  });
}

/* ---------- CHALLENGE 2: CENTRAL MARKET-INTELLIGENCE HUB (sources, multilingual desk, search, access) ---------- */
// unit = illustrative compute + licence cost (USD) per refresh across all tracked competitors; hl = signal half-life (h); min = fastest interval allowed by rate limits or terms (h)
const MI_SRC = [
  { k: 'web', n: 'Competitor websites & tariff pages', cat: 'Competitors', ex: 'Plan pages, offers, store locators', conn: 'Polite crawler with change detection', fmt: 'Unstructured', acc: 'Public', hl: 24, min: 1, unit: 4, rel: .9, rule: 'robots.txt, crawl-delay and terms of service respected' },
  { k: 'app', n: 'Competitor mobile apps', cat: 'Competitors', ex: 'Release notes, in-app offers, versions', conn: 'App store listing monitor', fmt: 'Semi-structured', acc: 'Public', hl: 72, min: 6, unit: 1, rel: .85, rule: 'Public listing data only; no decompiling' },
  { k: 'social', n: 'Official social media channels', cat: 'Competitors', ex: 'Brand accounts on the major networks', conn: 'Official platform APIs', fmt: 'Unstructured', acc: 'API key', hl: 6, min: .25, unit: .5, rel: .7, rule: 'Platform rate limits and developer terms; official accounts only' },
  { k: 'ios', n: 'Apple App Store ratings & reviews', cat: 'App stores', ex: 'Ratings, review text, rank', conn: 'App Store Connect API (own apps); licensed app-intelligence feed (rivals)', fmt: 'Semi-structured', acc: 'API key / licensed', hl: 48, min: 6, unit: 2, rel: .8, rule: 'Official API for own apps; a licensed provider for competitors' },
  { k: 'gplay', n: 'Google Play ratings & reviews', cat: 'App stores', ex: 'Ratings, review text, install bands', conn: 'Google Play Developer API (own apps); licensed app-intelligence feed (rivals)', fmt: 'Semi-structured', acc: 'API key / licensed', hl: 48, min: 6, unit: 2, rel: .8, rule: 'Official API for own apps; a licensed provider for competitors' },
  { k: 'gov', n: 'Government & ministries', cat: 'Public sector', ex: 'Ministries of economy, digital and trade', conn: 'RSS and page monitor', fmt: 'Unstructured', acc: 'Public', hl: 168, min: 6, unit: .3, rel: .95, rule: 'Official sources; terms of use respected' },
  { k: 'cb', n: 'Central banks', cat: 'Public sector', ex: 'Central Bank of the UAE, Saudi Central Bank', conn: 'Publications and statistics downloads', fmt: 'Structured', acc: 'Public', hl: 720, min: 24, unit: .3, rel: .97, rule: 'Official open publications' },
  { k: 'stats', n: 'National statistics', cat: 'Public sector', ex: 'UAE FCSC, Saudi GASTAT open data', conn: 'Open-data APIs', fmt: 'Structured', acc: 'Public', hl: 2160, min: 24, unit: .3, rel: .97, rule: 'Open-data licences' },
  { k: 'reg', n: 'Telecom regulators', cat: 'Regulation', ex: 'TDRA (UAE), CST (Saudi Arabia) and peers', conn: 'Announcement and consultation monitor', fmt: 'Unstructured', acc: 'Public', hl: 168, min: 1, unit: .3, rel: .97, rule: 'Public notices; no login areas without authorization' },
  { k: 'media', n: 'Trusted business media', cat: 'Media & research', ex: 'Licensed news APIs and publisher feeds', conn: 'Licensed news API', fmt: 'Unstructured', acc: 'Licensed', hl: 12, min: .25, unit: 3, rel: .85, rule: 'Used within the licence; summaries where full text is restricted' },
  { k: 'research', n: 'Licensed research providers', cat: 'Media & research', ex: 'Analyst reports and datasets', conn: 'Authorized accounts and APIs; credentials in a vault', fmt: 'Long documents', acc: 'Licensed', hl: 720, min: 24, unit: 5, rel: .9, rule: 'Named seats and territories from the licence; no redistribution' },
  { k: 'fin', n: 'Financial reports & exchange filings', cat: 'Financial', ex: 'ADX, DFM and Tadawul disclosures; annual reports', conn: 'Exchange disclosure feeds', fmt: 'Long documents', acc: 'Public', hl: 168, min: 1, unit: 1, rel: .97, rule: 'Official disclosures' },
  { k: 'net', n: 'Network performance tests', cat: 'Network', ex: 'Crowd-sourced speed and coverage data', conn: 'Licensed measurement feed', fmt: 'Structured', acc: 'Licensed', hl: 168, min: 24, unit: 3, rel: .85, rule: 'Aggregated data under licence' },
  { k: 'int', n: 'Internal databases & spreadsheets', cat: 'Internal', ex: 'Regional databases, vendor subscriptions, analyst spreadsheets', conn: 'Database connectors, SFTP and governed upload', fmt: 'Structured', acc: 'Internal', hl: 720, min: 24, unit: .2, rel: .9, rule: 'Classified, access-controlled, stays in the tenant' }
];
const MI = { target: .25, budget: 2000, role: 'uae', q: '', type: 'all', extra: [], panel: 'src', hit: null };
const sigLog = [];
const avgFresh = (T, H) => T <= 0 ? 1 : (H / (T * Math.LN2)) * (1 - Math.pow(2, -T / H));
const fmtEvery = h => h < 1 ? Math.round(h * 60) + ' min' : h < 48 ? (+h.toFixed(h < 10 ? 1 : 0)) + ' h' : Math.round(h / 24) + ' d';
function miPlan() {
  const rows = MI_SRC.map(s => ({ s, T: Math.max(s.min, s.hl * MI.target) })), cost = r => 720 / r.T * r.s.unit;
  let total = rows.reduce((a, r) => a + cost(r), 0), guard = 0;
  // over budget: stretch the interval whose saving costs the least reliability-weighted freshness per dollar
  while (total > MI.budget && guard++ < 500) {
    let best = null;
    rows.forEach(r => { const T2 = r.T * 1.5; if (T2 > r.s.hl * 2) return; const dc = cost(r) - 720 / T2 * r.s.unit, df = (avgFresh(r.T, r.s.hl) - avgFresh(T2, r.s.hl)) * r.s.rel; if (dc > 0 && (!best || df / dc < best.sc)) best = { r, T2, sc: df / dc }; });
    if (!best) break; best.r.T = best.T2; total = rows.reduce((a, r) => a + cost(r), 0);
  }
  rows.forEach(r => { r.cost = cost(r); r.f = avgFresh(r.T, r.s.hl); r.per = 720 / r.T; });
  return { rows, total, fresh: rows.reduce((a, r) => a + r.f * r.s.rel, 0) / rows.reduce((a, r) => a + r.s.rel, 0), over: total > MI.budget + 1 };
}
function miRenderSources() {
  const P = miPlan();
  const usd = v => '$' + fmtInt(v);
  $('#o-miTarget').textContent = Math.round(MI.target * 100) + '% of half-life'; $('#o-miBudget').textContent = usd(MI.budget) + ' a month';
  $('#miSrcSum').innerHTML = [['Sources connected', MI_SRC.length + ' types'], ['Monthly refresh cost', usd(P.total)], ['Average freshness', Math.round(P.fresh * 100) + '%'], ['Budget', P.over ? `<span class="down">over: needs ${usd(P.total)}</span>` : `<span class="up">within ${usd(MI.budget)}</span>`]]
    .map(([l, v]) => `<div><span>${l}</span><b>${v}</b></div>`).join('');
  $('#miSrcTable').innerHTML = `<thead><tr><th>Source</th><th>Connector</th><th>Access</th><th>Refresh every</th><th>Cost / month</th><th>Freshness</th><th>Compliance rule</th></tr></thead><tbody>` +
    P.rows.map(r => `<tr id="mi-src-${r.s.k}"${MI.hit === r.s.k ? ' class="hit"' : ''}><td><b>${esc(r.s.n)}</b><span class="tiny muted">${esc(r.s.ex)}</span></td><td class="small">${esc(r.s.conn)}<span class="tiny muted">${esc(r.s.fmt)}</span></td><td><span class="acc acc-${r.s.acc.split(' ')[0].toLowerCase()}">${esc(r.s.acc)}</span></td><td class="mono">${fmtEvery(r.T)}</td><td class="mono">${fmtMoney(r.cost)}</td><td><span class="fbar"><i style="width:${(r.f * 100).toFixed(0)}%"></i></span><span class="mono tiny">${Math.round(r.f * 100)}%</span></td><td class="small">${esc(r.s.rule)}</td></tr>`).join('') + '</tbody>';
}

/* multilingual desk */
const MI_SAMPLES = {
  en: ['English · analyst note', 'Arcline cut its Unlimited Premium plan to $60 a month for new lines. Early reviews of the Arcline app praise the faster sign-up, but several customers complain about slow speeds in the East district. Vertex has posted 42 fixed-wireless installer roles, which suggests a home internet launch within three months. Analysts expect Nimbus to respond with targeted retention credits rather than a full price match.'],
  ar: ['العربية · خبر', 'أطلقت شركة أركلاين باقة جديدة غير محدودة بسعر 60 دولاراً شهرياً للخطوط الجديدة. ويشكو بعض العملاء من بطء الإنترنت وانقطاع الخدمة في المنطقة الشرقية، بينما أشاد آخرون بسهولة التسجيل عبر التطبيق.'],
  zh: ['中文 · 应用评论', 'Kite 推出了新的 eSIM 无限流量套餐，价格很便宜，注册也很快。但是有些用户抱怨网速太慢，晚上经常断网。'],
  long: ['English · long report', 'Metro North mobile revenue grew slowly in the third quarter as price competition intensified. Arcline led the discounting with a $10 cut on its premium plan, and its port-in volumes rose sharply in the East and Harbor districts. Vertex avoided headline price cuts but added a network access fee to a legacy plan, which raised its effective price. Pulsar opened six pop-up kiosks near Nimbus stores and bundled mobile lines with home broadband. Kite, the digital eSIM brand, gained attention with a $25 unlimited plan and a four-minute in-app sign-up. Network quality remained a key differentiator: Pulsar improved median 5G speeds by 18% after adding carriers, while complaints about Arcline outages spiked twice. The regulator opened a consultation on shared mid-band spectrum, with responses due in 45 days. Looking ahead, the main risks are a Vertex fixed-wireless launch and a wider Arcline family-plan discount, both of which could raise churn among high-value customers.']
};
const MI_POS = ['praise', 'praised', 'good', 'great', 'excellent', 'fast', 'faster', 'easy', 'cheap', 'love', 'best', 'improved', 'improve', 'growth', 'strong', 'gained', 'ممتاز', 'جيد', 'رائع', 'سريع', 'سهولة', 'أشاد', 'أفضل', 'رخيص', '很好', '优秀', '快', '便宜', '满意', '推荐', '喜欢', '方便'];
const MI_NEG = ['complain', 'complaint', 'complaints', 'slow', 'outage', 'outages', 'bad', 'poor', 'expensive', 'worse', 'decline', 'problem', 'risk', 'risks', 'churn', 'spiked', 'بطء', 'بطيء', 'انقطاع', 'يشكو', 'شكوى', 'سيء', 'مشكلة', 'غالي', 'أسوأ', '慢', '断网', '抱怨', '投诉', '差', '贵', '问题', '失望'];
const MI_CONCEPTS = {
  'Price & plans': ['price', 'prices', 'pricing', 'tariff', 'plan', 'discount', 'fee', 'سعر', 'أسعار', 'باقة', 'خصم', 'رسوم', '价格', '套餐', '降价', '资费'],
  'Network quality': ['network', 'speed', 'speeds', 'coverage', '5g', 'outage', 'outages', 'شبكة', 'سرعة', 'تغطية', 'الجيل الخامس', 'انقطاع', 'الإنترنت', '网络', '网速', '覆盖', '断网', '信号'],
  'eSIM & switching': ['esim', 'switch', 'port-in', 'port-out', 'شريحة', 'انتقال', '携号转网', 'esim'],
  'Apps & reviews': ['app', 'review', 'reviews', 'rating', 'sign-up', 'تطبيق', 'التطبيق', 'تقييم', 'التسجيل', '应用', '评论', '评分', '注册'],
  'Regulation & spectrum': ['regulator', 'regulatory', 'consultation', 'spectrum', 'licence', 'license', 'الهيئة', 'تنظيم', 'الطيف', 'ترخيص', '监管', '频谱', '牌照'],
  'Churn & retention': ['churn', 'retention', 'leave', 'complain', 'complaints', 'الاحتفاظ', 'يشكو', 'شكوى', '流失', '投诉', '抱怨'],
  'Home broadband & FWA': ['fixed-wireless', 'fixed wireless', 'fwa', 'home internet', 'broadband', 'installer', 'الإنترنت المنزلي', '家庭宽带', '宽带'],
  'Retail & stores': ['store', 'stores', 'kiosk', 'kiosks', 'retail', 'متجر', 'متاجر', '门店', '零售'],
  'Finance & capital': ['revenue', 'earnings', 'profit', 'ebitda', 'dividend', 'market cap', 'private equity', 'hedge fund', 'stake', 'acquisition', 'deal', 'إيرادات', 'أرباح', 'استحواذ', 'صفقة', '营收', '利润', '收购', '投资']
};
const MI_ALIAS = { 'أركلاين': 'Arcline', 'فيرتكس': 'Vertex', 'نيمبس': 'Nimbus', 'اتصالات': 'etisalat', '中国移动': 'China Mobile', '中国电信': 'China Telecom', '中国联通': 'China Unicom' };
const isCJKorAr = w => /[؀-ۿ一-鿿]/.test(w);
function miHas(hay, term) { if (isCJKorAr(term)) return hay.includes(term); const t = term.toLowerCase(); return new RegExp('(^|[^a-z0-9])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)', 'i').test(hay); }
function miCount(hay, list) { return list.reduce((n, w) => n + (miHas(hay, w) ? 1 : 0), 0); }
function miLang(t) {
  const c = r => (t.match(r) || []).length;
  const L = [['Arabic', c(/[؀-ۿ]/g)], ['Chinese', c(/[一-鿿]/g) * 2], ['Cyrillic', c(/[Ѐ-ӿ]/g)], ['Hindi', c(/[ऀ-ॿ]/g)], ['English', c(/[A-Za-z]/g)]].sort((a, b) => b[1] - a[1]);
  const tot = L.reduce((a, x) => a + x[1], 0) || 1;
  return L.filter((x, i) => x[1] && (i === 0 || x[1] / tot > .2)).map(x => x[0]);
}
function miSent(t) { const lo = t.toLowerCase(), p = miCount(lo, MI_POS), n = miCount(lo, MI_NEG), s = (p - n) / (p + n + 1); return { p, n, s, l: p && n && Math.abs(p - n) <= 1 ? 'Mixed' : s > .15 ? 'Positive' : s < -.15 ? 'Negative' : 'Neutral' }; }
const miSplit = t => t.replace(/\s+/g, ' ').trim().split(/(?<=[.!?。！？؟])\s*/).map(s => s.trim()).filter(s => s.length > 1);
function miSummary(t) {
  const S = miSplit(t); if (S.length <= 2) return S;
  const tok = s => isCJKorAr(s) ? (s.match(/[一-鿿]{2}|[؀-ۿ]{3,}/g) || []) : (s.toLowerCase().match(/[a-z][a-z-]{3,}/g) || []);
  const tf = {}; S.forEach(s => tok(s).forEach(w => { tf[w] = (tf[w] || 0) + 1; }));
  const k = Math.min(3, Math.ceil(S.length / 3));
  return S.map((s, i) => ({ s, i, sc: tok(s).reduce((a, w) => a + (tf[w] > 1 ? tf[w] : 0), 0) / Math.sqrt(tok(s).length + 1) + Object.values(MI_CONCEPTS).reduce((a, l) => a + (miCount(s.toLowerCase(), l) ? .8 : 0), 0) + (i === 0 ? 1.2 : 0) }))
    .sort((a, b) => b.sc - a.sc).slice(0, k).sort((a, b) => a.i - b.i).map(x => x.s);
}
function miEntities(t) {
  const lo = t.toLowerCase(), out = new Set();
  Object.values(OPS).forEach(o => { if (o.short !== 'Market' && miHas(lo, o.short)) out.add(o.name); });
  Object.entries(MI_ALIAS).forEach(([a, n]) => { if (t.includes(a)) out.add(n); });
  (POS ? POS.operators : []).forEach(c => { const s = c.short || c.name; if (s && s.length > 2 && miHas(lo, s)) out.add(c.name); });
  return [...out].slice(0, 8);
}
const miTopics = t => Object.entries(MI_CONCEPTS).filter(([, l]) => miCount(t.toLowerCase(), l)).map(([k]) => k);
function miAnalyze() {
  const t = $('#miText').value.trim(), out = $('#miOut'); if (!t) { out.innerHTML = '<p class="small muted">Paste or pick a text to analyze.</p>'; return; }
  const langs = miLang(t), sen = miSent(t), sum = miSummary(t), ents = miEntities(t), tops = miTopics(t), n = miSplit(t).length;
  const cls = sen.l === 'Positive' ? 'up' : sen.l === 'Negative' ? 'down' : 'warn';
  out.innerHTML = `<div class="ue-out mi-tiles"><div><span>Language</span><b>${esc(langs.join(' + ') || 'Unknown')}</b></div><div><span>Sentiment</span><b class="${cls}">${sen.l}</b><span>${sen.p} positive · ${sen.n} negative cues</span></div><div><span>Length</span><b>${n} sentence${n === 1 ? '' : 's'}</b></div></div>
    <div><span class="label">Summary (key ${sum.length} of ${n} sentences)</span><ul class="cxl"${langs[0] === 'Arabic' ? ' dir="rtl" lang="ar"' : langs[0] === 'Chinese' ? ' lang="zh"' : ''}>${sum.map(s => { const x = miSent(s); return `<li>${esc(s)} <span class="sentp ${x.l.toLowerCase()}">${x.l}</span></li>`; }).join('')}</ul></div>
    <div class="mi-two"><div><span class="label">Companies linked to the knowledge base</span><div class="chips">${ents.map(e => `<span class="chip hl">${esc(e)}</span>`).join('') || '<span class="small muted">none found</span>'}</div></div>
    <div><span class="label">Topics</span><div class="chips">${tops.map(e => `<span class="chip">${esc(e)}</span>`).join('') || '<span class="small muted">none found</span>'}</div></div></div>`;
  MI.last = { t, langs, sen, sum, ents, tops };
}
async function miClaude(btn) {
  const t = $('#miText').value.trim(), out = $('#miAi'); if (!t) return;
  if (!sample) { out.innerHTML = '<div class="ai-out"><span class="by">Built-in analysis</span><p class="small">Claude is not available in this view, so the built-in lexicon analysis above is used. In the Claude viewer this button translates the text to English and writes an abstractive summary.</p></div>'; return; }
  btn.disabled = true; out.innerHTML = '<div class="ai-out"><span class="by">Claude · reading</span><span class="muted">Thinking…</span></div>';
  try {
    const d = await sample.json(`You are a telecom market-intelligence analyst. Read the text below (any language). Reply with only JSON: {"language": "...", "english_translation": "faithful translation, or the text itself if already English (max 120 words)", "summary": ["2-4 short bullet points in English"], "sentiment": "positive|negative|mixed|neutral", "companies": ["..."], "recommended_action": "one sentence for the operator, never suggesting price coordination"}.\n\nTEXT:\n${t.slice(0, 6000)}`);
    out.innerHTML = `<div class="ai-out"><span class="by">Claude · ${esc(d.language || '')} → English</span>${d.english_translation ? `<p class="small">${esc(d.english_translation)}</p>` : ''}${Array.isArray(d.summary) ? `<ul class="cxl">${d.summary.slice(0, 4).map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}<p class="small"><b>Sentiment:</b> ${esc(d.sentiment || '—')} · <b>Action:</b> ${esc(d.recommended_action || '—')}</p></div>`;
  } catch (err) { out.innerHTML = `<div class="ai-out"><span class="by">Built-in analysis</span><p class="small">${esc(aiFail(err))}. The built-in analysis above still applies.</p></div>`; }
  finally { btn.disabled = false; }
}

/* knowledge base search, linked stories and emerging signals */
const MI_ROLES = {
  uae: { l: 'UAE consumer analyst', lic: 'full', bu: ['uae'] },
  intl: { l: 'International consumer analyst', lic: 'full', bu: ['intl'] },
  ent: { l: 'Enterprise (B2B) analyst', lic: 'summary', bu: ['ent'] },
  group: { l: 'Group strategy executive', lic: 'full', bu: ['uae', 'intl', 'ent'] },
  ext: { l: 'External consultant', lic: 'none', bu: [] }
};
const MI_DOCS = [
  { type: 'Document', title: 'Licensed research note: GCC mobile pricing outlook (synthetic sample)', text: 'Licensed provider forecast for mobile pricing, eSIM adoption and fixed wireless growth across Gulf markets. Price competition expected to intensify among challengers.', cls: 'licensed' },
  { type: 'Document', title: 'Internal: UAE consumer churn extract, week 43 (synthetic sample)', text: 'Tokenized aggregate churn by district and segment for the UAE consumer division. Port-outs to digital brands up in two districts. Retention offers performing above plan.', cls: 'internal', bu: 'uae' },
  { type: 'Document', title: 'Internal: international consumer pricing review (synthetic sample)', text: 'Pricing benchmarks and plan changes across international consumer markets, prepared by the international division pricing team.', cls: 'internal', bu: 'intl' },
  { type: 'Document', title: 'Internal: enterprise tender pipeline (synthetic sample)', text: 'Open public-sector and private 5G tenders, competitor bids and win/loss notes for the enterprise unit.', cls: 'internal', bu: 'ent' }
];
function miDocs() {
  const D = [];
  events.forEach(e => D.push({ type: 'Signal', title: e.text, text: [OPS[e.tpl.op].name, e.tpl.cls, e.tpl.src, e.next, ...e.evidence.map(v => v[0])].join(' '), cls: 'public', t: e.t, act: ['signal', e.id] }));
  (POS ? POS.operators : []).forEach(c => D.push({ type: 'Operator', title: c.name, text: [c.short, c.country, c.region, c.group, c.ticker, ...(c.holders || []).map(h => h.n), ...(c.improve || []), ...(c.win || []), ...(c.rivals || [])].filter(Boolean).join(' '), cls: 'public', act: ['op', c.id] }));
  (LAND ? LAND.companies : []).forEach(c => D.push({ type: 'Company', title: c.name, text: [c.seg, c.hq, c.what, c.own, ...(c.investors || []).map(i => typeof i === 'string' ? i : i.n || i.name || ''), c.recent].filter(Boolean).join(' '), cls: 'public', act: ['sec', '#landscape'] }));
  (LAND ? LAND.deals || [] : []).forEach(d => D.push({ type: 'Deal', title: `${d.investor} → ${d.target}`, text: [d.type, d.what, d.date, d.status].join(' '), cls: 'public', act: ['sec', '#landscape'] }));
  MI_SRC.forEach(s => D.push({ type: 'Source', title: s.n, text: [s.cat, s.ex, s.conn, s.acc, s.rule].join(' '), cls: 'public', act: ['src', s.k] }));
  RESOURCES.forEach(r => D.push({ type: 'Resource', title: r[1], text: r[0] + ' ' + r[2], cls: 'public', act: ['sec', '#resources'] }));
  PLAYBOOKS.forEach(p => D.push({ type: 'Playbook', title: p[0], text: p[1].join(' '), cls: 'public', act: ['sec', '#resources'] }));
  GLOSSARY.forEach(g => D.push({ type: 'Glossary', title: g[0], text: g[1], cls: 'public', act: ['sec', '#resources'] }));
  return D.concat(MI_DOCS, MI.extra);
}
function miExpand(q) {
  const lo = q.toLowerCase(), terms = new Map(), words = lo.split(/[\s,;:]+/).filter(w => w.length > 1);
  words.forEach(w => terms.set(w, 1));
  Object.values(MI_CONCEPTS).forEach(list => { if (list.some(t => miHas(lo, t) || words.some(w => w.length > 2 && t.toLowerCase().startsWith(w)))) list.forEach(t => { if (!terms.has(t.toLowerCase())) terms.set(t.toLowerCase(), .5); }); });
  Object.entries(MI_ALIAS).forEach(([a, n]) => { if (q.includes(a)) terms.set(n.toLowerCase(), 1); });
  return terms;
}
function miAccess(d) {
  const R = MI_ROLES[MI.role];
  if (d.cls === 'licensed') return R.lic === 'none' ? 'hidden' : R.lic === 'summary' ? 'summary' : 'full';
  if (d.cls === 'internal') return R.bu.includes(d.bu) ? 'full' : 'hidden';
  return 'full';
}
function miSearch(q, type) {
  const terms = miExpand(q); if (!terms.size) return { res: [], hidden: 0 };
  let hidden = 0;
  const res = miDocs().filter(d => type === 'all' || d.type === type).map(d => {
    const ti = d.title.toLowerCase(), hay = ti + ' ' + d.text.toLowerCase(); let sc = 0, direct = 0;
    terms.forEach((w, t) => { const inT = isCJKorAr(t) ? ti.includes(t) : miHas(ti, t) || (t.length > 3 && ti.includes(t)), inH = inT || (isCJKorAr(t) ? hay.includes(t) : miHas(hay, t) || (t.length > 4 && hay.includes(t))); if (inH) { sc += w * (inT ? 3 : 1); if (w === 1) direct++; } });
    if (d.type === 'Signal' && sc) sc += 2 * fresh(events.find(e => e.id === d.act[1]) || { t: 0, tpl: { hl: 24 } });
    return { d, sc, direct };
  }).filter(r => r.sc > 0).sort((a, b) => b.direct - a.direct || b.sc - a.sc);
  const out = [];
  res.forEach(r => { const a = miAccess(r.d); if (a === 'hidden') hidden++; else out.push(Object.assign(r, { a })); });
  return { res: out.slice(0, 14), hidden, total: res.length, expanded: [...terms.entries()].filter(([, w]) => w < 1).length };
}
function miRenderSearch() {
  const el = $('#miResults'); if (!el) return;
  const q = MI.q.trim();
  if (!q) { el.innerHTML = '<p class="small muted">Try “price cut”, “etisalat”, “أسعار”, “网速”, “private equity” or “spectrum”.</p>'; return; }
  const R = miSearch(q, MI.type);
  el.innerHTML = `<p class="tiny muted">${R.total} match${R.total === 1 ? '' : 'es'} · ${R.expanded} related terms added across languages${R.hidden ? ` · <b>${R.hidden} hidden by the access level of “${esc(MI_ROLES[MI.role].l)}”</b>` : ''}</p>` +
    (R.res.map(r => `<button type="button" class="mi-res" data-act="${esc(r.d.act ? r.d.act.join('|') : '')}"><span class="mi-rt"><span class="rt">${esc(r.d.type)}</span>${r.d.cls !== 'public' ? `<span class="acc acc-${r.d.cls}">${r.d.cls === 'licensed' ? 'Licensed' : 'Internal'}${r.a === 'summary' ? ' · summary only' : ''}</span>` : ''}</span><b>${esc(r.d.title)}</b><span class="small muted">${esc((r.a === 'summary' ? 'Summary access: full text needs a licensed seat. ' : '') + r.d.text.slice(0, r.a === 'summary' ? 80 : 160))}${r.d.text.length > 160 ? '…' : ''}</span></button>`).join('') || '<p class="small muted">No results for this access level.</p>');
}
function miOpen(act) {
  const [k, id] = act.split('|');
  if (k === 'signal') { selId = id; selectTab('tab-cc'); renderFeed(); renderDetail(); $('#app').scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); }
  else if (k === 'op' && POS) { const c = POS.operators.find(x => x.id === id); posS.map = 'ops'; if (c) posS.region = c.region; posSelect(id, true); }
  else if (k === 'src') { MI.hit = id; miPanel('src'); const r = $('#mi-src-' + id); if (r) r.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'center' }); }
  else if (k === 'sec') { const s = $(id); if (s) s.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); }
}
function miRenderTrends() {
  const el = $('#miTrends'); if (!el) return;
  const now = simMin, W = 12 * 60, cls = [...new Set(TPL.map(t => t.cls))];
  const rows = cls.map(c => { const rec = sigLog.filter(s => s.cls === c && now - s.t <= W).length, base = sigLog.filter(s => s.cls === c && now - s.t > W && now - s.t <= W * 5).length / 4; return { c, rec, base, rising: rec >= 2 && rec > 1.5 * Math.max(base, .5) }; }).sort((a, b) => b.rec - a.rec || b.base - a.base);
  const mx = Math.max(1, ...rows.map(r => Math.max(r.rec, r.base)));
  el.innerHTML = rows.map(r => `<div class="mi-tr"><span>${esc(r.c)}</span><span class="bar"><i style="width:${(r.base / mx * 100).toFixed(0)}%;background:var(--line-strong)"></i></span><span class="bar"><i style="width:${(r.rec / mx * 100).toFixed(0)}%;background:${r.rising ? 'var(--signal)' : 'var(--accent)'}"></i></span><span class="mono tiny">${r.rec}${r.rising ? ' <b class="warn">rising</b>' : ''}</span></div>`).join('');
  const by = {}; events.filter(e => now - e.t <= 72 * 60 && e.tpl.op !== 'all').forEach(e => { (by[e.tpl.op] = by[e.tpl.op] || []).push(e); });
  $('#miStories').innerHTML = Object.entries(by).filter(([, l]) => l.length >= 2).sort((a, b) => b[1].length - a[1].length).slice(0, 3).map(([op, l]) => `<div class="mi-story"><b><span class="opt" style="--c:${opColor(op)}">${esc(OPS[op].name)}</span> · ${l.length} linked events in 72 h</b><ul class="cxl">${l.sort((a, b) => a.t - b.t).map(e => `<li><span class="mono tiny">${esc(fmtHM(e.t))}</span> ${esc(e.tpl.cls)}: ${esc(e.text)}</li>`).join('')}</ul></div>`).join('') || '<p class="small muted">No linked stories in the last 72 hours yet.</p>';
}
function miRenderAccess() {
  const el = $('#miMatrix'); if (!el) return;
  const cols = ['Public, regulatory & app data', 'Licensed research & media', 'Internal: UAE consumer', 'Internal: international consumer', 'Internal: enterprise', 'Customer-level data'];
  const cell = (k, i) => { const R = MI_ROLES[k];
    if (i === 0) return ['Full', 'ok'];
    if (i === 1) return R.lic === 'full' ? ['Full (licensed seat)', 'ok'] : R.lic === 'summary' ? ['Summaries only', 'part'] : ['No access', 'no'];
    if (i === 5) return k === 'ext' ? ['No access', 'no'] : ['Tokenized aggregates only', 'part'];
    const bu = ['uae', 'intl', 'ent'][i - 2]; return R.bu.includes(bu) ? ['Full', 'ok'] : ['No access', 'no']; };
  el.innerHTML = `<thead><tr><th>Role</th>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>` + Object.entries(MI_ROLES).map(([k, R]) => `<tr${k === MI.role ? ' class="hit"' : ''}><th scope="row">${esc(R.l)}</th>${cols.map((c, i) => { const [v, s] = cell(k, i); return `<td><span class="ac ac-${s}">${s === 'ok' ? '✓' : s === 'part' ? '◐' : '✕'}</span> ${esc(v)}</td>`; }).join('')}</tr>`).join('') + '</tbody>';
}
function miPanel(p) {
  MI.panel = p;
  $$('#miTabs [data-p]').forEach(b => { const on = b.dataset.p === p; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; $('#mi-' + b.dataset.p).hidden = !on; });
  if (p === 'src') miRenderSources(); if (p === 'search') { miRenderSearch(); miRenderTrends(); } if (p === 'acc') miRenderAccess(); if (p === 'desk' && !MI.last) miAnalyze();
}
function initMI() {
  if (!$('#miApp')) return;
  events.forEach(e => sigLog.push({ t: e.t, cls: e.tpl.cls, op: e.tpl.op }));
  $('#miRole').innerHTML = Object.entries(MI_ROLES).map(([k, R]) => `<option value="${k}">${esc(R.l)}</option>`).join('');
  $('#miRole').value = MI.role;
  $('#miRole').addEventListener('change', e => { MI.role = e.target.value; miRenderSearch(); miRenderAccess(); $('#miRoleNote').textContent = MI_ROLES[MI.role].l; });
  $('#miRoleNote').textContent = MI_ROLES[MI.role].l;
  const tabs = $$('#miTabs [data-p]');
  tabs.forEach((b, i) => { b.addEventListener('click', () => miPanel(b.dataset.p)); b.addEventListener('keydown', e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; miPanel(n.dataset.p); n.focus(); }); });
  $('#miTarget').addEventListener('input', e => { MI.target = +e.target.value / 100; miRenderSources(); });
  $('#miBudget').addEventListener('input', e => { MI.budget = +e.target.value; miRenderSources(); });
  $('#miSamples').innerHTML = Object.entries(MI_SAMPLES).map(([k, s]) => `<button type="button" class="chip hl" data-s="${k}">${esc(s[0])}</button>`).join('');
  $('#miSamples').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; $('#miText').value = MI_SAMPLES[b.dataset.s][1]; $('#miAi').innerHTML = ''; miAnalyze(); });
  $('#miText').value = MI_SAMPLES.ar[1];
  $('#miAnalyze').onclick = miAnalyze;
  $('#miAsk').onclick = e => miClaude(e.currentTarget);
  $('#miAdd').onclick = () => { const t = $('#miText').value.trim(); if (!t) return; miAnalyze(); const cls = $('#miCls').value; MI.extra.push({ type: 'Document', title: (MI.last.sum[0] || t).slice(0, 90), text: t, cls: cls === 'public' ? 'public' : cls === 'licensed' ? 'licensed' : 'internal', bu: cls.startsWith('internal-') ? cls.slice(9) : undefined, act: null }); toast('Added to the knowledge base for this visit; try it in Search'); };
  let st; $('#miQ').addEventListener('input', e => { clearTimeout(st); st = setTimeout(() => { MI.q = e.target.value; miRenderSearch(); }, 140); });
  $('#miType').addEventListener('change', e => { MI.type = e.target.value; miRenderSearch(); });
  $('#miResults').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && b.dataset.act) miOpen(b.dataset.act); });
  $('#miQuick').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (!b) return; $('#miQ').value = b.dataset.q; MI.q = b.dataset.q; miRenderSearch(); });
  miPanel('src');
}

/* ---------- OPERATOR DESK: a department for operators, with an etisalat UAE edition ---------- */
const OD = { op: 'e-emirates-telecom', tab: 'overview', prob: 'p1', cat: 'all', gen: [], sel: null };
const EAND = {
  facts: [['16.5m', 'UAE subscribers, Sep 2026 (14.8m mobile, 1.7m fixed)', 'etisalat Q3 2026 release', 'https://www.eand.com/content/dam/eand/assets/docs/earning-release/2026/earning-releases-q3-2026.pdf'],
    ['~61%', 'of UAE mobile lines vs du, Sep 2026 (computed from company figures)', 'etisalat and du Q3 2026 releases', 'https://www.dubaiprnetwork.com/business-news/194608-du-reports-resilient-q3-performance-with-nine-month-growth-and-margin-expansion'],
    ['AED 57.6bn', 'group revenue in 9M 2026, up 10.0%', 'etisalat Q3 2026 release', 'https://www.eand.com/content/dam/eand/assets/docs/earning-release/2026/earning-releases-q3-2026.pdf'],
    ['46.4%', 'group EBITDA margin, 9M 2026', 'etisalat Q3 2026 release', 'https://www.eand.com/content/dam/eand/assets/docs/earning-release/2026/earning-releases-q3-2026.pdf'],
    ['2046', 'UAE licence renewed by TDRA for 20 years', 'etisalat Q3 2026 release', 'https://www.eand.com/content/dam/eand/assets/docs/earning-release/2026/earning-releases-q3-2026.pdf']],
  rivals: [['du', '9.5m mobile lines (7.4m prepaid, 2.0m postpaid) and 756k fixed, Sep 2026; revenue AED 12.3bn in 9M 2026, up 6.2%; growing in Home Wireless, fibre, du Pay, cloud and AI.'],
    ['Virgin Mobile UAE', 'Digital-only brand run by du on its network, aimed at app-first and price-conscious customers.']],
  swot: { 'Strengths': ['Leading UAE share and high margins', 'Group scale: 254.8m subscribers', 'AED 21.9bn from the Vodafone stake sale and a UAE licence to 2046', 'Sovereign AI Compute with Core42, etisalat money and AI partnerships (AWS, IBM, Microsoft)'],
    'Watch-outs': ['du growing in fixed wireless and fibre', 'A digital-only rival brand targets youth and price-conscious users', 'eSIM makes switching a few taps away', 'A complex international portfolio competes for management attention'],
    'Opportunities': ['Converged households: mobile, fibre and etisalat money in one account', 'Enterprise and SME demand for 5G, cloud and AI', 'Expatriate and visitor segments with specific needs', 'Right-moment, personalized offers instead of mass campaigns'],
    'Threats': ['Price competition in prepaid and youth plans', 'Slower growth in a mature, two-network market', 'Regulatory or pricing changes', 'Customer fatigue from too many messages'] }
};
const OD_SEGS = [
  { n: 'Young, digital-first', why: 'A digital-only rival brand targets them with app-first offers.', play: 'App-only plans with instant eSIM sign-up, gaming and creator data passes, and cashback in etisalat money.', ch: 'App, social creators, campus events', kpi: 'Gross adds under 30; app sign-up time', tool: ['Tariff DNA', 'tab-dna'] },
  { n: 'Families & households', why: 'du is growing in Home Wireless and fibre.', play: 'One household account: mobile lines, fibre, entertainment and shared etisalat money allowances.', ch: 'Stores, home visits, app', kpi: 'Converged households; household churn', tool: ['War room', 'tab-war'] },
  { n: 'Expatriate communities', why: 'International calling and money transfers matter every week.', play: 'Home-country bundles: calling, data and lower transfer fees through etisalat money.', ch: 'Community partners, WhatsApp, stores in key districts', kpi: 'Wallet active users; prepaid churn', tool: ['Right-time studio', '#challenge'] },
  { n: 'Tourists & visitors', why: 'Short stays need connectivity the moment they land.', play: 'Tourist eSIM by QR code with a ready etisalat money wallet and city offers.', ch: 'Airports, hotels, travel partners', kpi: 'Visitor activations; revenue per visitor', tool: ['Intelligence hub', '#challenge2'] },
  { n: 'Small businesses', why: 'Small firms buy connectivity, cloud and payments together.', play: 'SME growth pack: lines, fibre, cloud storage, an AI assistant and payment acceptance.', ch: 'SME telesales, accountants, business centres', kpi: 'SME gross adds; revenue per SME', tool: ['AI assistant', 'tab-ask'] },
  { n: 'High-value postpaid', why: 'They travel often and expect premium service.', play: 'Loyalty that travels: roaming passes, priority support and partner perks.', ch: 'Relationship managers, app', kpi: 'Postpaid churn; roaming revenue', tool: ['Right-time studio', '#challenge'] }
];
const OD_FUNNEL = [['Attract', 'Right-moment offers, creator campaigns, tourist eSIM at arrival', 'Reach, app installs, store visits'], ['Convert', 'Four-minute app sign-up, store-to-app relay, instant eSIM', 'Conversion rate, time to activate'], ['Grow', 'Cross-sell fibre, etisalat money, devices and roaming passes at the right moment', 'Products per customer, ARPU'], ['Keep', 'Save desk routed to the districts where churn is spreading; loyalty perks', 'Churn, save rate'], ['Win back', 'Win-back offers when a rival’s promotion ends or its complaints spike', 'Win-back rate']];
const OD_CHANNELS = [['Stores', 'Staff report rival offers through the Voice-of-Store bot and finish sign-ups in the app with the customer.'], ['App & digital', 'Personal offers timed by the right-time engine; instant eSIM; AI assistant in Arabic and English.'], ['Telesales & SME desk', 'Call lists ranked by chance × value, inside quiet hours and consent rules.'], ['Partners', 'Airports, hotels, community groups and accountants as sign-up points.']];
const OD_HORIZONS = [['Horizon 1 · 0–12 months', 'Defend and grow the core', ['Defend share with converged mobile, fibre and etisalat money bundles', 'Win back app-first youth with a digital offer', 'Right-time retention and save desks by district']],
  ['Horizon 2 · 1–3 years', 'Build adjacent growth', ['Make etisalat money an everyday wallet', 'Sell 5G, cloud and AI to enterprises and SMEs', 'Household services on fibre: security, smart home, entertainment']],
  ['Horizon 3 · 3+ years', 'Create new markets', ['AI services for business and government', 'Use the Mobily stake and regional scale for a Gulf data-centre and AI-cloud platform', 'Satellite partnerships for remote and outdoor coverage']]];
const OD_RESP = [['du cuts its Home Wireless price', 'Installer hiring, plan-page change', 'Targeted fibre upgrade offers in the affected districts; no blanket price cut'],
  ['A digital brand launches a youth promotion', 'App rank jump, social buzz', 'App-only counter-offer and a creator campaign within 48 hours'],
  ['du extends fibre to new areas', 'Site permits, field hiring', 'Household bundles in those districts before the rival launches'],
  ['A rival bundles payments or a wallet', 'App release notes, partner news', 'Make etisalat money rewards visible on every bill and in the app']];
const OD_PROBS = {
  p1: { t: 'Defend leadership as du grows in fixed wireless and fibre', causes: ['Households choose one provider for home and mobile', 'Fixed wireless is quick to install and easy to sell', 'Mobile-only customers have little reason to stay'], levers: ['Convergence', 'District targeting', 'Switching costs that customers value'],
    options: [['Match prices everywhere', 'Fast and simple', 'Costly; trains customers to wait for cuts'], ['Converged household bundles', 'Raises value and loyalty', 'Needs IT and store changes'], ['District-targeted offers', 'Spend only where risk is real', 'Needs good signal data']],
    rec: 'Lead with converged household bundles, and use district-targeted offers where Cellvoyant shows rival installs rising.',
    plan: [['Days 1–30', 'Map districts at risk on the Geo radar; design 2 household bundles'], ['Days 31–60', 'Pilot in 3 districts with a control group'], ['Days 61–90', 'Scale the winning bundle; train stores; review weekly']],
    kpis: ['Converged households', 'Churn in pilot districts', 'Fixed-wireless share of new home connections'], risks: ['Cannibalizing existing revenue', 'Slow bundle set-up in IT systems'], tools: [['Geo radar', 'tab-geo'], ['War room', 'tab-war'], ['Move predictor', 'tab-pred']] },
  p2: { t: 'Grow revenue per customer while data use keeps rising', causes: ['Unlimited plans cap revenue', 'Customers compare headline prices only', 'Extras are sold too late or too often'], levers: ['Value-based tiers', 'Right-moment upsell', 'Services beyond data'],
    options: [['Raise headline prices', 'Quick revenue', 'Churn risk in a competitive market'], ['Tiered plans with clear extras', 'Customers trade up willingly', 'Needs clear communication'], ['Upsell at the right moment', 'Higher take-up, fewer messages', 'Needs the right-time model live']],
    rec: 'Combine clear tiered plans with right-moment upsell of fibre, etisalat money and roaming passes.',
    plan: [['Days 1–30', 'Benchmark plans with Tariff DNA; define 3 tiers'], ['Days 31–60', 'A/B test right-time upsell vs the current schedule'], ['Days 61–90', 'Roll out the winners; track ARPU and complaints']],
    kpis: ['ARPU', 'Upsell take-up', 'Opt-outs and complaints'], risks: ['Customers see tiers as a hidden price rise', 'Message fatigue'], tools: [['Tariff DNA', 'tab-dna'], ['Right-time studio', '#challenge'], ['Analyst workbench', 'tab-wb']] },
  p3: { t: 'Win young, digital-first customers from digital-only brands', causes: ['Sign-up feels slower than an app-only brand', 'Offers feel built for older customers', 'Brand is seen as premium, not playful'], levers: ['Speed', 'Relevance', 'Community'],
    options: [['A separate digital flanker brand', 'Clear youth positioning', 'Costly to build; may cannibalize'], ['A youth plan inside the main app', 'Uses existing scale', 'Harder to feel different'], ['Partnerships with gaming and creators', 'Fast reach and credibility', 'Depends on partners']],
    rec: 'Launch a youth plan inside the app with instant eSIM, then add gaming and creator partnerships; review a flanker brand after 6 months of data.',
    plan: [['Days 1–30', 'Cut app sign-up to under 5 minutes; design the youth plan'], ['Days 31–60', 'Launch with 3 creator partners; measure under-30 gross adds'], ['Days 61–90', 'Add gaming passes; decide on a flanker brand']],
    kpis: ['Gross adds under 30', 'App sign-up time', 'Youth churn'], risks: ['Cannibalizing higher-value plans', 'Partner reputation risk'], tools: [['Tariff DNA', 'tab-dna'], ['Move predictor', 'tab-pred'], ['Intelligence hub', '#challenge2']] },
  p4: { t: 'Turn etisalat money into a reason to choose and stay with etisalat', causes: ['The wallet is seen as separate from the phone plan', 'Rewards are not visible on the bill', 'Few everyday uses'], levers: ['Bundling', 'Visible rewards', 'Everyday use cases'],
    options: [['Cashback on bills paid with etisalat money', 'Simple and visible', 'Margin cost'], ['Home-country transfer bundles for expatriates', 'Strong need and loyalty', 'Corridor partnerships needed'], ['Merchant offers through SMEs', 'Network effects', 'Slower to build']],
    rec: 'Start with bill cashback and expatriate transfer bundles, then grow merchant offers through the SME pack.',
    plan: [['Days 1–30', 'Pick 3 transfer corridors; design bill cashback'], ['Days 31–60', 'Launch in stores and the app; time offers with the right-time engine'], ['Days 61–90', 'Add SME merchant offers; measure wallet activity and churn']],
    kpis: ['Active wallet users', 'Churn of wallet users vs others', 'Transfers per user'], risks: ['Regulatory requirements for payments', 'Fraud and security'], tools: [['Right-time studio', '#challenge'], ['Capital radar', 'tab-cap'], ['AI assistant', 'tab-ask']] },
  p5: { t: 'Sell 5G, cloud and AI to enterprises and small businesses', causes: ['Buyers want outcomes, not connectivity', 'Sales teams sell products separately', 'Hard to prove value before buying'], levers: ['Industry solutions', 'Bundled packs', 'Proof through pilots'],
    options: [['Industry solutions (ports, retail, events)', 'High value per deal', 'Long sales cycles'], ['An SME growth pack', 'Volume and speed', 'Lower revenue per customer'], ['Paid pilots with clear KPIs', 'Proof for the next sale', 'Needs pre-sales capacity']],
    rec: 'Run an SME growth pack for volume and 2–3 industry solutions with paid pilots for value; track tenders with the B2B deal radar.',
    plan: [['Days 1–30', 'Pick 2 industries and design the SME pack'], ['Days 31–60', 'Launch the pack through telesales and partners; start 2 pilots'], ['Days 61–90', 'Publish pilot results; scale the pack']],
    kpis: ['SME gross adds', 'Pilot-to-contract conversion', 'Enterprise revenue growth'], risks: ['Complex delivery', 'Competition from cloud providers'], tools: [['AI assistant', 'tab-ask'], ['Command center', 'tab-cc'], ['Landscape', '#landscape']] },
  p6: { t: 'Keep prepaid customers when switching is a few taps away', causes: ['eSIM makes leaving instant', 'Prepaid users chase the best weekly offer', 'Contacts arrive at the wrong time'], levers: ['Right-moment retention', 'Loyalty that builds over time', 'District-level save offers'],
    options: [['Bigger discounts for everyone', 'Easy to run', 'Expensive; no targeting'], ['Loyalty that grows with tenure', 'Rewards staying', 'Slow to show results'], ['Right-time save offers by district', 'Targeted and efficient', 'Needs model and guardrails']],
    rec: 'Use right-time save offers in the districts where churn is spreading, plus tenure rewards paid in etisalat money.',
    plan: [['Days 1–30', 'Find churn hotspots; set the contact policy with compliance'], ['Days 31–60', 'A/B test right-time save offers (about 4,200 per group)'], ['Days 61–90', 'Scale if churn falls and opt-outs do not rise']],
    kpis: ['Prepaid churn', 'Save rate', 'Opt-outs and complaints'], risks: ['Over-contacting customers', 'Discount dependence'], tools: [['Geo radar', 'tab-geo'], ['Right-time studio', '#challenge'], ['Operator workspace', 'tab-ws']] }
};
const OD_IDEAS = [
  ['mk', 'Right-moment offers', 'Send fibre, etisalat money and roaming offers when each customer is most likely to respond, inside the contact guardrails.', 4, 2, 'Offer take-up'],
  ['mk', 'Household hub', 'One family account for mobile lines, fibre, entertainment and shared etisalat money allowances.', 5, 4, 'Converged households'],
  ['mk', 'Tourist eSIM at arrival', 'Scan a QR code at the airport to get a tourist eSIM with a ready wallet and city offers.', 3, 2, 'Visitor activations'],
  ['mk', 'Creator & gaming passes', 'Data passes for creators and low-latency gaming, sold through creator partners.', 3, 2, 'Gross adds under 30'],
  ['mk', 'Total-price promise', 'Show the full monthly price including every fee, next to the headline price.', 3, 1, 'Consideration and NPS'],
  ['sl', 'Store-to-app relay', 'Start in store, finish in the app with instant eSIM; staff log rival offers as they hear them.', 3, 2, 'Conversion rate'],
  ['sl', 'Save desk by district', 'Route save offers to the districts where churn is spreading, using the churn-contagion radar.', 4, 2, 'Save rate'],
  ['sl', 'SME growth pack', 'Lines, fibre, cloud storage, an AI assistant and payment acceptance in one pack.', 4, 3, 'SME gross adds'],
  ['sl', 'Referral wallet rewards', 'Refer a friend and both get etisalat money credit when the friend activates.', 3, 1, 'Referred activations'],
  ['st', 'AI concierge in the app', 'A multilingual assistant that answers, sells and solves in Arabic, English and other community languages.', 4, 3, 'Digital sales share'],
  ['st', 'Home-country bundles', 'Calling, data and lower transfer fees to the countries expatriate customers call most.', 4, 3, 'Wallet active users'],
  ['st', 'Event and venue slicing', 'Guaranteed-capacity connectivity for events and venues where 5G standalone is available.', 3, 4, 'Enterprise revenue'],
  ['st', 'Smart-home on fibre', 'Security, smart home and entertainment services added to fibre households.', 3, 3, 'Revenue per household'],
  ['st', 'Satellite backup partnership', 'Satellite-to-phone messaging for outdoor, desert and maritime users through a partner.', 2, 4, 'Premium plan upgrades']
];
const OD_CAT = { mk: ['Marketing', 'var(--cx-1)'], sl: ['Sales', 'var(--cx-2)'], st: ['Strategy & product', 'var(--cx-3)'] };
const OD_GEN = { seg: ['young digital natives', 'expatriate families', 'tourists and visitors', 'small businesses', 'high-value postpaid customers', 'prepaid users', 'gamers', 'remote workers'],
  hook: [['instant eSIM sign-up', 1], ['etisalat money cashback', 2], ['a shared household data pool', 2], ['5G gaming priority', 3], ['a fibre + mobile bundle', 3], ['an AI assistant in the app', 3], ['roaming passes', 1], ['loyalty points that turn into wallet credit', 2]],
  ch: ['the app at the right moment', 'store staff with a tablet', 'social creators', 'airport and hotel partners', 'SME telesales', 'WhatsApp business messaging', 'partner retailers'],
  kpi: ['gross adds', 'churn', 'ARPU', 'wallet active users', 'NPS', 'conversion rate'] };
const odOps = () => posItems('ops').sort((a, b) => (b.id === 'e-emirates-telecom') - (a.id === 'e-emirates-telecom') || revOf(b) - revOf(a));
const odCur = () => odOps().find(c => c.id === OD.op) || odOps()[0];
const isEand = () => OD.op === 'e-emirates-telecom';
function odGaps(c) {
  const M = { fiveG_SA: 'Plan 5G standalone for network slicing and enterprise services', fwa: 'Launch fixed wireless where fibre is thin', fiber: 'Build or partner for fibre to offer convergence', satellite_d2d: 'Partner for satellite-to-phone messaging', fintech: 'Add a wallet or payments partner', ai: 'Launch AI customer service and sales assistants', cloud_dc: 'Partner for cloud and data-centre services' };
  return INNOV.filter(([k]) => !(c.innov && c.innov[k] && c.innov[k][0] === true)).map(([k, l]) => [l, M[k]]);
}
function odOverview(c) {
  const q = POSM.ops.quad(c.x, c.y), own = (c.holders || []).map(h => h.n).slice(0, 3).join(', ');
  if (isEand()) return `<div class="od-facts">${EAND.facts.map(f => `<div><b>${esc(f[0])}</b><span>${esc(f[1])}</span><a class="tiny" href="${esc(f[3])}" target="_blank" rel="noopener noreferrer">${esc(f[2])} ↗</a></div>`).join('')}</div>
    <div class="od-two"><div class="panel"><span class="label">Competitors in the UAE</span>${EAND.rivals.map(r => `<p class="small" style="margin-top:8px"><b>${esc(r[0])}:</b> ${esc(r[1])}</p>`).join('')}<p class="tiny muted" style="margin-top:8px">Source: du FY2025 results release. Positioning quadrant: <b>${esc(q)}</b>.</p></div>
    <div class="panel"><span class="label">Cellvoyant assessment</span><div class="od-swot">${Object.entries(EAND.swot).map(([k, l]) => `<div><b>${esc(k)}</b><ul class="cxl">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div></div></div>`;
  return `<div class="od-facts">${[[revOf(c) ? fmtMoney(revOf(c)) : '—', 'revenue' + (c.rev && c.rev.period ? ' · ' + c.rev.period : '')], [pct(c.growth && c.growth.v), 'revenue growth'], [c.mcap && c.mcap.usd ? fmtMoney(c.mcap.usd) : '—', 'market value'], [c.share && c.share.v ? '~' + c.share.v + '%' : '—', 'home-market share (where researched)'], [q, 'positioning quadrant']].map(f => `<div><b>${esc(String(f[0]))}</b><span>${esc(f[1])}</span></div>`).join('')}</div>
    <div class="od-two"><div class="panel"><span class="label">${esc(c.name)} · ${esc(c.country || c.region || '')}</span><p class="small" style="margin-top:8px"><b>Owners:</b> ${esc(own || c.own || '—')}</p>
      <div style="margin-top:10px"><span class="label">What to improve</span><ul class="cxl">${(c.improve || ['Not researched yet']).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div style="margin-top:10px"><span class="label">How to succeed</span><ul class="cxl">${(c.win || ['Not researched yet']).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
    <div class="panel"><span class="label">Growth moves not confirmed in our research</span><ul class="cxl">${odGaps(c).slice(0, 6).map(g => `<li><b>${esc(g[0])}:</b> ${esc(g[1])}</li>`).join('') || '<li>All seven innovation areas are confirmed.</li>'}</ul>
      <p class="tiny muted" style="margin-top:10px">Competitors: ${esc((c.rivals || c.competitors || []).join(', ') || '—')}. Full sources in the Positioning section.</p>
      <div class="row-btns" style="margin-top:10px"><button type="button" class="btn sm" data-odop="${esc(c.id)}">Open in Positioning</button><button type="button" class="btn sm accent" data-odreq="op_desk">Request a full desk for ${esc(c.short || c.name)}</button></div></div></div>`;
}
const odName = () => isEand() ? 'etisalat UAE' : (odCur().short || odCur().name);
function odMarketing() {
  const pre = isEand() ? '' : `<p class="small od-note">Starter plan for ${esc(odName())}, built from the etisalat UAE edition. Segments and channels need local research.</p>`;
  return pre + `<div class="od-segs">${OD_SEGS.map(s => `<article class="od-card"><h4>${esc(s.n)}</h4><p class="small"><b>Insight:</b> ${esc(isEand() ? s.why : s.why.replace('du is growing', 'Rivals are growing').replace('A digital-only rival brand targets them', 'Digital-only brands compete for them'))}</p><p class="small"><b>Play:</b> ${esc(isEand() ? s.play : s.play.replace(/etisalat money/g, 'a wallet'))}</p><p class="tiny muted"><b>Channels:</b> ${esc(s.ch)} · <b>KPI:</b> ${esc(s.kpi)}</p>${hasTarget(s.tool[1]) ? `<div class="row-btns"><button type="button" class="chip hl" data-go="${s.tool[1]}">${esc(s.tool[0])}</button></div>` : ''}</article>`).join('')}</div>
    <div class="panel od-rules"><span class="label">Marketing rules that win trust</span><ul class="cxl"><li>Lead with the total monthly price, fees included.</li><li>Measure every campaign against a control group.</li><li>Time offers per customer with the right-time engine, never mass blasts.</li><li>At most 2 marketing contacts a week; respect quiet hours and consent.</li></ul></div>`;
}
function odSales() {
  return `<div class="od-funnel">${OD_FUNNEL.map((f, i) => `<div><span class="mono tiny">${i + 1}</span><b>${esc(f[0])}</b><span class="small">${esc(isEand() ? f[1] : f[1].replace(/etisalat money/g, 'wallet'))}</span><span class="tiny muted">KPI: ${esc(f[2])}</span></div>`).join('')}</div>
    <div class="od-two"><div class="panel"><span class="label">Channel plan</span>${OD_CHANNELS.map(c => `<p class="small" style="margin-top:8px"><b>${esc(c[0])}:</b> ${esc(c[1])}</p>`).join('')}</div>
    <div class="panel"><span class="label">Sales rhythm</span><div class="rhythm" style="margin-top:6px"><div><b>Daily</b><span>Save-desk queue and act-by priorities for the sales lens</span></div><div><b>Weekly</b><span>War-room review of rival promotions; contact queue for SMEs</span></div><div><b>Monthly</b><span>Funnel review by segment against control groups</span></div></div>
      <div class="row-btns" style="margin-top:12px"><button type="button" class="chip hl" data-go="tab-cc" data-lensto="pm">Open console with the sales lens</button><button type="button" class="chip hl" data-go="tab-ws">Operator workspace</button></div></div></div>`;
}
function odStrategy() {
  return `<div class="od-hz">${OD_HORIZONS.map(h => `<div class="od-card"><span class="label">${esc(h[0])}</span><h4>${esc(h[1])}</h4><ul class="cxl">${h[2].map(x => `<li>${esc(isEand() ? x : x.replace(/etisalat money/g, 'a wallet').replace('Use the Mobily stake and regional scale for', 'Partner for'))}</li>`).join('')}</ul></div>`).join('')}</div>
    <div class="panel"><span class="label">Response playbook: rival move → early signal → response</span><div class="tbl-wrap" style="margin-top:8px"><table class="wb-table od-resp"><thead><tr><th>Rival move</th><th>Early signal Cellvoyant watches</th><th>Recommended response</th></tr></thead><tbody>${OD_RESP.map(r => `<tr><td>${esc(isEand() ? r[0] : r[0].replace(/^du /, 'A rival '))}</td><td>${esc(r[1])}</td><td>${esc(r[2].replace(/etisalat money/g, isEand() ? 'etisalat money' : 'wallet'))}</td></tr>`).join('')}</tbody></table></div>
    <p class="tiny muted" style="margin-top:8px">Responses are unilateral choices based on public signals; Cellvoyant never suggests coordinating with competitors.</p></div>`;
}
function odSolve() {
  const P = OD_PROBS[OD.prob];
  return `<div class="od-solve"><div class="panel"><span class="label">Pick a big problem</span><div class="od-plist">${Object.entries(OD_PROBS).map(([k, p]) => `<button type="button" data-prob="${k}" aria-pressed="${k === OD.prob}">${esc(p.t)}</button>`).join('')}</div>
      <label class="label" for="odFree" style="display:block;margin-top:14px">Or describe your own problem</label><textarea id="odFree" rows="4" placeholder="e.g. Our prepaid churn rose after a rival’s summer promotion. How do we respond without a price war?"></textarea>
      <div class="row-btns"><button type="button" class="btn sm accent" id="odSolveBtn">Solve with Claude</button><button type="button" class="btn sm" data-odreq="strategy_sprint">Book a strategy sprint</button></div><div id="odAi"></div></div>
    <article class="panel od-sol"><span class="label">Solution · ${esc(odName())}</span><h3>${esc(P.t)}</h3>
      <div class="od-three"><div><b>Root causes</b><ul class="cxl">${P.causes.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div><b>Levers</b><ul class="cxl">${P.levers.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div><b>KPIs</b><ul class="cxl">${P.kpis.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
      <div class="tbl-wrap"><table class="wb-table od-opt"><thead><tr><th>Option</th><th>Upside</th><th>Downside</th></tr></thead><tbody>${P.options.map(o => `<tr><td><b>${esc(o[0])}</b></td><td>${esc(o[1])}</td><td>${esc(o[2])}</td></tr>`).join('')}</tbody></table></div>
      <p class="od-rec"><b>Recommendation:</b> ${esc(P.rec)}</p>
      <div class="od-plan">${P.plan.map(x => `<div><span class="mono tiny">${esc(x[0])}</span><span class="small">${esc(x[1])}</span></div>`).join('')}</div>
      <p class="small"><b>Risks:</b> ${esc(P.risks.join('; '))}</p>
      <div class="row-btns">${P.tools.filter(t => hasTarget(t[1])).map(t => `<button type="button" class="chip hl" data-go="${t[1]}">${esc(t[0])}</button>`).join('')}<button type="button" class="btn sm" data-odtask="${OD.prob}">Add the 90-day plan to the workspace</button></div></article></div>`;
}
function odIdeas() {
  const list = OD_IDEAS.map((x, i) => ({ i, c: x[0], t: x[1], d: x[2], im: x[3], ef: x[4], k: x[5] })).concat(OD.gen).filter(x => OD.cat === 'all' || x.c === OD.cat);
  const W = 520, H = 360, P = 44, sx = v => P + (v - .5) / 5 * (W - P - 16), sy = v => H - P - (v - .5) / 5 * (H - P - 16);
  const shape = (c, x, y) => c === 'sl' ? `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="2" style="fill:${OD_CAT[c][1]}"/>` : c === 'st' ? `<polygon points="${x},${y - 8} ${x + 8},${y + 7} ${x - 8},${y + 7}" style="fill:${OD_CAT[c][1]}"/>` : `<circle cx="${x}" cy="${y}" r="7.5" style="fill:${OD_CAT[c][1]}"/>`;
  const seen = {};
  const pts = list.map((x, n) => { const key = x.ef + '-' + x.im, o = seen[key] = (seen[key] || 0) + 1; const X = sx(x.ef) + (o - 1) * 17 - 8, Y = sy(x.im); return `<g class="od-pt" data-idea="${x.i}" tabindex="0" role="button" aria-label="${esc(x.t)}: impact ${x.im}, effort ${x.ef}">${shape(x.c, X, Y)}<text x="${X}" y="${Y + 4}" text-anchor="middle" style="font:700 9px var(--f-mono);fill:var(--bg)">${n + 1}</text></g>`; }).join('');
  return `<div class="od-ideas"><div class="panel"><div class="od-ibar"><div class="seg-btns" id="odCat" role="group" aria-label="Idea type">${[['all', 'All'], ...Object.entries(OD_CAT).map(([k, v]) => [k, v[0]])].map(([k, l]) => `<button type="button" data-cat="${k}" aria-pressed="${OD.cat === k}">${esc(l)}</button>`).join('')}</div><button type="button" class="btn sm" id="odGen">Spark a new idea</button><button type="button" class="btn sm accent" id="odGenAi">Generate ideas with Claude</button></div>
      <svg viewBox="0 0 ${W} ${H}" class="od-mx" role="img" aria-label="Impact versus effort map of the ideas">
        <rect x="${sx(.5)}" y="${sy(5.5)}" width="${sx(3) - sx(.5)}" height="${sy(3) - sy(5.5)}" style="fill:var(--good-soft)"/>
        <line x1="${sx(3)}" y1="${sy(5.5)}" x2="${sx(3)}" y2="${sy(.5)}" style="stroke:var(--line-strong);stroke-dasharray:4 4"/><line x1="${sx(.5)}" y1="${sy(3)}" x2="${sx(5.5)}" y2="${sy(3)}" style="stroke:var(--line-strong);stroke-dasharray:4 4"/>
        <text x="${sx(.6)}" y="${sy(5.3)}" style="font:600 11px var(--f-body);fill:var(--good)">Quick wins</text><text x="${sx(5.4)}" y="${sy(5.3)}" text-anchor="end" style="font:600 11px var(--f-body);fill:var(--ink-2)">Big bets</text><text x="${sx(.6)}" y="${sy(.7)}" style="font:600 11px var(--f-body);fill:var(--muted)">Fill-ins</text><text x="${sx(5.4)}" y="${sy(.7)}" text-anchor="end" style="font:600 11px var(--f-body);fill:var(--muted)">Avoid</text>
        <text x="${(W + P) / 2}" y="${H - 10}" text-anchor="middle" style="font:11px var(--f-mono);fill:var(--muted)">EFFORT →</text><text x="14" y="${(H - P) / 2}" transform="rotate(-90 14 ${(H - P) / 2})" text-anchor="middle" style="font:11px var(--f-mono);fill:var(--muted)">IMPACT →</text>${pts}</svg>
      <div class="legend-row tiny">${Object.entries(OD_CAT).map(([k, v]) => `<span><i class="sw sw-c${k === 'mk' ? 1 : k === 'sl' ? 2 : 3}"></i>${esc(v[0])}</span>`).join('')}<span>Shaded = quick wins</span></div></div>
    <div class="od-ilist">${list.map((x, n) => `<article class="od-idea${OD.sel === x.i ? ' on' : ''}" id="od-idea-${x.i}"><div class="od-ih"><span class="mono tiny">${n + 1}</span><span class="rt">${esc(OD_CAT[x.c][0])}</span><span class="tiny muted">impact ${x.im}/5 · effort ${x.ef}/5</span></div><b>${esc(x.t)}</b><span class="small">${esc(isEand() || x.gen ? x.d : x.d.replace(/etisalat money/g, 'wallet'))}</span><span class="tiny muted">KPI: ${esc(x.k)}${x.gen ? ' · ' + esc(x.gen) : ''}</span><div><button type="button" class="btn sm" data-ideatask="${x.i}">Add to workspace</button></div></article>`).join('')}</div></div><div id="odIdeaAi"></div>`;
}
function odRender() {
  const root = $('#odBody'); if (!root) return;
  const c = odCur();
  $('#odBadge').textContent = isEand() ? 'Special edition · etisalat UAE' : 'Standard desk';
  $('#odBadge').className = 'pill' + (isEand() ? ' sim' : '');
  $$('#odTabs [data-t]').forEach(b => { const on = b.dataset.t === OD.tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  root.setAttribute('aria-labelledby', 'odt-' + OD.tab);
  root.innerHTML = { overview: () => odOverview(c), marketing: odMarketing, sales: odSales, strategy: odStrategy, solve: odSolve, ideas: odIdeas }[OD.tab]();
}
async function odClaude(btn, kind) {
  const out = kind === 'solve' ? $('#odAi') : $('#odIdeaAi'), free = kind === 'solve' ? ($('#odFree').value || '').trim() : '';
  if (kind === 'solve' && !free) { out.innerHTML = '<p class="small muted" style="margin-top:8px">Describe the problem first, or pick one from the list.</p>'; return; }
  if (!sample) { out.innerHTML = `<div class="ai-out" style="margin-top:10px"><span class="by">Built-in desk</span><p class="small">${kind === 'solve' ? 'Claude is not available in this view. The closest built-in solution is shown; open the platform in Claude for a custom answer, or book a strategy sprint.' : 'Claude is not available in this view. Use “Spark a new idea” for built-in ideas.'}</p></div>`;
    if (kind === 'solve') { const lo = free.toLowerCase(), best = Object.entries(OD_PROBS).map(([k, p]) => [k, [...p.causes, ...p.levers, p.t].join(' ').toLowerCase().split(/\W+/).filter(w => w.length > 4 && lo.includes(w)).length]).sort((a, b) => b[1] - a[1])[0]; if (best && best[1]) { OD.prob = best[0]; odRender(); $('#odAi').innerHTML = '<p class="small muted" style="margin-top:8px">Showing the closest built-in solution.</p>'; } }
    return; }
  btn.disabled = true; out.innerHTML = '<div class="ai-out" style="margin-top:10px"><span class="by">Claude · thinking</span><span class="muted">Working on it…</span></div>';
  const ctx = isEand() ? `Operator: etisalat UAE. Facts: ${EAND.facts.map(f => f[0] + ' ' + f[1]).join('; ')}. Rivals: ${EAND.rivals.map(r => r[0] + ': ' + r[1]).join(' ')}` : `Operator: ${odCur().name} (${odCur().country || odCur().region}). Improve: ${(odCur().improve || []).join('; ')}. Win: ${(odCur().win || []).join('; ')}.`;
  try {
    if (kind === 'solve') {
      const d = await sample.json(`You are a senior telecom strategy consultant. ${ctx}\nProblem: ${free.slice(0, 1500)}\nRules: unilateral strategies only, never coordination with competitors; respect customer consent and privacy; no invented statistics.\nReply with only JSON: {"problem":"one sentence","root_causes":["3"],"options":[{"name":"","upside":"","downside":""}],"recommendation":"","plan_90_days":["days 1-30 ...","days 31-60 ...","days 61-90 ..."],"kpis":["3"],"risks":["2"]}`);
      out.innerHTML = `<div class="ai-out" style="margin-top:10px"><span class="by">Claude · custom solution</span><p class="small"><b>${esc(d.problem || '')}</b></p><p class="small"><b>Root causes:</b> ${esc((d.root_causes || []).join('; '))}</p><ul class="cxl">${(d.options || []).slice(0, 4).map(o => `<li><b>${esc(o.name)}</b>: ${esc(o.upside)} / ${esc(o.downside)}</li>`).join('')}</ul><p class="small"><b>Recommendation:</b> ${esc(d.recommendation || '')}</p><ul class="cxl">${(d.plan_90_days || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="small"><b>KPIs:</b> ${esc((d.kpis || []).join(', '))} · <b>Risks:</b> ${esc((d.risks || []).join('; '))}</p></div>`;
    } else {
      const d = await sample.json(`You are a telecom marketing and product innovator. ${ctx}\nCreate 4 new, specific ideas to attract and keep customers (marketing, sales or product). Unilateral only, privacy-respecting, no invented statistics. Reply with only JSON: {"ideas":[{"title":"","description":"one sentence","type":"mk|sl|st","impact":1-5,"effort":1-5,"kpi":""}]}`);
      (d.ideas || []).slice(0, 4).forEach(x => OD.gen.push({ i: 'g' + OD.gen.length, c: OD_CAT[x.type] ? x.type : 'mk', t: String(x.title || 'Idea').slice(0, 60), d: String(x.description || '').slice(0, 220), im: Math.min(5, Math.max(1, +x.impact || 3)), ef: Math.min(5, Math.max(1, +x.effort || 3)), k: String(x.kpi || '—').slice(0, 40), gen: 'from Claude' }));
      odRender(); toast('New ideas added to the map');
    }
  } catch (err) { out.innerHTML = `<div class="ai-out" style="margin-top:10px"><span class="by">Built-in desk</span><p class="small">${esc(aiFail(err))}.</p></div>`; }
  finally { btn.disabled = false; }
}
function odSpark() {
  const r = () => Math.random(), G = OD_GEN, pick = a => a[Math.floor(r() * a.length)];
  const seg = pick(G.seg), hook = pick(G.hook), ch = pick(G.ch), kpi = pick(G.kpi);
  const h = isEand() ? hook[0] : hook[0].replace('etisalat money', 'wallet');
  OD.gen.push({ i: 'g' + OD.gen.length, c: /store|telesales|partner|retail/.test(ch) ? 'sl' : hook[1] >= 3 ? 'st' : 'mk', t: `${h[0].toUpperCase() + h.slice(1)} for ${seg}`, d: `Offer ${seg} ${h} through ${ch}; test it against a control group before scaling.`, im: 2 + Math.floor(r() * 3), ef: Math.min(5, hook[1] + (r() < .4 ? 1 : 0)), k: kpi, gen: 'idea starter: score it with your team' });
  OD.cat = 'all'; odRender();
}
function initOD() {
  const sel = $('#odOp'); if (!sel || !POS) return;
  sel.innerHTML = odOps().map(c => `<option value="${esc(c.id)}">${c.id === 'e-emirates-telecom' ? 'etisalat UAE · special edition' : esc(c.name) + ' · ' + esc(c.country || c.region || '')}</option>`).join('');
  sel.value = OD.op;
  document.addEventListener('click', e => { const b = e.target.closest('[data-odtab]'); if (!b) return; e.preventDefault(); OD.tab = b.dataset.odtab; odRender(); $('#operators').scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); });
  sel.addEventListener('change', () => { OD.op = sel.value; OD.gen = []; OD.sel = null; odRender(); });
  const tabs = $$('#odTabs [data-t]');
  tabs.forEach((b, i) => { b.addEventListener('click', () => { OD.tab = b.dataset.t; odRender(); }); b.addEventListener('keydown', e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; OD.tab = n.dataset.t; odRender(); n.focus(); }); });
  $('#operators').addEventListener('click', async e => {
    const t = e.target;
    const g = t.closest('[data-go]'); if (g) { if (g.dataset.lensto) setLens(g.dataset.lensto); goTool(g.dataset.go); return; }
    const pr = t.closest('[data-prob]'); if (pr) { OD.prob = pr.dataset.prob; odRender(); return; }
    const cat = t.closest('[data-cat]'); if (cat) { OD.cat = cat.dataset.cat; odRender(); return; }
    const op = t.closest('[data-odop]'); if (op && POS) { const c = POS.operators.find(x => x.id === op.dataset.odop); posS.map = 'ops'; if (c) posS.region = c.region; posSelect(op.dataset.odop, true); return; }
    const rq = t.closest('[data-odreq]'); if (rq) { rq.disabled = true; try { const r = await createRequest({ service: rq.dataset.odreq, details: `${odName()}: ${rq.dataset.odreq === 'strategy_sprint' ? (($('#odFree') || {}).value || OD_PROBS[OD.prob].t) : 'full operator desk'}`, urgency: 'standard', via: 'operator desk' }); toast(`Requested ${r.label}${r.saved ? '' : ' (this visit only)'}`); } catch (err) { toast(err.message); } finally { rq.disabled = false; } return; }
    const tk = t.closest('[data-odtask]'); if (tk) { const P = OD_PROBS[tk.dataset.odtask]; for (const x of P.plan) await addTask({ title: `${odName()}: ${x[1]}`, kind: 'manual', dept: 'st', prio: 'normal', due: x[0] }); return; }
    const it = t.closest('[data-ideatask]'); if (it) { const id = it.dataset.ideatask, x = OD_IDEAS[id] ? { t: OD_IDEAS[id][1], c: OD_IDEAS[id][0] } : OD.gen.find(g => g.i === id); if (x) addTask({ title: `${odName()} idea: ${x.t}`, kind: 'manual', dept: x.c === 'sl' ? 'pm' : x.c === 'mk' ? 'pm' : 'st', prio: 'normal' }, it); return; }
    const pt = t.closest('.od-pt'); if (pt) { OD.sel = isNaN(+pt.dataset.idea) ? pt.dataset.idea : +pt.dataset.idea; odRender(); const a = $('#od-idea-' + OD.sel); if (a) a.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'nearest' }); return; }
    if (t.closest('#odGen')) { odSpark(); return; }
    if (t.closest('#odGenAi')) { odClaude(t.closest('#odGenAi'), 'ideas'); return; }
    if (t.closest('#odSolveBtn')) { odClaude(t.closest('#odSolveBtn'), 'solve'); return; }
  });
  $('#operators').addEventListener('keydown', e => { const pt = e.target.closest && e.target.closest('.od-pt'); if (pt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
  odRender();
}

/* ---------- VALUE CALCULATOR (etisalat UAE edition) ---------- */
const VAL_DEF = { vN: 500000, vArpu: 100, vChurn: 1.5, vCut: 5, vUp: .5, vUpv: 20, vAn: 20, vHrs: 6, vCost: 150 };
const aed = v => 'AED ' + (v >= 1e9 ? (v / 1e9).toFixed(2) + 'bn' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'm' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : Math.round(v));
function valRun() {
  const g = id => +$('#' + id).value;
  const N = g('vN'), arpu = g('vArpu'), ch = g('vChurn') / 100, cut = g('vCut') / 100, up = g('vUp') / 100, upv = g('vUpv'), an = g('vAn'), hrs = g('vHrs'), cost = g('vCost');
  const lab = { vN: fmtInt(N), vArpu: 'AED ' + arpu, vChurn: (ch * 100).toFixed(1) + '% a month', vCut: Math.round(cut * 100) + '%', vUp: (up * 100).toFixed(1) + '% of customers', vUpv: 'AED ' + upv, vAn: an, vHrs: hrs + ' h', vCost: 'AED ' + cost };
  Object.entries(lab).forEach(([k, v]) => { const o = $('#o-' + k); if (o) o.textContent = v; });
  // saves spread evenly over the year keep, on average, six months of revenue in year one
  const saved = N * ch * 12 * cut, keep = saved * arpu * 6;
  // upgrades added each month and kept for the rest of the year: 1 + 2 + … + 12 = 78 upgrade-months per monthly cohort
  const upRev = N * up * upv * 78, time = an * hrs * 46 * cost, total = keep + upRev + time;
  $('#valOut').innerHTML = [['Customers kept in year one', fmtInt(saved)], ['Revenue kept', aed(keep)], ['Upgrade revenue', aed(upRev)], ['Total illustrative value', aed(total)]].map(([l, v], i) => `<div${i === 3 ? ' class="good"' : ''}><span>${l}</span><b>${v}</b></div>`).join('');
  const bars = [['Retention', keep, 'var(--cx-1)'], ['Upgrades', upRev, 'var(--cx-3)'], ['Analyst time', time, 'var(--cx-2)']], mx = Math.max(...bars.map(b => b[1]), 1);
  $('#valChart').innerHTML = bars.map((b, i) => { const w = Math.max(2, b[1] / mx * 420); return `<g><text x="0" y="${i * 30 + 17}" style="font:12px var(--f-body);fill:var(--ink-2)">${b[0]}</text><rect x="110" y="${i * 30 + 5}" width="${w.toFixed(1)}" height="16" rx="4" style="fill:${b[2]}"/><text x="${(116 + w).toFixed(1)}" y="${i * 30 + 17}" style="font:600 11.5px var(--f-mono);fill:var(--ink)">${aed(b[1])}</text></g>`; }).join('');
  $('#valNote').textContent = `Retention: ${fmtInt(N)} customers × ${(ch * 100).toFixed(1)}% monthly churn × 12 months × ${Math.round(cut * 100)}% fewer leavers, each keeping about 6 months of revenue in year one. Upgrades: added each month and kept for the rest of the year. Analyst time: ${an} analysts × ${hrs} hours × 46 weeks. Illustrative only, not a forecast.`;
}
function initValue() {
  if (!$('#valApp')) return;
  Object.keys(VAL_DEF).forEach(id => $('#' + id).addEventListener('input', valRun));
  $('#valReset').onclick = () => { Object.entries(VAL_DEF).forEach(([k, v]) => { $('#' + k).value = v; }); valRun(); };
  valRun();
}

/* ---------- AI AGENT DEPARTMENTS: 18 departments of 12 agents that search sources, run tools and brief a team ---------- */
// {placeholders} name the operator in the etisalat edition and stay neutral on the main platform
const AG_VARS = EDITION === 'eand'
  ? { op: 'etisalat', opU: 'etisalat UAE', rival: 'du', rivals: 'du and Virgin Mobile UAE', wallet: 'etisalat money', mkt: 'UAE' }
  : { op: 'the operator', opU: 'the operator', rival: 'the main rival', rivals: 'the main rivals', wallet: 'the wallet', mkt: 'home market' };
const agT = s => String(s).replace(/\{(\w+)\}/g, (m, k) => AG_VARS[k] ?? m);
// call shorthand: sig[:severity] kb:query geo:layer plan:id sim:rival:cut pred:move pos[:region] vend deals[:type] val:metric cp:goal size co[:segment|pe|state]
const AG_CALL = t => {
  const [k, a = '', b = ''] = t.split(':');
  return ({
    sig: ['list_signals', a ? { limit: 5, severity: a } : { limit: 5 }], kb: ['intel_search', { query: a }], geo: ['geo_hotspots', { layer: a || 'churn' }],
    plan: ['compare_plans', { plan_id: a || 'nim-u' }], sim: ['simulate_response', { rival: a || 'arc', cut_pct: +b || 15, weeks: 8 }],
    pred: ['predict_move', { move_id: a || 'fwa' }], pos: ['market_position', { map: 'operators', region: a || 'Gulf (GCC)', limit: 6 }],
    vend: ['market_position', { map: 'competitors', limit: 6 }], deals: ['capital_deals', a ? { investor_type: a, limit: 5 } : { limit: 5 }],
    val: ['valuation_pulse', { metric: a || 'mcap', limit: 6 }], cp: ['contact_plan', { goal: a || 'retention', limit: 5 }], size: ['size_market', {}],
    co: ['company_lookup', a === 'pe' || a === 'state' ? { involvement: a, limit: 5 } : { segment: a || 'Operator', limit: 5 }]
  })[k] || null;
};
// [id, name, role, default task, calls, sources, actions, gets better with (optional)]
const AG_SPEC = [
  { k: 'mi', n: 'Market Intelligence', lead: 'an', svc: ['analyst', 'audio_brief', 'feed'], res: ['ws:ws_signals', 'ws:ws_foresight', 'r:Signal brief', 'r:Competitor battlecard'], learn: 'Licensed news feed|Exchange filings in real time', a: [
    ['scout', 'Signal Scout', 'Finds the competitor moves that need action today', 'What changed in the market today, and what needs action first?', 'sig|kb:price cut launch', 'web social app reg media', 'Route each critical signal to its lead department with an act-by time|Open the evidence chain before responding|Put the top signal on the workspace', 'Licensed news feed|Store staff reports'],
    ['profiler', 'Rival Profiler', 'Keeps a live profile of {rivals} and Gulf peers', 'Profile {rivals}: position, strengths and what they will do next.', 'pos|kb:rival profile launch', 'web fin media stats', 'Refresh the battlecard for {rival}|Brief marketing and sales on what changed|Set alert rules for the next likely move', 'Exchange filings in real time|App-intelligence feed'],
    ['capital', 'Capital Watcher', 'Tracks deals, valuations and investor moves across telecom', 'Which deals and valuation moves matter for {op} this quarter?', 'deals|val:mcap', 'fin media research', 'Flag deals that change a rival’s capacity to invest|Update the peer valuation pack|Review tower and fibre carve-out options', 'Licensed deals database|Investor-call transcripts'],
    ['news', 'News Desk Agent', 'Reads business media for telecom news that matters', 'What telecom news from the last week should leadership know?', 'kb:news launch deal|sig', 'media research', 'Send a three-line brief to leadership|Tag each story with the owning department'],
    ['launch', 'Launch Detector', 'Detects new plans, brands and products the day they appear', 'Did any rival launch a new plan, brand or product this week?', 'sig|kb:launch new plan brand', 'web app social', 'Compare each launch with our closest plan|Decide respond, watch or ignore within 24 hours'],
    ['promo', 'Promotion Tracker', 'Tracks every rival promotion, its depth and its end date', 'Which rival promotions are live, and when do they end?', 'kb:promotion discount offer|plan:nim-u', 'web social app', 'Plan counter-offers for promotions that hit core segments|Time win-back offers to promotion end dates'],
    ['hiring', 'Hiring Signal Agent', 'Reads rival job posts for hints of new launches', 'What do rival job posts say about their next move?', 'kb:job posts hiring installer|pred:fwa', 'web media', 'Flag hiring clusters in new areas|Feed each pattern into the move predictor'],
    ['filings', 'Filings Reader', 'Reads results and exchange filings for strategy shifts', 'What did rival results and filings reveal this quarter?', 'kb:results filing revenue|val:revenue', 'fin media', 'Update battlecards with the new numbers|Brief strategy on guidance changes'],
    ['sentiment', 'Market Sentiment Gauge', 'Measures how customers feel about each operator, week by week', 'How has sentiment toward {op} and {rivals} moved this month?', 'kb:sentiment reviews complaints|sig', 'social ios gplay', 'Act on the biggest negative driver first|Share the trend with marketing'],
    ['peer', 'Gulf Peer Benchmarker', 'Benchmarks Gulf operators on scale, growth and innovation', 'How does {op} compare with Gulf peers on growth and innovation?', 'pos|val:revenue', 'fin stats research', 'Pick one peer practice to adopt this year|Track the gap every quarter'],
    ['alert', 'Alert Designer', 'Turns recurring signals into alert rules for each team', 'Which alert rules would have caught last month’s rival moves earliest?', 'sig|kb:alert rule early warning', 'int web', 'Create alert rules for the top three move types|Review false alarms monthly'],
    ['brief', 'Weekly Brief Writer', 'Writes the weekly market brief for executives', 'Write this week’s market brief for the leadership team.', 'sig|pos|kb:weekly brief', 'media fin web', 'Send the brief every Monday at 08:00|Keep it to one page with sources']] },
  { k: 'mk', n: 'Marketing & Brand', lead: 'pm', svc: ['launch', 'wargame', 'audio_brief'], res: ['ws:ws_rte', 'pb:2', 'r:Customer contact policy'], learn: 'Campaign results|Tokenized segment data', a: [
    ['segment', 'Segment Strategist', 'Finds the segments and offers with the most upside', 'Which customer segments should {op} target next, and with what offer?', 'kb:youth eSIM app|cp:upsell', 'social ios gplay stats', 'Test the youth app plan against a control group|Time offers with the right-time engine|Measure gross adds by segment weekly'],
    ['timer', 'Campaign Timer', 'Times every offer for the moment each customer is most likely to respond', 'Who should we contact in the next four hours, and through which channel?', 'cp:upsell', 'int app', 'Send the contact queue to the CRM|Keep caps, consent and quiet hours on|Compare engagement with the fixed schedule', 'Campaign response history|Consent records'],
    ['listener', 'Brand Listener', 'Reads social posts and app reviews in Arabic, English and other languages', 'What are customers saying about {op} and its rivals this week?', 'kb:complaints reviews outage|sig', 'social ios gplay media', 'Answer the top complaint theme publicly and factually|Send product issues to the owning team|Track sentiment after each fix', 'Social listening feed|App-review feed'],
    ['creative', 'Creative Tester', 'Tests messages and creatives against control groups', 'Which campaign message should we scale this month?', 'kb:campaign creative message|cp:upsell', 'int social', 'Run an A/B test before every major launch|Scale only messages with a clear uplift'],
    ['sov', 'Share-of-Voice Agent', 'Measures share of voice across media and social', 'What is our share of voice against {rivals} this month?', 'kb:share of voice media social', 'social media', 'Shift spend to channels where our voice is falling|Report monthly to the marketing lead'],
    ['youth', 'Youth Brand Agent', 'Builds offers and content for young, app-first customers', 'What should our youth proposition offer next quarter?', 'kb:youth eSIM gaming social|size', 'social ios gplay', 'Test a youth plan inside the app|Work with creators under clear disclosure rules'],
    ['expat', 'Expatriate Segment Agent', 'Designs offers for expatriate and migrant workers', 'How do we win more expatriate customers in the {mkt}?', 'kb:expatriate international calls transfers|cp:upsell', 'stats social int', 'Bundle international minutes with home-country transfers|Advertise in community languages'],
    ['tourist', 'Visitor Offer Agent', 'Creates eSIM and roaming offers for tourists and visitors', 'What visitor offer would win tourists on arrival?', 'kb:tourist eSIM visitor airport', 'stats web', 'Offer a QR-code eSIM at arrival points|Track visitor sign-ups by nationality'],
    ['seasonal', 'Seasonal Campaign Planner', 'Plans campaigns around Ramadan, Eid, back-to-school and national days', 'Plan the next seasonal campaign calendar.', 'kb:Ramadan Eid seasonal campaign|cp:upsell', 'int social', 'Lock the calendar eight weeks ahead|Respect rest days and quiet hours'],
    ['partner', 'Partnership Marketer', 'Finds co-marketing partners in retail, travel and entertainment', 'Which partnerships would bring new customers fastest?', 'kb:partnership retail entertainment', 'media research', 'Shortlist three partners with shared customers|Agree measurable goals before launch'],
    ['crm', 'CRM Journey Designer', 'Designs lifecycle journeys from welcome to renewal', 'Which lifecycle journey needs fixing first?', 'cp:service|kb:onboarding welcome renewal', 'int app', 'Rebuild the welcome journey for the first 90 days|Measure early churn by journey'],
    ['budget', 'Marketing Mix Optimizer', 'Moves budget to the channels with the best return', 'Where should next quarter’s marketing budget go?', 'kb:marketing spend channel return|size', 'int research', 'Move 10% of budget from the weakest channel|Re-measure every quarter']] },
  { k: 'sl', n: 'Sales & Channels', lead: 'pm', svc: ['store_bot', 'launch', 'decision_room'], res: ['r:Competitor battlecard', 'ws:wargame'], learn: 'CRM pipeline|Store footfall', a: [
    ['pipeline', 'Pipeline Coach', 'Ranks enterprise and SME opportunities by chance and value', 'Which opportunities should sales chase this month?', 'kb:tender enterprise private 5G', 'reg media int', 'Assign an owner to every open tender|Prepare a reference case for each bid|Review win and loss after each award', 'CRM pipeline|Tender portals'],
    ['store', 'Store Intel Agent', 'Watches rival retail moves near our stores', 'Where is rival retail pressure rising near our stores?', 'geo:retail', 'web social int', 'Staff the stores under pressure at peak hours|Give store teams the talk track for the rival offer|Log rival offers through the Voice-of-Store bot', 'Store footfall|Staff reports'],
    ['upsell', 'Upsell Planner', 'Finds customers ready for fibre, {wallet} or roaming passes', 'Which customers are most likely to upgrade this week?', 'cp:upsell', 'int app', 'Offer the upgrade at the predicted moment|Track take-up against a control group|Stop if opt-outs rise', 'Product holdings|Upgrade history'],
    ['telesales', 'Telesales Coach', 'Ranks call lists and scripts for outbound sales', 'Who should telesales call today, and what should they say?', 'cp:upsell|kb:telesales script', 'int', 'Call within the predicted best hour|Keep scripts short and factual'],
    ['online', 'Online Sales Optimizer', 'Improves conversion on the website and app shop', 'Where do online buyers drop off before checkout?', 'kb:online checkout conversion app', 'app ios gplay', 'Remove one step from checkout|Test instant eSIM delivery in the message'],
    ['dealer', 'Dealer Network Manager', 'Tracks dealers, kiosks and partner shops', 'Which dealers and kiosks should we grow or fix?', 'geo:retail|kb:dealer kiosk partner', 'int web', 'Support top dealers with stock and training|Review weak dealers monthly'],
    ['quota', 'Quota Planner', 'Sets fair targets by channel and region', 'Are this quarter’s sales targets realistic for each channel?', 'kb:sales target channel|size', 'int', 'Move targets toward growing channels|Review weekly with channel heads'],
    ['objection', 'Objection Handler', 'Prepares answers to the objections customers raise most', 'Which objections do customers raise about our offers versus {rival}?', 'kb:objection price rival switch|plan:nim-u', 'int social', 'Train staff on the top five answers|Update the answers after each rival offer'],
    ['bundle', 'Bundle Seller', 'Finds households ready for mobile and home bundles', 'Which households should get a bundle offer this week?', 'cp:upsell|geo:churn', 'int', 'Offer bundles where switching risk is highest|Track bundle take-up weekly'],
    ['storex', 'Store Experience Agent', 'Improves store visits, waiting times and conversion', 'Which stores lose the most visitors without a sale?', 'geo:retail|kb:store waiting time', 'int', 'Add staff at peak hours in weak stores|Test appointment booking'],
    ['winback', 'Win-Back Agent', 'Wins back customers who left in the last 90 days', 'Which former customers are most likely to come back?', 'cp:retention|kb:win back port in', 'int', 'Make one fair offer at 30 and at 90 days|Stop after two contacts'],
    ['salesfc', 'Sales Forecaster', 'Forecasts gross adds by channel for the next 13 weeks', 'What will gross adds look like next quarter?', 'sig|size', 'int stats', 'Share the forecast with finance weekly|Flag a 10% miss early']] },
  { k: 'cx', n: 'Customer Experience & Care', lead: 'cx', svc: ['store_bot', 'analyst'], res: ['ws:ws_churn', 'r:Shift handover note'], learn: 'Contact-centre transcripts (tokenized)|Survey results', a: [
    ['voc', 'Voice-of-Customer Agent', 'Turns complaints and reviews into fix-it lists', 'What are the top three things customers want fixed?', 'kb:complaints slow outage', 'ios gplay social int', 'Assign each issue to an owner with a date|Tell customers when it is fixed|Watch the review score after each fix'],
    ['nps', 'NPS Analyst', 'Tracks NPS and what drives it', 'What is driving NPS up or down this month?', 'kb:NPS satisfaction survey|sig', 'int social', 'Fix the biggest detractor driver|Close the loop with each detractor'],
    ['contact', 'Contact Centre Optimizer', 'Cuts waiting times and repeat calls', 'Why do customers call twice about the same issue?', 'kb:repeat calls contact centre|cp:service', 'int', 'Fix the top repeat-call reason|Give agents the right answer the first time'],
    ['outage', 'Outage Communicator', 'Tells affected customers about outages fast and clearly', 'Which customers were hit by the latest outage, and what should we tell them?', 'sig:crit|geo:coverage', 'net int social', 'Message affected customers within 30 minutes|Pause marketing to them for seven days'],
    ['bill', 'Bill Shock Preventer', 'Warns customers before an unexpected bill', 'Who is about to get an unexpectedly high bill?', 'cp:service|kb:bill shock roaming charges', 'int', 'Send a usage alert before the cap|Offer a fitting add-on'],
    ['complaint', 'Complaint Resolver', 'Routes complaints and tracks them to closure', 'Which open complaints could escalate to the regulator?', 'kb:complaint escalation regulator|sig', 'int reg', 'Resolve the oldest complaints first|Report regulator-bound cases daily'],
    ['digicare', 'Digital Care Agent', 'Moves simple requests to the app and chat', 'Which requests could customers handle themselves in the app?', 'kb:self service app chat|cp:service', 'app ios gplay', 'Add the top three requests to the app|Measure how many calls the app avoids'],
    ['access', 'Accessibility Agent', 'Makes services easy for elderly and disabled customers', 'Where do elderly or disabled customers struggle with our services?', 'kb:accessibility elderly', 'int social', 'Offer an assisted-service line|Test the app with screen readers'],
    ['mapper', 'CX Journey Mapper', 'Maps end-to-end journeys and their pain points', 'Map the move-home journey and its pain points.', 'kb:journey move home installation', 'int app', 'Fix the slowest step first|Set a target time for the journey'],
    ['install', 'Installation Tracker', 'Tracks home installation appointments', 'Which installation appointments are at risk of being missed?', 'kb:installation appointment fibre|geo:coverage', 'int net', 'Confirm appointments the day before|Compensate missed slots automatically'],
    ['language', 'Multilingual Care Agent', 'Plans care in Arabic, English, Hindi, Urdu and more', 'Which languages do customers need most in care?', 'kb:Arabic Hindi Urdu language', 'int social', 'Staff care for the top five languages|Translate the key help pages'],
    ['cxcard', 'CX Scorecard Agent', 'Builds the weekly customer-experience scorecard', 'Build this week’s customer-experience scorecard.', 'sig|kb:CX scorecard', 'int', 'Review the scorecard every Monday|Give every red metric an owner']] },
  { k: 'rl', n: 'Retention & Loyalty', lead: 'cx', svc: ['analyst', 'launch'], res: ['ws:ws_rte', 'ws:ws_churn', 'pb:1', 'pb:2', 'r:Customer contact policy', 'go:#challenge'], learn: 'Port-out records|Save-desk outcomes', a: [
    ['churn', 'Churn Sentinel', 'Spots where churn is spreading, district by district', 'Where is churn spreading, and why?', 'geo:churn|sig', 'int social', 'Target save offers to the top two districts|Brief the save desk on the rival offer behind it|Re-measure port-outs after seven days', 'Port-out records|Complaint logs'],
    ['save', 'Save-Desk Agent', 'Builds today’s retention queue inside the contact guardrails', 'Who should the save desk call first today?', 'cp:retention', 'int', 'Call the top of the queue at the predicted time|Use a tenure reward rather than a blanket discount|Log the outcome for the model', 'Save-desk outcomes|Tenure data'],
    ['risk', 'Churn Risk Scorer', 'Scores every customer’s risk of leaving', 'Which customer groups are most at risk this month?', 'cp:retention|geo:churn', 'int', 'Act on the highest-risk group first|Re-score every week'],
    ['contract', 'Contract End Agent', 'Acts before contracts and device plans end', 'Whose contract or device plan ends in the next 60 days?', 'cp:retention|kb:contract end renewal', 'int', 'Offer renewal 45 days before the end|Reward loyalty instead of blanket discounts'],
    ['loyalty', 'Loyalty Programme Manager', 'Designs rewards that make customers stay', 'Which rewards keep customers longest for the least cost?', 'kb:loyalty rewards points|cp:retention', 'int', 'Show tenure rewards on every bill|Measure churn by reward tier'],
    ['family', 'Family Plan Agent', 'Grows multi-line family plans', 'Which households are ready for a family plan?', 'cp:upsell|kb:family plan lines', 'int', 'Offer a family plan to multi-line households|Make adding a line one tap'],
    ['portout', 'Port-Out Analyst', 'Explains where port-outs go and why', 'Where did last week’s port-outs go, and why?', 'geo:churn|sig', 'int reg', 'Answer the main reason with a targeted offer|Track the port-in and port-out balance'],
    ['saveoffer', 'Retention Offer Designer', 'Designs save offers that cost less than losing the customer', 'Design a save offer for customers tempted by {rival}.', 'sim:arc:15|cp:retention', 'int web', 'Cap offers at the customer’s expected value|Test against a control group'],
    ['moment', 'Right-Moment Agent', 'Picks the moment and channel for every retention contact', 'When and how should we contact this week’s at-risk customers?', 'cp:retention', 'int app', 'Contact only inside consent and quiet hours|Keep to two contacts a week'],
    ['ltv', 'Lifetime Value Agent', 'Values each customer over their lifetime', 'Which customers are worth the most to keep?', 'cp:retention|size', 'int', 'Spend the retention budget by lifetime value|Review the model every quarter'],
    ['prepaid', 'Prepaid Retention Agent', 'Keeps prepaid customers topping up', 'Which prepaid customers have stopped topping up?', 'cp:retention|kb:prepaid top up', 'int', 'Send a small top-up bonus at the right moment|Win back inactive SIMs within 30 days'],
    ['retcard', 'Retention Scorecard Agent', 'Reports churn, saves and cost per save', 'Build this month’s retention scorecard.', 'geo:churn|cp:retention', 'int', 'Report churn by segment monthly|Retire offers that stop working']] },
  { k: 'pr', n: 'Pricing & Offers', lead: 'pm', svc: ['wargame', 'launch', 'analyst'], res: ['ws:ws_tariff', 'ws:wargame', 'pb:0', 'tab:tab-dna', 'tab:tab-war'], learn: 'Live tariff crawl|Elasticity from past campaigns', a: [
    ['tariff', 'Tariff Analyst', 'Compares our plans with rival plans gene by gene', 'How do our main plans compare with the closest rival plans?', 'plan:nim-u', 'web app', 'Fix any gene where a rival clearly wins|Show the total monthly price, fees included|Re-check after each rival change', 'Live tariff crawl|Plan take-up data'],
    ['pricesim', 'Price-Move Simulator', 'Simulates a rival price cut and ranks the responses', 'A rival cuts 15% for eight weeks: what should we do?', 'sim:arc:15', 'web int', 'Choose the response with the best net impact|Respond in week 0, not week 3|Avoid blanket price cuts', 'Elasticity from past campaigns|Port-out data'],
    ['fee', 'Fee Watch', 'Catches hidden price changes in fees and allowances', 'Has any rival raised prices through fees or smaller allowances?', 'kb:fee stealth pricing', 'web', 'Use the change in factual comparisons|Offer switchers a clear total-price promise|Alert pricing on every new fee', 'Terms-and-conditions archive'],
    ['elastic', 'Elasticity Modeller', 'Estimates how demand reacts to price', 'How sensitive are our main segments to a price change?', 'sim:vtx:10|kb:price elasticity', 'int', 'Price by segment, not one price for all|Re-estimate after each change'],
    ['ladder', 'Plan Ladder Designer', 'Designs a plan line-up with clear steps up', 'Is our plan line-up clear, with sensible steps between plans?', 'plan:nim-e|plan:nim-u', 'web int', 'Remove plans nobody buys|Keep clear price steps between plans'],
    ['addons', 'Add-On Pricer', 'Prices data packs, roaming passes and add-ons', 'Which add-ons are priced too high or too low?', 'kb:add-on data pack roaming pass|plan:nim-u', 'web int', 'Re-price the three weakest add-ons|Bundle add-ons customers buy together'],
    ['prepaidp', 'Prepaid Pricing Agent', 'Prices prepaid bundles against rival prepaid offers', 'How do our prepaid bundles compare with {rival}’s?', 'plan:kte-e|kb:prepaid bundle', 'web', 'Match value, not price, in the top bundles|Watch prepaid churn after each change'],
    ['b2bprice', 'Business Pricing Agent', 'Prices SME and enterprise plans and discounts', 'Are our business discounts consistent and profitable?', 'kb:business discount enterprise price', 'int', 'Set discount bands by deal size|Approve exceptions centrally'],
    ['promoroi', 'Promotion ROI Agent', 'Measures the return of each promotion', 'Which promotions paid back last quarter?', 'kb:promotion return uplift|cp:upsell', 'int', 'Stop promotions that do not pay back|Repeat the best two'],
    ['pricewar', 'Price-War Early Warning', 'Spots the signs of a price war early', 'Are there signs of a price war starting?', 'sig:crit|pred:cut', 'web social', 'Prepare targeted responses in advance|Avoid broad cuts that start a spiral'],
    ['bundlep', 'Bundle Price Architect', 'Prices mobile, home and TV bundles', 'What bundle price would grow households without losing margin?', 'plan:pls-u|size', 'web int', 'Give each bundle a clear saving|Track margin per household'],
    ['total', 'Total-Price Checker', 'Compares the full monthly price, fees included', 'What does each main plan really cost per month, fees included?', 'plan:nim-u|kb:fee stealth pricing', 'web', 'Advertise the total monthly price|Remove confusing fees']] },
  { k: 'en', n: 'Enterprise & Government', lead: 'b2b', svc: ['decision_room', 'analyst', 'diligence'], res: ['r:Competitor battlecard', 'ws:ws_exec'], learn: 'CRM account data|Government tender portals', a: [
    ['tender', 'Tender Hunter', 'Finds public and private tenders early', 'Which tenders open in the next 90 days?', 'kb:tender private 5G port', 'reg gov media', 'Qualify each tender within 48 hours|Line up partners for gaps|Track rival bids', 'Government tender portals|Partner pipeline'],
    ['architect', 'Solution Architect', 'Designs 5G, cloud and AI offers for each industry', 'Which industry solution should we lead with next quarter?', 'kb:cloud AI enterprise 5G', 'research media', 'Run a paid pilot with clear KPIs|Publish the result as a reference|Package it for similar clients', 'Pilot results|Licensed research'],
    ['account', 'Account Planner', 'Builds account plans for the largest clients', 'Build an account plan for our largest enterprise client group.', 'co:Operator|kb:government enterprise contract', 'fin media int', 'Map decision-makers and needs|Plan three offers for the next 12 months|Review quarterly with the client', 'CRM account data'],
    ['private5g', 'Private 5G Agent', 'Finds sites for private 5G networks', 'Which industries need private 5G most in the {mkt}?', 'kb:private 5G port industry|size', 'research media', 'Pitch ports, airports and factories first|Offer a paid pilot'],
    ['iot', 'IoT Solutions Agent', 'Builds IoT offers for fleets, utilities and cities', 'Which IoT offers should we push this year?', 'kb:IoT fleet utilities smart city|size', 'research media', 'Package three IoT offers by industry|Partner for devices'],
    ['cloud', 'Cloud & AI Seller', 'Sells cloud, sovereign AI and data-centre services', 'Which clients are ready for sovereign cloud and AI?', 'kb:sovereign cloud AI data centre', 'media research', 'Target regulated industries first|Show data-residency guarantees'],
    ['gov', 'Government Programs Agent', 'Follows government digital programs and budgets', 'Which government programs need telecom partners?', 'kb:government digital program|kb:tender', 'gov reg', 'Map each program to an offer|Build relationships early'],
    ['secsell', 'Managed Security Seller', 'Sells managed security to businesses', 'Which clients need managed security services?', 'kb:cybersecurity managed security', 'research media', 'Bundle security with connectivity|Publish incident response times'],
    ['renewal', 'Contract Renewal Agent', 'Protects large contracts before they renew', 'Which large contracts renew in the next six months?', 'kb:contract renewal enterprise', 'int', 'Start renewals six months early|Bring a better offer before rivals do'],
    ['ecosys', 'Partner Ecosystem Agent', 'Manages integrators, cloud and device partners', 'Which partners bring us the most business?', 'co:Operator|kb:partner integrator', 'media int', 'Reward partners who bring deals|Drop inactive partners'],
    ['rivalb2b', 'Rival B2B Watcher', 'Tracks rival enterprise wins and offers', 'Which enterprise deals did {rivals} win recently?', 'kb:enterprise contract win|sig', 'media reg', 'Learn from each lost deal|Prepare counters for the next bids'],
    ['b2bcard', 'B2B Scorecard Agent', 'Reports pipeline, wins and margins', 'Build this month’s enterprise scorecard.', 'kb:pipeline win rate', 'int', 'Review the pipeline weekly|Focus on deals that can close this quarter']] },
  { k: 'sm', n: 'SME & Small Business', lead: 'b2b', svc: ['launch', 'analyst'], res: ['r:Competitor battlecard'], learn: 'Business licence data|SME CRM records', a: [
    ['smeseg', 'SME Segment Agent', 'Finds the small-business segments with the most demand', 'Which small-business segments should we target first?', 'size|kb:SME small business', 'stats research', 'Pick two segments to lead with|Build one offer for each'],
    ['smeoffer', 'SME Offer Builder', 'Builds simple bundles for small businesses', 'What bundle would win small shops and offices?', 'kb:SME bundle internet mobile|plan:nim-e', 'web int', 'Combine mobile, fibre and a payments app|Keep pricing simple'],
    ['smesale', 'SME Sales Agent', 'Ranks SME leads for the sales team', 'Which SME leads should sales call this week?', 'cp:upsell|kb:SME leads', 'int', 'Call the warmest leads first|Track conversion by lead source'],
    ['startup', 'Startup Program Agent', 'Runs offers for startups and free zones', 'How do we win startups in the free zones?', 'kb:startup free zone', 'gov media', 'Offer startup credits|Partner with incubators'],
    ['smedigi', 'Digital Tools Agent', 'Sells websites, cloud apps and payments to SMEs', 'Which digital tools do small businesses ask for most?', 'kb:SME digital tools payments', 'research', 'Bundle the top two tools|Train sales on short demos'],
    ['smecare', 'SME Care Agent', 'Gives small businesses fast support', 'Where do small businesses wait too long for help?', 'kb:SME support', 'int', 'Offer a priority line|Set a four-hour fix target'],
    ['smechurn', 'SME Churn Agent', 'Spots small businesses about to leave', 'Which SME accounts are at risk of leaving?', 'cp:retention|kb:SME churn', 'int', 'Call at-risk accounts this week|Fix service issues first'],
    ['smepay', 'Merchant Payments Agent', 'Grows payments and {wallet} use among merchants', 'How do we grow merchant payments?', 'kb:merchant payments wallet', 'fin int', 'Offer low fees in the first year|Bundle point-of-sale with connectivity'],
    ['smerival', 'SME Rival Watcher', 'Tracks rival small-business offers', 'What SME offers do {rivals} run now?', 'kb:SME offer rival|plan:vtx-p', 'web', 'Match value where we lose deals|Highlight service quality'],
    ['smemap', 'Local Business Mapper', 'Maps where new businesses open', 'Where are new businesses opening fastest?', 'geo:retail|kb:new business licences', 'gov stats', 'Send field sales to growth areas|Time offers with licence renewals'],
    ['smecredit', 'SME Credit Agent', 'Checks credit risk for device and service plans', 'Which small businesses qualify for device financing?', 'kb:credit risk SME', 'fin int', 'Approve low-risk accounts fast|Ask for deposits where needed'],
    ['smecard', 'SME Scorecard Agent', 'Reports SME growth and churn', 'Build this month’s SME scorecard.', 'kb:SME scorecard', 'int', 'Review every month|Set targets by segment']] },
  { k: 'nw', n: 'Network & Technology', lead: 'nw', svc: ['geo_audit', 'analyst'], res: ['ws:ws_network', 'r:Speedtest Global Index', 'r:3GPP', 'tab:tab-geo'], learn: 'Licensed speed-test feed|Own network counters', a: [
    ['coverage', 'Coverage Truth Agent', 'Checks advertised coverage against measured speeds', 'Where does a rival’s coverage claim not match measured speeds?', 'geo:coverage', 'net web', 'Fix our own gaps first|Use rival gaps in factual campaigns|Prioritize capex in contested cells', 'Licensed speed-test feed|Own network counters'],
    ['build', 'Rival Build Watcher', 'Predicts rival network and fixed-wireless launches', 'How likely is a rival fixed-wireless launch, and when?', 'pred:fwa', 'web reg media', 'Pre-empt with household bundles in target districts|Watch installer hiring weekly|Prepare a response plan now', 'Site permits|Job postings'],
    ['capacity', 'Capacity Planner', 'Links rival network moves to our capex priorities', 'Where should network capex go first, given rival moves?', 'kb:network 5G speed carriers|sig', 'net reg', 'Rank contested cells for the next capex cycle|Coordinate launch timing with marketing|Track speed after upgrades', 'Traffic forecasts|Capex plans'],
    ['fivegsa', '5G Standalone Planner', 'Plans 5G standalone and network slicing', 'Where should 5G standalone and slicing launch first?', 'kb:5G standalone slicing|pred:fwa', 'net research', 'Launch slicing for business clients first|Measure latency gains'],
    ['outagep', 'Outage Predictor', 'Predicts outages from alarms and weather', 'Which sites are most likely to fail this week?', 'sig:crit|geo:coverage', 'net int', 'Fix high-risk sites first|Pre-position spare parts'],
    ['speed', 'Speed Benchmarker', 'Compares measured speeds with rivals by area', 'Where are rivals faster than us?', 'geo:coverage|kb:speed test', 'net', 'Prioritize upgrades where rivals lead|Advertise only where we lead, factually'],
    ['spectrum', 'Spectrum Use Agent', 'Checks how well each band is used', 'Are we using our spectrum efficiently?', 'kb:spectrum band carriers', 'net reg', 'Refarm under-used bands|Plan for the next auction'],
    ['energy', 'Network Energy Agent', 'Cuts network power use and cost', 'Where can we save network energy without hurting service?', 'kb:energy power sites', 'net int', 'Switch off spare capacity at night where safe|Track savings monthly'],
    ['sat', 'Satellite & Direct-to-Device Agent', 'Tracks satellite and direct-to-device services', 'What does satellite direct-to-device mean for us?', 'pred:sat|kb:satellite direct to device', 'media research', 'Decide whether to partner or wait|Test coverage for remote areas'],
    ['vendor', 'Network Vendor Agent', 'Tracks equipment vendors, prices and roadmaps', 'Which vendor roadmap fits our next network cycle?', 'kb:vendor equipment Ericsson Nokia Huawei', 'research media', 'Compare total cost over five years|Keep two vendors where possible'],
    ['sites', 'Site Acquisition Agent', 'Finds and secures new sites and towers', 'Where do we need new sites, and who owns them?', 'geo:coverage|deals:infrastructure', 'gov net', 'Share towers where possible|Start permits early'],
    ['nwcard', 'Network Scorecard Agent', 'Reports speed, availability and dropped calls', 'Build this week’s network scorecard.', 'geo:coverage|sig', 'net', 'Review every week|Give every red area an owner']] },
  { k: 'fh', n: 'Fibre & Home', lead: 'nw', svc: ['geo_audit', 'launch'], res: ['ws:ws_network', 'tab:tab-geo'], learn: 'Address-level demand data|Installer schedules', a: [
    ['fibreplan', 'Fibre Rollout Planner', 'Ranks areas for new fibre', 'Which areas should get fibre next?', 'geo:churn|size', 'stats net', 'Build where demand and rival pressure are high|Pre-sell before building'],
    ['fwa', 'Fixed-Wireless Strategist', 'Plans fixed wireless where fibre is slow to build', 'Where does fixed wireless make sense for us?', 'pred:fwa|geo:coverage', 'net web', 'Offer fixed wireless where fibre is far away|Protect households from rival fixed wireless'],
    ['homebundle', 'Home Bundle Agent', 'Grows mobile and home bundles', 'Which mobile customers should get a home offer?', 'cp:upsell|plan:pls-u', 'int', 'Offer home internet to multi-line households|Show the bundle saving clearly'],
    ['movehome', 'Move-Home Agent', 'Keeps customers when they move house', 'How many customers move home each month, and how many do we lose?', 'kb:move home relocation|cp:retention', 'int', 'Move the service for free|Contact customers at lease renewal'],
    ['tv', 'TV & Content Agent', 'Builds TV, streaming and gaming bundles', 'Which content partners would make our home offer stronger?', 'kb:TV streaming content gaming', 'media research', 'Bundle the top streaming service|Test a gaming pack'],
    ['wifi', 'Home Wi-Fi Agent', 'Fixes poor in-home Wi-Fi', 'Which customers have poor in-home Wi-Fi?', 'kb:wifi router mesh|cp:service', 'int net', 'Offer mesh Wi-Fi upgrades|Send a technician only when needed'],
    ['smarthome', 'Smart Home Agent', 'Sells smart-home and security devices', 'Is there demand for smart-home bundles?', 'kb:smart home security cameras|size', 'research', 'Pilot a smart-home bundle|Partner with device makers'],
    ['newbuild', 'New Development Agent', 'Wins new buildings and communities before they open', 'Which new communities open in the next 12 months?', 'kb:new community building developer', 'gov media', 'Sign developers early|Pre-install fibre'],
    ['homechurn', 'Home Churn Agent', 'Stops home broadband customers leaving', 'Why do home customers leave, and to whom?', 'geo:churn|cp:retention', 'int', 'Fix speed issues first|Offer bundle loyalty rewards'],
    ['homeprice', 'Home Price Agent', 'Compares home internet plans with rivals', 'How do our home plans compare with rival plans?', 'plan:pls-u|kb:home internet price', 'web', 'Keep a clear entry plan|Show speed for the price'],
    ['installcap', 'Install Capacity Agent', 'Matches installer capacity to demand', 'Do we have enough installers for next month’s orders?', 'kb:installer capacity orders', 'int', 'Add partner installers at peaks|Cut waiting time to under three days'],
    ['homecard', 'Home Scorecard Agent', 'Reports home growth, speed and churn', 'Build this month’s home scorecard.', 'geo:coverage|kb:home broadband', 'int net', 'Review every month|Set targets per area']] },
  { k: 'dg', n: 'Digital, App & Fintech', lead: 'da', svc: ['feed', 'launch'], res: ['r:AI assistant', 'r:Right-time engagement studio'], learn: 'App analytics|Wallet transaction data (tokenized)', a: [
    ['appwatch', 'App Store Watcher', 'Tracks ratings, reviews and releases of every telecom app', 'How do the telecom apps in the {mkt} compare this week?', 'kb:app rating reviews sign-up', 'ios gplay app', 'Fix the top-rated complaint in the next release|Learn from what customers praise in rival apps|Watch rank after each release', 'App-intelligence feed|Own app analytics'],
    ['wallet', 'Wallet Growth Agent', 'Finds who is ready to use {wallet} and why', 'How do we grow active {wallet} users this quarter?', 'cp:upsell|kb:wallet fintech payments', 'int fin', 'Launch bill cashback paid in {wallet}|Bundle home-country transfers for expatriates|Time wallet offers per customer', 'Wallet transaction data (tokenized)'],
    ['journey', 'Digital Journey Agent', 'Finds where online sign-up and support journeys lose customers', 'Where do customers drop out of the digital sign-up journey?', 'kb:eSIM sign-up in-app', 'app ios gplay', 'Cut sign-up to under five minutes|Add instant eSIM everywhere|Measure completion weekly', 'Journey analytics'],
    ['appfeat', 'App Feature Planner', 'Decides which app features to build next', 'Which app features would cut calls and grow sales most?', 'kb:app feature request|cp:service', 'ios gplay app', 'Build the two most requested features|Measure use after release'],
    ['esim', 'eSIM Growth Agent', 'Grows instant eSIM sign-ups', 'How do we make eSIM sign-up instant for everyone?', 'kb:eSIM sign-up instant', 'app web', 'Allow full eSIM sign-up in the app|Track the time to activate'],
    ['remit', 'Remittance Agent', 'Grows international money transfers through {wallet}', 'Which corridors should {wallet} price better for transfers?', 'kb:remittance transfer corridor|size', 'fin stats', 'Cut fees on the top three corridors|Bundle transfers with calls home'],
    ['finance', 'Device Financing Agent', 'Offers device instalments and buy-now-pay-later', 'Which customers should get device instalment offers?', 'cp:upsell|kb:instalments financing', 'int fin', 'Offer instalments at contract end|Check affordability first'],
    ['chatbot', 'Chatbot Trainer', 'Improves the care chatbot with real questions', 'Which questions does the chatbot fail to answer?', 'kb:chatbot questions', 'int app', 'Add answers for the ten most common failures|Hand over to a person quickly'],
    ['personal', 'Personalization Agent', 'Personalizes app offers for each customer', 'What should each customer see when they open the app?', 'cp:upsell', 'int app', 'Show one relevant offer, not ten|Respect consent'],
    ['merchant', 'Merchant Network Agent', 'Grows where {wallet} is accepted', 'Where should {wallet} be accepted next?', 'kb:merchant acceptance payments|geo:retail', 'fin int', 'Sign the most-visited merchants|Offer launch cashback'],
    ['digrival', 'Digital Rival Watcher', 'Tracks rival apps, wallets and digital brands', 'What did rival apps and wallets launch this month?', 'kb:rival app wallet launch|sig', 'ios gplay app', 'Adopt proven ideas within the law|Promote our strengths'],
    ['digcard', 'Digital Scorecard Agent', 'Reports app users, ratings and digital sales', 'Build this month’s digital scorecard.', 'kb:app users rating digital sales', 'app int', 'Review every month|Set a target for the digital share of sales']] },
  { k: 'dv', n: 'Devices & Retail', lead: 'pm', svc: ['store_bot', 'launch'], res: ['r:Competitor battlecard'], learn: 'Point-of-sale data|Stock levels', a: [
    ['range', 'Device Range Planner', 'Plans which phones and devices to stock', 'Which devices should we stock next quarter?', 'kb:smartphone launch device|plan:arc-p', 'web media', 'Stock the top sellers early|Drop slow-moving devices'],
    ['tradein', 'Trade-In Agent', 'Runs device trade-in offers', 'How does our trade-in offer compare with rivals?', 'kb:trade-in offer|plan:arc-p', 'web', 'Match trade-in values on flagship phones|Recycle old devices responsibly'],
    ['launchday', 'Device Launch Agent', 'Prepares for new phone launches', 'Are we ready for the next flagship phone launch?', 'kb:iPhone Galaxy launch pre-order', 'web media', 'Open pre-orders early|Pair a plan with each launch'],
    ['stock', 'Stock Balancer', 'Moves stock between stores to meet demand', 'Which stores will run out of popular devices?', 'geo:retail|kb:stock inventory', 'int', 'Rebalance stock weekly|Alert stores before they run out'],
    ['accessories', 'Accessories Agent', 'Grows accessory sales', 'Which accessories sell best with each device?', 'kb:accessories cases chargers', 'int', 'Offer accessories at checkout|Train staff to suggest them'],
    ['protect', 'Device Protection Agent', 'Sells device protection plans', 'Who should be offered device protection?', 'cp:upsell|kb:device insurance', 'int', 'Offer protection with flagship sales|Make claims simple'],
    ['refurb', 'Refurbished Devices Agent', 'Builds a certified refurbished-phone range', 'Is there demand for certified refurbished phones?', 'kb:refurbished phones|size', 'research', 'Pilot a refurbished range|Give a clear warranty'],
    ['storeplan', 'Store Network Planner', 'Decides where to open, move or close stores', 'Where should we open or close stores?', 'geo:retail|size', 'stats int', 'Open where rival pressure and footfall are high|Close stores that lose money'],
    ['popup', 'Pop-Up Store Agent', 'Plans kiosks and pop-ups at malls and events', 'Where should we run pop-up stores next month?', 'geo:retail|kb:pop-up kiosk events', 'int social', 'Go where rivals open kiosks|Measure sales per day'],
    ['devrival', 'Rival Device Offers Agent', 'Tracks rival device deals and financing', 'What device deals are {rivals} running?', 'plan:vtx-p|kb:device deal financing', 'web', 'Counter on flagship phones only|Highlight network value'],
    ['bizdev', 'Business Devices Agent', 'Supplies devices to business customers', 'Which business clients need a device refresh?', 'kb:business devices refresh', 'int', 'Offer devices as a service|Bundle device management tools'],
    ['retcard2', 'Retail Scorecard Agent', 'Reports store sales, footfall and conversion', 'Build this week’s retail scorecard.', 'geo:retail|kb:store sales footfall', 'int', 'Review every week|Coach the weakest stores']] },
  { k: 'ro', n: 'Roaming, Wholesale & Partners', lead: 'b2b', svc: ['feed', 'analyst'], res: ['r:GSMA Intelligence', 'r:ITU ICT statistics'], learn: 'Roaming traffic records|Partner agreements', a: [
    ['roampass', 'Roaming Pass Agent', 'Prices roaming passes by destination', 'Are our roaming passes priced right for the top destinations?', 'kb:roaming pass destination price', 'web stats', 'Re-price passes for the top ten destinations|Suggest a pass before customers travel'],
    ['inbound', 'Inbound Roaming Agent', 'Wins visitors who roam on our network', 'Which visitor nationalities roam on our network most?', 'kb:inbound roaming visitors|size', 'stats int', 'Improve deals with the top partner operators|Offer visitor SIMs'],
    ['wholesale', 'Wholesale Deals Agent', 'Sells capacity to MVNOs and other carriers', 'Which wholesale deals should we pursue?', 'kb:wholesale MVNO capacity|co:Operator', 'media int', 'Price wholesale by volume|Protect retail margins'],
    ['mvno', 'MVNO Watcher', 'Tracks MVNOs and digital brands in the market', 'Which MVNOs and digital brands are growing fastest?', 'kb:MVNO digital brand|pos', 'web media', 'Decide whether to host or compete|Watch their pricing'],
    ['carrier', 'Carrier Partner Agent', 'Manages partnerships with operators abroad', 'Which partner operators should we work more closely with?', 'pos:Middle East|co:Operator', 'fin media', 'Renew key partner deals early|Share roaming data securely'],
    ['cables', 'Subsea & Transit Agent', 'Tracks subsea cables, transit and data-centre links', 'Which new cables or routes matter for us?', 'kb:subsea cable transit data centre', 'media research', 'Secure capacity on new routes|Sell transit to neighbouring markets'],
    ['roamfraud', 'Roaming Fraud Agent', 'Detects roaming and interconnect fraud', 'Is there unusual roaming or interconnect traffic?', 'sig:crit|kb:fraud interconnect', 'int', 'Block suspicious routes fast|Report to partners'],
    ['travel', 'Travel Partner Agent', 'Partners with airlines, hotels and travel apps', 'Which travel partners would sell our roaming and eSIM?', 'kb:airline hotel travel partner', 'media', 'Sign two travel partners|Offer eSIM at booking'],
    ['events', 'Events & Seasons Agent', 'Plans capacity and offers for major events and peak seasons', 'Which events need extra capacity and special offers?', 'kb:event capacity season|geo:coverage', 'stats net', 'Add temporary capacity|Offer event passes'],
    ['interconnect', 'Interconnect Rates Agent', 'Checks interconnect and termination rates', 'Are our interconnect rates competitive and compliant?', 'kb:interconnect termination rates regulator', 'reg fin', 'Renegotiate high-cost routes|Track regulator decisions'],
    ['iotroam', 'IoT Roaming Agent', 'Manages roaming for connected devices', 'How do we support IoT devices that roam permanently?', 'kb:IoT roaming permanent', 'research reg', 'Offer an IoT roaming plan|Check the rules in each country'],
    ['rocard', 'Roaming Scorecard Agent', 'Reports roaming revenue, visitors and margins', 'Build this month’s roaming and wholesale scorecard.', 'kb:roaming revenue', 'int fin', 'Review every month|Act on falling routes']] },
  { k: 'st', n: 'Strategy & Investment', lead: 'st', svc: ['strategy_sprint', 'board_brief', 'diligence'], res: ['ws:ws_foresight', 'ws:ws_exec', 'go:#operators'], learn: 'Outcome history for back-testing|Licensed deals database', a: [
    ['forecast', 'Move Forecaster', 'Forecasts rival moves 30 to 90 days ahead', 'Which rival moves are most likely next quarter?', 'pred:fwa|pred:cut', 'web reg fin media', 'Plan a response for each likely move now|Set early-warning alert rules|Review the forecast monthly', 'Outcome history for back-testing'],
    ['mna', 'M&A Scout', 'Screens deals, carve-outs and partners', 'Which deals or carve-outs should strategy look at?', 'deals:infrastructure', 'fin media research', 'Screen each option against the capital plan|Model value with finance|Brief the board', 'Licensed deals database'],
    ['sizer', 'Market Sizer', 'Sizes markets and new business lines', 'How big is the opportunity for our next business line?', 'size', 'stats research', 'Validate the size with a pilot|Set a three-year target|Decide whether to build, partner or buy', 'National statistics|Licensed research'],
    ['scenario', 'Scenario Planner', 'Builds best, base and worst cases', 'What are our three scenarios for the next two years?', 'pred:cut|pred:fwa|size', 'research stats', 'Set triggers for each scenario|Review every quarter'],
    ['portfolio', 'Portfolio Reviewer', 'Reviews each business line for growth and return', 'Which business lines should we grow, fix or exit?', 'val:revenue|co:Operator', 'fin', 'Rank lines by return on capital|Decide once a year'],
    ['aistrat', 'AI Strategy Agent', 'Finds where AI creates the most value', 'Where should we use AI first to save cost or grow revenue?', 'kb:AI use case value|kb:sovereign AI', 'research media', 'Pick three AI uses with clear value|Measure each within 90 days'],
    ['newbiz', 'New Business Scout', 'Finds adjacent businesses to enter', 'Which new business lines fit us best?', 'size|kb:new business adjacent', 'research stats', 'Test the best two with small pilots|Decide whether to build, partner or buy'],
    ['intl', 'International Expansion Agent', 'Screens markets to enter or exit', 'Which markets should we enter or exit?', 'pos:Middle East|pos:Africa', 'fin stats', 'Score markets on growth and risk|Prefer partnerships first'],
    ['esg', 'ESG & Sustainability Agent', 'Tracks emissions, energy and ESG ratings', 'Where do we stand on ESG, and what should improve?', 'kb:ESG emissions energy', 'research fin', 'Set a yearly energy target|Publish progress'],
    ['board', 'Board Brief Agent', 'Prepares the strategy pack for the board', 'Prepare the next board strategy brief.', 'sig|pos|val:mcap', 'fin media', 'Send the brief a week ahead|Keep it to five pages'],
    ['okr', 'Goals Tracker', 'Tracks strategic goals and key results', 'Are we on track with this year’s strategic goals?', 'kb:goals targets progress', 'int', 'Flag goals behind plan|Name an owner for each recovery'],
    ['rivalstrat', 'Rival Strategy Agent', 'Reads rival strategy from results, hiring and launches', 'What is {rival}’s strategy for the next year?', 'pos|kb:strategy results', 'fin media web', 'Prepare a response plan|Update it every year']] },
  { k: 'fn', n: 'Finance & Investor Relations', lead: 'fi', svc: ['capital', 'diligence', 'board_brief'], res: ['ws:ws_capital', 'tab:tab-cap'], learn: 'Management accounts|Investor-call transcripts', a: [
    ['peerval', 'Peer Valuation Agent', 'Compares our valuation with peers', 'How is the market valuing us against peers?', 'val:mcap|val:mcap_to_revenue', 'fin', 'Explain the gap to investors|Update every month'],
    ['results', 'Results Analyst', 'Reads peer quarterly results the day they publish', 'What did peers report this quarter?', 'kb:quarterly results revenue profit|val:revenue', 'fin media', 'Brief leadership within a day|Update the peer table'],
    ['capex', 'Capex Allocator', 'Ranks investments by return', 'Which projects should get capex next year?', 'size|geo:coverage', 'int fin', 'Fund the highest returns first|Review spending every quarter'],
    ['cost', 'Cost Optimizer', 'Finds savings without hurting customers', 'Where can we cut cost by 5% without hurting service?', 'kb:cost savings opex', 'int', 'Cut duplicate spend first|Track savings monthly'],
    ['revassure', 'Revenue Assurance Agent', 'Finds revenue leaks in billing and usage', 'Where is revenue leaking?', 'kb:revenue leakage billing|sig', 'int', 'Fix the largest leak first|Reconcile every month'],
    ['treasury', 'Treasury Agent', 'Watches cash, debt and currency risk', 'How exposed are we to currency and interest-rate changes?', 'kb:currency interest rates debt', 'fin cb', 'Hedge large exposures|Review every month'],
    ['ir', 'Investor Questions Agent', 'Prepares answers to investor questions', 'What will investors ask about next quarter?', 'val:mcap|kb:investor questions guidance', 'fin media', 'Prepare clear answers with numbers|Keep messages consistent'],
    ['dividend', 'Capital Return Agent', 'Compares dividends and buybacks with peers', 'How do our dividends compare with peers?', 'kb:dividend buyback', 'fin', 'Keep the policy clear|Explain changes early'],
    ['dealval', 'Deal Valuation Agent', 'Values acquisitions, stakes and carve-outs', 'What would a tower or fibre carve-out be worth?', 'deals:infrastructure|val:mcap_to_revenue', 'fin research', 'Compare with recent deals|Model three prices'],
    ['tax', 'Royalty & Tax Agent', 'Tracks telecom royalty and tax rules', 'How will royalty and tax changes affect profit?', 'kb:royalty tax regime', 'reg fin', 'Model each change|Plan ahead with the regulator'],
    ['budgetfc', 'Budget Forecaster', 'Forecasts revenue and profit for the year', 'Will we meet this year’s budget?', 'size|sig', 'int fin', 'Flag gaps early|Plan recovery actions'],
    ['fincard', 'Finance Scorecard Agent', 'Reports revenue, margin, cash and returns', 'Build this month’s finance scorecard.', 'val:revenue|kb:margin cash', 'fin int', 'Review every month|Give every miss an owner']] },
  { k: 'rg', n: 'Regulatory, Legal & Spectrum', lead: 'rg', svc: ['regulator', 'analyst'], res: ['ws:ws_spectrum', 'pb:3', 'r:TDRA (UAE)', 'r:UAE personal data protection law', 'r:EU GDPR (official text)'], learn: 'Regulator notice feeds|Legal guidance library', a: [
    ['consult', 'Consultation Tracker', 'Tracks consultations, decisions and deadlines', 'Which consultations need a response, and by when?', 'kb:consultation spectrum regulator', 'reg gov', 'Assign an owner to each consultation|Draft the response two weeks early|Brief strategy on the impact', 'Regulator notice feeds'],
    ['compliance', 'Contact Compliance Agent', 'Checks every campaign against consent, quiet hours and caps', 'Are our contact plans within consent, quiet-hour and frequency rules?', 'cp:retention', 'int', 'Block any slot that breaks a rule|Report opt-outs and complaints weekly|Review the policy every quarter', 'Consent records|Complaint logs'],
    ['guard', 'Competition-Law Guard', 'Reviews recommendations for competition-law risk', 'Do our planned responses stay within competition law?', 'sig', 'reg', 'Keep every response unilateral|Never share or use rivals’ confidential plans|Escalate doubtful cases to legal', 'Legal guidance library'],
    ['auction', 'Spectrum Auction Agent', 'Prepares for spectrum auctions', 'Which spectrum should we bid for, and what is it worth?', 'kb:spectrum auction band|val:mcap', 'reg fin', 'Set a bidding envelope with finance|Model each rival’s needs'],
    ['licence', 'Licence Tracker', 'Tracks licence terms, renewals and obligations', 'Which licence obligations are due this year?', 'kb:licence renewal obligations', 'reg', 'Keep an obligations calendar|Report status every quarter'],
    ['privacy', 'Privacy Agent', 'Checks data use against privacy law', 'Does our data use meet privacy law?', 'kb:privacy personal data law|cp:service', 'reg int', 'Run a privacy check before each new use|Keep consent records complete'],
    ['consumer', 'Consumer Protection Agent', 'Checks offers and ads against consumer rules', 'Do our ads and offers meet consumer rules?', 'kb:consumer protection advertising', 'reg', 'Review ads before launch|Fix unclear terms'],
    ['porting', 'Numbering & Porting Agent', 'Tracks number porting rules and performance', 'Are number ports handled on time?', 'kb:number porting rules|geo:churn', 'reg int', 'Meet porting deadlines|Report to the regulator'],
    ['airules', 'AI Rules Agent', 'Tracks AI rules and responsible-AI duties', 'Which AI rules apply to our models?', 'kb:AI regulation responsible AI', 'reg gov', 'Keep model cards up to date|Review high-risk uses'],
    ['disputes', 'Disputes Agent', 'Tracks disputes and legal cases', 'Which disputes could affect us this year?', 'kb:dispute court case', 'media reg', 'Escalate high-risk cases|Settle small ones early'],
    ['regcal', 'Regulatory Calendar Agent', 'Keeps every deadline in one calendar', 'Which regulatory deadlines come up in the next 90 days?', 'kb:deadline consultation decision', 'reg gov', 'Give each deadline an owner|Send reminders two weeks ahead'],
    ['regcard', 'Compliance Scorecard Agent', 'Reports compliance status and risks', 'Build this quarter’s compliance scorecard.', 'kb:compliance status', 'reg int', 'Review every quarter|Fix red items first']] },
  { k: 'da', n: 'Data, AI & Analytics', lead: 'da', svc: ['feed', 'market_feed', 'analyst'], res: ['ws:ws_copilot', 'ws:ws_cert', 'r:Model card', 'go:#challenge2'], learn: 'Data lineage records|Model monitoring logs', a: [
    ['quality', 'Data Quality Agent', 'Checks data freshness and accuracy', 'Which data sources are stale or wrong?', 'kb:data quality freshness|sig', 'int', 'Fix the most-used sources first|Show freshness on every chart'],
    ['catalog', 'Data Catalog Agent', 'Keeps a catalog of every data source and owner', 'Which data do we have, and who owns it?', 'kb:data source owner', 'int', 'Name an owner for each source|Remove unused data'],
    ['model', 'Model Monitor', 'Watches models for drift and bias', 'Are our models still accurate and fair?', 'cp:retention|kb:model drift bias', 'int', 'Retrain drifting models|Check fairness every month'],
    ['experiment', 'Experiment Designer', 'Designs A/B tests with the right sample sizes', 'Design an A/B test for the next retention offer.', 'cp:retention|kb:A/B test sample size', 'int', 'Pre-register each test|Stop tests only at the planned size'],
    ['genai', 'GenAI Builder', 'Builds AI assistants for staff', 'Which staff tasks should get an AI assistant first?', 'kb:AI assistant staff productivity', 'research int', 'Start with care and sales|Measure the time saved'],
    ['demand', 'Demand Forecaster', 'Forecasts traffic, sales and churn', 'What will demand look like next quarter?', 'size|geo:churn', 'int stats', 'Share forecasts with network and sales|Track forecast accuracy'],
    ['dashboards', 'Dashboard Builder', 'Builds dashboards teams actually use', 'Which dashboards are unused, and what is missing?', 'kb:dashboard usage', 'int', 'Retire unused dashboards|Build one per team'],
    ['tokenize', 'Privacy-Safe Data Agent', 'Tokenizes and protects customer data', 'Is customer data tokenized everywhere it should be?', 'kb:tokenized customer data privacy', 'int reg', 'Tokenize before any analysis|Limit access by role'],
    ['kbcurator', 'Knowledge Base Curator', 'Keeps the intelligence hub clean and searchable', 'Which knowledge-base items are duplicated or out of date?', 'kb:knowledge base|sig', 'int media', 'Merge duplicates|Archive outdated items'],
    ['srcplan', 'Source Planner', 'Plans which sources to add and how often to refresh them', 'Which new data sources would improve our intelligence most?', 'kb:source registry refresh', 'int research', 'Add the two highest-value sources|Set refresh schedules'],
    ['nlp', 'Multilingual Language Agent', 'Improves analysis of Arabic and other languages', 'How well do we understand Arabic posts and reviews?', 'kb:Arabic sentiment language', 'social int', 'Add Arabic dialect examples|Check accuracy every month'],
    ['dacard', 'Data Scorecard Agent', 'Reports data quality, model accuracy and use', 'Build this month’s data and AI scorecard.', 'kb:data AI scorecard', 'int', 'Review every month|Fund the most-used data products']] },
  { k: 'sc', n: 'Security, Fraud & Trust', lead: 'rg', svc: ['analyst'], res: ['r:UAE personal data protection law', 'r:UK ICO: direct marketing guidance'], learn: 'Fraud case records|Security event logs', a: [
    ['fraud', 'Fraud Detector', 'Detects SIM-swap, subscription and payment fraud', 'Which fraud patterns are rising this week?', 'sig:crit|kb:fraud SIM swap', 'int', 'Block high-risk transactions fast|Warn affected customers'],
    ['simswap', 'SIM-Swap Guard', 'Protects customers from SIM-swap attacks', 'Are SIM-swap attempts rising?', 'kb:SIM swap attack', 'int', 'Add extra checks for swaps|Alert banks to suspicious swaps'],
    ['scam', 'Scam Call & Message Agent', 'Blocks spam and scam calls and messages', 'Which scam campaigns are targeting our customers?', 'kb:scam spam calls messages|sig', 'int social', 'Block scam numbers fast|Warn customers in the app'],
    ['cyber', 'Cyber Threat Agent', 'Tracks cyber threats to the network', 'Which threats are targeting telecom networks now?', 'kb:cyber threat telecom attack', 'media research', 'Patch critical systems first|Run incident drills'],
    ['ddos', 'DDoS Shield Agent', 'Spots and stops DDoS attacks', 'Are DDoS attacks hitting us or our clients?', 'sig:crit|kb:DDoS attack', 'net int', 'Filter attack traffic|Offer DDoS protection to clients'],
    ['identity', 'Identity Check Agent', 'Checks customer identity at sign-up', 'Where do fake identities get through at sign-up?', 'kb:identity verification sign-up', 'int reg', 'Add digital ID checks|Review failed checks'],
    ['insider', 'Insider Risk Agent', 'Watches for misuse of customer data by staff', 'Is any staff access to customer data unusual?', 'kb:insider access audit', 'int', 'Limit access by role|Review access logs weekly'],
    ['breach', 'Breach Response Agent', 'Plans the response to data breaches', 'Are we ready to respond to a data breach?', 'kb:data breach response plan', 'reg int', 'Run a breach drill|Prepare customer and regulator messages'],
    ['supplier', 'Supplier Security Agent', 'Checks suppliers’ security', 'Which suppliers are a security risk?', 'kb:supplier security risk', 'int research', 'Audit high-risk suppliers|Add security terms to contracts'],
    ['iotsec', 'IoT Security Agent', 'Secures connected devices on the network', 'Which IoT devices are a security risk?', 'kb:IoT device security', 'net research', 'Isolate risky devices|Require secure defaults'],
    ['safety', 'Trust & Safety Agent', 'Protects children and vulnerable customers online', 'Are our parental controls and safety tools good enough?', 'kb:parental controls child safety', 'social reg', 'Make controls easy to find|Report safety statistics'],
    ['seccard', 'Security Scorecard Agent', 'Reports incidents, fraud losses and fix times', 'Build this month’s security scorecard.', 'sig:crit|kb:security incidents', 'int', 'Review every month|Fix repeat incidents']] }
];
const AG_DEPTS = AG_SPEC.map(D => ({
  k: D.k, n: D.n, lead: D.lead, svc: D.svc, res: D.res,
  agents: D.a.map(([id, n, role, q, calls, src, acts, learn]) => ({
    id, n, role: agT(role), q: agT(q), calls: calls.split('|').map(AG_CALL).filter(Boolean), src: src.split(' '),
    acts: acts.split('|').map(agT), learn: (learn || D.learn).split('|')
  }))
}));
const AG = { dept: 'mi', agent: 'scout', busy: false, q: '' };
const AG_LAST = new WeakMap();
const agFind = () => { const D = AG_DEPTS.find(d => d.k === AG.dept); return { D, A: D.agents.find(a => a.id === AG.agent) || D.agents[0] }; };
const agByKey = key => { const [dk, id] = String(key || '').split(':'); const D = AG_DEPTS.find(d => d.k === dk); const A = D && D.agents.find(a => a.id === id); return A ? { D, A } : null; };
const agAll = () => AG_DEPTS.flatMap(D => D.agents.map(A => ({ D, A })));
const agInit = A => esc(A.n.split(' ').map(w => w[0]).join('').slice(0, 2));
const agTools = A => [...new Set(A.calls.map(c => c[0]).concat('intel_search'))];
function agFmt(name, r) {
  try {
    if (name === 'list_signals') return r.slice(0, 4).map(x => `[${x.id}] ${x.text} (${x.operator}, ${SEVL[x.severity] || x.severity}, ${x.freshness_pct}% fresh)`);
    if (name === 'geo_hotspots') return r.hotspots.slice(0, 3).map(h => `${h.district}: ` + (h.port_outs_per_day_per_10k != null ? `${h.port_outs_per_day_per_10k} port-outs a day per 10k lines (${h.level})` : h.measured_mbps != null ? `${h.measured_mbps} Mbps measured where 5G is advertised (${h.gap})` : `rival retail pressure ${h.rival_retail_pressure}`));
    if (name === 'compare_plans') return [`${r.plan.operator} ${r.plan.plan}: $${r.plan.price_usd}, value score ${r.plan.value_score}`].concat(r.nearest_rivals.slice(0, 2).map(n => `Closest rival: ${n.operator} ${n.plan} at $${n.price_usd} (${n.similarity_pct}% similar)`));
    if (name === 'simulate_response') return [`A ${r.scenario.cut_pct}% cut by ${r.scenario.rival} for ${r.scenario.weeks} weeks: about ${fmtInt(r.extra_port_outs_if_no_response)} extra port-outs with no response`, `Best response: ${r.best}`];
    if (name === 'predict_move') return [`${r.move}: ${r.probability_pct}% within ${r.window}`];
    if (name === 'market_position') return r.slice(0, 5).map(x => `${x.name}: ${x.quadrant}${x.revenue_usd ? ', revenue ' + fmtMoney(x.revenue_usd) : ''}`);
    if (name === 'capital_deals') return r.slice(0, 4).map(d => `${d.date}: ${d.investor} → ${d.target}${d.value_usd ? ' (' + fmtMoney(d.value_usd) + ')' : ''}`);
    if (name === 'valuation_pulse') return r.rows.slice(0, 4).map(x => `${x.company}: ${typeof x.value === 'number' && x.value > 1e6 ? fmtMoney(x.value) : x.value}`);
    if (name === 'contact_plan') return r.policy ? [`Right-time engine: ${r.policy.right_time_engagement_pct}% engagement vs ${r.policy.fixed_schedule_engagement_pct}% on a fixed schedule (${r.policy.uplift_pct > 0 ? '+' : ''}${r.policy.uplift_pct}%)`, `${r.next_4_hours.length} customers ready to contact in the next 4 hours; ${r.policy.not_contacted_by_guardrails} left alone by guardrails`] : [];
    if (name === 'intel_search') return [`${r.matches} matches in the knowledge base`].concat(r.results.slice(0, 3).map(x => `${x.type}: ${x.title}`));
    if (name === 'size_market') return [`TAM ${fmtMoney(r.tam_usd)} → SAM ${fmtMoney(r.sam_usd)} → SOM ${fmtMoney(r.som_usd)}`];
    if (name === 'company_lookup') return r.slice(0, 4).map(c => `${c.name} (${c.segment})`);
  } catch (e) { /* unexpected tool output shape */ }
  return [];
}
const agSrcNames = A => A.src.map(k => (MI_SRC.find(s => s.k === k) || { n: k }).n);
// a resource token: ws:<workshop> pb:<playbook index> r:<resource name> tab:<console tab> go:#<section>
function agResLabel(tok) {
  const [t, ...rest] = tok.split(':'), v = rest.join(':');
  if (t === 'ws') { const w = WORKSHOPS.find(x => x.k === v); return w && $('#wsGrid') ? 'Workshop: ' + w.name : null; }
  if (t === 'pb') return PLAYBOOKS[+v] && $('#resGrid') ? 'Playbook: ' + PLAYBOOKS[+v][0] : null;
  if (t === 'r') return RESOURCES.some(r => r[1] === v) && $('#resGrid') ? v : null;
  if (t === 'tab') { const b = document.getElementById(v); return b ? 'Console: ' + txtOf(b) : null; }
  if (t === 'go') { const s = $(v); return s && $('h2', s) ? txtOf($('h2', s)) : null; }
  return null;
}
function agOpenRes(tok) {
  const [t, ...rest] = tok.split(':'), v = rest.join(':');
  const openRes = (sel, name) => { resCat = 'All'; resQ = ''; const q = $('#resQ'); if (q) q.value = ''; renderResources(); const el = findCard(sel, name); const box = el && (el.closest('details') || el.closest('article')); if (box && box.tagName === 'DETAILS') box.open = true; findGo(box || $('#resources'), box); };
  if (t === 'ws') { acadAud = 'all'; renderAcademy(); findGo(document.getElementById(wsAnchor(v)), true); }
  else if (t === 'pb') openRes('#resGrid summary b', PLAYBOOKS[+v][0]);
  else if (t === 'r') openRes('#resGrid h4', v);
  else if (t === 'tab') { selectTab(v); findGo($('#app')); }
  else if (t === 'go') findGo($(v));
}
function agInfoHtml(D, A) {
  const res = D.res.map(t => [t, agResLabel(t)]).filter(x => x[1]);
  const svc = D.svc.map(k => SERVICES.find(s => s.k === k)).filter(Boolean).concat(SVC_CAT.filter(s => s.dept === D.k && s.kind === 'Signature'));
  return `<div><span class="label">Searches these sources</span><div class="chips">${agSrcNames(A).map(n => `<span class="chip">${esc(n)}</span>`).join('')}</div></div>
    <div><span class="label">Runs these tools</span><div class="chips">${agTools(A).map(t => `<span class="chip hl mono">${esc(t)}</span>`).join('')}</div></div>
    <div><span class="label">Can book these services</span><div class="chips">${svc.map(s => `<button type="button" class="chip" data-agsvc="${esc(s.k)}" title="${esc(s.desc)}">${esc(s.name)} ↗</button>`).join('')}</div></div>
    <div><span class="label">Works with these resources</span><div class="chips">${res.map(([t, l]) => `<button type="button" class="chip" data-agres="${esc(t)}">${esc(l)}</button>`).join('') || '<span class="tiny muted">None on this page</span>'}</div></div>
    <div><span class="label">Gets better with</span><div class="chips">${A.learn.map(n => `<span class="chip">${esc(n)}</span>`).join('')}</div></div>`;
}
function agRenderList() {
  const el = $('#agDepts'); if (!el) return;
  el.innerHTML = AG_DEPTS.map(d => `<button type="button" data-agd="${d.k}" aria-pressed="${!AG.q && d.k === AG.dept}"><b>${esc(d.n)}</b><span>${d.agents.length} agents</span></button>`).join('');
  const { D, A } = agFind(), q = AG.q.toLowerCase();
  const list = q ? agAll().filter(({ D, A }) => (A.n + ' ' + A.role + ' ' + D.n).toLowerCase().includes(q)).slice(0, 36) : D.agents.map(a => ({ D, A: a }));
  $('#agAgents').innerHTML = list.map(x => `<button type="button" class="ag-card" data-aga="${x.D.k}:${x.A.id}" aria-pressed="${x.D.k === D.k && x.A.id === A.id}"><span class="ag-av" aria-hidden="true">${agInit(x.A)}</span><span class="ag-meta"><b>${esc(x.A.n)}</b><span>${q ? esc(x.D.n) + ' · ' : ''}${esc(x.A.role)}</span></span></button>`).join('') || '<p class="small muted">No agent matches. Try another word.</p>';
  $('#agTask').value = A.q;
  $('#agSel').textContent = `${A.n} · ${D.n}`;
  $('#agInfo').innerHTML = agInfoHtml(D, A);
}
async function agLocal(A, task, trace, body) {
  const lines = [];
  for (const [name, args] of A.calls) { try { const r = await TOOLS[name](args); trace(name, args, true); lines.push(...agFmt(name, r)); } catch (e) { trace(name, args, false); } }
  const R = miSearch(task, 'all'); trace('intel_search', { query: task.slice(0, 40) }, true);
  R.res.slice(0, 3).forEach(r => lines.push(`${r.d.type}: ${r.d.title}`));
  body.innerHTML = `<div class="ag-sec"><span class="label">Findings</span><ul class="cxl">${[...new Set(lines)].slice(0, 8).map(l => `<li>${esc(l)}</li>`).join('') || '<li>No new findings in the connected sources.</li>'}</ul></div>
    <div class="ag-sec"><span class="label">Recommended actions</span><ol class="cxl">${A.acts.map(a => `<li>${esc(a)}</li>`).join('')}</ol></div>
    <div class="ag-sec"><span class="label">Searched</span><p class="small muted">${esc(agSrcNames(A).join(' · '))} · ${R.total || 0} knowledge-base matches for the task</p></div>
    <p class="tiny muted">Built-in agent run. In the Claude viewer the agent reasons over the same tools and writes its own brief.</p>`;
  return A.acts;
}
// run one agent on a task and write its brief into box (the agents chapter, a terminal panel or the command line)
async function agExec(D, A, task, box) {
  box.innerHTML = `<div class="ag-head"><span class="ag-av" aria-hidden="true">${agInit(A)}</span><div><b>${esc(A.n)}</b><span class="tiny muted">${esc(D.n)} · working on: ${esc(task)}</span></div></div><div class="trace"></div><div class="ag-body"><p class="small muted">Searching sources and running tools…</p></div>`;
  const tr = $('.trace', box), body = $('.ag-body', box);
  const trace = (name, args, ok) => { const c = document.createElement('span'); c.className = 'tchip' + (ok ? ' done' : ' err'); c.textContent = name + '(' + Object.entries(args || {}).map(([k, v]) => k + '=' + String(v).slice(0, 24)).join(', ') + ')'; tr.appendChild(c); };
  let acts = A.acts;
  try {
    if (sample && toolsMax) {
      const tools = TOOLDEFS.filter(d => agTools(A).includes(d.name)).slice(0, toolsMax).map(d => Object.assign({}, d, { execute: async input => { try { const r = await TOOLS[d.name](input || {}); trace(d.name, input, true); return r; } catch (e) { trace(d.name, input, false); throw e; } } }));
      const prompt = `${RULES}\n\nYou are "${A.n}", an AI agent in ${agT('{opU}')}'s ${D.n} department. Your job: ${A.role}. You search these sources: ${agSrcNames(A).join(', ')}. Console data is simulated for fictional operators; positioning, landscape and capital data are researched. Use your tools, then reply in Markdown with exactly these headings: **Findings** (3-5 bullets citing what you found), **What it means for ${agT('{opU}')}** (2 bullets), **Recommended actions** (3 numbered, each with an owner), **Watch next** (1-2 bullets). Never suggest coordinating with competitors.\n\nTask: ${task}`;
      const { text } = await sample([{ role: 'user', content: prompt }], { tools, modelTier: 'quick', onText: ({ text }) => { body.innerHTML = mdLite(text); } });
      body.innerHTML = mdLite(text);
      const got = (text.match(/^\s*\d+\.\s+(.+)$/gm) || []).map(x => x.replace(/^\s*\d+\.\s+/, '').replace(/\*\*/g, '')).slice(0, 5);
      if (got.length) acts = got;
    } else acts = await agLocal(A, task, trace, body);
  } catch (err) {
    if (err && err.code === 'cancelled') { body.innerHTML = '<p class="small">Stopped.</p>'; return null; }
    acts = await agLocal(A, task, trace, body);
    body.insertAdjacentHTML('afterbegin', `<p class="tiny muted">${esc(aiFail(err))}; the built-in agent ran instead.</p>`);
  }
  body.insertAdjacentHTML('beforeend', `<div class="row-btns"><button type="button" class="btn sm" data-agtask>Add actions to the workspace</button></div>`);
  const res = { D, A, acts };
  AG_LAST.set(box, res);
  return res;
}
async function agRun() {
  if (AG.busy) return;
  const { D, A } = agFind(), task = $('#agTask').value.trim() || A.q, btn = $('#agRun');
  AG.busy = true; btn.disabled = true;
  try { await agExec(D, A, task, $('#agOut')); } finally { AG.busy = false; btn.disabled = false; }
}
// buttons inside any agent brief or info panel, wherever it is on the page
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-agtask]');
  if (t) { const box = t.closest('.ag-run'); const r = box && AG_LAST.get(box); if (!r) return; t.disabled = true; for (const x of r.acts.slice(0, 3)) await addTask({ title: `${r.A.n}: ${x}`, kind: 'manual', dept: r.D.lead, prio: 'normal' }); return; }
  const s = e.target.closest('[data-agsvc]');
  if (s) { const host = s.closest('[data-agkey]'); const hit = host ? agByKey(host.dataset.agkey) : agFind(); if (!hit) return; s.disabled = true; try { const q = await createRequest({ service: s.dataset.agsvc, details: `${hit.A.n} (${hit.D.n}) asked for this service`, urgency: 'standard', via: 'agents' }); toast(`Requested: ${q.service}${q.saved ? '' : ' (this visit only)'}`); } catch (err) { toast(err.message); } finally { s.disabled = false; } return; }
  const r = e.target.closest('[data-agres]'); if (r) agOpenRes(r.dataset.agres);
});
function initAgents() {
  if (!$('#agApp')) return;
  $('#agApp').addEventListener('click', e => {
    const d = e.target.closest('[data-agd]'); if (d) { AG.q = ''; $('#agFind').value = ''; AG.dept = d.dataset.agd; AG.agent = AG_DEPTS.find(x => x.k === AG.dept).agents[0].id; agRenderList(); $('#agOut').innerHTML = '<p class="small muted">Pick an agent and run it.</p>'; return; }
    const a = e.target.closest('[data-aga]'); if (a) { const [dk, id] = a.dataset.aga.split(':'); AG.dept = dk; AG.agent = id; agRenderList(); }
  });
  let st; $('#agFind').addEventListener('input', e => { clearTimeout(st); st = setTimeout(() => { AG.q = e.target.value.trim(); agRenderList(); }, 120); });
  $('#agRun').onclick = agRun;
  $('#agCount').textContent = agAll().length;
  $('#agDeptN').textContent = AG_DEPTS.length;
  agRenderList();
}

/* ---------- etisalat INNOVATION LAB: 500+ tools and services ---------- */
const EL_PAT = {
  agent: ['AI agent', 'Designed', a => `${a} agent`, a => `An AI agent that watches ${a} across sources and alerts the owner when something changes.`],
  monitor: ['Tool', 'Designed', a => `${a} monitor`, a => `Tracks ${a} for etisalat and every rival, daily, with change alerts and evidence.`],
  bench: ['Dashboard', 'Designed', a => `${a} benchmark`, a => `Benchmarks ${a} for etisalat, du, Virgin Mobile UAE and Gulf peers on one screen.`],
  forecast: ['Model', 'Designed', a => `${a} forecast`, a => `Predicts ${a} 30–90 days ahead from leading signals, with a confidence range.`],
  sim: ['Tool', 'Designed', a => `${a} simulator`, a => `Simulates how a change in ${a} would play out in a digital twin, before anything goes live.`],
  opt: ['Model', 'Designed', a => `${a} optimizer`, a => `Recommends the best move on ${a} for each segment, inside pricing and contact guardrails.`],
  copilot: ['AI agent', 'Designed', a => `${a} copilot`, a => `Drafts, checks and explains ${a} work for the team, citing its sources.`],
  play: ['Playbook', 'Designed', a => `${a} playbook`, a => `A step-by-step response plan for ${a} events, with owners and act-by times.`],
  audit: ['Service', 'Service', a => `${a} audit`, a => `An analyst-led review of ${a} with findings and a 90-day plan.`],
  lab: ['Workshop', 'Service', a => `${a} lab`, a => `A hands-on workshop where the team improves ${a} with live data.`]
};
// [key, name, assets for the generator, hand-picked core items: [name, type, status, description, target]]
const EL_DOM = [
  ['mi', 'Market intelligence', ['Competitor pricing', 'Competitor launch', 'Market share signal'], [['Signal feed and act-by priorities', 'Tool', 'Live', 'Ranked competitor signals with evidence, half-life and act-by times.', 'tab-cc'], ['Market intelligence hub', 'Tool', 'Live', '14 source types, multilingual analysis, search and access control.', '#challenge2'], ['Move predictor', 'Model', 'Live', 'Probability and time window for each rival move.', 'tab-pred']]],
  ['mk', 'Marketing & brand', ['Campaign timing', 'Brand sentiment', 'Segment demand'], [['Right-time engagement engine', 'Model', 'Live', 'The best hour, day and channel for each customer, inside guardrails.', '#challenge'], ['Segment marketing plans', 'Playbook', 'Live', 'Six segment plans with insight, offer, channels and KPI.', '#operators'], ['Idea lab', 'Tool', 'Live', 'Impact-versus-effort map of ideas, with idea starters.', '#operators']]],
  ['sl', 'Sales & channels', ['Store performance', 'Telesales conversion', 'Partner channel sales'], [['Sales playbook', 'Playbook', 'Live', 'Five-stage funnel, channel plan and sales rhythm.', '#operators'], ['Contact queue', 'Tool', 'Live', 'Who to contact in the next four hours, ranked by chance × value.', '#challenge'], ['Operator workspace', 'Tool', 'Live', 'Shared shift board with handover notes.', 'tab-ws']]],
  ['cx', 'Customer experience', ['Customer complaint', 'First-contact resolution', 'NPS driver'], [['Multilingual desk', 'Tool', 'Live', 'Sentiment and summaries in Arabic, English, Chinese and more.', '#challenge2'], ['Problem studio', 'Tool', 'Live', 'Turns a big problem into options, a recommendation and a 90-day plan.', '#operators']]],
  ['rt', 'Retention & loyalty', ['Churn risk', 'Save-desk offer', 'Loyalty reward'], [['Churn contagion radar', 'Dashboard', 'Live', 'Where churn is spreading, district by district.', 'tab-geo'], ['Retention offer calculator', 'Tool', 'Live', 'Shows whether a retention offer pays back.', 'tab-wb']]],
  ['pr', 'Pricing & offers', ['Prepaid bundle pricing', 'Postpaid plan value', 'Roaming pass pricing'], [['Tariff DNA', 'Tool', 'Live', 'Plans compared gene by gene; stealth price rises caught.', 'tab-dna'], ['War room', 'Tool', 'Live', 'Simulate a rival price cut against five responses.', 'tab-war']]],
  ['en', 'Enterprise, SME & government', ['Tender pipeline', 'Enterprise solution demand', 'SME bundle uptake'], [['Client plans for six groups', 'Playbook', 'Live', 'Needs, offers, sales motions and KPIs per client group.', '#clients'], ['SME growth pack design', 'Playbook', 'Live', 'Lines, fibre, cloud, AI assistant and payments in one pack.', '#operators']]],
  ['nw', 'Network & coverage', ['Coverage claim', 'Network speed', 'Site build activity'], [['Coverage truth layer', 'Dashboard', 'Live', 'Advertised versus measured coverage per hex cell.', 'tab-geo']]],
  ['fb', 'Fibre & home', ['Fibre demand', 'Fixed wireless competition', 'Household bundle'], [['Household hub concept', 'Playbook', 'Prototype', 'One family account for mobile, fibre, entertainment and wallet.', '#operators']]],
  ['dg', 'Digital & app', ['App store rating', 'Digital sign-up journey', 'App feature release'], [['App Store Watcher agent', 'AI agent', 'Live', 'Tracks ratings, reviews and releases of every telecom app.', '#agents']]],
  ['fm', 'etisalat money & fintech', ['Wallet adoption', 'Remittance corridor', 'Merchant acceptance'], [['Wallet Growth agent', 'AI agent', 'Live', 'Finds who is ready to use etisalat money and why.', '#agents']]],
  ['dv', 'Devices & retail', ['Device trade-in offer', 'Device stock', 'Accessory attach rate'], [['Store Intel agent', 'AI agent', 'Live', 'Watches rival retail moves near etisalat stores.', '#agents']]],
  ['rm', 'Roaming & visitors', ['Visitor connectivity', 'Roaming usage', 'Tourist eSIM demand'], [['Tourist eSIM at arrival', 'Playbook', 'Prototype', 'QR sign-up at the airport with a ready wallet.', '#operators']]],
  ['sg', 'Strategy & M&A', ['Deal flow', 'Peer valuation', 'Portfolio performance'], [['Capital radar', 'Dashboard', 'Live', 'Valuations and state, PE and hedge-fund moves.', 'tab-cap'], ['Analyst workbench', 'Tool', 'Live', 'Benchmark of 108 real operators with CSV export.', 'tab-wb'], ['Positioning quadrants', 'Dashboard', 'Live', 'Where every operator sits and what to improve.', '#positioning']]],
  ['fi', 'Finance & investor relations', ['Revenue at risk', 'Investor sentiment', 'Cost efficiency'], [['Value calculator', 'Tool', 'Live', 'AED value of retention, upgrades and analyst time.', '#value']]],
  ['rg', 'Regulatory & spectrum', ['Regulatory consultation', 'Spectrum holding', 'Consumer-protection rule'], [['Consultation Tracker agent', 'AI agent', 'Live', 'Tracks consultations, decisions and deadlines.', '#agents']]],
  ['ai', 'Data, AI & analytics', ['Data quality', 'Model performance', 'Feature store'], [['Grounded AI assistant', 'AI agent', 'Live', '17 tools, citations on every answer, no price-coordination advice.', 'tab-ask'], ['Fairness check', 'Tool', 'Live', 'Confirms no customer segment is worse off.', '#challenge']]],
  ['sc', 'Security & privacy', ['Access permission', 'Privacy request', 'Fraud signal'], [['Business-unit access control', 'Tool', 'Live', 'Role and division rules for public, licensed and internal data.', '#challenge2']]],
  ['pp', 'People & skills', ['Analyst skill', 'Frontline knowledge', 'Leadership foresight'], [['Cellvoyant Academy', 'Workshop', 'Service', '12 workshops on a four-step learning path.', '#academy'], ['Certified analyst program', 'Workshop', 'Service', 'Six-week cohort with a capstone brief.', '#academy']]],
  ['pt', 'Partners & procurement', ['Vendor performance', 'Partner offer', 'Content partnership'], [['Benchmark consortium', 'Service', 'Designed', 'Lagged, aggregated peer benchmarks with no forward-looking prices.', null]]]
];
const EL_STATUS = { Live: 'st-live', Prototype: 'st-proto', Designed: 'st-prod', Service: 'st-svc' };
let EL_ITEMS = null;
function elBuild() {
  if (EL_ITEMS) return EL_ITEMS;
  const items = [];
  EL_DOM.forEach(([k, dn, assets, core]) => {
    core.forEach(([n, type, status, d, tgt]) => items.push({ k, dn, n, type, status, d, tgt }));
    assets.forEach(a => Object.values(EL_PAT).forEach(([type, status, nf, df]) => items.push({ k, dn, n: nf(a), type, status, d: df(/^[A-Z]{2}/.test(a) ? a : a[0].toLowerCase() + a.slice(1)), tgt: null })));
  });
  // Cellvoyant’s own innovation catalogue, mapped to the closest etisalat area
  const map = { 'AI engines': 'ai', 'Data & tools': 'mi', 'Delivery': 'sl', 'Services': 'pp', 'Trust & guardrails': 'sc' };
  LAB.forEach(([cat, , n, d]) => { const k = map[cat] || 'mi'; const dn = EL_DOM.find(x => x[0] === k)[1]; if (!items.some(x => x.n === n)) items.push({ k, dn, n, type: cat === 'Services' ? 'Service' : cat === 'AI engines' ? 'Model' : 'Tool', status: isLive(n) ? 'Live' : cat === 'Services' ? 'Service' : 'Designed', d, tgt: null, core: true }); });
  return (EL_ITEMS = items);
}
const EL = { q: '', dom: 'all', type: 'all', status: 'all', shown: 36 };
function elRender() {
  const root = $('#elGrid'); if (!root) return;
  const all = elBuild(), q = EL.q.toLowerCase();
  const list = all.filter(x => (EL.dom === 'all' || x.k === EL.dom) && (EL.type === 'all' || x.type === EL.type) && (EL.status === 'all' || x.status === EL.status) && (!q || (x.n + ' ' + x.d + ' ' + x.dn).toLowerCase().includes(q)))
    .sort((a, b) => ['Live', 'Prototype', 'Service', 'Designed'].indexOf(a.status) - ['Live', 'Prototype', 'Service', 'Designed'].indexOf(b.status));
  const cnt = s => all.filter(x => x.status === s).length;
  $('#elTotal').textContent = all.length;
  $('#elSum').innerHTML = [['Tools and services', all.length], ['Live on this page', cnt('Live')], ['Prototypes', cnt('Prototype')], ['Services and workshops', cnt('Service')], ['Designed, ready to scope', cnt('Designed')]].map(([l, v]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
  $('#elCount').textContent = `${list.length} match${list.length === 1 ? '' : 'es'}`;
  root.innerHTML = list.slice(0, EL.shown).map((x, i) => `<article class="el"><div class="el-h"><span class="label">${esc(x.dn)}</span><span class="stc ${EL_STATUS[x.status]}">${esc(x.status)}</span></div><b>${esc(x.n)}</b><span class="small">${esc(x.d)}</span><div class="el-f"><span class="chip">${esc(x.type)}</span>${x.tgt && hasTarget(x.tgt) ? `<button type="button" class="btn sm" data-go="${x.tgt}">Open</button>` : x.status === 'Live' ? '<span class="tiny muted">On this page</span>' : `<button type="button" class="btn sm" data-elreq="${esc(x.n)}">Request</button>`}</div></article>`).join('') || '<p class="muted">No tools match. Try another word or filter.</p>';
  $('#elMore').hidden = list.length <= EL.shown;
}
function initElab() {
  const root = $('#elab'); if (!root) return;
  $('#elDom').innerHTML = '<option value="all">All areas</option>' + EL_DOM.map(d => `<option value="${d[0]}">${esc(d[1])}</option>`).join('');
  const seg = (id, key, vals) => { $(id).innerHTML = vals.map(v => `<button type="button" data-v="${esc(v)}" aria-pressed="${EL[key] === v}">${esc(v === 'all' ? 'All' : v)}</button>`).join(''); $(id).addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; EL[key] = b.dataset.v; EL.shown = 36; $$(id + ' [data-v]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); elRender(); }); };
  seg('#elType', 'type', ['all', 'AI agent', 'Tool', 'Model', 'Dashboard', 'Playbook', 'Service', 'Workshop']);
  seg('#elStatus', 'status', ['all', 'Live', 'Prototype', 'Service', 'Designed']);
  $('#elDom').addEventListener('change', e => { EL.dom = e.target.value; EL.shown = 36; elRender(); });
  let st; $('#elQ').addEventListener('input', e => { clearTimeout(st); st = setTimeout(() => { EL.q = e.target.value.trim(); EL.shown = 36; elRender(); }, 120); });
  $('#elMore').onclick = () => { EL.shown += 48; elRender(); };
  root.addEventListener('click', async e => {
    const g = e.target.closest('[data-go]'); if (g) { goTool(g.dataset.go); return; }
    const r = e.target.closest('[data-elreq]'); if (!r) return; r.disabled = true;
    try { const q = await createRequest({ service: 'lab_item', details: `etisalat UAE: ${r.dataset.elreq}`, urgency: 'standard', via: 'innovation lab' }); toast(`Requested ${q.label}${q.saved ? '' : ' (this visit only)'}`); r.textContent = 'Requested'; }
    catch (err) { toast(err.message); r.disabled = false; }
  });
  elRender();
}

/* ---------- COMMAND CENTER ---------- */
const feedEl = $('#feed'), detailEl = $('#detail');
function kpis(tick) {
  const open = events.filter(e => fresh(e) > .1);
  const crit = events.filter(e => e.tpl.sev === 'crit' && fresh(e) > .25).length;
  const risk = open.reduce((s, e) => s + (e.tpl.risk || 0) * e.tpl.conf * fresh(e), 0);
  const today = 37 + events.filter(e => simDate(e.t).toDateString() === simDate().toDateString()).length;
  const P = pressure();
  if (tick || !riskHist.length) [[riskHist, risk], [idxHist, P.idx], [sigHist, today], [portHist, netPorts], [critHist, crit]].forEach(([h, v]) => { h.push(v); if (h.length > 60) h.shift(); });
  const nim = PLANS.find(p => p.id === 'nim-u'), rivals = PLANS.filter(p => ['vtx-p', 'arc-p'].includes(p.id));
  const gap = nim.price - Math.min(...rivals.map(p => p.price));
  const due = open.map(actBy).filter(a => a.left > 0).sort((a, b) => a.left - b.left), soon = due.filter(a => a.left <= 360).length;
  const ladder = [nim, ...rivals].sort((a, b) => a.price - b.price);
  const lad = `<div class="ladder">${ladder.map(p => `<span class="opt${p.op === 'nim' ? ' you' : ''}" style="--c:${opColor(p.op)}">${esc(OPS[p.op].short)} $${p.price}</span>`).join('')}</div>`;
  $('#kpis').innerHTML = [
    ['Signals today', fmtInt(today), '<span class="muted">from 41 sources</span>', deltaChip(sigHist, fmtInt, null), areaSpark(sigHist, 'var(--accent)')],
    ['Critical, still fresh', crit, crit ? '<span class="down">act within hours</span>' : '<span class="up">all clear</span>', deltaChip(critHist, fmtInt, false), areaSpark(critHist, 'var(--crit)')],
    ['Revenue at risk (open)', fmtMoney(risk), '<span class="muted">confidence × freshness</span>', deltaChip(riskHist, fmtMoney, false), areaSpark(riskHist, 'var(--signal)')],
    ['Net port balance · 7d', (netPorts > 0 ? '+' : '−') + fmtInt(Math.abs(netPorts)), '<span class="down">vs −860 last week</span>', deltaChip(portHist, fmtInt, true), areaSpark(portHist, 'var(--crit)')],
    ['Premium price gap', (gap >= 0 ? '+$' : '−$') + Math.abs(gap), '<span class="muted">vs cheapest rival network</span>', '<span class="dchip b">Arcline −$10</span>', lad],
    ['Next act-by', due.length ? fmtLeft(due[0].left).replace(/^in /, '') : '—', due.length ? `<span class="muted">at ${esc(fmtHM(due[0].due))} · ${soon} due within 6h</span>` : '<span class="up">nothing pending</span>', '', `<div class="meter" aria-hidden="true"><i style="width:${Math.min(100, soon / Math.max(1, open.length) * 100).toFixed(0)}%"></i></div>`]
  ].map(([l, v, d, c, viz]) => `<div class="kpi"><div class="kh"><span class="l">${l}</span>${c}</div><span class="v">${v}</span><span class="d">${d}</span>${viz}</div>`).join('');
  $('#critCount').textContent = crit; $('#critCount').hidden = !crit;
  renderPulse(P); renderTape(P);
}
function evHTML(e) {
  const T = e.tpl, f = fresh(e), op = OPS[T.op];
  return `<button type="button" class="ev${e.id === selId ? ' sel' : ''}${e.isNew ? ' new' : ''}${lensMatch(e) ? '' : ' dim'}" data-id="${e.id}">
    <span class="tm">${esc(fmtHM(e.t))}</span>
    <span class="body">
      <span class="line1"><span class="sev ${T.sev}">${SEVL[T.sev]}</span><span class="opt" style="--c:${opColor(T.op)}">${esc(op.short)}</span><span class="cls">${esc(T.cls)}</span>${e.rule ? '<span class="rulehit" title="' + esc(e.rule) + '">Rule</span>' : ''}</span>
      <span class="txt">${esc(e.text)}</span>
      <span class="meta"><span>${e.id}</span><span>${esc(T.src)}</span><span>conf ${Math.round(T.conf * 100)}%</span><span>${T.risk ? fmtMoney(T.risk) + ' at risk' : 'strategic'}</span></span>
      <span class="routes"><span class="tiny muted">Routed to</span>${routeOf(e).map(k => `<span class="rt${lens === k ? ' on' : ''}">${esc(DEPT[k].short)}</span>`).join('')}</span>
      <span class="fresh${f < .25 ? ' stale' : ''}"><span>½-life ${fmtHL(T.hl)}</span><span class="track"><i style="width:${(f * 100).toFixed(1)}%"></i></span><span data-f>${Math.round(f * 100)}% fresh</span></span>
    </span></button>`;
}
function renderFeed() {
  const list = [...events].sort((a, b) => lensScore(b) - lensScore(a));
  feedEl.innerHTML = list.map(evHTML).join('');
  $('#feedCount').textContent = lens === 'all' ? events.length + ' signals' : `${events.filter(lensMatch).length} of ${events.length} for ${DEPT[lens].short}`;
  events.forEach(e => { e.isNew = false; });
}
function refreshFreshness() {
  $$('.ev', feedEl).forEach(b => {
    const e = events.find(x => x.id === b.dataset.id); if (!e) return;
    const f = fresh(e);
    const i = $('.track i', b); if (i) i.style.width = (f * 100).toFixed(1) + '%';
    const t = $('[data-f]', b); if (t) t.textContent = Math.round(f * 100) + '% fresh';
    const fr = $('.fresh', b); if (fr) fr.classList.toggle('stale', f < .25);
  });
}
const WAR_OPS = ['arc', 'vtx', 'pls', 'kte'];
function renderDetail() {
  const e = events.find(x => x.id === selId); if (!e) return;
  const T = e.tpl;
  detailEl.innerHTML = `<div class="box-h"><span><b>${e.id}</b> · ${esc(T.cls)}</span><span>${esc(fmtAgo(e.t))}</span></div>
  <div class="detail">
    <div style="display:grid;gap:8px">
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="sev ${T.sev}">${SEVL[T.sev]}</span><span class="opt" style="--c:${opColor(T.op)}">${esc(OPS[T.op].name)}</span><span class="cls">${esc(OPS[T.op].kind)}</span></div>
      <h3>${esc(e.text)}</h3>
    </div>
    <div><div class="label" style="margin-bottom:8px">Evidence chain · fused confidence ${Math.round(T.conf * 100)}%</div>
      <div class="ev-chain">${e.evidence.map(v => `<div><b style="font-weight:500">${esc(v[0])}</b><span>${Math.round(v[2] * 100)}%</span><span style="grid-column:1/-1">${esc(v[1])}</span><span class="cb"><i style="width:${v[2] * 100}%"></i></span></div>`).join('')}</div></div>
    <div class="next"><b>Predicted next move</b>${esc(e.next)}</div>
    <div><div class="label" style="margin-bottom:8px">Recommended plays</div>
      <div class="plays">${e.plays.map(p => `<div class="play"><b>${esc(p[0])}</b><span class="eff">${esc(p[2])}</span><span class="tr">${esc(p[1])} · <i>${esc(p[3])}</i></span></div>`).join('')}</div></div>
    <div class="row-btns"><button class="btn sm accent" type="button" id="draftBtn">Draft a counter-move with Claude</button>${WAR_OPS.includes(T.op) ? '<button class="btn sm" type="button" id="toWar">Simulate in War room</button>' : ''}<button class="btn sm" type="button" id="toWs">Add to my workspace</button></div>
    <div id="draftOut"></div>
  </div>`;
  $('#draftBtn').onclick = ev => draftCounter(e, ev.currentTarget, $('#draftOut'));
  $('#toWs').onclick = ev => taskFromSignal(e.id, ev.currentTarget);
  const tw = $('#toWar'); if (tw) tw.onclick = () => { $('#wRival').value = T.op; if (T.op === 'kte') $('#wCut').value = 25; selectTab('tab-war'); runWar(); };
}
function offlinePlaybook(e, note) {
  const owners = ['Pricing', 'Retail', 'Marketing'];
  return `<div class="ai-out"><span class="by">Built-in playbook${note ? ' · ' + esc(note) : ''}</span>
    <p>${esc(e.id)}: respond within ${fmtHL(Math.max(2, Math.round(e.tpl.hl / 2)))} while the signal is still fresh.</p>
    <ul style="margin:0;padding-left:18px">${e.plays.map((p, i) => `<li><b>${esc(p[0])}</b> (${owners[i]}): ${esc(p[1])}. Expected: ${esc(p[2])}.</li>`).join('')}</ul></div>`;
}
async function draftCounter(e, btn, out) {
  if (!sample) { out.innerHTML = offlinePlaybook(e, 'Claude is not available in this view'); return; }
  const ctl = new AbortController();
  btn.disabled = true;
  out.innerHTML = '<div class="ai-out"><span class="by">Claude · drafting</span><span class="muted">Thinking…</span><div><button class="btn sm" type="button">Stop</button></div></div>';
  $('button', out).onclick = () => ctl.abort();
  const sig = { id: e.id, operator: OPS[e.tpl.op].name, class: e.tpl.cls, severity: e.tpl.sev, text: e.text, source: e.tpl.src, confidence: e.tpl.conf, revenue_at_risk_usd: e.tpl.risk, freshness_pct: Math.round(fresh(e) * 100), predicted_next_move: e.next, evidence: e.evidence.map(v => v[0] + ' (' + v[1] + ')'), candidate_plays: e.plays.map(p => p[0] + ': ' + p[1]) };
  const prompt = `You are Cellvoyant, a telecom competitive-intelligence analyst. All data is SIMULATED demo data about fictional operators. Our company is Nimbus Mobile, a mobile network operator (MNO).\n\nDraft a practical counter-move plan for this signal:\n${JSON.stringify(sig, null, 1)}\n\nMarket context:\n${contextBrief(6)}\n\nRules: be specific; reference the signal ID; never suggest coordinating prices or exchanging information with competitors; no disparaging claims about competitors.\n\nReply with only JSON of this shape: {"summary": "one sentence", "plays": [{"name": "...", "owner": "Pricing|Retail|Network|Marketing|Enterprise|Regulatory|Customer care", "timing": "e.g. within 48h", "action": "...", "expected_effect": "...", "risk": "..."}], "watch": ["...", "..."]} with exactly 3 plays and 2–3 watch items.`;
  try {
    const d = await sample.json(prompt, { signal: ctl.signal });
    const plays = Array.isArray(d && d.plays) ? d.plays.slice(0, 4) : [];
    if (!plays.length) throw { code: 'invalid_json' };
    out.innerHTML = `<div class="ai-out"><span class="by">Claude · counter-move draft</span>
      ${d.summary ? `<p><b>${esc(d.summary)}</b></p>` : ''}
      <div class="plays">${plays.map(p => `<div class="play"><b>${esc(p.name)}</b><span class="eff">${esc(p.timing || '')}</span><span class="tr">${esc(p.owner || '')}${p.owner ? ' · ' : ''}${esc(p.action || '')}${p.expected_effect ? ' → ' + esc(p.expected_effect) : ''}${p.risk ? ' · <i>Risk: ' + esc(p.risk) + '</i>' : ''}</span></div>`).join('')}</div>
      ${Array.isArray(d.watch) && d.watch.length ? `<div><span class="label">Watch next</span><ul style="margin:4px 0 0;padding-left:18px">${d.watch.slice(0, 3).map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}</div>`;
  } catch (err) {
    if (err && err.code === 'cancelled') out.innerHTML = '<p class="small muted">Stopped.</p>';
    else out.innerHTML = offlinePlaybook(e, aiFail(err));
  } finally { btn.disabled = false; }
}
feedEl.addEventListener('click', ev => {
  const b = ev.target.closest('.ev'); if (!b) return;
  selId = b.dataset.id;
  $$('.ev', feedEl).forEach(x => x.classList.toggle('sel', x === b));
  renderDetail();
  if (window.innerWidth < 980) detailEl.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' });
});

/* radar */
function initRadar() {
  const cv = $('#radar'); const ctx = cv.getContext('2d');
  const ORDER = ['vtx', 'arc', 'pls', 'sky', 'kte'];
  let sweep = -Math.PI / 2, W = 0, H = 0, dpr = 1, raf = 0;
  function threat() {
    const t = {}; ORDER.forEach(o => t[o] = 0);
    events.forEach(e => { if (t[e.tpl.op] !== undefined) t[e.tpl.op] += score(e); });
    const mx = Math.max(...Object.values(t), 1); ORDER.forEach(o => t[o] /= mx); return t;
  }
  function size() { const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  function draw() {
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 22;
    ctx.strokeStyle = 'rgba(120,190,205,.18)'; ctx.lineWidth = 1;
    [1, .66, .33].forEach(k => { ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, Math.PI * 2); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    if (ctx.createConicGradient) { const g = ctx.createConicGradient(sweep - .9, cx, cy); g.addColorStop(0, 'rgba(60,207,217,0)'); g.addColorStop(.14, 'rgba(60,207,217,.28)'); g.addColorStop(.1435, 'rgba(60,207,217,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, sweep - .9, sweep); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(60,207,217,.8)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R); ctx.stroke();
    ctx.fillStyle = '#3CCFD9'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = '600 10px "IBM Plex Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#CFE3E8'; ctx.fillText('YOU', cx, cy + 16);
    const t = threat();
    ORDER.forEach((o, i) => {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / ORDER.length) + .35;
      const r = R * (.28 + .68 * (1 - t[o]));
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      let since = ((sweep - a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const glow = 1 - since / (Math.PI * 2);
      ctx.globalAlpha = .45 + .55 * glow;
      ctx.fillStyle = SCREEN_OP[o]; ctx.beginPath(); ctx.arc(x, y, 4 + 5 * t[o], 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#CFE3E8'; ctx.font = '600 11px "IBM Plex Sans", system-ui, sans-serif';
      ctx.textAlign = Math.cos(a) < -.2 ? 'right' : Math.cos(a) > .2 ? 'left' : 'center';
      const lx = x + Math.cos(a) * 12, ly = y + Math.sin(a) * 12 + (Math.sin(a) > .5 ? 8 : Math.sin(a) < -.5 ? -4 : 4);
      ctx.fillText(OPS[o].short + ' ' + Math.round(t[o] * 100), lx, ly);
    });
  }
  function loop() { raf = requestAnimationFrame(loop); sweep += .018; if (sweep > Math.PI * 1.5) sweep -= Math.PI * 2; draw(); }
  size(); draw();
  if (!RM.matches) raf = requestAnimationFrame(loop);
  new ResizeObserver(() => { size(); draw(); }).observe(cv);
  return { draw };
}

/* live loop */
let live = !RM.matches, ticks = 0, lastTpl = 0;
function setLive(v) {
  live = v; const b = $('#liveBtn');
  b.setAttribute('aria-pressed', String(v)); $('span', b).textContent = v ? 'Live' : 'Paused'; renderStatus();
  $('#liveDot').style.background = v ? 'var(--good)' : 'var(--line-strong)'; $('#liveDot').classList.toggle('live', v);
}
$('#liveBtn').onclick = () => setLive(!live);
function spawnEvent() {
  let i; do { i = Math.floor(rand() * TPL.length); } while (i === lastTpl);
  lastTpl = i;
  const e = mkEvent(i, simMin); e.isNew = true; events.push(e); sigLog.push({ t: e.t, cls: e.tpl.cls, op: e.tpl.op }); onNewEvent(e);
  if (TPL[i].cls === 'Port-outs') netPorts -= 120 + Math.round(rand() * 80); else netPorts -= Math.round(rand() * 25);
  if (events.length > 24) { const oldest = [...events].sort((a, b) => score(a) - score(b))[0]; if (oldest.id !== selId) events.splice(events.indexOf(oldest), 1); }
  renderFeed(); kpis(); renderPriorities(); renderLensBrief(); renderStatus();
}
setInterval(() => {
  if (!live || document.hidden) return;
  simMin += 5; ticks++;
  $('#simClock').textContent = fmtClock();
  refreshFreshness();
  if (ticks % 8 === 0) spawnEvent(); else if (ticks % 4 === 0 && !$('#prio').contains(document.activeElement)) renderPriorities();
  if (MI.panel === 'search' && ticks % 6 === 0 && !$('#mi-search').hidden) miRenderTrends();
  kpis(true); GEO.t++; if (ticks % 3 === 0) geoJitter(); geoTick();
}, 1000);

/* ---------- TARIFF DNA ---------- */
const PLANS = [
  { id: 'nim-u', op: 'nim', name: 'Unlimited Plus', price: 65, data: 999, hotspot: 50, sa: 1, stream: 10, roam: 10, contract: 0, fees: 0, sat: 0, credit: 400 },
  { id: 'nim-e', op: 'nim', name: 'Essential 20', price: 35, data: 20, hotspot: 5, sa: 0, stream: 0, roam: 0, contract: 0, fees: 0, sat: 0, credit: 100 },
  { id: 'vtx-p', op: 'vtx', name: 'Unlimited Max', price: 70, data: 999, hotspot: 60, sa: 1, stream: 15, roam: 15, contract: 24, fees: 4, sat: 0, credit: 800 },
  { id: 'vtx-l', op: 'vtx', name: 'Legacy Plus', price: 55, data: 999, hotspot: 15, sa: 0, stream: 0, roam: 0, contract: 0, fees: 4, sat: 0, credit: 0, mut: [{ gene: 'fees', from: '$0', to: '$4', days: 3, note: '"Network access fee" added; headline price unchanged' }, { gene: 'hotspot', from: '30 GB', to: '15 GB', days: 3, note: 'Hotspot allowance halved in the same terms revision' }] },
  { id: 'arc-p', op: 'arc', name: 'Unlimited Premium', price: 60, data: 999, hotspot: 50, sa: 1, stream: 10, roam: 5, contract: 0, fees: 0, sat: 1, credit: 800, mut: [{ gene: 'price', from: '$70', to: '$60', days: 6, note: 'Headline cut for new lines and port-ins' }, { gene: 'credit', from: '$400', to: '$800', days: 2, note: 'Trade-in credit doubled, any condition' }] },
  { id: 'arc-s', op: 'arc', name: 'Starter 15', price: 30, data: 15, hotspot: 5, sa: 0, stream: 0, roam: 0, contract: 0, fees: 2, sat: 0, credit: 0 },
  { id: 'pls-u', op: 'pls', name: 'Unlimited + Home', price: 40, data: 999, hotspot: 10, sa: 0, stream: 0, roam: 0, contract: 0, fees: 0, sat: 0, credit: 200, note: 'needs Pulsar broadband' },
  { id: 'kte-e', op: 'kte', name: 'eSIM Unlimited', price: 25, data: 999, hotspot: 5, sa: 0, stream: 0, roam: 0, contract: 0, fees: 0, sat: 0, credit: 0, mut: [{ gene: 'new plan', from: '—', to: '$25', days: 4, note: 'New eSIM-only plan with in-app sign-up' }] },
  { id: 'kte-l', op: 'kte', name: 'Lite 8', price: 15, data: 8, hotspot: 0, sa: 0, stream: 0, roam: 0, contract: 0, fees: 0, sat: 0, credit: 0 }
];
const GENES = [
  { k: 'price', l: 'Price', w: 2.2, n: v => 1 - clamp((v - 15) / 60, 0, 1), f: v => '$' + v },
  { k: 'data', l: 'Data', w: 1.4, n: v => v >= 999 ? 1 : clamp(v / 60, 0, 1), f: v => v >= 999 ? 'unlimited' : v + ' GB' },
  { k: 'hotspot', l: 'Hotspot', w: .8, n: v => clamp(v / 60, 0, 1), f: v => v + ' GB hotspot' },
  { k: 'sa', l: '5G SA', w: .7, n: v => v ? 1 : 0, f: v => v ? '5G SA' : 'no 5G SA' },
  { k: 'stream', l: 'Perks', w: .8, n: v => clamp(v / 15, 0, 1), f: v => '$' + v + ' perks' },
  { k: 'roam', l: 'Roam', w: .5, n: v => clamp(v / 15, 0, 1), f: v => v + ' roam days' },
  { k: 'contract', l: 'No lock', w: .8, n: v => 1 - clamp(v / 24, 0, 1), f: v => v ? v + '-mo lock-in' : 'no lock-in' },
  { k: 'fees', l: 'No fees', w: 1, n: v => 1 - clamp(v / 5, 0, 1), f: v => '$' + v + ' fees' },
  { k: 'sat', l: 'Sat', w: .5, n: v => v ? 1 : 0, f: v => v ? 'satellite text' : 'no satellite' },
  { k: 'credit', l: 'Device', w: .7, n: v => clamp(v / 800, 0, 1), f: v => '$' + v + ' device credit' }
];
const vec = p => GENES.map(g => g.n(p[g.k]));
const valueScore = p => { const v = vec(p); let s = 0, w = 0; GENES.forEach((g, i) => { s += g.w * v[i]; w += g.w; }); return Math.round(s / w * 100); };
let selPlan = 'nim-u';
function renderDNA() {
  $('#dnaLegend').innerHTML = GENES.map(g => `<span>${g.l}</span>`).join('');
  const near = nearest(selPlan).map(x => x.p.id);
  $('#plans').innerHTML = PLANS.map(p => {
    const v = vec(p); const muts = (p.mut || []).map(m => m.gene);
    return `<button type="button" class="plan${p.id === selPlan ? ' sel' : ''}${near.includes(p.id) ? ' near' : ''}" data-id="${p.id}" style="--c:${opColor(p.op)}">
      <span class="nm"><span class="opt" style="--c:${opColor(p.op)}">${esc(OPS[p.op].short)}${p.op === 'nim' ? ' (you)' : ''}</span><b>${esc(p.name)}</b><span class="tiny muted mono">value ${valueScore(p)} · eff. $${p.price + p.fees}${p.note ? ' · ' + esc(p.note) : ''}</span></span>
      <span class="strip" aria-label="Gene strip">${GENES.map((g, i) => `<i class="${muts.includes(g.k) ? 'mut' : ''}" style="--p:${Math.round(14 + v[i] * 80)}%" title="${esc(g.l)}: ${esc(g.f(p[g.k]))}"></i>`).join('')}</span>
      <span class="pr">$${p.price}<small>/mo</small></span></button>`;
  }).join('');
  const sp = PLANS.find(p => p.id === selPlan);
  $('#nearFor').textContent = 'to ' + OPS[sp.op].short + ' ' + sp.name;
  $('#nearList').innerHTML = nearest(selPlan).map(({ p, d }) => {
    const deltas = GENES.filter(g => p[g.k] !== sp[g.k]).map(g => {
      const better = g.n(p[g.k]) > g.n(sp[g.k]);
      return `<span class="delta ${better ? 'bad' : 'good'}">${esc(g.f(p[g.k]))}</span>`;
    }).join('');
    const sim = Math.round(100 * (1 - d / Math.sqrt(GENES.length)));
    return `<div class="near-item"><div class="hd"><span><span class="opt" style="--c:${opColor(p.op)}">${esc(OPS[p.op].short)}</span> <b>${esc(p.name)}</b></span><span class="mono small">${sim}% similar</span></div>
      <div class="deltas">${deltas || '<span class="delta">identical genome</span>'}</div>
      <span class="tiny muted">Value ${valueScore(p)} vs ${valueScore(sp)} · effective $${p.price + p.fees} vs $${sp.price + sp.fees}</span></div>`;
  }).join('') + '<p class="tiny muted">Red = the rival plan offers more on that gene. Green = the selected plan offers more.</p>';
  const muts = PLANS.flatMap(p => (p.mut || []).map(m => ({ p, m }))).sort((a, b) => a.m.days - b.m.days);
  $('#mutLog').innerHTML = muts.map(({ p, m }) => `<div><span class="gene">${esc(m.gene)}: ${esc(m.from)} → ${esc(m.to)} · ${m.days}d ago</span><span><span class="opt" style="--c:${opColor(p.op)}">${esc(OPS[p.op].short)}</span> <b>${esc(p.name)}</b></span><span class="small muted">${esc(m.note)}</span></div>`).join('');
}
function nearest(id) {
  const a = PLANS.find(p => p.id === id), va = vec(a);
  return PLANS.filter(p => p.op !== a.op).map(p => { const vb = vec(p); return { p, d: Math.sqrt(vb.reduce((s, x, i) => s + Math.pow((x - va[i]) * (i === 0 ? 1.4 : 1), 2), 0)) }; }).sort((x, y) => x.d - y.d).slice(0, 3);
}
$('#plans').addEventListener('click', e => { const b = e.target.closest('.plan'); if (!b) return; selPlan = b.dataset.id; renderDNA(); const nb = $(`.plan[data-id="${selPlan}"]`); if (nb) nb.focus(); });

/* ---------- MOVE PREDICTOR ---------- */
const PRED = [
  { id: 'fwa', op: 'vtx', title: 'Vertex launches 5G home internet (FWA) in 3 metros', short: 'Vertex · FWA launch', prior: .12, window: '45–90 days', impact: '$3.1M/yr broadband and bundle churn at risk', signals: [
    { t: '42 FWA installer job posts in 3 cities', s: 'Job postings', lr: 3.2, r: .8, g: 'jobs', on: true },
    { t: 'Equipment authorization filed for new outdoor 5G CPE', s: 'Equipment authorizations', lr: 4.0, r: .95, g: 'regulatory', on: true },
    { t: 'App v8.4 strings reference "HomeLink 5G"', s: 'App release diff', lr: 2.5, r: .7, g: 'product', on: true },
    { t: '"HomeLink" domains registered by Vertex’s registrar agent', s: 'Domain registrations', lr: 1.8, r: .6, g: 'product', on: true },
    { t: 'Vendor earnings call: "large FWA order from a regional operator"', s: 'Earnings calls', lr: 1.6, r: .5, g: 'supply', on: false }] },
  { id: 'cut', op: 'arc', title: 'Arcline extends its price cut to family plans', short: 'Arcline · family price cut', prior: .2, window: '14–30 days', impact: '$2.4M ARPU pressure on your family base', signals: [
    { t: 'Premium unlimited cut −$10 (already live)', s: 'Tariff crawler', lr: 2.6, r: .97, g: 'pricing', on: true },
    { t: 'Family-plan page A/B variant with a lower price', s: 'Web change monitor', lr: 3.5, r: .9, g: 'pricing', on: true },
    { t: 'Arcline port-ins falling 3 weeks straight (from your data)', s: 'Port-out analytics', lr: 2.2, r: .85, g: 'ports', on: true },
    { t: 'CFO on the earnings call: "we will defend share"', s: 'Earnings calls', lr: 1.9, r: .6, g: 'exec', on: true },
    { t: 'Store staff report new family-promo training', s: 'Frontline reports', lr: 2.0, r: .7, g: 'retail', on: false }] },
  { id: 'sat', op: 'sky', title: 'Skyreach signs a satellite bundle with Pulsar', short: 'Skyreach × Pulsar bundle', prior: .08, window: '60–150 days', impact: 'Feature gap on premium plans in rural districts', signals: [
    { t: 'Roaming/hosting agreement filed with the regulator', s: 'Regulatory feed', lr: 2.8, r: .9, g: 'regulatory', on: true },
    { t: 'Joint trademark "PulsarSky" filed', s: 'Trademark registrations', lr: 3.0, r: .85, g: 'brand', on: false },
    { t: 'Pulsar hired Skyreach’s former partnerships lead', s: 'Job moves', lr: 1.7, r: .6, g: 'people', on: true },
    { t: 'Forum rumor about a bundle', s: 'Social listening', lr: 1.3, r: .3, g: 'rumor', on: true },
    { t: 'Tech blog re-reports the same rumor', s: 'News', lr: 1.3, r: .4, g: 'rumor', on: true }] }
];
let predSel = 'fwa';
function fuse(P) {
  let L = logit(P.prior); const seen = {}; const terms = [];
  P.signals.forEach(s => { if (!s.on) return; const d = seen[s.g] ? .5 : 0; seen[s.g] = true; const c = s.r * Math.log(s.lr) * (1 - d); L += c; terms.push({ s, d, c }); });
  return { L, p: sigmoid(L), terms };
}
function renderPred() {
  $('#predTabs').innerHTML = PRED.map(P => { const p = fuse(P).p; return `<button type="button" aria-pressed="${P.id === predSel}" data-id="${P.id}"><span class="opt" style="--c:${opColor(P.op)}"></span>${esc(P.short)} <span class="mono tiny">${Math.round(p * 100)}%</span></button>`; }).join('');
  const P = PRED.find(x => x.id === predSel); const F = fuse(P); const pct = Math.round(F.p * 100);
  const col = pct >= 70 ? 'var(--crit)' : pct >= 40 ? 'var(--signal)' : 'var(--accent)';
  // decisive signal
  let dec = null, drop = 0;
  P.signals.forEach(s => { if (!s.on) return; s.on = false; const q = fuse(P).p; s.on = true; if (F.p - q > drop) { drop = F.p - q; dec = s; } });
  $('#gauge').innerHTML = `<svg viewBox="0 0 240 140" aria-hidden="true">
      <path d="M20 120 A100 100 0 0 1 220 120" fill="none" stroke="var(--surface-2)" stroke-width="18" stroke-linecap="round"/>
      <path d="M20 120 A100 100 0 0 1 220 120" fill="none" stroke="var(--line)" stroke-width="18" stroke-linecap="round" opacity=".5"/>
      <path d="M20 120 A100 100 0 0 1 220 120" fill="none" stroke="${col}" stroke-width="18" stroke-linecap="round" pathLength="100" stroke-dasharray="${Math.max(.5, pct)} 100" style="transition:stroke-dasharray .4s ease"/>
      <text x="20" y="136" text-anchor="middle" style="font:10px var(--f-mono);fill:var(--muted)">0</text>
      <text x="120" y="12" text-anchor="middle" style="font:10px var(--f-mono);fill:var(--muted)">50</text>
      <text x="220" y="136" text-anchor="middle" style="font:10px var(--f-mono);fill:var(--muted)">100</text>
    </svg>
    <div class="pv" style="color:${col}">${pct}%</div>
    <div class="pl">chance that <b>${esc(P.title)}</b></div>`;
  $('#predFacts').innerHTML = `<div><span class="label">Time window</span><b>${esc(P.window)}</b></div>
    <div><span class="label">Base rate (prior)</span><b>${Math.round(P.prior * 100)}%</b></div>
    <div><span class="label">Decisive signal</span><b style="font-family:var(--f-body);font-weight:600;font-size:13px">${dec ? esc(dec.s) + ' (−' + Math.round(drop * 100) + ' pts if removed)' : '—'}</b></div>
    <div><span class="label">Impact if it happens</span><b style="font-family:var(--f-body);font-weight:600;font-size:13px">${esc(P.impact)}</b></div>`;
  const maxC = Math.max(...P.signals.map(s => s.r * Math.log(s.lr)));
  $('#sigList').innerHTML = P.signals.map((s, i) => {
    const term = F.terms.find(t => t.s === s);
    const c = term ? term.c : s.r * Math.log(s.lr);
    return `<div class="sig${s.on ? '' : ' off'}"><input type="checkbox" id="sig-${P.id}-${i}" data-i="${i}" ${s.on ? 'checked' : ''}>
      <label for="sig-${P.id}-${i}">${esc(s.t)}<span class="sm">${esc(s.s)} · origin group "${esc(s.g)}" · reliability ${s.r.toFixed(2)}${term && term.d ? ' · <span class="warn">shared origin, discounted 50%</span>' : ''}</span></label>
      <span class="lr">LR ${s.lr.toFixed(1)}<br><span class="muted">+${c.toFixed(2)}</span></span>
      <span class="lrbar"><i style="width:${Math.round(c / maxC * 100)}%"></i></span></div>`;
  }).join('');
  $('#formula').textContent = `L = ln(${P.prior.toFixed(2)}/${(1 - P.prior).toFixed(2)})` + F.terms.map(t => ` + ${t.s.r.toFixed(2)}·ln ${t.s.lr.toFixed(1)}${t.d ? '·(1−0.5)' : ''}`).join('') + ` = ${F.L.toFixed(2)}  →  P = 1/(1+e^−L) = ${pct}%`;
}
$('#predTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; predSel = b.dataset.id; renderPred(); });
$('#sigList').addEventListener('change', e => { const i = +e.target.dataset.i; const P = PRED.find(x => x.id === predSel); P.signals[i].on = e.target.checked; renderPred(); const el = $('#sig-' + P.id + '-' + i); if (el) el.focus(); });

/* ---------- WAR ROOM ---------- */
const BASE_PORTS = { arc: 950, vtx: 820, pls: 540, kte: 380 };
const RESP = { targeted: { l: 'Targeted retention credits', e: .62 }, perk: { l: 'Hold price, add perk', e: .55 }, half: { l: 'Match 50%', e: .5 }, match: { l: 'Full match', e: .85 }, hold: { l: 'Do nothing', e: 0 } };
const CLV = 46 * 24, EXPOSED = 380000, AT_RISK = 30000;
const WAR_DEF = { wRival: 'arc', wCut: 14, wWeeks: 8, wEsim: 45, wNet: 2, wResp: 'targeted', wEarly: true };
function scenario() { return { rival: $('#wRival').value, cut: +$('#wCut').value, weeks: +$('#wWeeks').value, esim: +$('#wEsim').value, net: +$('#wNet').value, resp: $('#wResp').value, early: $('#wEarly').checked }; }
function simulate(sc, key, early) {
  const u = sc.cut / 100 * 4.2 * (.6 + sc.esim / 100 * .8) * (1 - sc.net * .03);
  const base = BASE_PORTS[sc.rival], W = sc.weeks + 6, lag = early ? 0 : 3, e = RESP[key].e;
  const none = [], resp = [];
  for (let w = 0; w < W; w++) {
    const ramp = w < sc.weeks ? Math.min(1, (w + 1) / 2) : Math.pow(.5, w - sc.weeks + 1);
    const x = base * u * ramp; none.push(x);
    const active = w >= lag && w < sc.weeks + 4; resp.push(x * (1 - (active ? e : 0)));
  }
  const sum = a => a.reduce((s, v) => s + v, 0);
  const saved = sum(none) - sum(resp);
  const months = Math.max(0, sc.weeks + 4 - lag) / 4.33, cf = sc.cut / 100;
  const cost = key === 'match' ? EXPOSED * 46 * cf * months : key === 'half' ? EXPOSED * 46 * cf * .5 * months : key === 'perk' ? EXPOSED * .3 * 4 * months : key === 'targeted' ? AT_RISK * 10 * months : 0;
  return { none, resp, extra: sum(none), saved, cost, net: saved * CLV - cost, u, lag };
}
function drawWar(r, sc) {
  const svg = $('#warChart'); const Wd = 640, Hd = 260, L = 46, Rm = 14, T = 16, B = 30;
  const n = r.none.length, mx = Math.max(10, ...r.none) * 1.12;
  const step = mx > 400 ? 100 : mx > 200 ? 50 : mx > 80 ? 20 : 10;
  const x = i => L + (Wd - L - Rm) * i / (n - 1), y = v => T + (Hd - T - B) * (1 - v / mx);
  let g = '';
  for (let v = 0; v <= mx; v += step) g += `<line x1="${L}" x2="${Wd - Rm}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" style="font:11px var(--f-mono);fill:var(--muted)">${v}</text>`;
  for (let i = 0; i < n; i += 2) g += `<text x="${x(i)}" y="${Hd - 10}" text-anchor="middle" style="font:11px var(--f-mono);fill:var(--muted)">W${i}</text>`;
  const pe = x(Math.min(n - 1, sc.weeks - .5));
  g += `<line x1="${pe}" x2="${pe}" y1="${T}" y2="${Hd - B}" style="stroke:var(--muted);stroke-dasharray:4 4"/><text x="${pe + 5}" y="${T + 10}" style="font:11px var(--f-mono);fill:var(--ink-2)">promo ends</text>`;
  if (r.lag && RESP[sc.resp].e) { const rs = x(r.lag); g += `<line x1="${rs}" x2="${rs}" y1="${T}" y2="${Hd - B}" style="stroke:var(--signal);stroke-dasharray:2 3"/><text x="${rs + 5}" y="${T + 24}" style="font:11px var(--f-mono);fill:var(--signal)">response starts</text>`; }
  const pts = a => a.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const area = `M${pts(r.none).join(' L')} L${pts(r.resp).reverse().join(' L')} Z`;
  g += `<path d="${area}" style="fill:var(--accent);opacity:.2"/>`;
  g += `<polyline points="${pts(r.none).join(' ')}" style="fill:none;stroke:var(--crit);stroke-width:2.2;stroke-linejoin:round"/>`;
  g += `<polyline points="${pts(r.resp).join(' ')}" style="fill:none;stroke:var(--accent);stroke-width:2.8;stroke-linejoin:round"/>`;
  const pk = r.none.indexOf(Math.max(...r.none));
  g += `<circle cx="${x(pk)}" cy="${y(r.none[pk])}" r="4" style="fill:var(--crit)"/><text x="${x(pk) + 7}" y="${y(r.none[pk]) - 7}" style="font:600 11px var(--f-mono);fill:var(--crit)">${Math.round(r.none[pk])}/wk</text>`;
  g += `<circle cx="${x(pk)}" cy="${y(r.resp[pk])}" r="4" style="fill:var(--accent)"/>`;
  svg.innerHTML = g;
}
let warLast = null;
function runWar() {
  const sc = scenario();
  $('#oCut').textContent = sc.cut + '%'; $('#oWeeks').textContent = sc.weeks + ' weeks'; $('#oEsim').textContent = sc.esim + '%'; $('#oNet').textContent = (sc.net > 0 ? '+' : '') + sc.net + ' pts';
  const r = simulate(sc, sc.resp, sc.early);
  drawWar(r, sc);
  $('#warTitle').textContent = OPS[sc.rival].short + ' −' + sc.cut + '% · ' + sc.weeks + ' wks';
  $('#verdict').innerHTML = `<div><span class="label">Lines saved</span><b>${fmtInt(r.saved)}</b><span class="tiny muted">of ${fmtInt(r.extra)} extra port-outs</span></div>
    <div><span class="label">Response cost</span><b>${fmtMoney(r.cost)}</b><span class="tiny muted">${esc(RESP[sc.resp].l)}</span></div>
    <div><span class="label">Net impact</span><b class="${r.net >= 0 ? 'up' : 'down'}">${r.net >= 0 ? '+' : ''}${fmtMoney(r.net)}</b><span class="tiny muted">lifetime value saved − cost</span></div>`;
  const all = Object.keys(RESP).map(k => ({ k, ...simulate(sc, k, sc.early) }));
  const best = all.reduce((a, b) => b.net > a.net ? b : a);
  const late = simulate(sc, sc.resp, false), early = simulate(sc, sc.resp, true);
  $('#stratTable').innerHTML = `<thead><tr><th>Strategy (${sc.early ? 'week-0 response' : 'week-3 response'})</th><th>Lines saved</th><th>Cost</th><th>Net impact</th></tr></thead><tbody>` +
    all.map(s => `<tr class="${s.k === sc.resp ? 'me' : ''}"><td>${esc(RESP[s.k].l)}${s.k === best.k ? '<span class="best">BEST</span>' : ''}</td><td>${fmtInt(s.saved)}</td><td>${fmtMoney(s.cost)}</td><td class="${s.net >= 0 ? 'up' : 'down'}">${s.net >= 0 ? '+' : ''}${fmtMoney(s.net)}</td></tr>`).join('') +
    `</tbody><tfoot><tr><td colspan="4" style="text-align:left;font-size:12.5px;color:var(--ink-2)">Early warning is worth <b>${fmtInt(early.saved - late.saved)} extra lines</b> (${fmtMoney(early.net - late.net)} net) for "${esc(RESP[sc.resp].l)}" compared with a 3-week reaction.</td></tr></tfoot>`;
  warLast = { sc, r, all, best, earlyGain: early.net - late.net };
}
['wRival', 'wCut', 'wWeeks', 'wEsim', 'wNet', 'wResp', 'wEarly'].forEach(id => $('#' + id).addEventListener('input', runWar));
$('#warReset').onclick = () => { Object.entries(WAR_DEF).forEach(([k, v]) => { const el = $('#' + k); if (el.type === 'checkbox') el.checked = v; else el.value = v; }); runWar(); };
$('#warExplain').onclick = async ev => {
  const out = $('#warAI'), btn = ev.currentTarget;
  const { sc, all, best } = warLast;
  const table = all.map(s => `${RESP[s.k].l}: saves ${Math.round(s.saved)} lines, cost ${fmtMoney(s.cost)}, net ${fmtMoney(s.net)}`).join('\n');
  const local = () => `<div class="ai-out"><span class="by">Built-in analyst</span><p>With ${OPS[sc.rival].name} cutting ${sc.cut}% for ${sc.weeks} weeks, the model expects about <b>${fmtInt(warLast.r.extra)}</b> extra port-outs if you do nothing. <b>${esc(RESP[best.k].l)}</b> gives the best net result (${fmtMoney(best.net)}), because it protects the lines most likely to leave without repricing the whole base. Responding in week 0 instead of week 3 adds ${fmtMoney(warLast.earlyGain)}.</p></div>`;
  if (!sample) { out.innerHTML = local(); return; }
  const ctl = new AbortController(); btn.disabled = true;
  out.innerHTML = '<div class="ai-out"><span class="by">Claude · explaining</span><div class="aitxt muted">Thinking…</div><div><button class="btn sm" type="button">Stop</button></div></div>';
  $('button', out).onclick = () => ctl.abort();
  const prompt = `You are Cellvoyant's pricing strategist. SIMULATED demo for fictional operators; our company is Nimbus Mobile (MNO, ARPU $46, CLV $1,104).\nScenario: ${OPS[sc.rival].name} cuts price ${sc.cut}% for ${sc.weeks} weeks. eSIM-ready base ${sc.esim}%. Our network perception edge ${sc.net} pts. We respond in week ${sc.early ? 0 : 3}. Chosen response: ${RESP[sc.resp].l}.\nSimulated outcomes per strategy:\n${table}\n\nWrite a 110–150 word explanation for a CMO: what happens, which strategy is best and why, one execution tip, and one caveat about the model. Use **bold** for key numbers. No headings. Never suggest coordinating prices with competitors.`;
  try {
    const { text } = await sample(prompt, { signal: ctl.signal, onText: ({ text }) => { const t = $('.aitxt', out); if (t) { t.classList.remove('muted'); t.innerHTML = mdLite(text); } } });
    out.innerHTML = `<div class="ai-out"><span class="by">Claude · scenario explanation</span><div>${mdLite(text)}</div></div>`;
  } catch (err) {
    if (err && err.code === 'cancelled') out.innerHTML = err.text ? `<div class="ai-out"><span class="by">Claude · stopped</span><div>${mdLite(err.text)}</div></div>` : '<p class="small muted">Stopped.</p>';
    else { const msg = aiFail(err); out.innerHTML = local() + `<p class="tiny muted">${esc(msg)}</p>`; }
  } finally { btn.disabled = false; }
};

/* ---------- AI ASSISTANT: tools + services ---------- */
const SEG = [
  { k: 'mno', l: 'Mobile network operators', n: 750, nMax: 1200, acv: 144, acvMax: 400 },
  { k: 'mvno', l: 'MVNOs & digital brands', n: 1500, nMax: 3000, acv: 30, acvMax: 120 },
  { k: 'isp', l: 'Cable & fiber broadband providers', n: 3000, nMax: 6000, acv: 30, acvMax: 120 },
  { k: 'infra', l: 'Tower, satellite & infrastructure cos', n: 300, nMax: 800, acv: 60, acvMax: 200 },
  { k: 'inv', l: 'Vendors, consultancies & investors', n: 1500, nMax: 4000, acv: 40, acvMax: 150 }
];
const SERVICES = [
  { k: 'analyst', name: 'Analyst-on-Demand verification', turn: '4 hours', desc: 'A telecom analyst verifies a critical signal and adds context the data can’t.' },
  { k: 'wargame', name: 'War-Gaming Sprint', turn: '2-day workshop', desc: 'Your team plays against AI-simulated rivals on real market data.' },
  { k: 'launch', name: 'Launch Readiness Audit', turn: '5 business days', desc: 'Simulate each rival’s likely response to your next launch and pre-build counters.' },
  { k: 'decision_room', name: 'Decision Room setup', turn: 'same day', desc: 'A Slack or Teams room pre-filled with evidence, simulated options and owners.' },
  { k: 'feed', name: 'Insight API & data feed access', turn: '1–2 weeks', desc: 'Pipe verified signals into your pricing engine, CRM retention flows or BI.' },
  { k: 'consortium', name: 'Benchmark Consortium enrollment', turn: '4–6 weeks', desc: 'Contribute KPIs to the clean room; receive lagged, k-anonymous peer benchmarks.' },
  { k: 'store_bot', name: 'Voice-of-Store bot rollout', turn: '2 weeks', desc: 'A WhatsApp bot for frontline staff to report rival offers, verified by AI.' },
  { k: 'audio_brief', name: '3-Minute Audio Brief', turn: 'next morning', desc: 'A daily spoken briefing for one role: what changed, what it means, what to do.' },
  { k: 'capital', name: 'Cellvoyant Capital (investor edition) trial', turn: '1 week', desc: 'Public-data telecom indicators for hedge funds, PE and infrastructure funds, behind a compliance firewall.' },
  { k: 'diligence', name: 'Deal Diligence Twin', turn: '10 business days', desc: 'Outside-in competitive and coverage diligence on a tower, fiber or operator target.' },
  { k: 'market_feed', name: 'Live market-data feed integration', turn: '2–4 weeks', desc: 'Connect a licensed real-time market-data feed so valuations update tick by tick.' },
  { k: 'geo_audit', name: 'Coverage Truth audit', turn: '10 business days', desc: 'Cell-level audit of advertised vs measured coverage for you and your rivals.' },
  { k: 'regulator', name: 'Regulator edition', turn: '2 weeks', desc: 'Tariff and coverage benchmarking for national regulators, with an open methodology.' },
  { k: 'board_brief', name: 'Weekly board brief', turn: 'weekly', desc: 'An analyst-reviewed brief on rivals, capital moves and recommended responses.' },
  { k: 'op_desk', name: 'Operator desk: full edition for one operator', turn: '3 weeks', desc: 'A segment-by-segment marketing plan, sales playbook, strategy horizons and rival-response playbook for your operator.' },
  { k: 'strategy_sprint', name: 'Strategy sprint for a big problem', turn: '1–2 weeks', desc: 'Analysts and AI work one complex problem into options, a recommendation, a 90-day plan and KPIs with your team.' },
  { k: 'lab_item', name: 'Innovation lab: scope or pilot a tool', turn: 'scoped in 1 week', desc: 'Scope, build and pilot any tool, agent or service from the innovation lab.' },
  { k: 'pilot', name: 'Pilot program (30-day shadow mode)', turn: 'kick-off within 2 weeks', desc: 'Run Cellvoyant next to your current process for 30 days and measure how much earlier it catches each competitor move.' }
];
const SVC_EXTRA = []; // the service catalog adds its 340+ services here
const svcByKey = k => SERVICES.find(s => s.k === k) || SVC_EXTRA.find(s => s.k === k);
WORKSHOPS.forEach(w => { if (!svcByKey(w.k)) SERVICES.push({ k: w.k, name: 'Academy: ' + w.name, turn: w.dur, desc: w.desc, ws: true }); });

/* request queue: shared db when the viewer provides it, otherwise this visit only */
let db = null, dbState = 'wait', reqs = [], readOnly = false;
const localReqs = [];
const reqLabel = id => 'REQ-' + String(id).replace(/[^a-z0-9]/gi, '').slice(-5).toUpperCase();
function agoReal(iso) { const t = Date.parse(iso); if (!t) return ''; const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; if (m < 1440) return Math.round(m / 60) + ' h ago'; return Math.round(m / 1440) + ' d ago'; }
function renderReqs() {
  const el = $('#reqList'); if (!el) return;
  $('#reqNote').textContent = { on: 'Saved · visible to everyone who can open this page', wait: 'Connecting…', err: 'Queue unavailable right now', off: 'Kept for this visit only' }[dbState];
  const list = db ? reqs : localReqs;
  el.innerHTML = list.length ? list.slice(0, 12).map(r => {
    const s = svcByKey(r.service); const st = String(r.status || 'submitted');
    return `<div class="req"><div class="hd"><b>${esc(s ? s.name : r.service)}</b><span class="st st-${esc(st.replace(/[^a-z]/gi, ''))}">${esc(st)}</span></div>
      <span class="tiny muted mono">${esc(reqLabel(r.id))} · ${esc(r.urgency || 'standard')} · ${esc(agoReal(r.createdAt))}${r.signal ? ' · ' + esc(r.signal) : ''} · via ${esc(r.via || 'form')}</span>
      ${r.details ? `<span class="small">${esc(String(r.details).slice(0, 280))}</span>` : ''}
      ${st === 'submitted' && !readOnly ? `<div><button type="button" class="btn sm" data-withdraw="${esc(r.id)}">Withdraw</button></div>` : ''}</div>`;
  }).join('') : '<p class="small muted">No requests yet. Ask the assistant, or use a Request button above.</p>';
}
(window.claude && typeof window.claude.use === 'function' ? window.claude.use('db').catch(() => null) : Promise.resolve(null)).then(d => {
  db = d || null; dbState = db ? 'on' : 'off';
  if (db) db.collection('requests').orderBy('createdAt', 'desc').limit(30).onSnapshot(s => { reqs = s.docs.map(x => Object.assign({ id: x.id }, x.data())); renderReqs(); }, () => { dbState = 'err'; renderReqs(); });
  renderReqs();
});
async function createRequest({ service, details, urgency, signal, via }) {
  const s = svcByKey(service); if (!s) throw new Error('Unknown service "' + service + '". Valid keys: ' + SERVICES.map(x => x.k).join(', '));
  if (readOnly) throw new Error('This viewer has view-only access, so requests can’t be submitted.');
  const body = { service: s.k, details: String(details || '').slice(0, 1200), urgency: ['standard', 'urgent', 'critical'].includes(urgency) ? urgency : 'standard', signal: /^S-\d{4}$/.test(signal || '') ? signal : null, via: via || 'form', status: 'submitted', createdAt: new Date().toISOString() };
  if (db) {
    try { const ref = await db.collection('requests').add(body); return { id: ref.id, label: reqLabel(ref.id), saved: true, service: s.name, turnaround: s.turn }; }
    catch (e) {
      const c = e && e.code;
      if (c === 'invalid_argument') { readOnly = true; renderReqs(); throw new Error('This viewer has view-only access, so requests can’t be submitted.'); }
      if (c === 'quota_exceeded') throw new Error('The request queue is full. Withdraw old requests first.');
      throw new Error('The request could not be saved (' + (c || 'error') + '). Try again.');
    }
  }
  const id = 'local' + Date.now().toString(36);
  localReqs.unshift(Object.assign({ id }, body)); renderReqs();
  return { id, label: reqLabel(id), saved: false, service: s.name, turnaround: s.turn };
}
$('#reqList').addEventListener('click', async e => {
  const b = e.target.closest('[data-withdraw]'); if (!b) return;
  const id = b.dataset.withdraw; b.disabled = true;
  if (db && !id.startsWith('local')) { try { await db.doc('requests/' + id).update({ status: 'withdrawn' }); } catch (err) { b.disabled = false; } }
  else { const r = localReqs.find(x => x.id === id); if (r) r.status = 'withdrawn'; renderReqs(); }
});
function renderServices() {
  $('#svcList').innerHTML = SERVICES.filter(s => !s.ws).map(s => `<div class="svc"><div class="hd"><b>${esc(s.name)}</b><button type="button" class="btn sm" data-open="${s.k}" aria-expanded="false">Request</button></div>
    <span class="tiny muted">${esc(s.desc)} · <span class="mono">${esc(s.turn)}</span></span>
    <form class="svc-form" data-k="${s.k}" hidden>
      <label class="sr" for="rq-${s.k}">Details for ${esc(s.name)}</label>
      <textarea id="rq-${s.k}" rows="2" placeholder="What do you need? Add a signal ID like S-1032 if it helps."></textarea>
      <div class="row2"><label class="sr" for="ru-${s.k}">Urgency</label><select id="ru-${s.k}" class="mini"><option value="standard">Standard</option><option value="urgent">Urgent</option><option value="critical">Critical</option></select><button type="submit" class="btn sm accent">Submit request</button></div>
      <span class="tiny" data-msg aria-live="polite"></span>
    </form></div>`).join('');
}
$('#svcList').addEventListener('click', e => {
  const b = e.target.closest('[data-open]'); if (!b) return;
  const f = $(`form[data-k="${b.dataset.open}"]`, $('#svcList')); f.hidden = !f.hidden;
  b.setAttribute('aria-expanded', String(!f.hidden)); if (!f.hidden) $('textarea', f).focus();
});
$('#svcList').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, k = f.dataset.k, msg = $('[data-msg]', f), btn = $('button[type=submit]', f);
  const details = $('#rq-' + k).value.trim(); if (!details) { msg.textContent = 'Add a line about what you need.'; return; }
  btn.disabled = true;
  try { const r = await createRequest({ service: k, details, urgency: $('#ru-' + k).value, signal: ((details.match(/S-\d{4}/i) || [])[0] || '').toUpperCase(), via: 'form' }); msg.textContent = `Submitted ${r.label}${r.saved ? '' : ' (kept for this visit only)'}.`; $('#rq-' + k).value = ''; }
  catch (err) { msg.textContent = err.message; }
  finally { btn.disabled = false; }
});

/* the tools — one implementation shared by Claude (page tools) and the built-in assistant */
const opByName = v => { const s = String(v || '').toLowerCase().trim(); return Object.keys(OPS).find(k => k === s || OPS[k].short.toLowerCase() === s || OPS[k].name.toLowerCase() === s) || null; };
const TOOLS = {
  list_signals({ limit, operator, severity } = {}) {
    const n = clamp(Math.round(+limit || 8), 1, 20), op = operator ? opByName(operator) : null;
    return [...events].filter(e => (!op || e.tpl.op === op) && (!severity || e.tpl.sev === severity)).sort((a, b) => score(b) - score(a)).slice(0, n)
      .map(e => ({ id: e.id, severity: e.tpl.sev, operator: OPS[e.tpl.op].name, class: e.tpl.cls, text: e.text, source: e.tpl.src, confidence: e.tpl.conf, freshness_pct: Math.round(fresh(e) * 100), half_life: fmtHL(e.tpl.hl), revenue_at_risk_usd: e.tpl.risk, next: e.next }));
  },
  get_signal({ id } = {}) {
    const e = events.find(x => x.id === String(id || '').toUpperCase().trim());
    if (!e) throw new Error('No signal ' + id + '. Current ids: ' + events.map(x => x.id).join(', '));
    return { id: e.id, severity: e.tpl.sev, operator: OPS[e.tpl.op].name, operator_type: OPS[e.tpl.op].kind, class: e.tpl.cls, text: e.text, detected: fmtAgo(e.t), source: e.tpl.src, fused_confidence: e.tpl.conf, freshness_pct: Math.round(fresh(e) * 100), half_life: fmtHL(e.tpl.hl), revenue_at_risk_usd: e.tpl.risk,
      evidence: e.evidence.map(v => ({ evidence: v[0], source: v[1], reliability: v[2] })), predicted_next_move: e.next, candidate_plays: e.plays.map(p => ({ play: p[0], action: p[1], expected: p[2], tradeoff: p[3] })) };
  },
  compare_plans({ plan_id } = {}) {
    const sum = p => ({ id: p.id, operator: OPS[p.op].name, plan: p.name, price_usd: p.price, effective_price_usd: p.price + p.fees, value_score: valueScore(p), genes: Object.fromEntries(GENES.map(g => [g.l, g.f(p[g.k])])), mutations: (p.mut || []).map(m => `${m.gene}: ${m.from} → ${m.to} (${m.days}d ago) — ${m.note}`) });
    const sp = PLANS.find(p => p.id === plan_id);
    if (!sp) return { plans: PLANS.map(sum), note: plan_id ? 'Unknown plan_id. Valid ids: ' + PLANS.map(p => p.id).join(', ') : 'All plans' };
    return { plan: sum(sp), nearest_rivals: nearest(sp.id).map(({ p, d }) => Object.assign(sum(p), { similarity_pct: Math.round(100 * (1 - d / Math.sqrt(GENES.length))),
      differences: GENES.filter(g => p[g.k] !== sp[g.k]).map(g => ({ gene: g.l, rival: g.f(p[g.k]), selected: g.f(sp[g.k]), rival_better_for_customer: g.n(p[g.k]) > g.n(sp[g.k]) })) })) };
  },
  predict_move({ move_id, exclude, include } = {}) {
    const P = PRED.find(x => x.id === move_id); if (!P) throw new Error('move_id must be fwa, cut or sat');
    const ex = new Set((Array.isArray(exclude) ? exclude : []).map(Number)), inc = new Set((Array.isArray(include) ? include : []).map(Number));
    const P2 = Object.assign({}, P, { signals: P.signals.map((s, i) => Object.assign({}, s, { on: inc.has(i) ? true : ex.has(i) ? false : s.on })) });
    const F = fuse(P2), base = fuse(P);
    let dec = null, drop = 0;
    P2.signals.forEach(s => { if (!s.on) return; s.on = false; const q = fuse(P2).p; s.on = true; if (F.p - q > drop) { drop = F.p - q; dec = s; } });
    return { move: P.title, window: P.window, prior_pct: Math.round(P.prior * 100), probability_pct: Math.round(F.p * 100), console_probability_pct: Math.round(base.p * 100), impact: P.impact,
      signals: P2.signals.map((s, i) => ({ index: i, signal: s.t, source: s.s, likelihood_ratio: s.lr, reliability: s.r, origin_group: s.g, enabled: s.on, dependence_discounted: !!((F.terms.find(t => t.s === s) || {}).d) })),
      decisive_signal: dec ? { signal: dec.t, drop_pts_if_removed: Math.round(drop * 100) } : null };
  },
  simulate_response(a = {}) {
    const rival = opByName(a.rival) || String(a.rival || ''); if (!BASE_PORTS[rival]) throw new Error('rival must be one of arc, vtx, pls, kte');
    const sc = { rival, cut: clamp(Math.round(a.cut_pct == null ? 14 : +a.cut_pct), 0, 30), weeks: clamp(Math.round(+a.weeks || 8), 4, 16), esim: clamp(Math.round(a.esim_pct == null ? 45 : +a.esim_pct), 10, 80), net: clamp(Math.round(+a.network_edge || 0), -10, 10), resp: 'targeted', early: a.early_warning !== false };
    const all = Object.keys(RESP).map(k => Object.assign({ k }, simulate(sc, k, sc.early)));
    const best = all.reduce((x, y) => y.net > x.net ? y : x);
    const late = simulate(sc, best.k, false), early = simulate(sc, best.k, true);
    if (a.show_in_war_room) { $('#wRival').value = sc.rival; $('#wCut').value = sc.cut; $('#wWeeks').value = sc.weeks; $('#wEsim').value = sc.esim; $('#wNet').value = sc.net; $('#wResp').value = best.k; $('#wEarly').checked = sc.early; runWar(); }
    return { scenario: { rival: OPS[sc.rival].name, cut_pct: sc.cut, weeks: sc.weeks, esim_pct: sc.esim, network_edge: sc.net, response_week: sc.early ? 0 : 3 }, extra_port_outs_if_no_response: Math.round(all[0].extra),
      strategies: all.map(s => ({ strategy: RESP[s.k].l, lines_saved: Math.round(s.saved), cost_usd: Math.round(s.cost), net_impact_usd: Math.round(s.net) })), best: RESP[best.k].l,
      early_warning_gain_usd: Math.round(early.net - late.net), loaded_into_war_room: !!a.show_in_war_room, assumptions: 'ARPU $46, CLV $1,104, 380k exposed lines, 30k at-risk lines; illustrative model' };
  },
  size_market({ segments, sam_pct, som_pct } = {}) {
    const keys = Array.isArray(segments) && segments.length ? segments.filter(k => SEG.some(s => s.k === k)) : SEG.map(s => s.k);
    const val = (id, d) => { const el = $('#' + id); return el ? +el.value : d; };
    const rows = SEG.filter(s => keys.includes(s.k)).map(s => ({ segment: s.l, organizations: val('n-' + s.k, s.n), acv_usd: val('a-' + s.k, s.acv) * 1000 }));
    const tam = rows.reduce((t, r) => t + r.organizations * r.acv_usd, 0);
    const samP = clamp(sam_pct == null ? val('samP', 35) : +sam_pct, 1, 100) / 100, somP = clamp(som_pct == null ? val('somP', 8) : +som_pct, 1, 100) / 100;
    return { segments: rows, tam_usd: Math.round(tam), sam_pct: Math.round(samP * 100), sam_usd: Math.round(tam * samP), som_pct_of_sam: Math.round(somP * 100), som_usd: Math.round(tam * samP * somP), note: 'Organization counts and contract values are planning assumptions, not sourced facts.' };
  },
  geo_hotspots({ layer, operator } = {}) {
    const l = ['churn', 'coverage', 'retail'].includes(layer) ? layer : 'churn';
    const o = opByName(operator); const covOp = ['nim', 'vtx', 'arc', 'pls'].includes(o) ? o : 'arc';
    return { layer: l, operator: l === 'coverage' ? OPS[covOp].name : null, hotspots: geoHotspots(l, covOp), note: 'Simulated map data for fictional operators; it updates every second while the console is live.' };
  },
  valuation_pulse({ metric, limit } = {}) {
    if (!LAND) throw new Error('Landscape data is not loaded.');
    const m = metric === 'revenue' ? 'rev' : metric === 'mcap_to_revenue' ? 'mult' : 'mcap';
    return { metric: m === 'mult' ? 'market cap ÷ revenue' : m === 'rev' ? 'revenue (USD)' : 'market cap (USD)', verified: landAgeText(),
      rows: valuationRows(m).slice(0, clamp(+limit || 10, 1, 25)).map(r => ({ company: r.c.name, value: m === 'mult' ? +r.v.toFixed(2) : Math.round(r.v), change_since_previous_check_pct: m === 'mcap' && r.c.mcap && r.c.mcap.prev ? +((r.c.mcap.usd - r.c.mcap.prev) / r.c.mcap.prev * 100).toFixed(1) : null, as_of: r.c.mcap ? r.c.mcap.asOf || null : null })) };
  },
  async create_alert_rule({ operator, signal_class, min_severity } = {}) {
    const op = !operator || String(operator).toLowerCase() === 'any' ? 'any' : opByName(operator);
    if (!op) throw new Error('Unknown operator. Use Vertex, Arcline, Pulsar, Skyreach, Kite, Market or any.');
    const cls = signal_class ? (TPL.map(t => t.cls).find(c => c.toLowerCase() === String(signal_class).toLowerCase()) || 'any') : 'any';
    const sev = { critical: 'crit', crit: 'crit', high: 'high', watch: 'watch' }[String(min_severity || 'high').toLowerCase()] || 'high';
    const r = await addRule({ op, cls, sev, via: 'assistant' });
    return { rule: r.label, shared_with_team: r.shared };
  },
  async export_brief() { return exportBrief(); },
  list_services() {
    return { live_in_console: ['Signal feed with evidence chains', 'Threat radar', 'Alert rules', 'Tariff DNA', 'Move Predictor', 'War Room digital twin', 'Geo radar (churn contagion, coverage truth, rival retail)', 'Capital radar (valuation pulse, activist watch, PE hold clock)', 'Competitor & capital landscape', 'Market sizing', 'Counter-move drafting', 'Brief export', 'This assistant'],
      roadmap: LAB.filter(x => x[0] !== 'Services').map(x => x[2]),
      requestable_services: SERVICES.map(s => ({ key: s.k, name: s.name, turnaround: s.turn, what: s.desc })),
      ai_deliverables: ['exec briefs', 'battlecards', 'counter-move plans', 'regulatory response outlines', 'launch playbooks'] };
  },
  company_lookup({ name, segment, involvement, limit } = {}) {
    if (!LAND) throw new Error('Landscape data is not loaded.');
    const n = String(name || '').toLowerCase().trim(), sg = String(segment || '').toLowerCase().trim();
    const want = String(involvement || '').toLowerCase();
    const pick = LAND.companies.filter(c => (!n || c.name.toLowerCase().includes(n) || (c.investors || []).some(i => i.n.toLowerCase().includes(n))) && (!sg || c.seg.toLowerCase().includes(sg)) && (!want || (want === 'pe' ? flagsOf(c).pe || flagsOf(c).infra : want === 'hedge fund' ? flagsOf(c).hf : want === 'state' ? flagsOf(c).state : true)));
    return pick.sort((a, b) => sizeOf(b) - sizeOf(a)).slice(0, clamp(+limit || 8, 1, 25)).map(c => ({ name: c.name, segment: c.seg, hq: c.hq, ownership: c.own, ticker: c.ticker || null, investors: (c.investors || []).map(i => i.n + ' (' + i.t + ')'), market_cap_usd: c.mcap ? c.mcap.usd : null, market_cap_as_of: c.mcap ? c.mcap.asOf : null, valuation_usd: c.val ? c.val.usd : null, valuation_basis: c.val ? c.val.basis : null, revenue: c.rev ? (c.rev.usd ? fmtMoney(c.rev.usd) : c.rev.label) + ' ' + (c.rev.period || '') : null, capital_raised_usd: c.raised ? c.raised.usd : null, what: c.what, overlap_with_cellvoyant: c.rel, recent: c.recent || null, source: (c.sources || [])[0] || null }));
  },
  market_position({ name, map, region, quadrant, limit, show_on_map } = {}) {
    if (!POS) throw new Error('Positioning data is not loaded.');
    const n = String(name || '').toLowerCase().trim();
    const kinds = map === 'operators' ? ['ops'] : map === 'competitors' ? ['vendors'] : ['vendors', 'ops'];
    let rows = kinds.flatMap(k => posItems(k).map(c => ({ c, k })));
    const hitName = c => { const nm = c.name.toLowerCase(), sh = String(c.short || '').toLowerCase(); return nm === n || sh === n || (n.length > 2 && (nm.includes(n) || sh.includes(n))); };
    if (n) rows = rows.filter(({ c }) => hitName(c));
    if (region) rows = rows.filter(({ c, k }) => k === 'vendors' || String(c.region || '').toLowerCase().includes(String(region).toLowerCase().replace(/\s*\(gcc\)/, '')));
    if (quadrant) rows = rows.filter(({ c, k }) => POSM[k].quad(c.x, c.y).toLowerCase().includes(String(quadrant).toLowerCase()));
    rows = rows.filter(({ c }) => c.cls !== 'self' || n);
    rows.sort((a, b) => (a.k === 'vendors' && b.k === 'vendors') ? b.c.threat - a.c.threat : revOf(b.c) - revOf(a.c));
    rows = rows.slice(0, clamp(+limit || (n ? 3 : 8), 1, 30));
    if (show_on_map && rows[0]) { const { c, k } = rows[0]; posS.map = k; if (k === 'ops') posS.region = c.region || 'All regions'; posS.seg = 'all'; posS.cls = 'all'; posS.sel[k] = c.id; posRender(); }
    return rows.map(({ c, k }) => ({ name: c.name, map: k === 'vendors' ? "Cellvoyant's competitors" : 'Telecom operators', region: c.region || null, country: c.country || null,
      quadrant: POSM[k].quad(c.x, c.y), x: c.x, y: c.y, axes: POSM[k].xl + ' / ' + POSM[k].yl, ownership: c.own || null,
      owners: (c.investors || []).slice(0, 6).map(v => v.n + (v.pct != null && v.pct !== '' ? ' ' + String(v.pct).replace('%', '') + '%' : '') + ' (' + v.t + ')'),
      private_equity_or_infra: !!(c.f.pe || c.f.infra), hedge_fund: !!c.f.hf, state: !!c.f.state,
      market_cap_usd: c.mcap ? c.mcap.usd : null, revenue_usd: revOf(c) || null, revenue_growth_pct: c.growth ? c.growth.v : null,
      threat_to_cellvoyant: k === 'vendors' && c.cls !== 'self' ? c.threat : undefined,
      strengths: c.strengths || [], weaknesses: c.gaps || c.weaknesses || [], improve: c.improve || [], how_to_succeed: c.win || [], competitors: c.rivals || [],
      recent: (c.moves || []).slice(0, 3).map(m => m.join(': ')), shown_on_map: !!show_on_map }));
  },
  capital_deals({ investor_type, target, investor, limit } = {}) {
    if (!LAND) throw new Error('Landscape data is not loaded.');
    const t = String(investor_type || '').toLowerCase(), tg = String(target || '').toLowerCase(), iv = String(investor || '').toLowerCase();
    const map = { pe: 'pe', 'private equity': 'pe', 'hedge fund': 'hf', hf: 'hf', activist: 'hf', infrastructure: 'infra', infra: 'infra', state: 'state', sovereign: 'state' };
    return (LAND.deals || []).filter(d => (!t || typeKey(d.type) === (map[t] || t)) && (!tg || String(d.target).toLowerCase().includes(tg)) && (!iv || String(d.investor).toLowerCase().includes(iv))).slice(0, clamp(+limit || 10, 1, 30))
      .map(d => ({ date: d.date, investor: d.investor, investor_type: d.type, target: d.target, what: d.what, value_usd: d.usd || null, status: d.status, source: d.src }));
  },
  contact_plan({ customer_id, goal, channel, limit } = {}) {
    rtEnsure(); const g = RT_GN[goal] ? goal : 'retention';
    if (customer_id) {
      const c = RT.cust.find(x => x.id.toLowerCase() === String(customer_id).toLowerCase()); if (!c) throw new Error('Unknown customer token. Tokens look like ' + RT.hold[0].id + '.');
      const b = rtBest(c, g, RT_CHN[channel] ? channel : undefined), f = rtFixed(c, g);
      return { customer: c.id, segment: c.seg.l, churn_score_pct: Math.round(c.risk * 100), goal: RT_GN[g], best_window: b ? { slot: rtSlot(b), channel: RT_CHN[b.ch], engage_probability_pct: Math.round(b.p * 100), reasons: rtReasons(c, b, g) } : null,
        fixed_schedule: f ? { slot: 'Tue 10:00', channel: RT_CHN[f.ch], engage_probability_pct: f.bl ? null : Math.round(f.p * 100), blocked_by: f.bl || null } : null, data: 'synthetic, tokenized' };
    }
    const I = rtImpact(g);
    return { goal: RT_GN[g], model: { auc: +RT.m.auc.toFixed(3), baseline_auc: +RT.m.bAuc.toFixed(3), lift_top20: +RT.m.lift.toFixed(2), brier: +RT.m.brier.toFixed(3) },
      policy: { fixed_schedule_engagement_pct: +(I.pf * 100).toFixed(1), right_time_engagement_pct: +(I.pm * 100).toFixed(1), uplift_pct: Math.round(I.uplift * 100), not_contacted_by_guardrails: I.blocked },
      next_4_hours: rtQueue(g, clamp(+limit || 6, 1, 12)).map(r => ({ customer: r.c.id, segment: r.c.seg.l, slot: rtSlot(r.z), channel: RT_CHN[r.z.ch], engage_probability_pct: Math.round(r.z.p * 100) })), data: 'synthetic, tokenized' };
  },
  intel_search({ query, type } = {}) {
    const R = miSearch(String(query || ''), type || 'all');
    return { access_level: MI_ROLES[MI.role].l, matches: R.total || 0, hidden_by_access_level: R.hidden || 0, results: R.res.slice(0, 8).map(r => ({ type: r.d.type, title: r.d.title, access: r.a, snippet: r.d.text.slice(0, r.a === 'summary' ? 80 : 160) })) };
  },
  async add_workspace_task({ title, department, priority } = {}) {
    const dk = DEPTS.find(d => d.k === department || d.short.toLowerCase() === String(department || '').toLowerCase() || d.name.toLowerCase() === String(department || '').toLowerCase());
    const r = await addTask({ title, kind: 'manual', dept: dk ? dk.k : 'st', prio: priority === 'high' ? 'high' : 'normal' });
    if (!r) throw new Error('The task could not be added (view-only access, or no title).');
    return { task: r.title, department: DEPT[r.dept].name, priority: r.prio, board: tasksDb ? 'shared operator workspace' : 'workspace (this visit only)' };
  },
  async request_service({ service, details, urgency, related_signal } = {}) {
    const r = await createRequest({ service, details, urgency, signal: related_signal, via: 'assistant' });
    return { request_id: r.label, service: r.service, turnaround: r.turnaround, status: 'submitted', saved_to_shared_queue: r.saved };
  }
};
const TOOLDEFS = [
  { name: 'simulate_response', description: 'War Room digital twin. Simulates extra port-outs to a rival that cuts price and scores 5 responses (targeted credits, perk, 50% match, full match, do nothing) on lines saved, cost and net impact. Set show_in_war_room to load the scenario into the War room tab.',
    inputSchema: { type: 'object', properties: { rival: { type: 'string', enum: ['arc', 'vtx', 'pls', 'kte'], description: 'arc = Arcline, vtx = Vertex, pls = Pulsar, kte = Kite' }, cut_pct: { type: 'number', description: '0–30' }, weeks: { type: 'integer', description: 'Promo duration, 4–16' }, esim_pct: { type: 'number', description: 'eSIM-ready share of base, 10–80 (default 45)' }, network_edge: { type: 'number', description: 'Our network perception edge, −10..10 (default 0)' }, early_warning: { type: 'boolean', description: 'true = respond in week 0; false = week 3' }, show_in_war_room: { type: 'boolean' } }, required: ['rival', 'cut_pct'] } },
  { name: 'list_signals', description: 'Freshest competitor signals, ranked by impact × confidence × freshness. Returns id, severity, operator, class, text, source, confidence, freshness, revenue at risk and predicted next move.',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', description: '1–20, default 8' }, operator: { type: 'string', description: 'Optional: Vertex, Arcline, Pulsar, Skyreach, Kite' }, severity: { type: 'string', enum: ['crit', 'high', 'watch'] } } } },
  { name: 'market_position', description: 'Positioning quadrants. Map "competitors": Cellvoyant\'s competitors (telecom depth vs predictive & real-time) with threat scores. Map "operators": telecom operators in the Gulf (GCC), Middle East, Asia-Pacific, Europe, Africa, Americas and international groups (scale vs growth & innovation). Returns quadrant, owners with PE / hedge-fund / state flags, market cap, revenue, growth, strengths, weaknesses, what to improve, how to succeed and competitors. Filter by name, map, region or quadrant; show_on_map selects the company on the page.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, map: { type: 'string', enum: ['competitors', 'operators'] }, region: { type: 'string', description: 'Gulf (GCC), Middle East, Asia-Pacific, Europe, Africa, Americas, International group' }, quadrant: { type: 'string' }, limit: { type: 'integer' }, show_on_map: { type: 'boolean' } } } },
  { name: 'get_signal', description: 'Full detail for one signal: evidence chain with reliabilities, predicted next move, candidate plays.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Signal id like S-1032' } }, required: ['id'] } },
  { name: 'compare_plans', description: 'Tariff DNA. With plan_id: the 3 nearest rival plans and gene-by-gene differences. Without: every plan with value score and detected stealth mutations. Our plans: nim-u (Unlimited Plus), nim-e (Essential 20).',
    inputSchema: { type: 'object', properties: { plan_id: { type: 'string', enum: PLANS.map(p => p.id) } } } },
  { name: 'predict_move', description: 'Move Predictor: dependence-adjusted log-odds fusion of weak signals into the probability of a competitor move. exclude/include take signal indexes (0–4) for what-if tests.',
    inputSchema: { type: 'object', properties: { move_id: { type: 'string', enum: ['fwa', 'cut', 'sat'], description: 'fwa = Vertex FWA launch; cut = Arcline family-plan price cut; sat = Skyreach × Pulsar bundle' }, exclude: { type: 'array', items: { type: 'integer' } }, include: { type: 'array', items: { type: 'integer' } } }, required: ['move_id'] } },
  { name: 'request_service', description: 'Submit a service request to this page’s request queue (visible to everyone who can open the page). Call ONLY when the user explicitly asks to request, book or order a service. Returns the request ID.',
    inputSchema: { type: 'object', properties: { service: { type: 'string', enum: SERVICES.map(s => s.k) }, details: { type: 'string', description: 'What the user needs, in one or two sentences' }, urgency: { type: 'string', enum: ['standard', 'urgent', 'critical'] }, related_signal: { type: 'string', description: 'Optional signal id like S-1032' } }, required: ['service', 'details'] } },
  { name: 'company_lookup', description: 'Competitor & capital landscape: look up competitors, telecom-intelligence vendors and operators with ownership, PE / hedge-fund / state involvement, market cap or valuation, revenue, capital raised and sources. Filter by name (also matches investor names), segment, or involvement.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, segment: { type: 'string', description: 'e.g. "CI software", "Telecom intelligence", "Operator", "Tower"' }, involvement: { type: 'string', enum: ['pe', 'hedge fund', 'state'] }, limit: { type: 'integer' } } } },
  { name: 'capital_deals', description: 'Private-equity, infrastructure-fund, hedge-fund/activist and sovereign deals and stakes in telecom (2023–2026), with value, date, status and source.',
    inputSchema: { type: 'object', properties: { investor_type: { type: 'string', enum: ['pe', 'infrastructure', 'hedge fund', 'state'] }, investor: { type: 'string' }, target: { type: 'string' }, limit: { type: 'integer' } } } },
  { name: 'geo_hotspots', description: 'Geo radar (simulated hex map of Metro North): top hotspots for churn contagion (port-out wave), coverage truth (advertised 5G vs measured Mbps for one operator) or rival retail pressure.',
    inputSchema: { type: 'object', properties: { layer: { type: 'string', enum: ['churn', 'coverage', 'retail'] }, operator: { type: 'string', description: 'For coverage: Nimbus, Vertex, Arcline or Pulsar' } } } },
  { name: 'valuation_pulse', description: 'Capital radar: rank listed operators and tower companies by market cap, market cap ÷ revenue, or revenue, with the change since the previous verification (researched data).',
    inputSchema: { type: 'object', properties: { metric: { type: 'string', enum: ['mcap', 'mcap_to_revenue', 'revenue'] }, limit: { type: 'integer' } } } },
  { name: 'contact_plan', description: 'Right-time engagement engine (synthetic, tokenized customers). With customer_id: the best day, hour and channel to contact that customer inside the guardrails (consent, quiet hours, frequency cap, cooling-off), with reasons and the fixed-schedule comparison. Without: model quality (AUC, lift), the policy uplift vs a fixed schedule, and the contact queue for the next 4 hours.',
    inputSchema: { type: 'object', properties: { customer_id: { type: 'string', description: 'Token like C-1A2B3C' }, goal: { type: 'string', enum: ['retention', 'upsell', 'service'] }, channel: { type: 'string', enum: ['push', 'sms', 'email', 'call', 'inapp'] }, limit: { type: 'integer' } } } },
  { name: 'intel_search', description: 'Market intelligence hub: multilingual concept search (English, Arabic, Chinese terms map to shared concepts) across signals, 108 operators, 140 companies, capital deals, data sources, documents and resources, filtered by the viewer’s access level.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' }, type: { type: 'string', enum: ['all', 'Signal', 'Operator', 'Company', 'Deal', 'Source', 'Document', 'Resource', 'Playbook', 'Glossary'] } }, required: ['query'] } },
  { name: 'add_workspace_task', description: 'Add a task to the shared operator workspace (shift board). Call ONLY when the user asks to add a task, to-do or reminder.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, department: { type: 'string', description: 'Department name or short name, e.g. Marketing, CX & Retention, Network, Analytics' }, priority: { type: 'string', enum: ['normal', 'high'] } }, required: ['title'] } },
  { name: 'create_alert_rule', description: 'Create a team alert rule that flags new console signals matching operator, signal class and minimum severity. Call only when the user asks for an alert or rule.',
    inputSchema: { type: 'object', properties: { operator: { type: 'string' }, signal_class: { type: 'string', description: 'Pricing, Stealth pricing, Network, Devices, Enterprise, Regulatory, Social, Retail, Port-outs, Satellite or Hiring' }, min_severity: { type: 'string', enum: ['watch', 'high', 'critical'] } } } },
  { name: 'export_brief', description: 'Export the current console state as a Markdown brief; the viewer confirms the save. Call only when the user asks to export or download a brief.' },
  { name: 'list_services', description: 'Catalog: what is live in this console, what is on the roadmap, which services can be requested (with turnaround), and deliverables the assistant can write.' },
  { name: 'size_market', description: 'Bottom-up TAM/SAM/SOM from the page’s segment assumptions (organizations × annual contract value), optionally for a subset of segments.',
    inputSchema: { type: 'object', properties: { segments: { type: 'array', items: { type: 'string', enum: SEG.map(s => s.k) }, description: 'mno, mvno, isp, infra, inv' }, sam_pct: { type: 'number' }, som_pct: { type: 'number' } } } }
];
let toolsMax = 0;
function traceChip(bubble, name, input) {
  const tr = $('.trace', bubble); const c = document.createElement('span'); c.className = 'tchip';
  const args = Object.entries(input || {}).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)).map(([k, v]) => k + '=' + (Array.isArray(v) ? '[' + v.join(',') + ']' : String(v).slice(0, 28))).join(', ');
  c.textContent = name + '(' + args + ')'; tr.appendChild(c); tr.hidden = false; msgs.scrollTop = msgs.scrollHeight; return c;
}
async function runTool(name, input, bubble) {
  const chip = traceChip(bubble, name, input);
  try { const r = await TOOLS[name](input || {}); chip.classList.add('done'); if (name === 'request_service') bubble.dataset.req = r.request_id; return r; }
  catch (e) { chip.classList.add('err'); throw e; }
}
const toolsFor = bubble => TOOLDEFS.slice(0, toolsMax).map(d => Object.assign({}, d, { execute: input => runTool(d.name, input, bubble) }));
aiReady.then(async s => {
  if (s && typeof s.limits === 'function') { try { const L = await s.limits(); toolsMax = (L && L.tools && L.tools.maxCount) || 0; } catch (e) { toolsMax = 0; } }
  setAI(s ? 'on' : 'off'); $('#aiDepth').disabled = !s;
});

/* chat */
function contextBrief(n = 12) {
  const top = [...events].sort((a, b) => score(b) - score(a)).slice(0, n);
  const sig = top.map(e => `[${e.id}] ${SEVL[e.tpl.sev].toUpperCase()} · ${OPS[e.tpl.op].short} · ${e.tpl.cls} · ${e.text} · source: ${e.tpl.src} · conf ${Math.round(e.tpl.conf * 100)}% · fresh ${Math.round(fresh(e) * 100)}% (half-life ${fmtHL(e.tpl.hl)}) · at risk ${e.tpl.risk ? fmtMoney(e.tpl.risk) : 'n/a'} · next: ${e.next}`).join('\n');
  const plans = PLANS.map(p => `${p.id} = ${OPS[p.op].short} ${p.name}: $${p.price}/mo, ${GENES.slice(1).map(g => g.f(p[g.k])).join(', ')}${p.mut ? ' · MUTATIONS: ' + p.mut.map(m => `${m.gene} ${m.from}→${m.to} (${m.days}d ago)`).join('; ') : ''}`).join('\n');
  const preds = PRED.map(P => `${P.id}: ${P.title}: ${Math.round(fuse(P).p * 100)}% within ${P.window}`).join('\n');
  const w = warLast ? `${OPS[warLast.sc.rival].name} cuts ${warLast.sc.cut}% for ${warLast.sc.weeks} weeks; best response ${RESP[warLast.best.k].l} (net ${fmtMoney(warLast.best.net)}).` : 'n/a';
  return `MARKET: Metro North (fictional). Sim time ${fmtClock()}. Operators: Nimbus Mobile (you, MNO), Vertex Telecom (MNO), Arcline Wireless (MNO), Pulsar Cable Mobile (cable MVNO), Skyreach (satellite direct-to-device), Kite (digital eSIM MVNO).\nKPIs: net port balance 7d ${netPorts}.\nTOP SIGNALS:\n${sig}\nPLANS:\n${plans}\nPREDICTIONS:\n${preds}\nWAR ROOM (current tab state): ${w}\nSERVICES that can be requested: ${SERVICES.map(s => s.k + ' = ' + s.name + ' (' + s.turn + ')').join('; ')}`;
}
const msgs = $('#msgs');
function addMsg(role, html, by) {
  const d = document.createElement('div'); d.className = 'msg ' + (role === 'u' ? 'u' : 'a');
  if (role === 'u') d.textContent = html;
  else d.innerHTML = (by ? `<span class="by">${esc(by)}</span>` : '') + '<div class="trace" hidden></div><div class="body">' + html + '</div>';
  msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
}
let turns = [], askCtl = null, busy = false;
const RULES = `You are the Cellvoyant assistant inside a telecom competitive-intelligence console. IMPORTANT: all console data is SIMULATED demo data about fictional operators; the user's company is Nimbus Mobile (an MNO).
When tools are available, call them to run the console's engines (signal scan, signal detail, Tariff DNA comparison, move-prediction what-ifs, war-room simulation, geo hotspots, valuation pulse, alert rules, brief export, market sizing, competitor & capital landscape lookups with PE / hedge-fund involvement, service catalog, service requests) and use their numbers instead of estimating. Call request_service ONLY when the user explicitly asks to request, book or order a service, then confirm the request ID. Without tools, answer from the CONTEXT.
You also write deliverables directly: exec briefs, battlecards, counter-move plans, regulatory response outlines, launch playbooks.
Cite signal IDs in square brackets like [S-1042] for claims about signals. Say so when evidence is thin. Be concise (under 220 words unless a deliverable needs more): short paragraphs, "- " bullets, **bold** for key numbers, and a small markdown table only to compare options. Never recommend coordinating or discussing prices with competitors, and never disparage competitors.`;
function setBusy(b) { busy = b; $('#askBtn').disabled = b; $('#stopBtn').hidden = !b; }
async function ask(q) {
  q = String(q || '').trim(); if (!q || busy) return;
  addMsg('u', q);
  if (!sample) { setBusy(true); const b = addMsg('a', '', 'Built-in assistant'); try { await runLocal(q, b); } finally { setBusy(false); } return; }
  const bubble = addMsg('a', '<span class="muted">Thinking…</span>', 'Claude'), body = $('.body', bubble);
  const ctl = new AbortController(); askCtl = ctl; setBusy(true);
  const content = `CONTEXT (live console snapshot):\n${contextBrief(toolsMax ? 6 : 12)}\n\nREQUEST: ${q}`;
  const input = [{ role: 'user', content: RULES }, ...turns.slice(-6), { role: 'user', content }];
  const paint = t => { body.innerHTML = mdLite(t); msgs.scrollTop = msgs.scrollHeight; };
  const opts = { signal: ctl.signal, modelTier: $('#aiDepth').value === 'default' ? 'default' : 'quick', onText: ({ text }) => paint(text) };
  if (toolsMax) opts.tools = toolsFor(bubble); else opts.cache = false;
  try {
    const { text, truncated } = await sample(input, opts);
    paint(text + (truncated ? '\n\n(cut short: ask for less at a time)' : ''));
    turns.push({ role: 'user', content: q }, { role: 'assistant', content: text });
  } catch (err) {
    const code = err && err.code;
    if (code === 'cancelled') paint((err.text || '') + '\n\n(stopped)');
    else if (code === 'tools_unavailable') { toolsMax = 0; setAI('on'); await runLocal(q, bubble, 'Claude can’t run page tools in this view, so the built-in assistant ran them.'); }
    else { const note = aiFail(err); await runLocal(q, bubble, note); }
  } finally { setBusy(false); askCtl = null; }
}
function matchService(s) {
  const map = [['market_feed', /market.?data|real.?time|live feed|price feed/], ['geo_audit', /coverage audit|coverage truth audit/], ['regulator', /regulator edition|\bnra\b/], ['board_brief', /board brief|weekly brief/], ['capital', /investor edition|cellvoyant capital|alt.?data/], ['diligence', /diligence/], ['analyst', /analyst|verif/], ['wargame', /war.?gam|sprint|workshop/], ['launch', /launch readiness|launch audit|readiness/], ['decision_room', /decision room|slack|teams room/], ['feed', /\bapi\b|data feed|webhook/], ['consortium', /consortium|benchmark/], ['store_bot', /store bot|voice.of.store|whatsapp|frontline/], ['audio_brief', /audio|morning brief|podcast/]];
  const m = map.find(([, re]) => re.test(s)); return m ? m[0] : null;
}
const STOP = new Set(['vertex', 'arcline', 'pulsar', 'skyreach', 'signal', 'signals', 'report', 'reports']);
function posNamed(s) {
  if (!POS) return null;
  let best = null;
  for (const k of ['ops', 'vendors']) for (const c of posItems(k)) {
    if (c.cls === 'self') continue;
    for (const cand of [c.name, c.short].filter(Boolean)) {
      const t = String(cand).toLowerCase().split(' (')[0].trim(); if (t.length < 2) continue;
      const rx = new RegExp('(^|[^a-z0-9&])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9&])');
      if (rx.test(s) && (!best || t.length > best.len)) best = { c, k, len: t.length };
    }
  }
  return best;
}
async function runLocal(q, bubble, note) {
  const by = $('.by', bubble); if (by) by.textContent = 'Built-in assistant';
  const body = $('.body', bubble), s = q.toLowerCase();
  const T = (name, args) => runTool(name, args, bubble);
  const sigLine = r => `**[${r.id}] ${r.text}** (${r.operator}, ${SEVL[r.severity]}, ${r.freshness_pct}% fresh)\n` + r.evidence.map(v => `- ${v.evidence} · ${v.source} · reliability ${Math.round(v.reliability * 100)}%`).join('\n') + `\n**Next:** ${r.predicted_next_move}\n**Best play:** ${r.candidate_plays[0].play}: ${r.candidate_plays[0].action}.`;
  let out = '';
  try {
    const sid = ((q.match(/S-\d{4}/i) || [])[0] || '').toUpperCase();
    const rival = /arcline/.test(s) ? 'arc' : /vertex/.test(s) ? 'vtx' : /pulsar/.test(s) ? 'pls' : /\bkite\b/.test(s) ? 'kte' : /skyreach/.test(s) ? 'sky' : null;
    const svc = matchService(s);
    if (/\b(book|request|order|schedule|enrol|enroll|sign me up)\b/.test(s) && svc) {
      if (bubble.dataset.req) out = `Request **${bubble.dataset.req}** was already submitted.`;
      else {
        const sig = sid || (rival ? ((TOOLS.list_signals({ operator: rival, limit: 1 })[0] || {}).id) : undefined);
        const r = await T('request_service', { service: svc, details: q, urgency: /urgent|asap|today|critical/.test(s) ? 'urgent' : 'standard', related_signal: sig });
        out = `Submitted **${r.request_id}**: ${r.service} (turnaround ${r.turnaround})${sig ? ', linked to [' + sig + ']' : ''}. ${r.saved_to_shared_queue ? 'It’s in the request queue on the right.' : 'It’s in the queue for this visit only; open the page in Claude to save requests.'}`;
      }
    } else if (/^(please )?(search|find|look up|look for)\b|ابحث|搜索/.test(s)) {
      const qq = q.replace(/^(please )?(search|find|look up|look for)( the knowledge base)?( for)?:?/i, '').replace(/ابحث عن|ابحث|搜索/g, '').replace(/["“”]/g, '').trim() || q;
      const r = await T('intel_search', { query: qq });
      out = `**${r.matches} match${r.matches === 1 ? '' : 'es'}** for “${qq}” (access level: ${r.access_level}${r.hidden_by_access_level ? `, ${r.hidden_by_access_level} hidden` : ''}):\n` + (r.results.map(x => `- **${x.type}:** ${x.title}${x.access === 'summary' ? ' (summary only)' : ''}`).join('\n') || '- nothing found') + ($('#miApp') ? '\nOpen the market intelligence hub to filter and open results.' : '');
    } else if (/\bworkspace\b|to-?do|\badd (a )?task|my tasks?\b|remind me/.test(s)) {
      const title = ((q.match(/["“](.+?)["”]/) || [])[1] || q.replace(/^(please )?(add|put|create)( a)?( task)?( to)?( my)?( workspace)?:?/i, '').replace(/\b(to|in|on) (my|the) (operator )?workspace\b/i, '').trim()) || q;
      const r = await T('add_workspace_task', { title, priority: /urgent|high|critical|asap/.test(s) ? 'high' : 'normal', department: /network/.test(s) ? 'Network' : /price|pricing|marketing/.test(s) ? 'Marketing' : /churn|retention|save/.test(s) ? 'CX & Retention' : undefined });
      out = `Added to the ${r.board}: **${r.task}** (${r.department}${r.priority === 'high' ? ', high priority' : ''}). Open the **My workspace** tab to move it through the shift.`;
    } else if (/right.?time|best time|when (should|to|do|can) (we |i )?(contact|call|message|text|reach)|contact (queue|plan|window)|who should (we|i) (contact|call)|\bengag/.test(s)) {
      const cid = ((q.match(/C-[0-9A-F]{6}/i) || [])[0] || '').toUpperCase(), g = /upsell|upgrade/.test(s) ? 'upsell' : /service|bill|remind/.test(s) ? 'service' : 'retention';
      const r = await T('contact_plan', { customer_id: cid || undefined, goal: g });
      out = cid ? (r.best_window ? `**${r.customer}** (${r.segment}, churn ${r.churn_score_pct}%): best ${r.goal.toLowerCase()} contact is **${r.best_window.channel}, ${r.best_window.slot}** at **${r.best_window.engage_probability_pct}%**${r.fixed_schedule && r.fixed_schedule.engage_probability_pct != null ? ` (fixed Tue 10:00 ${r.fixed_schedule.channel}: ${r.fixed_schedule.engage_probability_pct}%)` : ''}.\n` + r.best_window.reasons.map(x => '- ' + x).join('\n') : `**${r.customer}**: do not contact this week. Every slot is blocked by consent, a cap or a cooling-off rule.`)
        : `**Right-time engine** (${r.goal}; synthetic, tokenized customers): AUC **${r.model.auc}** vs ${r.model.baseline_auc} for a one-size-fits-all rule; engagement **${r.policy.right_time_engagement_pct}%** vs ${r.policy.fixed_schedule_engagement_pct}% on a fixed schedule (**${r.policy.uplift_pct > 0 ? '+' : ''}${r.policy.uplift_pct}%**).\n**Next 4 hours:**\n` + (r.next_4_hours.map(x => `- ${x.customer} (${x.segment}): ${x.channel}, ${x.slot}, ${x.engage_probability_pct}%`).join('\n') || '- Nobody: quiet hours.') + ($('#rtApp') ? '\nThe right-time studio shows the heatmap, guardrails and technical report.' : '');
    } else if (POS && (/quadrant|biggest competitor|main competitor|top competitor|who competes|competes with|what (should|to) improve|succeed|\bposition|biggest operator|largest operator/.test(s) || (posNamed(s) && !/hedge|private equity|\bpe\b|who owns|investor|market cap|valuation/.test(s)))) {
      const named = posNamed(s);
      const opsQ = (named && named.k === 'ops') || /operator|carrier|telco|gulf|gcc|middle east|asia|europe|africa|america/.test(s);
      const region = /gulf|gcc|uae|emirates|saudi|qatar|kuwait|bahrain|oman/.test(s) ? 'Gulf' : /middle east/.test(s) ? 'Middle East' : /asia|apac|pacific/.test(s) ? 'Asia' : /europe/.test(s) ? 'Europe' : /africa/.test(s) ? 'Africa' : /america/.test(s) ? 'Americas' : undefined;
      const r = await T('market_position', { name: named ? named.c.name : undefined, map: named ? (named.k === 'ops' ? 'operators' : 'competitors') : (opsQ ? 'operators' : 'competitors'), region: named ? undefined : region, limit: named ? 1 : 6, show_on_map: true });
      if (named && r[0]) { const x = r[0]; out = `**${x.name}** is in **${x.quadrant}** (${x.axes}: ${x.x} / ${x.y}).\n**Owners:** ${x.owners.join(', ') || x.ownership || '—'}${x.private_equity_or_infra ? ' · **PE / infrastructure fund involved**' : ''}${x.hedge_fund ? ' · **hedge fund involved**' : ''}${x.state ? ' · state-backed' : ''}\n**What to improve:**\n${(x.improve || []).map(i => '- ' + i).join('\n') || '- —'}\n**How to succeed:**\n${(x.how_to_succeed || []).map(i => '- ' + i).join('\n') || '- —'}\n**Competitors:** ${(x.competitors || []).join(', ') || '—'}\nIt is selected on the positioning map.`; }
      else out = (opsQ ? `**Biggest operators${region ? ' · ' + region : ''}** (by revenue):\n` : '**Biggest competitors to Cellvoyant** (by threat):\n') + r.map((x, i) => `- ${i + 1}. **${x.name}**: ${x.quadrant}${x.threat_to_cellvoyant != null ? ', threat ' + x.threat_to_cellvoyant + '/100' : x.revenue_usd ? ', revenue ' + fmtMoney(x.revenue_usd) : ''}${x.private_equity_or_infra ? ' · PE/infra' : ''}${x.hedge_fund ? ' · hedge fund' : ''}${x.state ? ' · state' : ''}`).join('\n') + '\nThe Positioning section shows each one’s quadrant, what to improve and its competitors.';
    } else if (/\balerts?\b|notify|\brules?\b|watchlist|tell me when|let me know when/.test(s) && !/brief/.test(s)) {
      const sev = /critical/.test(s) ? 'critical' : /\bwatch\b/.test(s) ? 'watch' : 'high';
      const cls = TPL.map(t => t.cls).find(c => s.includes(c.toLowerCase())) || (/pric/.test(s) ? 'Pricing' : undefined);
      const r = await T('create_alert_rule', { operator: rival ? OPS[rival].short : 'any', signal_class: cls, min_severity: sev });
      out = `Rule added: **${r.rule}**. ${r.shared_with_team ? 'It is saved for your team.' : 'It lasts for this visit (open the page in Claude to save it).'} Matching signals will be flagged in the feed the moment they arrive.`;
    } else if (/export|download|\bsave\b/.test(s) && /brief|report/.test(s)) {
      const r = await T('export_brief', {});
      out = r.status === 'saved' ? `Brief saved as **${r.filename}**.` : r.status === 'declined' ? 'The save was cancelled.' : r.status === 'busy' ? 'A save prompt is already open.' : 'Downloads aren’t available here, so the brief is open in a panel where you can copy it.';
    } else if (/hotspot|\bmap\b|\bgeo\b|spreading|coverage gap|where .*churn|district/.test(s)) {
      const layer = /coverage/.test(s) ? 'coverage' : /retail|store|kiosk/.test(s) ? 'retail' : 'churn';
      const r = await T('geo_hotspots', { layer, operator: rival ? OPS[rival].short : 'Arcline' });
      out = `**Geo radar · ${layer === 'churn' ? 'churn contagion' : layer === 'coverage' ? 'coverage truth (' + r.operator + ')' : 'rival retail'}** (simulated):\n` + r.hotspots.map((h, i) => `- ${i + 1}. ${h.district} (cell ${h.cell}): ` + (layer === 'churn' ? `**${h.port_outs_per_day_per_10k}** port-outs/day per 10k lines, ${h.level}` : layer === 'coverage' ? `**${h.measured_mbps} Mbps** measured where 5G is advertised (${h.gap})` : `pressure ${h.rival_retail_pressure}`)).join('\n') + (layer === 'churn' ? '\n**Suggested:** targeted retention credits in the top two districts, then watch the wave front.' : layer === 'coverage' ? '\n**Suggested:** where a rival misses its own claim, run factual comparison ads; where you miss yours, fix it before a rival notices.' : '');
    } else if (LAND && /\bpeer|multiple|valuation pulse|\brank|largest operators|biggest operators|biggest telecom/.test(s)) {
      const m = /revenue multiple|÷|to revenue|multiple/.test(s) ? 'mcap_to_revenue' : /by revenue/.test(s) ? 'revenue' : 'mcap';
      const r = await T('valuation_pulse', { metric: m, limit: 8 });
      out = `**${r.metric}**, ${r.verified}:\n` + r.rows.map((x, i) => `- ${i + 1}. ${x.company}: ${m === 'mcap_to_revenue' ? x.value + '×' : fmtMoney(x.value)}${x.change_since_previous_check_pct != null ? ` (${x.change_since_previous_check_pct > 0 ? '+' : ''}${x.change_since_previous_check_pct}% since last check)` : ''}`).join('\n');
    } else if (LAND && /hedge|private equity|\bpe\b|activist|infrastructure fund|who owns|owner|investor|backed|funding|raised|valuation|market cap|revenue of|competitor/.test(s)) {
      const inv = /hedge|activist/.test(s) ? 'hedge fund' : /private equity|\bpe\b|infrastructure fund/.test(s) ? 'pe' : undefined;
      const named = LAND.companies.find(c => s.includes(c.name.toLowerCase().split(/[\s(/]/)[0]) && c.name.length > 3);
      const segq = /operator|carrier/.test(s) ? 'operator' : /competitor|ci |intelligence/.test(s) ? '' : '';
      const r = await T('company_lookup', { name: named ? named.name : undefined, involvement: named ? undefined : inv, segment: segq || undefined, limit: 8 });
      let dl = [];
      if (inv && !named) dl = await T('capital_deals', { investor_type: inv === 'pe' ? 'pe' : 'hedge fund', limit: 5 });
      out = (r.length ? r.map(c => `- **${c.name}** (${c.segment}; ${c.ownership || 'ownership n/a'}): ${c.market_cap_usd ? 'market cap ' + fmtMoney(c.market_cap_usd) + ' (' + c.market_cap_as_of + ')' : c.valuation_usd ? 'valuation ' + fmtMoney(c.valuation_usd) + ' (' + (c.valuation_basis || '') + ')' : 'value not disclosed'}${c.revenue ? '; revenue ' + c.revenue : ''}${c.investors.length ? '; investors: ' + c.investors.slice(0, 4).join(', ') : ''}`).join('\n') : 'No matching companies in the landscape data.') + (dl.length ? '\n**Recent deals:**\n' + dl.map(d => `- ${d.date}: ${d.investor} → ${d.target}${d.value_usd ? ' (' + fmtMoney(d.value_usd) + ')' : ''}: ${d.what}`).join('\n') : '') + '\nFull table: the Landscape section of this page.';
    } else if (/services?\b|what can you|\bhelp\b|capabilit/.test(s) && !/simulat|compare|predict/.test(s)) {
      const r = await T('list_services', {});
      out = `**Live in this console:** ${r.live_in_console.join(', ')}.\n**Services you can request:**\n` + r.requestable_services.map(x => `- ${x.name} (${x.turnaround}): ${x.what}`).join('\n') + `\n**I can also write:** ${r.ai_deliverables.join(', ')}.`;
    } else if (/simulat|war.?room|\bmatch|cutting|price cut|respond|response/.test(s) && (rival || /cut/.test(s))) {
      const cut = +((s.match(/(\d{1,2})\s?%/) || [])[1] || 14), weeks = +((s.match(/(\d{1,2})\s?-?\s?weeks?/) || [])[1] || 8);
      const r = await T('simulate_response', { rival: rival && BASE_PORTS[rival] ? rival : 'arc', cut_pct: cut, weeks, show_in_war_room: true });
      out = `**${r.scenario.rival} cuts ${r.scenario.cut_pct}% for ${r.scenario.weeks} weeks:** about **${fmtInt(r.extra_port_outs_if_no_response)}** extra port-outs if you do nothing.\n` + r.strategies.map(x => `- ${x.strategy}: saves ${fmtInt(x.lines_saved)} lines, costs ${fmtMoney(x.cost_usd)}, net **${fmtMoney(x.net_impact_usd)}**`).join('\n') + `\n**Recommendation: ${r.best}.** Responding in week 0 instead of week 3 is worth ${fmtMoney(r.early_warning_gain_usd)}. The scenario is loaded in the War room tab.`;
    } else if (sid) {
      out = sigLine(await T('get_signal', { id: sid }));
    } else if (/evidence|deep.?dive|break down|top critical/.test(s)) {
      const top = TOOLS.list_signals({ severity: 'crit', limit: 1 })[0] || TOOLS.list_signals({ limit: 1 })[0];
      out = sigLine(await T('get_signal', { id: top.id }));
    } else if (/battle.?card/.test(s)) {
      const op = rival || 'arc', plan = PLANS.find(p => p.op === op);
      const sigs = await T('list_signals', { operator: op, limit: 3 }), cmp = plan ? await T('compare_plans', { plan_id: plan.id }) : null;
      out = `**Battlecard: ${OPS[op].name}** (${OPS[op].kind})\n**Recent moves:**\n` + (sigs.map(x => `- [${x.id}] ${x.text}`).join('\n') || '- None detected yet') + (cmp ? `\n**Their headline plan:** ${cmp.plan.plan} at $${cmp.plan.price_usd}/mo, effective $${cmp.plan.effective_price_usd}${cmp.plan.mutations.length ? '. Recent change: ' + cmp.plan.mutations[0] : ''}.` : '') + `\n**Where we win:** network perception, no hidden fees, bundled perks.\n**Talk track:** compare the total monthly cost including fees, not the headline price.\n**Watch next:** ${sigs[0] ? sigs[0].next : 'new pricing or launch signals'}.`;
    } else if (/\bcompare|\bplans?\b|tariff|expos|\bdna\b/.test(s)) {
      const r = await T('compare_plans', { plan_id: /essential/.test(s) ? 'nim-e' : 'nim-u' });
      out = `**${r.plan.operator} ${r.plan.plan}** ($${r.plan.price_usd}, value ${r.plan.value_score}) vs its nearest rivals:\n` + r.nearest_rivals.map(n => `- **${n.operator} ${n.plan}** ($${n.price_usd}, ${n.similarity_pct}% similar). They offer more on: ${n.differences.filter(d => d.rival_better_for_customer).map(d => d.gene + ' (' + d.rival + ')').join(', ') || 'nothing'}. You offer more on: ${n.differences.filter(d => !d.rival_better_for_customer).map(d => d.gene + ' (' + d.selected + ')').join(', ') || 'nothing'}.`).join('\n');
    } else if (/predict|likely|chance|probab|what if|exclude|without|fwa|home internet|bundle|family/.test(s)) {
      const mv = /arcline|family|price cut/.test(s) ? 'cut' : /skyreach|satellite|bundle|pulsar/.test(s) ? 'sat' : 'fwa';
      const P = PRED.find(x => x.id === mv), exclude = [];
      if (/exclude|without|what if|remove|ignore/.test(s)) P.signals.forEach((sg, i) => { const w = (sg.s + ' ' + sg.t).toLowerCase().split(/[^a-z]+/).filter(x => x.length > 4 && !STOP.has(x)); if (w.some(x => s.includes(x))) exclude.push(i); });
      const r = await T('predict_move', { move_id: mv, exclude });
      out = `**${r.move}: ${r.probability_pct}%** within ${r.window} (base rate ${r.prior_pct}%${exclude.length ? `; ${r.console_probability_pct}% with all current signals` : ''}).\n` + r.signals.filter(x => x.enabled).map(x => `- ${x.signal} (LR ${x.likelihood_ratio}${x.dependence_discounted ? ', shared origin, discounted' : ''})`).join('\n') + (r.decisive_signal ? `\n**Decisive signal:** ${r.decisive_signal.signal} (−${r.decisive_signal.drop_pts_if_removed} pts if removed).` : '');
    } else if (/\bsize|\btam\b|\bsam\b|\bsom\b|market/.test(s)) {
      const seg = [];
      if (/\bmnos?\b|network operator/.test(s)) seg.push('mno'); if (/mvno|digital brand/.test(s)) seg.push('mvno'); if (/\bisps?\b|fiber|fibre|cable|broadband/.test(s)) seg.push('isp'); if (/tower|satellite|infra/.test(s)) seg.push('infra'); if (/vendor|investor|consult/.test(s)) seg.push('inv');
      const r = await T('size_market', { segments: seg });
      out = `**TAM ${fmtMoney(r.tam_usd)}** → SAM ${fmtMoney(r.sam_usd)} (${r.sam_pct}%) → SOM ${fmtMoney(r.som_usd)} (${r.som_pct_of_sam}% of SAM).\n` + r.segments.map(x => `- ${x.segment}: ${fmtInt(x.organizations)} × ${fmtMoney(x.acv_usd)}`).join('\n') + `\n${r.note}`;
    } else if (/brief|summary|summar|\bexec|\bcmo\b|update/.test(s)) {
      const sigs = await T('list_signals', { limit: 3 }), pr = await T('predict_move', { move_id: 'fwa' }), sim = await T('simulate_response', { rival: 'arc', cut_pct: 14 });
      out = `**Metro North brief** (${fmtClock()})\n` + sigs.map(x => `- [${x.id}] ${x.text}. Next: ${x.next}`).join('\n') + `\n- Vertex FWA launch: **${pr.probability_pct}%** within ${pr.window}.\n- Response to the Arcline cut: **${sim.best}** (net ${fmtMoney(sim.strategies.find(z => z.strategy === sim.best).net_impact_usd)}).`;
    } else {
      const sigs = await T('list_signals', { limit: 3 });
      out = 'Top of the feed right now:\n' + sigs.map(x => `- [${x.id}] **${SEVL[x.severity]}** · ${x.text} (${x.freshness_pct}% fresh)`).join('\n') + '\nI can simulate responses, compare plans, run prediction what-ifs, size the market, write briefs and battlecards, or book a service. Try a tool on the right.';
    }
  } catch (e) { out = 'That tool call failed: ' + (e && e.message ? e.message : 'unknown error'); }
  body.innerHTML = mdLite(out) + (note ? `<p class="tiny muted">${esc(note)}</p>` : '');
  msgs.scrollTop = msgs.scrollHeight;
}
$('#askForm').addEventListener('submit', e => { e.preventDefault(); const v = $('#askInput').value; $('#askInput').value = ''; ask(v); });
$('#askInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#askForm').requestSubmit(); } });
$('#stopBtn').onclick = () => askCtl && askCtl.abort();
const SUGG = ['Search for spectrum consultation', 'Who should we contact in the next 4 hours, and when?', 'Add "brief the save desk on Arcline" to my workspace', 'Who are Cellvoyant’s biggest competitors?', 'Which quadrant is du in, and what should it improve?', 'Who are the biggest operators in the Gulf?', 'What needs action today?', 'Where is churn spreading right now?', 'Rank operators by market cap to revenue', 'Alert me when Arcline makes a High pricing move', 'Export a brief', 'Which competitors are backed by hedge funds or private equity?', 'Simulate Arcline cutting 20% for 12 weeks and recommend a response', 'Compare our Unlimited Plus with the closest rival plans', 'What if we exclude the equipment filing from the Vertex FWA prediction?', 'Write a battlecard against Kite', 'Book an analyst to verify the Arcline price cut', 'Size the market for MVNOs and fiber ISPs only', 'Draft a 5-bullet exec brief for the CMO', 'What services can I request?'];
$('#sugg').innerHTML = SUGG.map(s => `<button type="button">${esc(s)}</button>`).join('');
$('#sugg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
const TOOLBOX = [
  ['Market position', 'market_position', 'Which quadrant is du in, and what should it improve?'],
  ['Geo hotspots', 'geo_hotspots', 'Where is churn spreading right now?'],
  ['Valuation pulse', 'valuation_pulse', 'Rank operators by market cap to revenue.'],
  ['Alert rule', 'create_alert_rule', 'Alert me when Arcline makes a High pricing move.'],
  ['Brief export', 'export_brief', 'Export a brief.'],
  ['Signal scan', 'list_signals', 'What needs action today?'],
  ['Evidence deep-dive', 'get_signal', 'Break down the evidence behind the top critical signal.'],
  ['Tariff DNA compare', 'compare_plans', 'Compare our Unlimited Plus with the closest rival plans.'],
  ['Prediction what-if', 'predict_move', 'What if we exclude the equipment filing from the Vertex FWA prediction?'],
  ['War-room simulation', 'simulate_response', 'Simulate Arcline cutting 20% for 12 weeks and recommend a response.'],
  ['Market sizing', 'size_market', 'Size the market for MVNOs and fiber ISPs only.'],
  ['Right-time contact plan', 'contact_plan', 'Who should we contact in the next 4 hours, and when?'],
  ['Intelligence search', 'intel_search', 'Search for “private equity” deals in the Gulf'],
  ['Workspace task', 'add_workspace_task', 'Add "verify the Arcline price cut" to my workspace.'],
  ['Service desk', 'request_service', 'Book an analyst to verify the Arcline price cut.']
];
$('#toolbox').innerHTML = TOOLBOX.map(([n, t, p]) => `<button type="button" class="tool-btn" data-p="${esc(p)}"><span class="tb-h"><b>${esc(n)}</b><code>${t}</code></span><span>“${esc(p)}”</span></button>`).join('');
$('#toolbox').addEventListener('click', e => { const b = e.target.closest('.tool-btn'); if (b) ask(b.dataset.p); });

/* ---------- tabs ---------- */
const TABS = $$('#app .tab');
function selectTab(id) {
  TABS.forEach(t => { const on = t.id === id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = !on; });
  if (id === 'tab-cc') radar && radar.draw();
  if (id === 'tab-geo') { geoSize(); geoTick(); }
  if (id === 'tab-cap') renderCapital();
  if (id === 'tab-wb') wbRender();
  if (id === 'tab-ws') renderWorkspace();
}
TABS.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t.id));
  t.addEventListener('keydown', e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; const n = TABS[(i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length]; selectTab(n.id); n.focus(); });
});

/* ---------- toast ---------- */
let toastT = 0;
function toast(msg) {
  const el = $('#toast'); if (!el) return;
  el.textContent = msg; el.hidden = false; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => { el.classList.remove('show'); el.hidden = true; }, 5200);
}

/* ---------- GEO RADAR (simulated churn contagion, coverage truth, rival retail) ---------- */
const DIST_SEEDS = [['North district', .47, .16], ['East district', .80, .44], ['Harbor district', .62, .86], ['Old Town', .42, .52], ['Riverside', .13, .74], ['University Heights', .15, .24]];
const GEO = { cols: 19, rows: 11, layer: 'churn', op: 'arc', t: 0, sel: null, hexes: [], tests: 18420, pins: [], W: 0, H: 0, s: 0, dpr: 1 };
(function buildGeo() {
  const g = mulberry(4242);
  for (let r = 0; r < GEO.rows; r++) for (let q = 0; q < GEO.cols; q++) {
    const x = (q + (r % 2 ? .5 : 0)) / (GEO.cols - .5), y = r / (GEO.rows - 1);
    let d = 0, bd = 9; DIST_SEEDS.forEach((s, i) => { const dd = (x - s[1]) ** 2 + ((y - s[2]) * .85) ** 2; if (dd < bd) { bd = dd; d = i; } });
    const edge = Math.min(x, 1 - x, y, 1 - y), rural = edge < .1 ? (.1 - edge) * 10 : 0;
    const mb = (base, weakD) => Math.max(8, Math.round(base + g() * 180 - rural * 150 - (d === weakD ? 110 : 0)));
    GEO.hexes.push({ q, r, x, y, d, id: `${DIST_SEEDS[d][0][0]}${r * GEO.cols + q}`, base: g(), cov: { nim: mb(150, -1), vtx: mb(160, 2), arc: mb(135, 4), pls: mb(120 + (d === 2 ? 90 : 0), 5) }, adv: edge > .03 });
  }
  const pin = (op, dname, dx, dy, kind) => { const s = DIST_SEEDS.find(v => v[0] === dname); GEO.pins.push({ op, x: s[1] + dx, y: s[2] + dy, kind }); };
  [['pls', 'East district', .03, -.08], ['pls', 'East district', -.06, .05], ['pls', 'Old Town', .05, .04], ['pls', 'Old Town', -.04, -.06], ['pls', 'Harbor district', .02, -.05], ['pls', 'East district', .07, .1]].forEach(a => pin(a[0], a[1], a[2], a[3], 'pop-up kiosk'));
  [['arc', 'North district', 0, 0], ['arc', 'Old Town', .08, .02], ['vtx', 'University Heights', .03, .05], ['vtx', 'Harbor district', -.05, 0], ['nim', 'Old Town', -.02, .1], ['nim', 'North district', -.08, .04], ['nim', 'East district', .0, .0]].forEach(a => pin(a[0], a[1], a[2], a[3], 'store'));
})();
function geoChurn(h) {
  const E = DIST_SEEDS[1], Hb = DIST_SEEDS[2];
  const de = Math.hypot(h.x - E[1], (h.y - E[2]) * .85), dh = Math.hypot(h.x - Hb[1], (h.y - Hb[2]) * .85);
  const radius = .04 + (GEO.t % 180) / 180 * .62;
  const wave = Math.exp(-((de - radius) ** 2) / .0045) * (1 - radius / .75);
  const core = Math.exp(-(de ** 2) / .012) * .75, outage = Math.exp(-(dh ** 2) / .006) * (.45 + .35 * Math.sin(GEO.t / 7));
  return clamp(h.base * .28 + core + wave * .85 + outage * .5, 0, 1.2);
}
const portouts = v => Math.round(6 + v * 36);
function geoValue(h) {
  if (GEO.layer === 'churn') return geoChurn(h);
  if (GEO.layer === 'coverage') { const m = h.cov[GEO.op]; return h.adv ? clamp(1 - m / 220, 0, 1) : 0; }
  const rivals = GEO.pins.filter(p => p.op !== 'nim'), own = GEO.pins.filter(p => p.op === 'nim');
  const dens = ps => ps.reduce((t, p) => t + Math.exp(-(((h.x - p.x) ** 2) + ((h.y - p.y) * .85) ** 2) / .006), 0);
  return clamp(dens(rivals) * .55 - dens(own) * .25, 0, 1);
}
function hexToRgb(c) { c = String(c || '').trim(); if (c[0] !== '#') return [128, 128, 128]; if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); }
function mixC(a, b, t) { return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * clamp(t, 0, 1))).join(',')})`; }
function geoSize() {
  const cv = $('#geo'); if (!cv) return false;
  const W = cv.getBoundingClientRect().width; if (!W) return false;
  GEO.dpr = Math.min(2, window.devicePixelRatio || 1); GEO.W = W;
  GEO.s = W / ((GEO.cols + .5) * Math.sqrt(3)); GEO.H = GEO.s * (1.5 * (GEO.rows - 1) + 2) + 4;
  cv.style.height = GEO.H + 'px'; cv.width = Math.round(W * GEO.dpr); cv.height = Math.round(GEO.H * GEO.dpr);
  return true;
}
const hexCenter = h => [GEO.s * Math.sqrt(3) * (h.q + .5 * (h.r & 1)) + GEO.s * Math.sqrt(3) / 2, GEO.s * 1.5 * h.r + GEO.s + 2];
function drawGeo() {
  const cv = $('#geo'); if (!cv || !GEO.W || $('#p-geo').hidden) return;
  const ctx = cv.getContext('2d'), css = getComputedStyle($('#app')), tok = n => css.getPropertyValue(n).trim();
  const cLo = hexToRgb(tok('--surface-2')), cMid = hexToRgb(tok('--signal')), cHi = hexToRgb(tok('--crit')), cGood = hexToRgb(tok('--good')), cAcc = hexToRgb(tok('--accent'));
  ctx.setTransform(GEO.dpr, 0, 0, GEO.dpr, 0, 0); ctx.clearRect(0, 0, GEO.W, GEO.H);
  const s = GEO.s * .96;
  GEO.hexes.forEach(h => {
    const [cx, cy] = hexCenter(h), v = geoValue(h);
    let fill;
    if (GEO.layer === 'coverage') { const m = h.cov[GEO.op]; fill = !h.adv ? tok('--surface-2') : m < 50 ? mixC(cMid, cHi, .9) : m < 120 ? mixC(cLo, cMid, .85) : mixC(cLo, cGood, .75); }
    else if (GEO.layer === 'retail') fill = mixC(cLo, cAcc, v);
    else fill = v < .5 ? mixC(cLo, cMid, v / .5) : mixC(cMid, cHi, (v - .5) / .7);
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k - 30); const px = cx + s * Math.cos(a), py = cy + s * Math.sin(a); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = GEO.sel === h ? 2.5 : 1; ctx.strokeStyle = GEO.sel === h ? tok('--ink') : tok('--surface'); ctx.stroke();
  });
  if (GEO.layer === 'retail') GEO.pins.forEach(p => {
    const x = p.x * (GEO.W - GEO.s * 2) + GEO.s, y = p.y * (GEO.H - GEO.s * 2) + GEO.s;
    ctx.beginPath(); ctx.arc(x, y, p.kind === 'store' ? 5 : 4, 0, Math.PI * 2); ctx.fillStyle = tok('--op-' + p.op); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = tok('--surface'); ctx.stroke();
  });
  ctx.font = '600 11px "IBM Plex Sans", system-ui, sans-serif'; ctx.textAlign = 'center';
  DIST_SEEDS.forEach((d, i) => {
    const hs = GEO.hexes.filter(h => h.d === i); if (!hs.length) return;
    const cx = hs.reduce((t, h) => t + hexCenter(h)[0], 0) / hs.length, cy = hs.reduce((t, h) => t + hexCenter(h)[1], 0) / hs.length;
    const w = ctx.measureText(d[0]).width + 10;
    ctx.fillStyle = tok('--surface'); ctx.globalAlpha = .85; ctx.fillRect(cx - w / 2, cy - 9, w, 17); ctx.globalAlpha = 1;
    ctx.fillStyle = tok('--ink'); ctx.fillText(d[0], cx, cy + 4);
  });
}
function geoHotspots(layer, op) {
  const keepL = GEO.layer, keepO = GEO.op; GEO.layer = layer || GEO.layer; GEO.op = op || GEO.op;
  const list = GEO.hexes.map(h => ({ h, v: geoValue(h) })).filter(o => GEO.layer !== 'coverage' || o.h.adv).sort((a, b) => b.v - a.v).filter((o, i, arr) => arr.findIndex(x => x.h.d === o.h.d) === i).slice(0, 5).map(({ h, v }) => {
    const dist = DIST_SEEDS[h.d][0];
    if (GEO.layer === 'coverage') return { cell: h.id, district: dist, operator: OPS[GEO.op].name, advertised: '5G', measured_mbps: h.cov[GEO.op], gap: h.cov[GEO.op] < 50 ? 'claim not met' : h.cov[GEO.op] < 120 ? 'weak' : 'ok' };
    if (GEO.layer === 'retail') return { cell: h.id, district: dist, rival_retail_pressure: Math.round(v * 100) };
    return { cell: h.id, district: dist, port_outs_per_day_per_10k: portouts(v), level: v > .8 ? 'wave front' : v > .5 ? 'elevated' : 'normal' };
  });
  GEO.layer = keepL; GEO.op = keepO; return list;
}
function renderGeoSide() {
  const hs = geoHotspots();
  const unit = GEO.layer === 'churn' ? 'port-outs/day per 10k lines' : GEO.layer === 'coverage' ? `${OPS[GEO.op].short} measured median Mbps where 5G is advertised` : 'rival retail pressure index';
  $('#geoHot').innerHTML = hs.map((o, i) => `<button type="button" class="hot" data-cell="${esc(o.cell)}"><span class="mono tiny muted">#${i + 1} · ${esc(o.cell)}</span><b>${esc(o.district)}</b><span class="small">${GEO.layer === 'churn' ? `<b>${o.port_outs_per_day_per_10k}</b> port-outs/day per 10k · ${esc(o.level)}` : GEO.layer === 'coverage' ? `<b>${o.measured_mbps} Mbps</b> vs 5G claim · ${esc(o.gap)}` : `pressure <b>${o.rival_retail_pressure}</b>`}</span></button>`).join('');
  $('#geoUnit').textContent = unit;
  $('#geoLegend').dataset.l = GEO.layer;
  $('#geoTests').textContent = fmtInt(GEO.tests);
  const h = GEO.sel; const d = $('#geoCell');
  if (!h) { d.innerHTML = '<p class="small muted">Click a cell on the map for details.</p>'; return; }
  const v = geoChurn(h);
  d.innerHTML = `<div class="hd"><b>${esc(DIST_SEEDS[h.d][0])}</b><span class="mono tiny">cell ${esc(h.id)}</span></div>
    <div class="figs2"><span>Port-outs/day per 10k</span><b>${portouts(v)}</b><span>Measured median Mbps</span><b>${['nim', 'vtx', 'arc', 'pls'].map(o => `${OPS[o].short} ${h.cov[o]}`).join(' · ')}</b><span>5G advertised</span><b>${h.adv ? 'yes, by all MNOs' : 'no'}</b></div>`;
}
function geoTick() { if (!GEO.W && !geoSize()) return; drawGeo(); if (!$('#p-geo').hidden) renderGeoSide(); }
function initGeo() {
  const cv = $('#geo'); if (!cv) return;
  $('#geoLayers').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; GEO.layer = b.dataset.l; $$('#geoLayers button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('#geoOpWrap').hidden = GEO.layer !== 'coverage'; geoTick(); });
  $('#geoOp').addEventListener('change', e => { GEO.op = e.target.value; geoTick(); });
  cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 1e9; GEO.hexes.forEach(h => { const [cx, cy] = hexCenter(h), dd = (cx - x) ** 2 + (cy - y) ** 2; if (dd < bd) { bd = dd; best = h; } }); if (best && bd < GEO.s * GEO.s * 1.2) { GEO.sel = best; geoTick(); } });
  $('#geoHot').addEventListener('click', e => { const b = e.target.closest('.hot'); if (!b) return; GEO.sel = GEO.hexes.find(h => h.id === b.dataset.cell) || null; geoTick(); });
  $('#geoWar').onclick = () => { $('#wRival').value = 'arc'; selectTab('tab-war'); runWar(); };
  $('#geoAsk').onclick = () => { const where = GEO.sel ? DIST_SEEDS[GEO.sel.d][0] : (geoHotspots()[0] || {}).district || 'East district'; selectTab('tab-ask'); ask(GEO.layer === 'coverage' ? `Explain the ${OPS[GEO.op].short} coverage gaps and what we should do in ${where}` : GEO.layer === 'retail' ? `How should we respond to rival retail pressure in ${where}?` : `Where is churn spreading right now, and what should we do in ${where}?`); };
  new ResizeObserver(() => { if (geoSize()) geoTick(); }).observe(cv);
}

/* ---------- alert rules (shared through the page's data store) ---------- */
const SEVRANK = { watch: 0, high: 1, crit: 2 };
let ALERT_RULES = [], ruleHits = 0, rulesDb = null;
const localRules = [];
const ruleLabel = r => `${r.op === 'any' ? 'Any operator' : (OPS[r.op] || {}).short || r.op} · ${r.cls === 'any' ? 'any class' : r.cls} · ${SEVL[r.sev] || r.sev}+`;
const ruleMatch = e => ALERT_RULES.find(r => (r.op === 'any' || r.op === e.tpl.op) && (r.cls === 'any' || r.cls === e.tpl.cls) && SEVRANK[e.tpl.sev] >= (SEVRANK[r.sev] ?? 0));
function renderRules() {
  ALERT_RULES = rulesDb ? ALERT_RULES : localRules;
  $('#ruleList').innerHTML = ALERT_RULES.length ? ALERT_RULES.map(r => `<span class="rule-chip">${esc(ruleLabel(r))}<button type="button" data-del="${esc(r.id)}" aria-label="Delete rule ${esc(ruleLabel(r))}">×</button></span>`).join('') : '<span class="small muted">No rules yet. Try Arcline · Pricing · High+.</span>';
  $('#ruleNote').textContent = rulesDb ? 'shared with your team' : 'this visit only';
  $('#rulePill').textContent = `Rule hits: ${ruleHits}`;
}
async function addRule({ op, cls, sev, via }) {
  op = op && (OPS[op] || op === 'any') ? op : 'any'; cls = cls || 'any'; sev = SEVRANK[sev] != null ? sev : 'high';
  const body = { op, cls, sev, via: via || 'form', createdAt: new Date().toISOString() };
  if (rulesDb) {
    try { const ref = await rulesDb.collection('rules').add(body); return { id: ref.id, label: ruleLabel(body), shared: true }; }
    catch (e) { throw new Error(e && e.code === 'invalid_argument' ? 'You have view-only access, so you can’t add team rules.' : 'The rule could not be saved (' + ((e && e.code) || 'error') + ').'); }
  }
  const id = 'local' + Date.now().toString(36); localRules.unshift(Object.assign({ id }, body)); renderRules();
  return { id, label: ruleLabel(body), shared: false };
}
function onNewEvent(e) {
  const r = ruleMatch(e); if (!r) return;
  e.rule = ruleLabel(r); ruleHits++; $('#rulePill').textContent = `Rule hits: ${ruleHits}`;
  toast(`Rule matched (${ruleLabel(r)}): ${e.id} ${e.text}`);
}
function initRules() {
  const clsSet = [...new Set(TPL.map(t => t.cls))];
  $('#rOp').innerHTML = '<option value="any">Any operator</option>' + ['vtx', 'arc', 'pls', 'sky', 'kte', 'all'].map(o => `<option value="${o}">${esc(OPS[o].short)}</option>`).join('');
  $('#rCls').innerHTML = '<option value="any">Any class</option>' + clsSet.map(c => `<option>${esc(c)}</option>`).join('');
  $('#rSev').innerHTML = '<option value="watch">Watch+</option><option value="high" selected>High+</option><option value="crit">Critical only</option>';
  $('#ruleForm').addEventListener('submit', async e => { e.preventDefault(); const b = $('button', e.target); b.disabled = true; try { const r = await addRule({ op: $('#rOp').value, cls: $('#rCls').value, sev: $('#rSev').value }); toast(`Rule added: ${r.label}`); } catch (err) { toast(err.message); } finally { b.disabled = false; } });
  $('#ruleList').addEventListener('click', async e => { const b = e.target.closest('[data-del]'); if (!b) return; const id = b.dataset.del; if (rulesDb && !id.startsWith('local')) { try { await rulesDb.doc('rules/' + id).delete(); } catch (err) { toast('Could not delete the rule.'); } } else { const i = localRules.findIndex(r => r.id === id); if (i > -1) localRules.splice(i, 1); renderRules(); } });
  renderRules();
  (window.claude && typeof window.claude.use === 'function' ? window.claude.use('db').catch(() => null) : Promise.resolve(null)).then(d => {
    if (!d) return; rulesDb = d;
    d.collection('rules').orderBy('createdAt', 'desc').limit(20).onSnapshot(s => { ALERT_RULES = s.docs.map(x => Object.assign({ id: x.id }, x.data())).filter(r => r && r.op && r.sev); renderRules(); }, () => { rulesDb = null; renderRules(); });
  });
}

/* ---------- brief export ---------- */
let downloadsNs = null;
(window.claude && typeof window.claude.use === 'function' ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null)).then(d => { downloadsNs = d || null; });
function buildBrief() {
  const top = [...events].sort((a, b) => score(b) - score(a)).slice(0, 5);
  const hs = geoHotspots('churn');
  const lines = [`# Cellvoyant brief · ${fmtClock()}`, '', '_Console data is simulated for fictional operators. Landscape figures are researched public data with sources on the page._', '',
    '## Top signals', ...top.map(e => `- **[${e.id}] ${SEVL[e.tpl.sev]}** · ${OPS[e.tpl.op].name}: ${e.text} (conf ${Math.round(e.tpl.conf * 100)}%, ${Math.round(fresh(e) * 100)}% fresh). Next: ${e.next}`), '',
    '## Predicted moves', ...PRED.map(P => `- ${P.title}: **${Math.round(fuse(P).p * 100)}%** within ${P.window}`), ''];
  if (warLast) lines.push('## War room', `- Scenario: ${OPS[warLast.sc.rival].name} cuts ${warLast.sc.cut}% for ${warLast.sc.weeks} weeks`, `- Best response: **${RESP[warLast.best.k].l}** (net ${fmtMoney(warLast.best.net)}); early warning worth ${fmtMoney(warLast.earlyGain)}`, '');
  lines.push('## Churn hotspots (Geo radar)', ...hs.slice(0, 3).map(h => `- ${h.district} (cell ${h.cell}): ${h.port_outs_per_day_per_10k} port-outs/day per 10k lines`), '');
  if (ALERT_RULES.length) lines.push('## Alert rules', ...ALERT_RULES.map(r => `- ${ruleLabel(r)}`), `- Hits this session: ${ruleHits}`, '');
  if (LAND) {
    const ops = LAND.companies.filter(c => c.seg === 'Operator' && c.mcap && c.mcap.usd).sort((a, b) => b.mcap.usd - a.mcap.usd).slice(0, 5);
    lines.push(`## Market (${landAgeText()})`, ...ops.map(c => `- ${c.name}: market cap ${fmtMoney(c.mcap.usd)} (${c.mcap.asOf || ''})`), '',
      '## Competitors with PE or hedge-fund backing', ...LAND.companies.filter(c => c.seg !== 'Operator' && (flagsOf(c).pe || flagsOf(c).hf)).map(c => `- ${c.name}: ${(c.investors || []).filter(i => ['pe', 'hf', 'infra'].includes(typeKey(i.t))).map(i => i.n).join(', ')}`), '');
  }
  return lines.join('\n');
}
function showBriefPanel(md) { $('#briefText').value = md; $('#briefPanel').hidden = false; $('#briefText').focus(); $('#briefText').select(); }
async function exportBrief() {
  const md = buildBrief(), d = simDate(), name = `cellvoyant-brief-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.md`;
  if (downloadsNs) {
    try { await downloadsNs.save({ filename: name, data: md }); toast('Brief saved'); return { status: 'saved', filename: name }; }
    catch (e) { if (e && e.code === 'declined') { toast('Save cancelled'); return { status: 'declined' }; } if (e && e.code === 'rate_limited') { toast('A save prompt is already open.'); return { status: 'busy' }; } }
  }
  showBriefPanel(md);
  return { status: 'shown_in_panel', filename: name, note: 'Downloads are not available in this view; the brief is open in a panel to copy.' };
}
function initExport() {
  $('#exportBtn').onclick = () => exportBrief();
  $('#briefClose').onclick = () => { $('#briefPanel').hidden = true; $('#exportBtn').focus(); };
  $('#briefCopy').onclick = async () => { try { await navigator.clipboard.writeText($('#briefText').value); toast('Brief copied'); } catch (e) { $('#briefText').select(); toast('Select the text and copy it with your keyboard.'); } };
}

/* ---------- live risk sparkline ---------- */
const riskHist = [];
function spark(vals) {
  if (vals.length < 2) return '';
  const mn = Math.min(...vals), mx = Math.max(...vals), w = 84, h = 18, rng = mx - mn || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1) * w).toFixed(1)},${(h - 2 - (v - mn) / rng * (h - 4)).toFixed(1)}`).join(' ');
  const last = pts.split(' ').pop().split(',');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" style="fill:none;stroke:var(--signal);stroke-width:1.5"/><circle cx="${last[0]}" cy="${last[1]}" r="2.2" style="fill:var(--signal)"/></svg>`;
}

function geoJitter() { for (let k = 0; k < 8; k++) { const h = GEO.hexes[Math.floor(rand() * GEO.hexes.length)]; ['nim', 'vtx', 'arc', 'pls'].forEach(o => { h.cov[o] = Math.max(8, Math.round(h.cov[o] * (0.96 + rand() * 0.08))); }); } GEO.tests += 7 + Math.floor(rand() * 19); }

/* ---------- innovation lab ---------- */
const LAB = [
  ['AI engines', 'core', 'Move Predictor', 'Combines weak pre-launch signals (job posts, equipment filings, app strings, domains) into a probability and time window for each competitor move.', 'Launches discovered on announcement day'],
  ['AI engines', 'core', 'Tariff DNA Sequencer', 'Splits every plan into ten normalized genes to compare plans like-for-like and catch stealth price rises hidden in fees and allowances.', 'Fine-print pricing nobody can compare'],
  ['AI engines', 'core', 'Market Digital Twin (War Room)', 'Subscriber-level simulation that tests hold, match, perk and targeted responses before you commit a dollar.', '“Should we match?” decided on gut feel'],
  ['AI engines', 'core', 'Insight Half-Life Router', 'Every insight carries a decay clock. Short-lived ones jump the queue and go straight to someone who can act.', 'Alerts that arrive after the moment has passed'],
  ['AI engines', 'new', 'Churn Contagion Radar', 'Detects port-out waves spreading district to district after a rival promo, 5–7 days before they peak.', 'Churn spikes seen only in the monthly report'],
  ['AI engines', 'new', 'Coverage Truth Engine', 'Compares advertised coverage maps with crowd-measured experience in every hex cell, for you and for rivals.', 'Network claims no one can verify'],
  ['AI engines', '', 'Spectrum Auction Oracle', 'Models each rival’s spectrum needs, balance-sheet headroom and likely bids, then simulates auction outcomes.', 'Auction strategy built on guesswork'],
  ['AI engines', '', 'Earnings Call Decoder', 'Tracks tone, hedging and new phrases in executive calls quarter over quarter, for example “defend share” appearing for the first time.', 'Strategy shifts hidden in management language'],
  ['AI engines', 'core', 'Grounded Narrator', 'An LLM layer that can only state what the evidence chain supports, with a signal ID behind every sentence.', 'AI summaries nobody can audit'],
  ['Data & tools', '', 'B2B Deal Radar', 'Watches public tenders, private-5G awards and enterprise RFPs, and predicts the next bids.', 'Enterprise losses discovered at contract signing'],
  ['Data & tools', '', 'Device & Trade-in Tracker', 'Captures device subsidies, trade-in values and financing terms across every brand, every day.', 'Device-led switching you can’t see coming'],
  ['Data & tools', '', 'Retail Pulse', 'Maps store openings, closures, pop-ups and signage changes against your churn hotspots.', 'Rival retail pushes noticed weeks late'],
  ['Data & tools', 'new', 'eSIM Switch-Intent Index', 'Search, app-store and comparison-site signals that show intent to switch before the port-out happens.', 'eSIM makes switching a 4-minute decision'],
  ['Data & tools', 'new', 'Non-Traditional Entrant Watch', 'Tracks cable MVNOs, satellite-to-phone players, and big-tech or fintech eSIM plans that operator league tables miss.', 'Blind spots outside the usual rival set'],
  ['Data & tools', '', 'Tower & Fiber Asset Map', 'Tower sales, fiber builds, sharing deals and site permits that show where rivals will be strong next.', 'Infrastructure moves spotted only after launch'],
  ['Data & tools', 'new', 'Sentiment-to-Revenue Translator', 'Turns social and review sentiment changes into estimated churn and revenue at risk, by district.', 'Social dashboards with no business meaning'],
  ['Data & tools', '', 'Regulatory Early Warning', 'Parses consultations, filings and court dockets, and maps each one to the plans and bands it affects.', 'Rule changes found at the deadline'],
  ['Delivery', 'new', 'Decision Rooms', 'When a critical signal fires, a Slack or Teams room opens with the evidence, simulated options and proposed owners already filled in.', 'Days lost assembling the right people'],
  ['Delivery', '', '3-Minute Audio Brief', 'A spoken morning briefing for each role: what changed, what it means, what to do today.', 'Executives who never open dashboards'],
  ['Delivery', 'new', 'Voice-of-Store Bot', 'Frontline staff report rival offers over WhatsApp. The AI de-duplicates, verifies and scores each reporter’s reliability.', 'Store intel that never reaches HQ'],
  ['Delivery', '', 'Insight API & Webhooks', 'Pushes verified signals into pricing engines, CRM retention flows and network-planning tools.', 'Insights stuck in slides'],
  ['Data & tools', 'new', 'Activist & Capital Radar', 'Tracks PE, infrastructure-fund and hedge-fund moves, peer valuations and PE hold clocks as leading signals of operator strategy shifts.', 'Capital moves that reshape operators, spotted too late'],
  ['Delivery', 'new', 'Alert Rules & Watchlists', 'Team rules such as “Arcline · Pricing · High+” flag matching signals the moment they land, saved for everyone on the page.', 'Important signals buried in the feed'],
  ['Delivery', '', 'One-click Brief Export', 'Exports the current state (signals, predictions, simulations, hotspots, capital moves) as a Markdown brief to share.', 'Hours spent assembling weekly updates'],
  ['Delivery', 'new', 'Cellvoyant AI Assistant', 'An AI agent that runs the platform’s tools on request (simulations, plan comparisons, prediction what-ifs, market sizing), writes briefs and battlecards, and books services into a shared queue. Try it in the console above.', 'Waiting days for an analyst, and services nobody knows how to order'],
  ['Services', 'svc', 'Analyst-on-Demand', 'Telecom analysts verify critical signals within 4 hours and add the context data can’t.', 'High-stakes calls made on unverified data'],
  ['Services', 'svc', 'War-Gaming Sprints', 'Quarterly workshops where your team plays against AI-simulated rivals on real market data.', 'Strategy that is never stress-tested'],
  ['Services', 'svc', 'Launch Readiness Audit', 'Before you launch, simulate how each rival is likely to respond and pre-build your counters.', 'Launches ambushed by predictable responses'],
  ['Services', 'svc', 'Benchmark Consortium', 'Operators contribute KPIs to a privacy-preserving clean room and get peer benchmarks back.', 'No trustworthy peer benchmarks'],
  ['Trust & guardrails', 'core', 'Antitrust Guardrail', 'Lagged, k-anonymous aggregates only, and never forward-looking prices: competitive intelligence without collusion risk.', 'Legal risk that blocks data sharing'],
  ['Trust & guardrails', '', 'Provenance Ledger', 'Every insight keeps a record of the sources, timestamps and reliability scores behind it.', 'Decisions that can’t be audited later'],
  ['Delivery', 'new', 'Department Lens & Signal Routing', 'Routes every signal to the departments that can act on it, re-ranks the console for the chosen department and sets an act-by time from each signal’s half-life.', 'Alerts that reach everyone and are owned by no one'],
  ['Data & tools', 'new', 'Analyst Workbench', 'Peer benchmark of 108 real operators on revenue, valuation, growth, innovation and ownership with CSV export, plus a retention-offer unit-economics calculator.', 'Benchmarks rebuilt by hand in spreadsheets every quarter'],
  ['Services', 'svc', 'Cellvoyant Academy', 'Twelve hands-on workshops, from a signals foundation course to a certified analyst program, for operators, analysts and executives.', 'Tools bought but never adopted by the teams that need them'],
  ['AI engines', 'new', 'Right-Time Engagement Engine', 'Predicts the hour, day and channel each tokenized customer is most likely to engage, from behavioral, transactional and contextual data, and only recommends slots the consent, quiet-hour, cap and cooling-off guardrails allow.', 'Retention and upsell contacts sent at the wrong moment'],
  ['Delivery', 'new', 'Operator Workspace', 'A shared shift board where operators turn signals and contact-queue entries into tasks, move them through the shift and export a handover note.', 'Insights that never become owned actions'],
  ['Delivery', '', 'Resources & Templates Library', 'Templates (signal brief, battlecard, contact policy, handover, model card), playbooks, regulator and data links, and a glossary.', 'Every team reinventing the same documents'],
  ['Data & tools', 'new', 'Source Registry & Refresh Planner', '14 source types, from competitor sites and app stores to central banks, regulators and internal databases, each with a connector, access method, compliance rule and a refresh interval optimized for freshness, reliability and cost.', 'Intelligence scattered across databases, subscriptions and spreadsheets'],
  ['AI engines', 'new', 'Multilingual Intelligence Desk', 'Detects Arabic, English, Chinese and other scripts, scores sentiment, summarizes long reports and links companies to the knowledge base; Claude adds translation and abstractive summaries.', 'Arabic and Chinese content left unread'],
  ['AI engines', 'new', 'Semantic Intelligence Search', 'One search across signals, operators, companies, deals, sources and documents, with terms in different languages mapped to shared concepts, plus emerging-signal detection and linked stories.', 'Historical intelligence nobody can find again'],
  ['Trust & guardrails', 'new', 'Business-Unit Access Control', 'Role and business-unit rules for public, licensed, internal and customer data; search results filtered by access level; licensed credentials kept in a server-side vault.', 'Confidential and licensed data shared too widely'],
  ['Delivery', 'new', 'Operator Desk (etisalat UAE edition)', 'A department for operators: segment marketing plans, a sales playbook, strategy horizons and rival-response playbooks for any of 108 operators, with a deeper, sourced edition for etisalat UAE.', 'Strategy decks that are out of date before they are presented'],
  ['AI engines', 'new', 'Problem-Solving Studio', 'Breaks a big, complex problem into root causes, levers, options, a recommendation, a 90-day plan, KPIs and risks; Claude solves custom problems.', 'Complex problems debated for months without a plan'],
  ['AI engines', 'new', 'Idea Lab', 'Innovative marketing, sales and product ideas on an impact-versus-effort map, with an idea starter and Claude-generated ideas, each one ready to become a task.', 'Good ideas lost in meetings']
];
const LIVE = new Set(['Operator Desk (etisalat UAE edition)', 'Problem-Solving Studio', 'Idea Lab', 'Source Registry & Refresh Planner', 'Multilingual Intelligence Desk', 'Semantic Intelligence Search', 'Business-Unit Access Control', 'Right-Time Engagement Engine', 'Operator Workspace', 'Resources & Templates Library', 'Department Lens & Signal Routing', 'Analyst Workbench', 'Move Predictor', 'Tariff DNA Sequencer', 'Market Digital Twin (War Room)', 'Insight Half-Life Router', 'Churn Contagion Radar', 'Coverage Truth Engine', 'Activist & Capital Radar', 'Alert Rules & Watchlists', 'One-click Brief Export', 'Cellvoyant AI Assistant']);
let labCat = 'All';
const LIVE_EL = { 'Right-Time Engagement Engine': 'rtApp', 'Source Registry & Refresh Planner': 'miApp', 'Multilingual Intelligence Desk': 'miApp', 'Semantic Intelligence Search': 'miApp', 'Business-Unit Access Control': 'miApp' };
const isLive = n => LIVE.has(n) && (!LIVE_EL[n] || !!document.getElementById(LIVE_EL[n]));
function renderLab() {
  if (!$('#labGrid')) return;
  const ln = $('#labLiveN'); if (ln) ln.textContent = LAB.filter(x => isLive(x[2])).length;
  const cats = ['All', 'Live now', ...new Set(LAB.map(x => x[0]))];
  const inCat = (x, c) => c === 'All' || (c === 'Live now' ? isLive(x[2]) : x[0] === c);
  $('#labFilters').innerHTML = cats.map(c => `<button type="button" aria-pressed="${c === labCat}" data-c="${esc(c)}">${esc(c)}<span class="cnt">${LAB.filter(x => inCat(x, c)).length}</span></button>`).join('');
  const BL = { core: '<span class="badge core">Patent core</span>', new: '<span class="badge new">New idea</span>', svc: '<span class="badge svc">Service</span>' };
  $('#labGrid').innerHTML = LAB.filter(x => inCat(x, labCat)).map(([c, b, n, d, s]) => `<article class="inno"><div class="top-l"><span class="cat">${esc(c)}</span><span class="badges">${isLive(n) ? '<span class="badge live">Live in console</span>' : ''}${BL[b] || ''}</span></div><h4>${esc(n)}</h4><p>${esc(d)}</p><div class="solves"><b>Solves:</b> ${esc(s)}</div></article>`).join('');
}
const labF = $('#labFilters'); if (labF) labF.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; labCat = b.dataset.c; renderLab(); });

/* ---------- TAM calculator ---------- */
function initTAM() {
  const root = $('#tamSegs'); if (!root) return;
  root.innerHTML = SEG.map(s => `<div class="seg"><label for="n-${s.k}">${esc(s.l)}</label><output id="o-${s.k}"></output>
    <div class="row"><div><span>Organizations</span><input type="range" id="n-${s.k}" min="0" max="${s.nMax}" step="50" value="${s.n}"></div><div><span>Annual contract ($k)</span><input type="range" id="a-${s.k}" min="5" max="${s.acvMax}" step="1" value="${s.acv}" aria-label="Annual contract value for ${esc(s.l)}"></div></div></div>`).join('');
  const calc = () => {
    let tam = 0;
    SEG.forEach(s => { const n = +$('#n-' + s.k).value, a = +$('#a-' + s.k).value; tam += n * a * 1000; $('#o-' + s.k).textContent = fmtInt(n) + ' × $' + a + 'k'; });
    const samP = +$('#samP').value / 100, somP = +$('#somP').value / 100;
    $('#oSam').textContent = Math.round(samP * 100) + '%'; $('#oSom').textContent = Math.round(somP * 100) + '%';
    const sam = tam * samP, som = sam * somP;
    $('#fTam').textContent = fmtMoney(tam); $('#fSam').textContent = fmtMoney(sam); $('#fSom').textContent = fmtMoney(som);
    $('#barSam').style.width = Math.max(28, samP * 100) + '%'; $('#barSom').style.width = Math.max(22, samP * somP * 100 * 2.2) + '%';
  };
  $$('input', root).concat([$('#samP'), $('#somP')]).forEach(i => i.addEventListener('input', calc));
  calc();
}


/* ---------- COMPETITOR & CAPITAL LANDSCAPE (researched data, live-updating store) ---------- */
let LAND = window.CV_LANDSCAPE || null;
let LAND_META = LAND ? { verifiedAt: LAND.verifiedAt, live: false } : null;
const typeKey = t => { t = String(t || '').toLowerCase(); if (/hedge|activist|crossover/.test(t)) return 'hf'; if (/infra/.test(t)) return 'infra'; if (/private equity|^pe\b|\bpe$|buyout/.test(t)) return 'pe'; if (/state|sovereign|government/.test(t)) return 'state'; if (/vc|venture|growth/.test(t)) return 'vc'; return 'other'; };
const TYPE_LABEL = { pe: 'PE', hf: 'Hedge fund', state: 'State', infra: 'Infra fund', vc: 'VC', other: '' };
const fundBadge = t => { const k = typeKey(t); return `<span class="fund f-${k}">${esc(k === 'other' ? String(t || 'other') : TYPE_LABEL[k])}</span>`; };
const flagsOf = c => { const ks = (c.investors || []).map(i => typeKey(i.t)); return { pe: ks.includes('pe'), hf: ks.includes('hf'), state: ks.includes('state'), infra: ks.includes('infra') }; };
const sizeOf = c => (c.mcap && c.mcap.usd) || (c.val && c.val.usd) || 0;
const showAmt = o => !o ? '' : o.label ? esc(o.label) : o.usd ? fmtMoney(o.usd) : '';
const safeUrl = u => /^https?:\/\//i.test(String(u || '')) ? String(u) : null;
const srcLink = (u, label) => safeUrl(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(label || 'source')}</a>` : '';
const richText = t => esc(t).replace(/&lt;(\/?)b&gt;/g, '<$1b>').replace(/&amp;amp;/g, '&amp;');
const deltaHTML = o => { if (!o || !o.usd || !o.prev) return ''; const p = (o.usd - o.prev) / o.prev * 100; return ` <span class="dl ${p > 0.05 ? 'up' : p < -0.05 ? 'down' : ''}">${p > 0.05 ? '▲' : p < -0.05 ? '▼' : '■'} ${Math.abs(p).toFixed(1)}%</span>`; };
const land = { seg: 'All', q: '', capOnly: false, sortK: 'size', dir: -1, openId: null, dt: 'all', metric: 'mcap' };
function landAgeText() {
  if (!LAND_META || !LAND_META.verifiedAt) return 'verification time unknown';
  const t = Date.parse(LAND_META.verifiedAt); if (!t) return 'verification time unknown';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
  const dt = new Date(t);
  return `verified ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]} ${dt.getUTCFullYear()}, ${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())} UTC · ${d ? d + 'd ' : ''}${pad(h)}h ${pad(m)}m ${pad(ss)}s ago`;
}
function tickLandAge() {
  const txt = landAgeText(), on = !!(LAND_META && LAND_META.live);
  $$('.land-age').forEach(el => { el.textContent = txt; });
  $$('.land-src').forEach(el => { el.textContent = on ? 'Live data store · connected' : 'Bundled snapshot'; el.classList.toggle('on', on); });
}
setInterval(tickLandAge, 1000);
function landDrawTiles() {
  const C = LAND.companies, D = LAND.deals || [], fl = C.map(flagsOf);
  $('#landTiles').innerHTML = [
    [C.length, 'companies profiled: competitors, telecom-intelligence vendors and operators'],
    [fl.filter(f => f.pe || f.infra).length, 'with private-equity or infrastructure-fund ownership or backing'],
    [fl.filter(f => f.hf).length, 'with hedge-fund or crossover-fund investors or activist stakes'],
    [fmtMoney(D.reduce((t, d) => t + (+d.usd || 0), 0)), `disclosed value across ${D.length} tracked PE, infrastructure and hedge-fund deals`]
  ].map(([b, t]) => `<div><b>${b}</b><span>${esc(t)}</span></div>`).join('');
}
function landDrawSegs() {
  const C = LAND.companies, segs = ['All', ...new Set(C.map(c => c.seg))];
  $('#landSegs').innerHTML = segs.map(sg => `<button type="button" aria-pressed="${sg === land.seg}" data-s="${esc(sg)}">${esc(sg)}<span class="cnt">${sg === 'All' ? C.length : C.filter(c => c.seg === sg).length}</span></button>`).join('');
}
function landVal(c, k) { return k === 'name' ? c.name.toLowerCase() : k === 'rev' ? ((c.rev && c.rev.usd) || 0) : k === 'raised' ? ((c.raised && c.raised.usd) || 0) : sizeOf(c); }
function landDrawTable() {
  const C = LAND.companies, q = land.q;
  const rows = C.map(c => ({ c, f: flagsOf(c) })).filter(({ c, f }) => (land.seg === 'All' || c.seg === land.seg) && (!land.capOnly || f.pe || f.hf || f.state || f.infra) && (!q || [c.name, c.hq, c.region, c.own, c.what, (c.investors || []).map(i => i.n).join(' ')].join(' ').toLowerCase().includes(q)))
    .sort((a, b) => { const x = landVal(a.c, land.sortK), y = landVal(b.c, land.sortK); return (x > y ? 1 : x < y ? -1 : 0) * land.dir; });
  const th = (k, l, cls) => `<th class="${cls || ''}"><button type="button" data-k="${k}" aria-sort="${land.sortK === k ? (land.dir > 0 ? 'ascending' : 'descending') : 'none'}">${l}</button></th>`;
  $('#landTable').innerHTML = `<thead><tr>${th('name', 'Company')}<th>Segment</th><th>Ownership</th><th>Key owners / investors</th>${th('size', 'Mkt cap / valuation', 'num')}${th('rev', 'Revenue', 'num')}${th('raised', 'Capital raised', 'num')}</tr></thead><tbody>` +
    rows.map(({ c, f }) => {
      const inv = c.investors || [];
      const badges = [f.pe && fundBadge('PE'), f.infra && fundBadge('infrastructure fund'), f.hf && fundBadge('hedge fund'), f.state && fundBadge('state')].filter(Boolean).join('');
      const sz = showAmt(c.mcap) ? `${showAmt(c.mcap)}${deltaHTML(c.mcap)}<br><span class="tiny muted">mkt cap · ${esc(c.mcap.asOf || '')}</span>` : showAmt(c.val) ? `${showAmt(c.val)}<br><span class="tiny muted">${esc(c.val.short || 'valuation')}${c.val.asOf ? ' · ' + esc(c.val.asOf) : ''}</span>` : '—';
      const rv = showAmt(c.rev) ? `${showAmt(c.rev)}<br><span class="tiny muted">${esc(c.rev.period || '')}${c.rev.note ? ' · ' + esc(c.rev.note) : ''}</span>` : '—';
      const detail = land.openId === c.id ? `<tr class="land-detail"><td colspan="7"><div class="ld"><div>
          <p><b>What they do:</b> ${esc(c.what || '—')}</p>
          <p><b>Overlap with Cellvoyant:</b> ${esc(c.rel || '—')}</p>
          ${c.recent ? `<p><b>2025–26:</b> ${esc(c.recent)}</p>` : ''}
          <p><b>All owners / investors:</b> ${inv.length ? inv.map(i => `${esc(i.n)} ${fundBadge(i.t)}`).join(' ') : '—'}</p></div>
        <div class="figs">
          <div><span>HQ · founded</span><b style="font-weight:500">${esc(c.hq || '—')}${c.founded ? ' · ' + esc(c.founded) : ''}</b></div>
          ${c.ticker ? `<div><span>Ticker</span><b style="font-weight:500">${esc(c.ticker)}</b></div>` : ''}
          ${showAmt(c.mcap) ? `<div><span>Market cap</span><b style="font-weight:500">${showAmt(c.mcap)}${deltaHTML(c.mcap)} (${esc(c.mcap.asOf || '')}${c.mcap.prev ? '; previous check ' + fmtMoney(c.mcap.prev) : ''}) ${srcLink(c.mcap.src)}</b></div>` : ''}
          ${showAmt(c.val) || (c.val && c.val.basis) ? `<div><span>Valuation / deal</span><b style="font-weight:500">${showAmt(c.val) || 'undisclosed'}${c.val.basis ? ' · ' + esc(c.val.basis) : ''}${c.val.asOf ? ' (' + esc(c.val.asOf) + ')' : ''} ${srcLink(c.val.src)}</b></div>` : ''}
          ${showAmt(c.rev) ? `<div><span>Revenue</span><b style="font-weight:500">${showAmt(c.rev)} ${esc(c.rev.period || '')}${c.rev.note ? ' · ' + esc(c.rev.note) : ''} ${srcLink(c.rev.src)}</b></div>` : ''}
          ${c.profit ? `<div><span>Profit</span><b style="font-weight:500">${esc(c.profit)}</b></div>` : ''}
          ${showAmt(c.raised) ? `<div><span>Capital raised</span><b style="font-weight:500">${showAmt(c.raised)}${c.raised.asOf ? ' (' + esc(c.raised.asOf) + ')' : ''} ${srcLink(c.raised.src)}</b></div>` : ''}
          ${c.subs ? `<div><span>Subscribers</span><b style="font-weight:500">${esc(c.subs)}</b></div>` : ''}
          ${c.emp ? `<div><span>Employees</span><b style="font-weight:500">${esc(c.emp)}</b></div>` : ''}
          <div class="srcs">${(c.sources || []).filter(safeUrl).slice(0, 6).map(u => srcLink(u, u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 70))).join('')}</div>
        </div></div></td></tr>` : '';
      return `<tr class="row${land.openId === c.id ? ' open' : ''}" data-id="${esc(c.id)}" tabindex="0" aria-expanded="${land.openId === c.id}"><td class="co"><b>${esc(c.name)}</b><span>${esc(c.hq || '')}${c.region ? ' · ' + esc(c.region) : ''}${c.ticker ? ' · ' + esc(c.ticker) : ''}</span></td><td>${esc(c.seg)}</td><td>${esc(c.own || '—')}<br>${badges}</td><td class="inv-names">${inv.slice(0, 4).map(i => esc(i.n)).join(', ') || '—'}${inv.length > 4 ? ` +${inv.length - 4}` : ''}</td><td class="num">${sz}</td><td class="num">${rv}</td><td class="num">${showAmt(c.raised) || '—'}</td></tr>` + detail;
    }).join('') + '</tbody>';
  $('#landNote').textContent = `${rows.length} of ${C.length} shown. Market caps are point-in-time, in USD (FX: ${LAND.fx || 'approximate'}); ▲▼ shows the change since the previous verification. "—" means not disclosed or not verified.`;
}
function landDrawDeals() {
  const D = LAND.deals || [], types = ['all', ...new Set(D.map(d => typeKey(d.type)))];
  $('#dealTypes').innerHTML = types.map(t => `<button type="button" aria-pressed="${t === land.dt}" data-t="${t}">${t === 'all' ? 'All' : (TYPE_LABEL[t] || 'Other')}<span class="cnt">${t === 'all' ? D.length : D.filter(d => typeKey(d.type) === t).length}</span></button>`).join('');
  $('#dealTable').innerHTML = '<thead><tr><th>Date</th><th>Investor</th><th>Target</th><th>What happened</th><th class="num">Value</th><th>Status</th><th>Source</th></tr></thead><tbody>' +
    D.filter(d => land.dt === 'all' || typeKey(d.type) === land.dt).map(d => `<tr><td class="mono small">${esc(d.date || '')}</td><td><b>${esc(d.investor)}</b><br>${fundBadge(d.type)}</td><td>${esc(d.target)}</td><td>${esc(d.what || '')}</td><td class="num" style="text-align:right;white-space:nowrap">${d.usd ? fmtMoney(+d.usd) : '—'}${d.native ? `<br><span class="tiny muted">${esc(d.native)}</span>` : ''}</td><td class="small">${esc(d.status || '')}</td><td class="small">${srcLink(d.src)}</td></tr>`).join('') + '</tbody>';
}
function landDrawInv() {
  $('#invGrid').innerHTML = (LAND.investors || []).map(v => `<div class="inv"><div>${fundBadge(v.type)}</div><h4>${esc(v.name)}</h4><p>${esc(v.focus || '')}</p>${v.holdings && v.holdings.length ? `<span class="hold"><b>Telecom holdings:</b> ${esc(v.holdings.join(', '))}</span>` : ''}${v.aum ? `<span class="hold"><b>AUM:</b> ${esc(v.aum)}</span>` : ''}</div>`).join('');
  $('#landTake').innerHTML = (LAND.takeaways || []).map(t => `<li>${richText(t)}</li>`).join('');
}
/* capital radar (console tab) — same researched data */
const HOLDS = [['Opensignal', 'Berkshire Partners', 2021.7], ['Analysys Mason', 'Bridgepoint', 2022.5], ['TechInsights', 'Oakley Capital / CVC', 2022.5], ['Valona Intelligence', 'Monterro', 2022.5], ['Meltwater', 'Marlin / Altor', 2023.6]];
function valuationRows(metric) {
  return LAND.companies.filter(c => c.seg === 'Operator' || /^Tower/.test(c.seg)).map(c => {
    const mc = c.mcap && c.mcap.usd, rv = c.rev && c.rev.usd;
    return { c, v: metric === 'mcap' ? mc : metric === 'rev' ? rv : (mc && rv ? mc / rv : null) };
  }).filter(o => o.v).sort((a, b) => b.v - a.v);
}
function renderCapital() {
  const svg = $('#capChart'); if (!svg || !LAND) return;
  const rows = valuationRows(land.metric), W = 640, rh = 24, L = 178, R = 96, H = rows.length * rh + 8;
  const mx = Math.max(...rows.map(r => r.v), 1);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const fmtV = v => land.metric === 'mult' ? v.toFixed(1) + '×' : fmtMoney(v);
  svg.innerHTML = rows.map((r, i) => {
    const f = flagsOf(r.c), y = i * rh + 4, w = Math.max(2, (W - L - R) * r.v / mx);
    const col = f.state ? 'var(--accent)' : (f.pe || f.hf || f.infra) ? 'var(--signal)' : 'var(--line-strong)';
    const d = land.metric === 'mcap' && r.c.mcap && r.c.mcap.prev ? (r.c.mcap.usd - r.c.mcap.prev) / r.c.mcap.prev * 100 : null;
    return `<g class="cap-row" data-id="${esc(r.c.id)}"><title>${esc(r.c.name)}: ${fmtV(r.v)}</title>
      <text x="${L - 8}" y="${y + 15}" text-anchor="end" style="font:12px var(--f-body);fill:var(--ink-2)">${esc(r.c.name.length > 26 ? r.c.name.slice(0, 25) + '…' : r.c.name)}</text>
      <rect x="${L}" y="${y + 4}" width="${w.toFixed(1)}" height="${rh - 9}" rx="3" style="fill:${col}"/>
      <text x="${(L + w + 6).toFixed(1)}" y="${y + 15}" style="font:600 11.5px var(--f-mono);fill:var(--ink)">${fmtV(r.v)}${d != null ? `<tspan style="font-weight:400;fill:${d > 0.05 ? 'var(--good)' : d < -0.05 ? 'var(--crit)' : 'var(--muted)'}"> ${d > 0.05 ? '▲' : d < -0.05 ? '▼' : '■'}${Math.abs(d).toFixed(1)}%</tspan>` : ''}</text></g>`;
  }).join('');
  $$('#capMetric button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === land.metric)));
  const D = LAND.deals || [];
  $('#capActivist').innerHTML = D.filter(d => typeKey(d.type) === 'hf').slice(0, 6).map(d => `<div class="cap-item"><span class="mono tiny muted">${esc(d.date || '')} · ${esc(d.status || '')}</span><b>${esc(d.investor)} → ${esc(d.target)}</b><span class="small">${esc(d.what || '')}</span>${srcLink(d.src)}</div>`).join('') || '<p class="small muted" style="padding:12px">No activist events in the data.</p>';
  $('#capMoves').innerHTML = D.filter(d => typeKey(d.type) !== 'hf').slice(0, 6).map(d => `<div class="cap-item"><span class="mono tiny muted">${esc(d.date || '')} · ${esc(d.status || '')}</span><b>${esc(d.investor)} → ${esc(d.target)}${d.usd ? ' · ' + fmtMoney(+d.usd) : ''}</b><span class="small">${esc(d.what || '')}</span>${srcLink(d.src)}</div>`).join('');
  const now = new Date(), yr = now.getFullYear() + now.getMonth() / 12;
  $('#capHold').innerHTML = HOLDS.map(([n, o, y]) => { const held = yr - y; return `<div class="hold-row"><div class="hd"><b>${esc(n)}</b><span class="mono tiny">${held.toFixed(1)} yrs · ${esc(o)}</span></div><div class="hold-track"><i class="band"></i><i class="bar" style="width:${Math.min(100, held / 7 * 100).toFixed(1)}%"></i></div></div>`; }).join('') + '<p class="tiny muted" style="margin:8px 12px 12px">Shaded band: the 4–6-year window in which PE owners typically sell (our inference, not a sourced forecast).</p>';
}
function landRender() { if (!LAND) return; landDrawTiles(); landDrawSegs(); landDrawTable(); landDrawDeals(); landDrawInv(); renderCapital(); tickLandAge(); if (POS && $('#posTable') && $('#posTable').dataset.ready) posRender(); }
function initLandscape() {
  if (!$('#landscape')) return;
  if (!LAND) { $('#landTable').innerHTML = '<tbody><tr><td>Landscape data is unavailable.</td></tr></tbody>'; return; }
  $('#landSegs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; land.seg = b.dataset.s; landDrawSegs(); landDrawTable(); });
  $('#landQ').addEventListener('input', e => { land.q = e.target.value.trim().toLowerCase(); landDrawTable(); });
  $('#landCap').addEventListener('change', e => { land.capOnly = e.target.checked; landDrawTable(); });
  $('#landTable').addEventListener('click', e => {
    const s = e.target.closest('th button'); if (s) { const k = s.dataset.k; if (land.sortK === k) land.dir = -land.dir; else { land.sortK = k; land.dir = k === 'name' ? 1 : -1; } landDrawTable(); return; }
    if (e.target.closest('a')) return;
    const r = e.target.closest('tr.row'); if (!r) return; land.openId = land.openId === r.dataset.id ? null : r.dataset.id; landDrawTable();
  });
  $('#landTable').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr.row')) { e.preventDefault(); const id = e.target.dataset.id; land.openId = land.openId === id ? null : id; landDrawTable(); const n = $(`tr.row[data-id="${id}"]`, $('#landTable')); if (n) n.focus(); } });
  $('#dealTypes').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; land.dt = b.dataset.t; landDrawDeals(); });
  $('#capMetric').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; land.metric = b.dataset.m; renderCapital(); });
  $('#capChart').addEventListener('click', e => { const g = e.target.closest('.cap-row'); if (!g) return; land.openId = g.dataset.id; land.seg = 'All'; land.q = ''; $('#landQ').value = ''; landDrawSegs(); landDrawTable(); const n = $(`tr.row[data-id="${g.dataset.id}"]`, $('#landTable')); if (n) { n.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'center' }); n.focus({ preventScroll: true }); } });
  landRender();
  (window.claude && typeof window.claude.use === 'function' ? window.claude.use('db').catch(() => null) : Promise.resolve(null)).then(d => {
    if (!d) return;
    d.doc('live/landscape').onSnapshot(snap => {
      if (!snap.exists) return;
      const v = snap.data();
      if (!v || !v.data || !Array.isArray(v.data.companies)) return;
      const first = !(LAND_META && LAND_META.live);
      LAND = v.data; LAND_META = { verifiedAt: v.verifiedAt || v.data.verifiedAt, live: true };
      landRender();
      if (!first) toast('Market and landscape data updated live');
    }, () => {});
  });
}

/* ---------- POSITIONING: biggest competitors & quadrants (competitors + operators by region) ---------- */
const POS = window.CV_POS || null;
const POSM = {
  vendors: {
    xl: 'Telecom depth', yl: 'Predictive & real-time', home: 'Predictive telecom specialists',
    quad: (x, y) => x >= 50 ? (y >= 50 ? 'Predictive telecom specialists' : 'Deep but periodic') : (y >= 50 ? 'Fast generalists' : 'General research & media'),
    corners: ['Fast generalists', 'Predictive telecom specialists', 'General research & media', 'Deep but periodic'],
    qd: { 'Predictive telecom specialists': 'Telecom-native and real-time: the corner Cellvoyant is built for.', 'Fast generalists': 'Real-time and AI-driven, but built for every industry, so they lack telecom data and semantics.', 'Deep but periodic': 'Deep telecom knowledge, delivered as reports, databases or single-source data, with little prediction.', 'General research & media': 'Broad research or media monitoring with neither telecom depth nor predictive alerts.' },
    cls: { c1: 'Public or corporate-owned', c2: 'Private equity or hedge fund money', c3: 'VC-backed, independent or association' }
  },
  ops: {
    xl: 'Scale & market strength', yl: 'Growth & innovation momentum', home: 'Scale leaders',
    quad: (x, y) => x >= 50 ? (y >= 50 ? 'Scale leaders' : 'Defending incumbents') : (y >= 50 ? 'Fast challengers' : 'Under pressure'),
    corners: ['Fast challengers', 'Scale leaders', 'Under pressure', 'Defending incumbents'],
    qd: { 'Scale leaders': 'Large and strong at home, and still growing and innovating.', 'Fast challengers': 'Smaller or weaker at home, but growing fast or innovating quickly.', 'Defending incumbents': 'Large and strong at home, but growth and innovation are slowing.', 'Under pressure': 'Smaller and slower: the most exposed to price wars, consolidation or takeover.' },
    cls: { c1: 'Listed, strategic or family-controlled', c2: 'Private equity, infrastructure fund or hedge fund involved', c3: 'State or sovereign-fund controlled' }
  }
};
const INNOV = [['fiveG_SA', '5G standalone'], ['fwa', 'Fixed wireless'], ['fiber', 'Fiber'], ['satellite_d2d', 'Satellite-to-phone'], ['fintech', 'Fintech / wallet'], ['ai', 'AI products'], ['cloud_dc', 'Cloud / data centers']];
const REG_ORDER = ['Gulf (GCC)', 'Middle East', 'Asia-Pacific', 'Europe', 'Africa', 'Americas', 'International group'];
const posS = { map: EDITION === 'eand' ? 'ops' : 'vendors', region: 'Gulf (GCC)', seg: 'all', cls: 'all', sel: { vendors: null, ops: null }, sortK: { vendors: 'threat', ops: 'rev' }, dir: { vendors: -1, ops: -1 } };
const landById = id => (LAND && id) ? LAND.companies.find(c => c.id === id) || null : null;
function posItem(v, kind) {
  const L = landById(v.landId || v.id);
  const investors = (v.holders && v.holders.length ? v.holders : null) || (L ? L.investors : null) || v.investors || [];
  const f = flagsOf({ investors });
  const own = v.own || (L && L.own) || '';
  let cls;
  if (v.seg === 'self') cls = 'self';
  else if (kind === 'vendors') cls = (f.pe || f.hf || f.infra || /PE-owned|private equity/i.test(own)) ? 'c2' : (/public|listed|subsidiary|corporate|division/i.test(own) && !/industry body|association/i.test(own)) ? 'c1' : 'c3';
  else cls = (f.pe || f.hf || f.infra) ? 'c2' : f.state ? 'c3' : 'c1';
  const mcap = (L && L.mcap) || v.mcap || null, rev = (L && L.rev) || v.rev || null, val = (L && L.val) || null;
  return Object.assign({}, v, { kind, L, investors, f: { pe: f.pe || /PE-owned/i.test(own), hf: f.hf, state: f.state, infra: f.infra }, own: own || (L ? L.own : ''), cls, mcap, rev, val,
    name: v.name || (L && L.name) || v.id, hq: v.hq || (L && L.hq) || v.country || '', ticker: v.ticker || (L && L.ticker) || '' });
}
function posItems(kind) {
  if (!POS) return [];
  return kind === 'vendors' ? (POS.vendors || []).map(v => posItem(v, 'vendors')) : (POS.operators || []).map(o => posItem(o, 'ops'));
}
const posVisible = (c, k) => c.seg === 'self' || (k === 'vendors' ? ((posS.seg === 'all' || c.seg === posS.seg) && (posS.cls === 'all' || c.cls === posS.cls)) : ((posS.region === 'All regions' || c.region === posS.region) && (posS.cls === 'all' || c.cls === posS.cls)));
const revOf = c => (c.rev && c.rev.usd) || 0, mcapOf = c => (c.mcap && c.mcap.usd) || (c.val && c.val.usd) || 0;
const pct = v => v == null || isNaN(v) ? '—' : (v > 0 ? '+' : '') + (+v).toFixed(1) + '%';
const innovCount = c => INNOV.filter(([k]) => c.innov && c.innov[k] && c.innov[k][0] === true).length;
function posBadges(c) { return [c.f.pe && fundBadge('PE'), c.f.infra && fundBadge('infrastructure fund'), c.f.hf && fundBadge('hedge fund'), c.f.state && fundBadge('state')].filter(Boolean).join(''); }

function posDrawTabs() {
  $$('#posTabs [data-map]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.map === posS.map)));
  $('#posTV').textContent = (POS.vendors || []).length - 1; $('#posTO').textContent = (POS.operators || []).length;
}
function posDrawSummary(items) {
  const k = posS.map, rv = items.filter(c => c.seg !== 'self');
  const vis = k === 'ops' ? rv.filter(c => posS.region === 'All regions' || c.region === posS.region) : rv;
  const tiles = k === 'vendors' ? [
    [rv.length, 'competitors placed: telecom-native data, horizontal CI and adjacent analytics'],
    [rv.filter(c => c.f.pe).length, 'have private-equity owners or backers, now or in the past'],
    [rv.filter(c => c.f.hf).length, 'have hedge-fund, crossover or activist investors'],
    [rv.filter(c => POSM.vendors.quad(c.x, c.y) === 'Predictive telecom specialists').length, 'sit in Cellvoyant’s target corner (predictive telecom specialists)'],
    [rv.filter(c => c.threat >= 60).length, 'are serious threats (score 60+ out of 100)']
  ] : [
    [vis.length, `operators placed in ${posS.region === 'All regions' ? 'all regions' : posS.region}`],
    [vis.filter(c => c.f.state).length, 'are state or sovereign-fund controlled or backed'],
    [vis.filter(c => c.f.pe || c.f.infra).length, 'have private-equity or infrastructure-fund involvement'],
    [vis.filter(c => c.f.hf).length, 'have hedge-fund or activist investors'],
    [fmtMoney(vis.reduce((t, c) => t + revOf(c), 0)), 'combined annual revenue (latest year, USD)']
  ];
  $('#posSum').innerHTML = tiles.map(([b, t]) => `<div><b>${esc(b)}</b><span>${esc(t)}</span></div>`).join('');
}
function posDrawTop(items) {
  const k = posS.map, M = POSM[k];
  let list, title;
  if (k === 'vendors') { list = items.filter(c => c.seg !== 'self').sort((a, b) => b.threat - a.threat).slice(0, 6); title = 'The biggest competitors to Cellvoyant, ranked by threat'; }
  else { list = items.filter(c => posVisible(c, k) && c.seg !== 'self').sort((a, b) => revOf(b) - revOf(a)).slice(0, 6); title = `The biggest operators in ${posS.region === 'All regions' ? 'the world (in this dataset)' : posS.region}, by revenue`; }
  $('#posTopTitle').textContent = title;
  const mx = Math.max(...list.map(c => k === 'vendors' ? c.threat : revOf(c)), 1);
  $('#posTop').innerHTML = list.map((c, i) => {
    const v = k === 'vendors' ? c.threat : revOf(c);
    const sub = k === 'vendors' ? c.why : `${M.quad(c.x, c.y)} · growth ${pct(c.growth && c.growth.v)} · competes with ${(c.rivals || []).slice(0, 3).join(', ') || '—'}`;
    return `<button type="button" class="threat" data-id="${esc(c.id)}">
      <span class="rk mono">${i + 1}</span>
      <span class="tn"><b>${esc(k === 'vendors' ? c.name : (c.short || c.name))}</b><span class="tiny muted">${esc(k === 'vendors' ? M.quad(c.x, c.y) + ' · ' + (c.own || '') : [c.country, (c.investors || []).filter(v => v.t !== 'public float').slice(0, 2).map(v => v.n + (v.pct != null && v.pct !== '' ? ' ' + String(v.pct).replace('%', '') + '%' : '')).join(', ')].filter(Boolean).join(' · '))}</span></span>
      <span class="tb" aria-hidden="true"><i style="width:${(v / mx * 100).toFixed(1)}%;${k === 'ops' ? 'background:var(--accent)' : ''}"></i></span>
      <span class="ts mono">${k === 'vendors' ? c.threat : fmtMoney(v)}</span>
      <span class="tw small">${esc(sub || '')}</span></button>`;
  }).join('') || '<p class="small muted">No companies match this filter.</p>';
}
function posDrawFilters(items) {
  const k = posS.map, M = POSM[k];
  const first = k === 'vendors'
    ? [['all', 'All segments'], ['telecom', 'Telecom-native'], ['horizontal', 'Horizontal CI'], ['adjacent', 'Adjacent']].map(([v, l]) => `<button type="button" data-seg="${v}" aria-pressed="${posS.seg === v}">${l}<span class="cnt">${items.filter(c => c.seg !== 'self' && (v === 'all' || c.seg === v)).length}</span></button>`).join('')
    : ['All regions', ...REG_ORDER].filter(r => r === 'All regions' || items.some(c => c.region === r)).map(r => `<button type="button" data-reg="${esc(r)}" aria-pressed="${posS.region === r}">${esc(r)}<span class="cnt">${r === 'All regions' ? items.length : items.filter(c => c.region === r).length}</span></button>`).join('');
  const clsB = [['all', 'All owners'], ...Object.entries(M.cls)].map(([v, l]) => `<button type="button" data-cls="${v}" aria-pressed="${posS.cls === v}">${v !== 'all' ? `<i class="sw sw-${v}" aria-hidden="true"></i>` : ''}${esc(l)}</button>`).join('');
  $('#posFilters').innerHTML = `<div class="filters" role="group" aria-label="${k === 'vendors' ? 'Segment' : 'Region'}">${first}</div><div class="filters" role="group" aria-label="Ownership">${clsB}</div>`;
}
const PW = 680, PH = 560, PL = 48, PR = 14, PT = 18, PB = 46;
const psx = v => PL + (PW - PL - PR) * v / 100, psy = v => PT + (PH - PT - PB) * (1 - v / 100);
function posMark(c, r) {
  const x = psx(c.x), y = psy(c.y);
  if (c.cls === 'self') { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .5 : r * 1.25; p.push((x + Math.cos(a) * rr).toFixed(1) + ',' + (y + Math.sin(a) * rr).toFixed(1)); } return `<polygon class="mk mk-self" points="${p.join(' ')}"/>`; }
  if (c.cls === 'c2') return `<rect class="mk mk-c2" x="${(x - r * .9).toFixed(1)}" y="${(y - r * .9).toFixed(1)}" width="${(r * 1.8).toFixed(1)}" height="${(r * 1.8).toFixed(1)}" rx="2"/>`;
  if (c.cls === 'c3') return `<polygon class="mk mk-c3" points="${x},${(y - r * 1.15).toFixed(1)} ${(x + r * 1.05).toFixed(1)},${(y + r * .8).toFixed(1)} ${(x - r * 1.05).toFixed(1)},${(y + r * .8).toFixed(1)}"/>`;
  return `<circle class="mk mk-c1" cx="${x}" cy="${y}" r="${r}"/>`;
}
function posPlaceLabels(list, selId) {
  const placed = [], dots = list.map(c => ({ x: psx(c.x) - 8, y: psy(c.y) - 8, w: 16, h: 16 }));
  const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const order = list.map((c, i) => i).sort((i, j) => (list[j].id === selId) - (list[i].id === selId) || (list[j].cls === 'self') - (list[i].cls === 'self') || (posS.map === 'vendors' ? list[j].threat - list[i].threat : revOf(list[j]) - revOf(list[i])));
  const out = new Array(list.length).fill(null);
  for (const i of order) {
    const c = list[i], x = psx(c.x), y = psy(c.y), t = c.short || c.name, w = t.length * (c.cls === 'self' ? 7.6 : 6.3) + 4, h = 14;
    const cx = v => clamp(v, 2, PW - 2 - w);
    const cands = [[x + 11, y - 7, 'start'], [x - 11 - w, y - 7, 'end'], [cx(x - w / 2), y - 24, 'middle'], [cx(x - w / 2), y + 10, 'middle'], [cx(x - w + 8), y - 24, 'middle'], [cx(x - w + 8), y + 10, 'middle'], [cx(x - 8), y - 24, 'middle'], [cx(x - 8), y + 10, 'middle']];
    for (const [bx, by, a] of cands) {
      const b = { x: bx, y: by, w, h };
      if (bx < 2 || bx + w > PW - 2 || by < 2 || by + h > PH - PB) continue;
      if (placed.some(o => hit(o, b)) || dots.some((d, j) => j !== i && hit(d, b))) continue;
      placed.push(b); out[i] = { x: a === 'start' ? bx + 2 : a === 'end' ? bx + w - 2 : bx + w / 2, y: by + 11, a }; break;
    }
  }
  return out;
}
function posDrawChart(items) {
  const k = posS.map, M = POSM[k], sel = posS.sel[k];
  const list = items.filter(c => posVisible(c, k));
  let g = `<rect class="q-bg" x="${psx(50)}" y="${psy(100)}" width="${psx(100) - psx(50)}" height="${psy(50) - psy(100)}"/>`;
  for (let v = 0; v <= 100; v += 25) g += `<line class="grid" x1="${psx(0)}" x2="${psx(100)}" y1="${psy(v)}" y2="${psy(v)}"/><line class="grid" x1="${psx(v)}" x2="${psx(v)}" y1="${psy(0)}" y2="${psy(100)}"/>`;
  g += `<line class="mid" x1="${psx(50)}" x2="${psx(50)}" y1="${psy(0)}" y2="${psy(100)}"/><line class="mid" x1="${psx(0)}" x2="${psx(100)}" y1="${psy(50)}" y2="${psy(50)}"/>`;
  const [tl, tr, bl, br] = M.corners;
  g += `<text class="ql" x="${psx(1.5)}" y="${psy(97)}">${esc(tl)}</text><text class="ql ql-us" x="${psx(98.5)}" y="${psy(97)}" text-anchor="end">${esc(tr)}</text><text class="ql" x="${psx(1.5)}" y="${psy(2)}">${esc(bl)}</text><text class="ql" x="${psx(98.5)}" y="${psy(2)}" text-anchor="end">${esc(br)}</text>`;
  g += `<text class="ax" x="${psx(50)}" y="${PH - 12}" text-anchor="middle">${esc(M.xl)} →</text><text class="ax" transform="translate(16 ${psy(50)}) rotate(-90)" text-anchor="middle">${esc(M.yl)} →</text>`;
  const labels = posPlaceLabels(list, sel);
  const ord = list.map((c, i) => i).sort((i, j) => (list[i].id === sel) - (list[j].id === sel));
  for (const i of ord) {
    const c = list[i], on = c.id === sel, r = c.cls === 'self' ? 9 : 7, L = labels[i];
    g += `<g class="pt${on ? ' on' : ''}${c.cls === 'self' ? ' self' : ''}" data-id="${esc(c.id)}" tabindex="0" role="button" aria-label="${esc(c.name)}: ${esc(M.quad(c.x, c.y))}">
      <circle class="hit" cx="${psx(c.x)}" cy="${psy(c.y)}" r="15"/>${on ? `<circle class="halo" cx="${psx(c.x)}" cy="${psy(c.y)}" r="${r + 7}"/>` : ''}${posMark(c, r)}
      ${L ? `<text class="pl" x="${L.x.toFixed(1)}" y="${L.y.toFixed(1)}" text-anchor="${L.a}">${esc(c.short || c.name)}</text>` : ''}</g>`;
  }
  $('#posChart').innerHTML = g;
  $('#posChart').setAttribute('aria-label', `${k === 'vendors' ? 'Competitor' : 'Operator'} positioning quadrant: ${list.length} companies`);
  const hidden = labels.filter(l => !l).length;
  $('#posLegend').innerHTML = Object.entries(M.cls).map(([v, l]) => `<span><i class="sw sw-${v}" aria-hidden="true"></i>${esc(l)}</span>`).join('') + (k === 'vendors' ? '<span><i class="star" aria-hidden="true"></i>Cellvoyant</span>' : '') + (hidden ? `<span class="muted">${hidden} label${hidden > 1 ? 's' : ''} hidden to avoid overlap: hover or use the table</span>` : '');
  $('#posMethod').textContent = k === 'vendors'
    ? 'Positions and threat scores are Cellvoyant’s assessment. Telecom depth = telecom-specific data and models; predictive & real-time = alert cadence and forecasting. Owners, investors and financials come from the sourced landscape data.'
    : 'Scale & market strength = 60% revenue scale (log scale, $0.3B → $125B) + 40% home-market mobile share where a source gives one. Growth & innovation = 50% latest revenue growth (−5% → +15%, local currency) + 50% innovation checklist (5G standalone, fixed wireless, fiber, satellite-to-phone, fintech, AI, cloud/data centers). Recommendations are analyst assessments.';
}
const posTip = () => $('#posTip');
function posShowTip(id, target) {
  const c = posItems(posS.map).find(x => x.id === id); if (!c) return; const M = POSM[posS.map], t = posTip();
  t.innerHTML = `<b>${esc(c.name)}</b><span>${esc(M.quad(c.x, c.y))}</span><span>${esc(c.own || '')}${c.f.pe ? ' · PE' : ''}${c.f.hf ? ' · hedge fund' : ''}${c.f.state ? ' · state' : ''}</span>${posS.map === 'vendors' ? (c.cls !== 'self' ? `<span>Threat to Cellvoyant: ${c.threat}/100</span>` : '') : `<span>Revenue ${revOf(c) ? fmtMoney(revOf(c)) : '—'} · growth ${pct(c.growth && c.growth.v)}</span>`}`;
  t.hidden = false;
  const box = $('#posChartBox').getBoundingClientRect(), pt = target.getBoundingClientRect();
  let left = pt.left - box.left + pt.width / 2 + 14, top = pt.top - box.top - 8;
  if (left > box.width - 230) left = pt.left - box.left - 236;
  t.style.left = Math.max(4, left) + 'px'; t.style.top = Math.max(4, top) + 'px';
}
function posDrawProfile(items) {
  const k = posS.map, M = POSM[k];
  const c = items.find(x => x.id === posS.sel[k]); if (!c) { $('#posProfile').innerHTML = '<p class="small muted">Choose a company on the map.</p>'; return; }
  const q = M.quad(c.x, c.y), home = q === M.home;
  const li = a => (a || []).map(x => `<li>${esc(x)}</li>`).join('');
  const inv = (c.investors || []).map(v => `<li>${fundBadge(v.t)} <b>${esc(v.n)}</b>${v.pct != null && v.pct !== '' ? ` · ${esc(v.pct)}${/%/.test(String(v.pct)) ? '' : '%'}` : ''}${v.r ? ' · ' + esc(v.r) : ''}${v.y ? ' (' + esc(v.y) + ')' : ''}${v.u ? ' ' + srcLink(v.u) : ''}</li>`).join('');
  const all = items;
  const riv = (c.rivals || []).map(r => { const lr = String(r).toLowerCase(); const m = all.find(x => x.id !== c.id && (x.name.toLowerCase() === lr || (x.short || '').toLowerCase() === lr || (lr.length > 3 && x.name.toLowerCase().startsWith(lr.split(' (')[0])) || (x.L && x.L.name.toLowerCase() === lr))); return m ? `<button type="button" class="chip hl" data-id="${esc(m.id)}">${esc(r)}</button>` : `<span class="chip">${esc(r)}</span>`; }).join('');
  const figs = [];
  if (c.mcap && c.mcap.usd) figs.push(`<div><span>Market cap</span><b>${fmtMoney(c.mcap.usd)}${deltaHTML(c.mcap)} <span class="tiny muted">${esc(c.mcap.asOf || '')}</span> ${srcLink(c.mcap.src)}</b></div>`);
  else if (c.val && (c.val.usd || c.val.basis)) figs.push(`<div><span>Valuation / deal</span><b>${c.val.usd ? fmtMoney(c.val.usd) : 'undisclosed'} <span class="tiny muted">${esc(c.val.short || c.val.basis || '')}</span> ${srcLink(c.val.src)}</b></div>`);
  if (c.rev && (c.rev.usd || c.rev.label)) figs.push(`<div><span>Revenue</span><b>${c.rev.usd ? fmtMoney(c.rev.usd) : esc(c.rev.label)} <span class="tiny muted">${esc(c.rev.period || '')}</span> ${srcLink(c.rev.src)}</b></div>`);
  if (c.growth && c.growth.v != null) figs.push(`<div><span>Revenue growth</span><b>${pct(c.growth.v)} <span class="tiny muted">${esc(c.growth.period || '')}</span> ${srcLink(c.growth.src)}</b></div>`);
  if (c.subs && c.subs.v) figs.push(`<div><span>Mobile subscribers</span><b>${esc(c.subs.v)} <span class="tiny muted">${esc(c.subs.asOf || '')}</span></b></div>`);
  if (c.share && c.share.v != null) figs.push(`<div><span>Home-market share</span><b>${esc(c.share.v)}% <span class="tiny muted">${esc(c.share.basis || '')}</span> ${srcLink(c.share.src)}</b></div>`);
  (c.scale || []).forEach(s => figs.push(`<div><span>Scale</span><b>${esc(s)}</b></div>`));
  const innov = k === 'ops' && c.innov ? `<div><span class="label">Innovation checklist · ${innovCount(c)}/7</span><div class="innov">${INNOV.map(([key, l]) => { const v = c.innov[key] || [null, '']; return `<span class="iv ${v[0] === true ? 'yes' : v[0] === false ? 'no' : 'unk'}" title="${esc(v[1] || 'not found')}">${v[0] === true ? '✓' : v[0] === false ? '✗' : '?'} ${esc(l)}</span>`; }).join('')}</div></div>` : '';
  const sc = k === 'ops' && c.sc ? `<span class="tiny mono muted">scale ${c.sc.scale} · home share ${c.sc.share == null ? 'n/a' : c.sc.share} · growth ${c.sc.growth == null ? 'n/a' : c.sc.growth} · innovation ${c.sc.innov}</span>` : '';
  $('#posProfile').innerHTML = `
    <label class="sr" for="posPick">Choose a company</label>
    <select id="posPick">${[...items].sort((a, b) => a.name.localeCompare(b.name)).map(x => `<option value="${esc(x.id)}"${x.id === c.id ? ' selected' : ''}>${esc(x.name)}${x.cls === 'self' ? ' (us)' : ''}${k === 'ops' ? ' · ' + esc(x.region || '') : ''}</option>`).join('')}</select>
    <div class="cxp-head"><h3>${esc(c.name)}</h3><span class="small muted">${esc(k === 'ops' ? [c.region, c.country, c.footprint && c.footprint !== c.country ? 'footprint: ' + String(c.footprint).replace(/,(?=\S)/g, ', ') : ''].filter(Boolean).join(' · ') : ({ telecom: 'Telecom-native data', horizontal: 'Horizontal CI', adjacent: 'Adjacent', self: 'Cellvoyant' }[c.seg] || '') + (c.hq ? ' · ' + c.hq : ''))}${c.ticker ? ' · ' + esc(c.ticker) : ''}${c.founded ? ' · founded ' + esc(c.founded) : ''}</span></div>
    <div class="cxp-quad${home ? ' q-us' : ''}"><span class="label">Quadrant</span><b>${esc(q)}</b><span class="small">${esc(M.qd[q])}</span><span class="tiny mono muted">${esc(M.xl.toLowerCase())} ${c.x}/100 · ${esc(M.yl.toLowerCase())} ${c.y}/100</span>${sc}${c.judged ? `<span class="tiny warn">${esc(c.judged)}</span>` : ''}</div>
    <div class="cxp-own"><span class="label">Owners &amp; money</span>${posBadges(c) ? `<div class="badges">${posBadges(c)}</div>` : ''}<p class="small">${esc(c.own && c.own !== 'listed' ? c.own : c.ticker ? 'Listed (' + c.ticker + ')' : c.own || '—')}</p>${c.group && c.group !== c.name ? `<p class="small muted">Group: ${esc(c.group)}</p>` : ''}${inv ? `<ul class="cx-inv">${inv}</ul>` : '<p class="small muted">No outside investors found.</p>'}</div>
    ${figs.length ? `<div class="cx-figs">${figs.join('')}</div>` : ''}
    ${innov}
    ${c.telecom || (c.L && c.L.what) ? `<div><span class="label">What they do</span><p class="small">${esc(c.telecom || c.L.what)}</p></div>` : ''}
    <div class="cxp-two"><div><span class="label">Strengths</span><ul class="cxl">${li(c.strengths)}</ul></div><div><span class="label">${k === 'ops' ? 'Weaknesses' : 'Gaps'}</span><ul class="cxl">${li(c.gaps || c.weaknesses)}</ul></div></div>
    <div class="cxp-act"><span class="label">What to improve</span><ul class="cxl">${li(c.improve)}</ul></div>
    <div class="cxp-act win"><span class="label">How to succeed${home ? '' : ' (and move toward the top-right)'}</span><ul class="cxl">${li(c.win)}</ul></div>
    <div><span class="label">Their competitors</span><div class="chips" style="margin-top:6px">${riv || '<span class="small muted">—</span>'}</div></div>
    ${k === 'vendors' && c.cls !== 'self' ? `<div class="cxp-threat"><span class="label">Threat to Cellvoyant · ${c.threat}/100</span><p class="small">${esc(c.why || '')}</p><p class="small"><b>How Cellvoyant wins:</b> ${esc(c.beat || '')}</p></div>` : ''}
    ${k === 'ops' ? `<div class="cxp-threat cv"><span class="label">How Cellvoyant helps ${esc(c.short || c.name)}</span><p class="small">${esc(cvHelp(c, q))}</p></div>` : ''}
    ${c.moves && c.moves.length ? `<div><span class="label">Recent moves</span><ul class="cxl moves">${c.moves.map(m => `<li><span class="mono tiny">${esc(m[0])}</span> ${esc(m[1])}</li>`).join('')}</ul></div>` : (c.L && c.L.recent ? `<div><span class="label">Recent</span><p class="small">${esc(c.L.recent)}</p></div>` : '')}
    ${(c.src && c.src.length) || (c.L && c.L.sources && c.L.sources.length) ? `<div><span class="label">Sources</span><ul class="cxl src-l">${(c.src || []).map(s => `<li>${srcLink(s[0], s[1] || s[0].replace(/^https?:\/\/(www\.)?/, '').slice(0, 60))}</li>`).join('')}${(c.L && c.L.sources || []).filter(safeUrl).slice(0, 4).map(u => `<li>${srcLink(u, u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60))}</li>`).join('')}</ul></div>` : ''}
    ${c.unverified && c.unverified.length ? `<p class="tiny muted">Unverified: ${esc(c.unverified.join('; '))}</p>` : ''}`;
  $('#posPick').onchange = e => posSelect(e.target.value, false);
}
function cvHelp(c, q) {
  const r = (c.rivals || []).slice(0, 2).join(' and ') || 'its rivals';
  if (q === 'Scale leaders') return `Protect the lead: watch ${r} for pricing and launch moves 30–90 days early, and stress-test every response in the war room before matching anything.`;
  if (q === 'Fast challengers') return `Pick the fights you can win: the Move Predictor flags where ${r} are slow to respond, and Tariff DNA shows where your plans already beat theirs.`;
  if (q === 'Defending incumbents') return `Spot erosion before it shows in results: churn contagion and switch-intent signals show where ${r} are taking share, so retention spend goes only where it is needed.`;
  return `Stretch a limited budget: targeted retention instead of price cuts, and early warning on ${r}'s promotions so you are never the last to react.`;
}
function posDrawTable(items) {
  const k = posS.map, M = POSM[k], sk = posS.sortK[k], dir = posS.dir[k];
  const list = items.filter(c => posVisible(c, k) && c.cls !== 'self');
  const val = (c, key) => key === 'name' ? c.name.toLowerCase() : key === 'q' ? M.quad(c.x, c.y) : key === 'threat' ? c.threat : key === 'rev' ? revOf(c) : key === 'mcap' ? mcapOf(c) : key === 'growth' ? (c.growth && c.growth.v != null ? +c.growth.v : -999) : key === 'innov' ? innovCount(c) : key === 'region' ? (c.region || '') + (c.country || '') : 0;
  list.sort((a, b) => { const x = val(a, sk), y = val(b, sk); return (x > y ? 1 : x < y ? -1 : 0) * dir; });
  const th = (key, l, cls) => `<th class="${cls || ''}" aria-sort="${sk === key ? (dir > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" data-k="${key}">${l}${sk === key ? (dir > 0 ? ' ↑' : ' ↓') : ''}</button></th>`;
  const head = k === 'vendors'
    ? `${th('name', 'Company')}<th>Segment</th>${th('q', 'Quadrant')}<th>Owners &amp; money</th>${th('mcap', 'Mkt cap / valuation', 'num')}<th>Main competitors</th>${th('threat', 'Threat', 'num')}`
    : `${th('name', 'Operator')}${th('region', 'Region · country')}${th('q', 'Quadrant')}<th>Owners &amp; money</th>${th('mcap', 'Mkt cap', 'num')}${th('rev', 'Revenue', 'num')}${th('growth', 'Growth', 'num')}${th('innov', 'Innovation', 'num')}<th>Main competitors</th>`;
  $('#posTable').innerHTML = `<thead><tr>${head}</tr></thead><tbody>` + list.map(c => {
    const owners = `${posBadges(c)}<span class="small">${esc((c.investors || []).slice(0, 3).map(v => v.n + (v.pct != null && v.pct !== '' ? ' ' + v.pct + (/%/.test(String(v.pct)) ? '' : '%') : '')).join(', ') || c.own || '—')}</span>`;
    const rivals = esc((c.rivals || []).slice(0, 4).join(', ') || '—');
    return k === 'vendors'
      ? `<tr data-id="${esc(c.id)}" class="${c.id === posS.sel[k] ? 'on' : ''}"><td><button type="button" class="linkish" data-id="${esc(c.id)}">${esc(c.name)}</button></td><td class="small">${esc({ telecom: 'Telecom-native', horizontal: 'Horizontal CI', adjacent: 'Adjacent' }[c.seg] || '')}</td><td class="small">${esc(M.quad(c.x, c.y))}</td><td>${owners}</td><td class="num">${mcapOf(c) ? fmtMoney(mcapOf(c)) : '—'}</td><td class="small">${rivals}</td><td class="num mono">${c.threat}</td></tr>`
      : `<tr data-id="${esc(c.id)}" class="${c.id === posS.sel[k] ? 'on' : ''}"><td><button type="button" class="linkish" data-id="${esc(c.id)}">${esc(c.name)}</button></td><td class="small">${esc(c.region || '')}<br>${esc(c.country || '')}</td><td class="small">${esc(M.quad(c.x, c.y))}</td><td>${owners}</td><td class="num">${c.mcap && c.mcap.usd ? fmtMoney(c.mcap.usd) : '—'}</td><td class="num">${revOf(c) ? fmtMoney(revOf(c)) : '—'}</td><td class="num">${pct(c.growth && c.growth.v)}</td><td class="num mono">${c.innov ? innovCount(c) + '/7' : '—'}</td><td class="small">${rivals}</td></tr>`;
  }).join('') + '</tbody>';
  $('#posTableTitle').textContent = k === 'vendors' ? 'Every competitor on this map' : `Every operator on this map${posS.region === 'All regions' ? '' : ' · ' + posS.region}`;
  $('#posNote').textContent = `${list.length} shown. Click a row to open its profile. Market caps and revenue are in USD at the stated FX; "—" means not disclosed or not found.`;
}
function posDrawMarkets() {
  const el = $('#posMarkets'); if (!el) return;
  const ms = (POS.markets || []).filter(m => posS.map === 'ops' && (posS.region === 'All regions' ? false : m.region === posS.region));
  el.hidden = !ms.length;
  el.innerHTML = ms.length ? `<h3 class="cx-h3">Market structure · ${esc(posS.region)}</h3><div class="mkts">${ms.map(m => `<div class="mkt"><b>${esc(m.country)}</b><span class="small">${esc(m.structure || '')}</span>${m.regulator ? `<span class="tiny muted">Regulator: ${esc(m.regulator)}</span>` : ''}${m.events && m.events.length ? `<ul class="cxl">${m.events.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>` : '';
}
function posRender() {
  if (!POS || !$('#positioning')) return;
  const k = posS.map, items = posItems(k);
  if (!posS.sel[k] || !items.some(c => c.id === posS.sel[k] && posVisible(c, k))) {
    const vis = items.filter(c => posVisible(c, k) && c.cls !== 'self');
    posS.sel[k] = (k === 'vendors' ? vis.sort((a, b) => b.threat - a.threat)[0] : vis.sort((a, b) => revOf(b) - revOf(a))[0] || items[0] || {}).id;
  }
  posDrawTabs(); posDrawSummary(items); posDrawTop(items); posDrawFilters(items); posDrawChart(items); posDrawProfile(items); posDrawMarkets(); posDrawTable(items);
}
function posSelect(id, scroll) {
  posS.sel[posS.map] = id; posRender();
  if (scroll) $('#posChartBox').scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' });
  else if (innerWidth < 980) $('#posProfile').scrollIntoView({ behavior: 'auto', block: 'start' });
}
function initPositioning() {
  if (!POS || !$('#positioning')) return;
  $('#posTabs').addEventListener('click', e => { const b = e.target.closest('[data-map]'); if (!b) return; posS.map = b.dataset.map; posS.cls = 'all'; posRender(); });
  $('#posFilters').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.seg) posS.seg = b.dataset.seg; if (b.dataset.reg) posS.region = b.dataset.reg; if (b.dataset.cls) posS.cls = b.dataset.cls; posRender(); });
  $('#posTop').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) posSelect(b.dataset.id, true); });
  const chart = $('#posChart');
  chart.addEventListener('mouseover', e => { const p = e.target.closest('.pt'); if (p) posShowTip(p.dataset.id, p); });
  chart.addEventListener('mouseleave', () => { posTip().hidden = true; });
  chart.addEventListener('click', e => { const p = e.target.closest('.pt'); if (p) posSelect(p.dataset.id, false); });
  chart.addEventListener('keydown', e => { const p = e.target.closest('.pt'); if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); posSelect(p.dataset.id, false); } });
  $('#posProfile').addEventListener('click', e => { const b = e.target.closest('button[data-id]'); if (b) posSelect(b.dataset.id, false); });
  $('#posTable').addEventListener('click', e => {
    const h = e.target.closest('th button'); if (h) { const key = h.dataset.k, m = posS.map; posS.dir[m] = posS.sortK[m] === key ? -posS.dir[m] : (['name', 'q', 'region'].includes(key) ? 1 : -1); posS.sortK[m] = key; posDrawTable(posItems(m)); return; }
    if (e.target.closest('a')) return;
    const r = e.target.closest('[data-id]'); if (r) posSelect(r.dataset.id, true);
  });
  $('#posTable').dataset.ready = '1';
  posRender();
}

/* ---------- nav highlight ---------- */
function initNav() {
  const links = $$('.nav a'); const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.classList.remove('on')); const a = map.get(e.target.id); if (a) a.classList.add('on'); } }), { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

/* ---------- TERMINALS: several workstations side by side, ready-made or built for one purpose ---------- */
const TM_KEY = 'cv.terminals.v1';
const TM_PANELS = {
  kpi: ['Market pulse', 'Signals, coverage, tasks and data freshness at a glance'],
  signals: ['Signal feed', 'Top competitor signals, ranked by urgency'],
  movers: ['Market-value movers', 'Biggest risers and fallers since the last check'],
  mcap: ['Largest companies', 'Telecom, tower and intelligence companies by market value'],
  gulf: ['Gulf operators', 'Revenue, growth and market value of Gulf operators'],
  deals: ['Capital deals', 'Private-equity, infrastructure, hedge-fund and sovereign deals'],
  predict: ['Move predictor', 'Probability and timing of the next rival moves'],
  tariff: ['Tariff compare', 'A plan against the closest rival plans'],
  war: ['War room', 'Simulate a rival price cut and see the best response'],
  geo: ['Geo radar', 'Churn, coverage and retail hotspots by district'],
  agent: ['Agent console', 'Run any AI agent on any task'],
  roster: ['Department agents', 'Every agent in one department, one click to run'],
  tasks: ['Workspace tasks', 'Open tasks from the team workspace'],
  intel: ['Intelligence feed', 'Latest matching items from the knowledge base'],
  sources: ['Source registry', 'Where the intelligence comes from'],
  lab: ['Innovation lab', 'Tools and services by status'],
  facts: ['Key facts', 'Sourced headline facts from this page'],
  notes: ['Notes', 'Your notes for this terminal, kept in this browser'],
  toolbox: ['Tool library', '400+ tools: analytics, simulations and calculators'],
  services: ['Service catalog', '340+ services to request, by department']
};
const TM_PRESETS = [
  { id: 'exec', n: 'Executive', p: 'What leadership needs at 8 a.m.: signals, market moves, forecasts and tasks', panels: [['kpi'], ['signals'], ['movers'], ['predict'], ['agent', 'st:board'], ['tasks']] },
  { id: 'market', n: 'Market & competitors', p: 'Every rival move and position in one view', panels: [['signals'], ['gulf'], ['predict'], ['geo', 'retail'], ['agent', 'mi:profiler'], ['intel']] },
  { id: 'pricing', n: 'Pricing', p: 'Compare plans and test responses before you move', panels: [['tariff'], ['war'], ['signals', 'crit'], ['agent', 'pr:tariff'], ['roster', 'pr']] },
  { id: 'capital', n: 'Capital markets', p: 'Valuations, movers and deals across telecom', panels: [['mcap'], ['movers'], ['deals'], ['gulf'], ['agent', 'fn:peerval']] },
  { id: 'network', n: 'Network', p: 'Coverage truth, rival builds and capex priorities', panels: [['geo', 'coverage'], ['predict'], ['signals'], ['agent', 'nw:coverage'], ['roster', 'nw']] },
  { id: 'customer', n: 'Customers & retention', p: 'Where churn spreads and who to save today', panels: [['geo', 'churn'], ['war'], ['agent', 'rl:churn'], ['roster', 'rl'], ['tasks']] },
  { id: 'enterprise', n: 'Enterprise & SME', p: 'Tenders, accounts and business offers', panels: [['agent', 'en:tender'], ['roster', 'en'], ['roster', 'sm'], ['intel'], ['deals']] },
  { id: 'regulatory', n: 'Regulatory & risk', p: 'Consultations, compliance, security and fraud', panels: [['agent', 'rg:consult'], ['roster', 'rg'], ['roster', 'sc'], ['signals'], ['sources']] },
  { id: 'agents', n: 'Agent operations', p: 'Run and supervise the AI agents', panels: [['agent', 'mi:scout'], ['agent', 'mk:segment'], ['roster', 'mi'], ['tasks']] },
  { id: 'digital', n: 'Digital & fintech', p: 'Apps, eSIM, the wallet and digital rivals', panels: [['agent', 'dg:wallet'], ['roster', 'dg'], ['intel', 'app wallet eSIM'], ['notes']] },
  { id: 'innovation', n: 'Innovation', p: 'The lab, new ideas and data', panels: [['lab'], ['agent', 'da:genai'], ['intel'], ['notes']] },
  { id: 'tools', n: 'Tools & services', p: 'Every tool and every service in one terminal', panels: [['toolbox'], ['services'], ['notes']] }
];
if (EDITION === 'eand') TM_PRESETS.unshift({ id: 'uae', n: 'etisalat UAE', p: 'The UAE market, du and Virgin Mobile UAE at a glance', panels: [['facts'], ['gulf'], ['signals'], ['agent', 'mi:profiler'], ['roster', 'mk']] });
const TM = { custom: [], open: [], active: null, notes: {}, log: {}, hist: [], hi: -1, edit: null, draft: null };
const tmAll = () => TM_PRESETS.concat(TM.custom);
const tmGet = id => tmAll().find(t => t.id === id);
function tmSave() { try { localStorage.setItem(TM_KEY, JSON.stringify({ custom: TM.custom, open: TM.open, active: TM.active, notes: TM.notes })); } catch (e) { /* storage blocked: this visit only */ } }
function tmLoad() {
  try { const s = JSON.parse(localStorage.getItem(TM_KEY) || 'null'); if (s) { TM.custom = (s.custom || []).filter(t => t && t.id && Array.isArray(t.panels)); TM.open = s.open || []; TM.active = s.active; TM.notes = s.notes || {}; } } catch (e) { /* first visit or storage blocked */ }
  TM.open = TM.open.filter(id => tmGet(id));
  if (!TM.open.length) TM.open = EDITION === 'eand' ? ['uae', 'exec', 'market'] : ['exec', 'market', 'pricing'];
  if (TM.active !== '__new' && !tmGet(TM.active)) TM.active = TM.open[0];
}
const tmPct = v => (v > 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
const tmRow = (a, b, cls) => `<div class="tm-row"><span>${a}</span><span class="${cls || ''}">${b}</span></div>`;
const tmMovers = () => (LAND ? LAND.companies : []).filter(c => c.mcap && c.mcap.usd && c.mcap.prev).map(c => ({ c, d: c.mcap.usd / c.mcap.prev - 1 })).sort((a, b) => b.d - a.d);
const tmAgentOpts = sel => AG_DEPTS.map(D => `<optgroup label="${esc(D.n)}">${D.agents.map(A => `<option value="${D.k}:${A.id}"${sel === D.k + ':' + A.id ? ' selected' : ''}>${esc(A.n)}</option>`).join('')}</optgroup>`).join('');
function tmPanelHtml(k, arg, tid) {
  if (k === 'kpi') {
    const sig = TOOLS.list_signals({ limit: 20 }), fr = sig.length ? Math.round(sig.reduce((a, x) => a + x.freshness_pct, 0) / sig.length) : 0;
    const tiles = [['Critical signals', sig.filter(x => x.severity === 'crit').length], ['High signals', sig.filter(x => x.severity === 'high').length], ['Average freshness', fr + '%'],
      ['Open tasks', taskList().filter(t => t.status !== 'done').length], ['Operators tracked', POS ? POS.operators.length : '—'], ['Companies tracked', LAND ? LAND.companies.length : '—'],
      ['AI agents', agAll().length], ['Market values as of', LAND && LAND.verifiedAt ? String(LAND.verifiedAt).slice(0, 10) : '—']];
    return `<div class="tm-kpis">${tiles.map(([l, v]) => `<div><b>${esc(String(v))}</b><span>${esc(l)}</span></div>`).join('')}</div>`;
  }
  if (k === 'signals') return TOOLS.list_signals({ limit: 8, severity: arg || undefined }).map(x => `<button type="button" class="tm-line" data-tmrun="SIG ${esc(x.id)}"><span class="tm-sev s-${esc(x.severity)}">${esc(SEVL[x.severity] || x.severity)}</span><span>${esc(x.operator)}: ${esc(x.text)}</span><span class="mono muted">${x.freshness_pct}%</span></button>`).join('') || '<p class="small muted">No signals.</p>';
  if (k === 'movers') { const m = tmMovers(); if (!m.length) return '<p class="small muted">No earlier values to compare yet.</p>'; return '<span class="label">Risers</span>' + m.slice(0, 5).map(x => tmRow(esc(x.c.name), `${fmtMoney(x.c.mcap.usd)} · ${tmPct(x.d)}`, 'tm-up')).join('') + '<span class="label">Fallers</span>' + m.slice(-5).reverse().map(x => tmRow(esc(x.c.name), `${fmtMoney(x.c.mcap.usd)} · ${tmPct(x.d)}`, 'tm-dn')).join(''); }
  if (k === 'mcap') return (LAND ? LAND.companies : []).filter(c => c.mcap && c.mcap.usd).sort((a, b) => b.mcap.usd - a.mcap.usd).slice(0, +arg || 10).map((c, i) => tmRow(`${i + 1}. ${esc(c.name)}`, fmtMoney(c.mcap.usd))).join('');
  if (k === 'gulf') return POS ? POS.operators.filter(o => o.region === 'Gulf (GCC)' && revOf(o)).sort((a, b) => revOf(b) - revOf(a)).slice(0, 10).map(o => tmRow(esc(o.short || o.name), `${fmtMoney(revOf(o))} rev${o.growth && o.growth.v != null ? ' · ' + (o.growth.v > 0 ? '+' : '') + o.growth.v + '%' : ''}${o.mcap && o.mcap.usd ? ' · ' + fmtMoney(o.mcap.usd) + ' mcap' : ''}`)).join('') : '<p class="small muted">Positioning data is not loaded.</p>';
  if (k === 'deals') return TOOLS.capital_deals({ limit: 8 }).map(d => tmRow(esc(`${d.investor} → ${d.target}`), esc(`${d.date}${d.value_usd ? ' · ' + fmtMoney(d.value_usd) : ''}`))).join('');
  if (k === 'predict') return ['fwa', 'cut', 'sat'].map(m => { const r = TOOLS.predict_move({ move_id: m }); return `<div class="tm-bar"><span>${esc(r.move)}</span><i style="--w:${r.probability_pct}%"></i><b>${r.probability_pct}%</b><span class="tiny muted">${esc(r.window)}</span></div>`; }).join('');
  if (k === 'tariff') { const id = arg || 'nim-u'; return `<label class="sr" for="tmPlan${tid}">Plan</label><select class="inp" id="tmPlan${tid}" data-tmplan>${PLANS.map(p => `<option value="${p.id}"${p.id === id ? ' selected' : ''}>${esc(OPS[p.op] ? OPS[p.op].short + ' ' + p.name : p.id)}</option>`).join('')}</select>` + agFmt('compare_plans', TOOLS.compare_plans({ plan_id: id })).map(l => `<p class="small">${esc(l)}</p>`).join(''); }
  if (k === 'war') return `<form class="tm-war" data-tmwar><label class="small">Rival <select class="inp" name="rival">${['arc', 'vtx', 'pls', 'kte'].map(r => `<option value="${r}">${esc(OPS[r].name)}</option>`).join('')}</select></label><label class="small">Price cut <input type="range" name="cut" min="5" max="30" value="15"> <output>15%</output></label><button class="btn sm accent" type="submit">Simulate</button></form><div class="tm-warout small muted">Pick a rival and a cut, then simulate.</div>`;
  if (k === 'geo') { const L = arg || 'churn', r = TOOLS.geo_hotspots({ layer: L }); return `<div class="seg tm-seg">${['churn', 'coverage', 'retail'].map(x => `<button type="button" data-tmgeo="${x}" aria-pressed="${x === L}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div>` + r.hotspots.slice(0, 6).map(h => tmRow(esc(h.district), esc(h.port_outs_per_day_per_10k != null ? h.port_outs_per_day_per_10k + ' port-outs/day per 10k · ' + h.level : h.measured_mbps != null ? h.measured_mbps + ' Mbps · ' + h.gap : 'pressure ' + h.rival_retail_pressure))).join(''); }
  if (k === 'agent') { const hit = agByKey(arg) || agAll()[0]; return `<label class="sr" for="tmAg${tid}">Agent</label><select class="inp" id="tmAg${tid}" data-tmagent>${tmAgentOpts(hit.D.k + ':' + hit.A.id)}</select><label class="sr" for="tmAgQ${tid}">Task</label><textarea class="tm-q" id="tmAgQ${tid}" rows="2">${esc(hit.A.q)}</textarea><button type="button" class="btn sm accent" data-tmagrun>Run agent</button><div class="ag-run tm-agout" aria-live="polite"></div>`; }
  if (k === 'roster') { const D = AG_DEPTS.find(d => d.k === arg) || AG_DEPTS[0]; return `<p class="tiny muted">${esc(D.n)} · ${D.agents.length} agents</p>` + D.agents.map(A => `<div class="tm-ros"><span><b>${esc(A.n)}</b><span class="tiny muted">${esc(A.role)}</span></span><button type="button" class="btn sm" data-tmros="${D.k}:${A.id}">Run</button></div>`).join('') + '<div class="ag-run tm-agout" aria-live="polite"></div>'; }
  if (k === 'tasks') { const L = taskList().filter(t => t.status !== 'done').slice(0, 8); return L.map(t => tmRow(esc(t.title), esc((TASK_COLS.find(c => c[0] === t.status) || ['', 'To do'])[1]))).join('') || '<p class="small muted">No open tasks. Agents can add theirs in one click.</p>'; }
  if (k === 'intel') { const R = miSearch(arg || 'launch price network 5G deal', 'all'); return R.res.slice(0, 7).map(r => tmRow(esc(r.d.title), esc(r.d.type))).join('') || '<p class="small muted">No matches.</p>'; }
  if (k === 'sources') return MI_SRC.slice(0, 14).map(s => tmRow(esc(s.n), esc(s.acc || s.cat || ''))).join('');
  if (k === 'lab') { const all = elBuild(), by = s => all.filter(x => x.status === s).length; return `<div class="tm-kpis">${['Live', 'Prototype', 'Service', 'Designed'].map(s => `<div><b>${by(s)}</b><span>${s}</span></div>`).join('')}</div><span class="label">Live now</span>` + all.filter(x => x.status === 'Live').slice(0, 6).map(x => tmRow(esc(x.n), esc(x.dn))).join(''); }
  if (k === 'facts') return $$('.stats > div').slice(0, 6).map(d => tmRow(`<b>${esc(txtOf($('b', d)))}</b> ${esc(txtOf($('span', d)))}`, esc(txtOf($('cite', d)).replace(' ↗', '')), 'tiny muted')).join('');
  if (k === 'toolbox') return tlPanelHtml(tid, arg);
  if (k === 'services') return svPanelHtml(tid, arg);
  if (k === 'notes') return `<label class="sr" for="tmNote${tid}">Notes</label><textarea class="tm-q" id="tmNote${tid}" rows="6" data-tmnote placeholder="Notes for this terminal">${esc(TM.notes[TM.active] || '')}</textarea><p class="tiny muted">Saved in this browser only.</p>`;
  return '';
}
function tmFill(el, t) {
  const [k, arg] = [el.dataset.k, el.dataset.arg];
  try { $('.tm-pb', el).innerHTML = tmPanelHtml(k, arg, t.id + el.dataset.i); } catch (e) { $('.tm-pb', el).innerHTML = `<p class="small muted">This panel could not load: ${esc(e.message)}</p>`; }
}
const tmSub = (k, arg) => k === 'agent' ? (agByKey(arg) || { A: { n: '' } }).A.n : k === 'roster' ? ((AG_DEPTS.find(d => d.k === arg) || {}).n || '') : k === 'geo' ? (arg || 'churn') : k === 'services' && arg ? ((AG_DEPTS.find(d => d.k === arg) || {}).n || '') : k === 'toolbox' ? tlBuild().length + ' tools' : k === 'signals' && arg ? (SEVL[arg] || arg) : '';
function tmTerminalHtml(t) {
  return `<div class="tm-head"><div><h3>${t.custom ? '★ ' : ''}${esc(t.n)}</h3><p class="small muted">${esc(t.p || '')}</p></div><div class="tm-meta"><span class="pill sim">Signals simulated</span><span class="mono tm-clock" data-tmclock></span>${t.custom ? `<button type="button" class="btn sm" data-tmedit="${esc(t.id)}">Edit</button>` : `<button type="button" class="btn sm" data-tmcopy="${esc(t.id)}">Customize a copy</button>`}</div></div>
    <form class="tm-cmd" data-tmcmd><label for="tmIn" class="sr">Terminal command</label><span aria-hidden="true">CV&gt;</span><input id="tmIn" autocomplete="off" spellcheck="false" placeholder="Type a command: HELP, OP du, MCAP 10, AGENT churn sentinel"><button class="btn sm" type="submit">Run</button></form>
    <div class="tm-log" id="tmLog" aria-live="polite">${(TM.log[t.id] || []).join('')}</div>
    <div class="tm-grid">${t.panels.map(([k, arg], i) => TM_PANELS[k] ? `<article class="tm-p${['agent', 'roster', 'toolbox', 'services'].includes(k) ? ' tm-wide' : ''}" data-k="${k}" data-arg="${esc(arg || '')}" data-i="${i}"><header><b>${esc(TM_PANELS[k][0])}</b><span>${esc(tmSub(k, arg))}</span></header><div class="tm-pb"></div></article>` : '').join('')}</div>`;
}
function tmLauncherHtml() {
  const d = TM.draft || { n: '', p: '', panels: [] }, has = k => d.panels.find(p => p[0] === k);
  const argSel = k => k === 'geo' ? `<select class="inp" name="arg-geo">${['churn', 'coverage', 'retail'].map(x => `<option${(has('geo') || [])[1] === x ? ' selected' : ''}>${x}</option>`).join('')}</select>`
    : k === 'agent' ? `<select class="inp" name="arg-agent">${tmAgentOpts((has('agent') || [])[1] || 'mi:scout')}</select>`
    : k === 'roster' ? `<select class="inp" name="arg-roster">${AG_DEPTS.map(D => `<option value="${D.k}"${(has('roster') || [])[1] === D.k ? ' selected' : ''}>${esc(D.n)}</option>`).join('')}</select>`
    : k === 'signals' ? `<select class="inp" name="arg-signals"><option value="">All severities</option><option value="crit"${(has('signals') || [])[1] === 'crit' ? ' selected' : ''}>Critical only</option><option value="high"${(has('signals') || [])[1] === 'high' ? ' selected' : ''}>High only</option></select>` : '';
  return `<div class="tm-launch">
    <div><h3>Open a terminal</h3><p class="small muted">Ready-made terminals for each job. Open as many as you like; each opens in its own tab.</p></div>
    <div class="tm-cards">${TM_PRESETS.map(t => `<button type="button" class="tm-card" data-tmopen="${t.id}"><b>${esc(t.n)}</b><span class="small">${esc(t.p)}</span><span class="tiny muted">${t.panels.map(p => TM_PANELS[p[0]][0]).join(' · ')}</span></button>`).join('')}</div>
    ${TM.custom.length ? `<div><h3>Your terminals</h3><div class="tm-cards">${TM.custom.map(t => `<div class="tm-card tm-mine"><b>★ ${esc(t.n)}</b><span class="small">${esc(t.p || '')}</span><span class="row-btns"><button type="button" class="btn sm accent" data-tmopen="${esc(t.id)}">Open</button><button type="button" class="btn sm" data-tmedit="${esc(t.id)}">Edit</button><button type="button" class="btn sm" data-tmdel="${esc(t.id)}">Delete</button></span></div>`).join('')}</div></div>` : ''}
    <form class="tm-build panel" data-tmbuild id="tmBuild">
      <h3>${TM.edit ? 'Edit your terminal' : 'Build a custom terminal'}</h3>
      <p class="small muted">Name it, say what it is for and pick its panels. It is saved in this browser, and you can open several at once.</p>
      <div class="tm-brow"><label class="small">Name<input class="inp-search" name="n" maxlength="40" required value="${esc(d.n)}" placeholder="e.g. Ramadan campaign room"></label><label class="small">Purpose<input class="inp-search" name="p" maxlength="120" value="${esc(d.p)}" placeholder="What this terminal is for"></label></div>
      <fieldset class="tm-pick"><legend class="label">Panels</legend>${Object.entries(TM_PANELS).map(([k, [n, desc]]) => `<label class="tm-opt"><input type="checkbox" name="pk" value="${k}"${has(k) ? ' checked' : ''}><span><b>${esc(n)}</b><span class="tiny muted">${esc(desc)}</span></span>${argSel(k)}</label>`).join('')}</fieldset>
      <div class="row-btns"><button class="btn accent" type="submit">${TM.edit ? 'Save changes' : 'Create terminal'}</button>${TM.edit ? '<button class="btn" type="button" data-tmcancel>Cancel</button>' : ''}<span class="small" id="tmMsg" aria-live="polite"></span></div>
    </form></div>`;
}
function tmRender() {
  const tabs = $('#tmTabs'), body = $('#tmBody'); if (!tabs) return;
  tabs.innerHTML = TM.open.map(id => { const t = tmGet(id); return t ? `<span class="tm-tab"><button type="button" role="tab" aria-selected="${id === TM.active}" data-tmopen="${esc(id)}">${t.custom ? '★ ' : ''}${esc(t.n)}</button><button type="button" class="tm-x" data-tmclose="${esc(id)}" aria-label="Close the ${esc(t.n)} terminal">×</button></span>` : ''; }).join('') +
    `<button type="button" class="tm-new" role="tab" aria-selected="${TM.active === '__new'}" data-tmopen="__new">+ New terminal</button>`;
  const t = tmGet(TM.active);
  if (!t) { body.innerHTML = tmLauncherHtml(); return; }
  body.innerHTML = tmTerminalHtml(t);
  $$('.tm-p', body).forEach(el => tmFill(el, t));
  tmClock();
}
function tmOpen(id) { if (id !== '__new' && !tmGet(id)) return false; if (id !== '__new' && !TM.open.includes(id)) TM.open.push(id); TM.active = id; if (id !== '__new') { TM.edit = null; TM.draft = null; } tmSave(); tmRender(); return true; }
function tmClock() { const c = $('[data-tmclock]'); if (c) c.textContent = new Date().toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function tmOut(html) {
  const id = TM.active, L = TM.log[id] = (TM.log[id] || []); L.push(`<div class="tm-l">${html}</div>`); if (L.length > 120) L.splice(0, L.length - 120);
  const box = $('#tmLog'); if (box) { box.insertAdjacentHTML('beforeend', `<div class="tm-l">${html}</div>`); box.scrollTop = box.scrollHeight; }
}
const TM_HELP = [['HELP', 'this list'], ['OPEN name', 'open a terminal, e.g. OPEN pricing'], ['NEW', 'build a custom terminal'], ['SIG [crit|high|S-1234]', 'signals, or one signal in detail'],
  ['OP name', 'an operator profile, e.g. OP stc'], ['CO name', 'a company or investor, e.g. CO KKR'], ['MCAP [n]', 'largest companies by market value'], ['MOVERS', 'market-value risers and fallers'],
  ['DEALS [n]', 'latest capital deals'], ['PRED [fwa|cut|sat]', 'move predictions'], ['SIM rival cut%', 'war-room simulation, e.g. SIM arcline 15'], ['PLAN id', 'compare a plan, e.g. PLAN nim-u'],
  ['GEO churn|coverage|retail', 'district hotspots'], ['AGENTS [department]', 'list departments or agents'], ['AGENT name [: task]', 'run an agent, e.g. AGENT fee watch: any new fees?'],
  ['TOOLS [search|family]', 'find tools, e.g. TOOLS gulf'], ['TOOL id [values]', 'run a tool, e.g. TOOL calc-arpu 1200000000 4000000 12'], ['SERVICES [search]', 'find services, e.g. SERVICES churn'], ['BOOK service [: note]', 'request a service, e.g. BOOK churn model build'],
  ['ASK question', 'ask the AI assistant'], ['FIND text', 'search the whole platform'], ['TASK title', 'add a workspace task'], ['CLEAR', 'clear this log']];
const tmFindAgent = q => { const s = q.toLowerCase().trim(); return agByKey(s) || agAll().find(x => x.A.n.toLowerCase() === s) || agAll().find(x => x.A.n.toLowerCase().includes(s) || x.A.id === s); };
async function tmCmd(raw) {
  const line = String(raw || '').trim(); if (!line) return;
  TM.hist.unshift(line); TM.hist.length = Math.min(TM.hist.length, 40); TM.hi = -1;
  const sp = line.indexOf(' '), C = (sp < 0 ? line : line.slice(0, sp)).toUpperCase(), arg = sp < 0 ? '' : line.slice(sp + 1).trim();
  tmOut(`<span class="tm-in">CV&gt; ${esc(line)}</span>`);
  const rows = (a) => a.length ? tmOut(a.map(esc).join('<br>')) : tmOut('<span class="muted">Nothing found.</span>');
  try {
    if (C === 'HELP') tmOut(TM_HELP.map(([c, d]) => `<b>${esc(c)}</b>  ${esc(d)}`).join('<br>'));
    else if (C === 'CLEAR') { TM.log[TM.active] = []; $('#tmLog').innerHTML = ''; }
    else if (C === 'OPEN') { const s = arg.toLowerCase(), t = tmAll().find(x => x.id === s || x.n.toLowerCase() === s) || tmAll().find(x => x.n.toLowerCase().includes(s)); if (!t || !s) tmOut('Terminals: ' + esc(tmAll().map(x => x.n).join(', '))); else tmOpen(t.id); }
    else if (C === 'NEW') tmOpen('__new');
    else if (C === 'SIG') {
      if (/^s-\d+/i.test(arg)) { const r = TOOLS.get_signal({ id: arg }); rows([`${r.id} · ${SEVL[r.severity] || r.severity} · ${r.operator} · ${r.class}`, r.text, `Source: ${r.source} · detected ${r.detected}`, `Likely next move: ${r.predicted_next_move || '—'}`]); }
      else rows(TOOLS.list_signals({ limit: /^\d+$/.test(arg) ? +arg : 8, severity: ['crit', 'high', 'watch'].includes(arg.toLowerCase()) ? arg.toLowerCase() : undefined }).map(x => `[${x.id}] ${SEVL[x.severity]} · ${x.operator}: ${x.text} (${x.freshness_pct}% fresh)`));
    }
    else if (C === 'OP') {
      const s = arg.toLowerCase(); const o = POS && s && (POS.operators.find(x => (x.short || '').toLowerCase() === s) || POS.operators.find(x => x.name.toLowerCase().includes(s) || (x.short || '').toLowerCase().includes(s)));
      if (!o) tmOut('No operator matches. Try OP stc, OP du or OP vodafone.');
      else rows([o.name, `${o.country || ''} · ${o.region || ''} · ${POSM.ops.quad(o.x, o.y)}`, `Revenue ${revOf(o) ? fmtMoney(revOf(o)) : '—'}${o.growth && o.growth.v != null ? ' · growth ' + o.growth.v + '%' : ''} · market value ${o.mcap && o.mcap.usd ? fmtMoney(o.mcap.usd) + ' (' + (o.mcap.asOf || '') + ')' : '—'}`, `Competes with: ${(o.rivals || []).slice(0, 5).join(', ') || '—'}`].concat((o.moves || []).slice(0, 2).map(m => `Recent: ${m[0]} ${m[1]}`)));
    }
    else if (C === 'CO') rows(TOOLS.company_lookup({ name: arg, limit: 4 }).map(c => `${c.name} · ${c.segment} · ${c.hq || ''}${c.market_cap_usd ? ' · ' + fmtMoney(c.market_cap_usd) : ''}${c.investors && c.investors.length ? ' · investors: ' + c.investors.slice(0, 3).join(', ') : ''}`));
    else if (C === 'MCAP') rows((LAND ? LAND.companies : []).filter(c => c.mcap && c.mcap.usd).sort((a, b) => b.mcap.usd - a.mcap.usd).slice(0, clamp(+arg || 10, 1, 40)).map((c, i) => `${i + 1}. ${c.name}  ${fmtMoney(c.mcap.usd)}  (${c.mcap.asOf || ''})`));
    else if (C === 'MOVERS') { const m = tmMovers(); rows(m.slice(0, 5).map(x => `▲ ${x.c.name} ${tmPct(x.d)} → ${fmtMoney(x.c.mcap.usd)}`).concat(m.slice(-5).reverse().map(x => `▼ ${x.c.name} ${tmPct(x.d)} → ${fmtMoney(x.c.mcap.usd)}`))); }
    else if (C === 'DEALS') rows(TOOLS.capital_deals({ limit: clamp(+arg || 6, 1, 25) }).map(d => `${d.date}: ${d.investor} → ${d.target}${d.value_usd ? ' (' + fmtMoney(d.value_usd) + ')' : ''}`));
    else if (C === 'PRED') rows((['fwa', 'cut', 'sat'].includes(arg.toLowerCase()) ? [arg.toLowerCase()] : ['fwa', 'cut', 'sat']).flatMap(m => agFmt('predict_move', TOOLS.predict_move({ move_id: m }))));
    else if (C === 'SIM') { const [r, c] = arg.split(/\s+/); const key = ['arc', 'vtx', 'pls', 'kte'].includes((r || '').toLowerCase()) ? r.toLowerCase() : opByName(r); if (!['arc', 'vtx', 'pls', 'kte'].includes(key)) tmOut('Rivals: ' + ['arc', 'vtx', 'pls', 'kte'].map(k => OPS[k].name).join(', ') + '. Example: SIM arcline 15'); else rows(agFmt('simulate_response', TOOLS.simulate_response({ rival: key, cut_pct: clamp(+String(c || '15').replace('%', '') || 15, 1, 60), weeks: 8 }))); }
    else if (C === 'PLAN') rows(agFmt('compare_plans', TOOLS.compare_plans({ plan_id: PLANS.some(p => p.id === arg) ? arg : 'nim-u' })));
    else if (C === 'GEO') rows(agFmt('geo_hotspots', TOOLS.geo_hotspots({ layer: ['churn', 'coverage', 'retail'].includes(arg.toLowerCase()) ? arg.toLowerCase() : 'churn' })));
    else if (C === 'AGENTS') { const s = arg.toLowerCase(), D = s && AG_DEPTS.find(d => d.k === s || d.n.toLowerCase().includes(s)); if (D) rows(D.agents.map(A => `${A.n}: ${A.role}`)); else rows(AG_DEPTS.map(d => `${d.k}  ${d.n} (${d.agents.length} agents)`)); }
    else if (C === 'AGENT') {
      const [who, ...task] = arg.split(':'), hit = tmFindAgent(who || '');
      if (!hit) { tmOut('No agent matches. Try AGENTS to list them, or AGENT churn sentinel.'); return; }
      const box = document.createElement('div'); box.className = 'ag-run tm-agout';
      $('#tmLog').appendChild(box); await agExec(hit.D, hit.A, task.join(':').trim() || hit.A.q, box); $('#tmLog').scrollTop = $('#tmLog').scrollHeight;
      TM.log[TM.active].push(`<div class="tm-l tiny muted">Ran ${esc(hit.A.n)} (open the terminal again to rerun).</div>`);
    }
    else if (C === 'TOOLS') { const s = arg.toLowerCase(), T = tlBuild(), fam = TL_FAMS().find(f => f.toLowerCase() === s), L = T.filter(t => !s || (fam ? t.fam === fam : (t.n + ' ' + t.d + ' ' + t.fam).toLowerCase().includes(s))); if (!s) tmOut(`${T.length} tools in ${TL_FAMS().length} families: ${esc(TL_FAMS().map(f => f + ' (' + T.filter(t => t.fam === f).length + ')').join(', '))}. Try TOOLS gulf or TOOLS calculators.`); else rows(L.slice(0, 25).map(t => `${t.id}  ${t.n}`).concat(L.length > 25 ? [`…and ${L.length - 25} more`] : [])); }
    else if (C === 'TOOL') { const parts = arg.split(/\s+/), p0 = (parts[0] || '').toLowerCase(), byId = tlBuild().find(x => x.id === p0 || x.id === 'calc-' + p0), t = byId || tlFind(arg); if (!t || !arg) { tmOut('No tool matches. Try TOOLS to search.'); return; } const rest = byId ? parts.slice(1) : []; const args = {}; rest.forEach((v, i) => { const m = v.match(/^(\w+)=(.*)$/); if (m) args[m[1]] = m[2]; else args[i] = v; }); tmOut(`<b>${esc(t.n)}</b>`); rows(tlRun(t, args)); }
    else if (C === 'SERVICES') { const s = arg.toLowerCase(), D = s && AG_DEPTS.find(d => d.k === s || d.n.toLowerCase() === s), L = SVC_CAT.filter(x => D ? x.dept === D.k : !s || (x.name + ' ' + x.desc + ' ' + x.dn).toLowerCase().includes(s)); if (!s) tmOut(`${SVC_CAT.length} services, ${SV_TYPES.length + 4} per department. Try SERVICES churn or SERVICES pricing.`); else rows(L.slice(0, 20).map(x => `${x.name} · ${x.turn}`).concat(L.length > 20 ? [`…and ${L.length - 20} more`] : [])); }
    else if (C === 'BOOK') { const [who, ...note] = arg.split(':'), sv = svFind(who) || svcByKey(who.trim()); if (!sv) tmOut('No service matches. Try SERVICES to search.'); else { const q = await svBook(sv.k, note.join(':').trim()); tmOut(`Requested ${esc(q.service)} · ${esc(q.label || '')}${q.saved ? '' : ' (kept for this visit only)'}`); } }
    else if (C === 'ASK') { selectTab('tab-ask'); const a = $('#askInput'); if (a) a.value = arg; findGo($('#app')); setTimeout(() => a && a.focus(), 300); tmOut('Opened the AI assistant with your question.'); }
    else if (C === 'FIND') { findOpen(); const q = $('#findQ'); q.value = arg; findRender(); }
    else if (C === 'TASK') { if (!arg) tmOut('Example: TASK Call back the top three at-risk accounts'); else await addTask({ title: arg, kind: 'manual', dept: 'st', prio: 'normal' }); }
    else tmOut(`Unknown command ${esc(C)}. Type HELP.`);
  } catch (e) { tmOut(`<span class="tm-err">${esc(e.message || String(e))}</span>`); }
}
function tmBuildSave(f) {
  const n = f.n.value.trim(), p = f.p.value.trim(), ks = $$('input[name=pk]:checked', f).map(x => x.value);
  if (!n) { $('#tmMsg').textContent = 'Give the terminal a name.'; return; }
  if (!ks.length) { $('#tmMsg').textContent = 'Pick at least one panel.'; return; }
  const panels = ks.map(k => { const a = f.elements['arg-' + k]; return a ? [k, a.value] : [k]; });
  if (TM.edit) { const t = TM.custom.find(x => x.id === TM.edit); if (t) Object.assign(t, { n, p, panels }); tmOpen(TM.edit); }
  else { const t = { id: 'c' + Date.now().toString(36), n, p, panels, custom: true }; TM.custom.push(t); tmOpen(t.id); }
  FIND.items = null; toast('Terminal saved in this browser');
}
function initTerminals() {
  const app = $('#tmApp'); if (!app) return;
  tmLoad(); tmRender();
  app.addEventListener('click', async e => {
    const o = e.target.closest('[data-tmopen]'); if (o) { tmOpen(o.dataset.tmopen); return; }
    const x = e.target.closest('[data-tmclose]'); if (x) { const id = x.dataset.tmclose, i = TM.open.indexOf(id); TM.open.splice(i, 1); if (TM.active === id) TM.active = TM.open[Math.max(0, i - 1)] || '__new'; tmSave(); tmRender(); return; }
    const ed = e.target.closest('[data-tmedit]'); if (ed) { const t = tmGet(ed.dataset.tmedit); TM.edit = t.id; TM.draft = { n: t.n, p: t.p, panels: t.panels }; TM.active = '__new'; tmRender(); $('#tmBuild').scrollIntoView({ block: 'start', behavior: RM.matches ? 'auto' : 'smooth' }); return; }
    const cp = e.target.closest('[data-tmcopy]'); if (cp) { const t = tmGet(cp.dataset.tmcopy); TM.edit = null; TM.draft = { n: 'My ' + t.n.toLowerCase() + ' terminal', p: t.p, panels: t.panels }; TM.active = '__new'; tmRender(); $('#tmBuild').scrollIntoView({ block: 'start', behavior: RM.matches ? 'auto' : 'smooth' }); return; }
    if (e.target.closest('[data-tmcancel]')) { TM.edit = null; TM.draft = null; tmRender(); return; }
    const del = e.target.closest('[data-tmdel]'); if (del) { const id = del.dataset.tmdel; TM.custom = TM.custom.filter(t => t.id !== id); TM.open = TM.open.filter(t => t !== id); delete TM.notes[id]; tmSave(); tmRender(); FIND.items = null; toast('Terminal deleted'); return; }
    const run = e.target.closest('[data-tmrun]'); if (run) { tmCmd(run.dataset.tmrun); return; }
    const tp = e.target.closest('[data-tlpick]'); if (tp) { const t = tlBuild().find(x => x.id === tp.dataset.tlpick), box = $('[data-tlrun]', tp.closest('.tm-p')); box.innerHTML = tlFormHtml(t); if (!t.params.length) $('form', box).requestSubmit(); return; }
    const sb = e.target.closest('[data-svbook]'); if (sb) { sb.disabled = true; try { await svBook(sb.dataset.svbook); sb.textContent = 'Requested'; } catch (err) { toast(err.message); sb.disabled = false; } return; }
    const g = e.target.closest('[data-tmgeo]'); if (g) { const p = g.closest('.tm-p'); p.dataset.arg = g.dataset.tmgeo; $('header span', p).textContent = g.dataset.tmgeo; tmFill(p, tmGet(TM.active)); return; }
    const ar = e.target.closest('[data-tmagrun]'); if (ar) { const p = ar.closest('.tm-p'), hit = agByKey($('[data-tmagent]', p).value); if (!hit) return; ar.disabled = true; try { await agExec(hit.D, hit.A, $('textarea', p).value.trim() || hit.A.q, $('.tm-agout', p)); } finally { ar.disabled = false; } return; }
    const ro = e.target.closest('[data-tmros]'); if (ro) { const p = ro.closest('.tm-p'), hit = agByKey(ro.dataset.tmros); ro.disabled = true; try { await agExec(hit.D, hit.A, hit.A.q, $('.tm-agout', p)); } finally { ro.disabled = false; } }
  });
  app.addEventListener('change', e => {
    const ag = e.target.closest('[data-tmagent]'); if (ag) { const hit = agByKey(ag.value), p = ag.closest('.tm-p'); $('textarea', p).value = hit.A.q; $('header span', p).textContent = hit.A.n; return; }
    const pl = e.target.closest('[data-tmplan]'); if (pl) { const p = pl.closest('.tm-p'); p.dataset.arg = pl.value; tmFill(p, tmGet(TM.active)); return; }
    const tf = e.target.closest('[data-tlfam]'); if (tf) { const p = tf.closest('.tm-p'); $('[data-tllist]', p).innerHTML = tlListHtml($('[data-tlq]', p).value, tf.value); return; }
    const sd = e.target.closest('[data-svdept]'); if (sd) { const p = sd.closest('.tm-p'); $('[data-svlist]', p).innerHTML = svListHtml($('[data-svq]', p).value, sd.value); }
  });
  app.addEventListener('input', e => {
    const n = e.target.closest('[data-tmnote]'); if (n) { TM.notes[TM.active] = n.value.slice(0, 4000); tmSave(); return; }
    if (e.target.name === 'cut') e.target.nextElementSibling.textContent = e.target.value + '%';
    const tq = e.target.closest('[data-tlq]'); if (tq) { const p = tq.closest('.tm-p'); $('[data-tllist]', p).innerHTML = tlListHtml(tq.value, $('[data-tlfam]', p).value); return; }
    const sq = e.target.closest('[data-svq]'); if (sq) { const p = sq.closest('.tm-p'); $('[data-svlist]', p).innerHTML = svListHtml(sq.value, $('[data-svdept]', p).value); }
  });
  app.addEventListener('submit', async e => {
    e.preventDefault();
    if (e.target.matches('[data-tmcmd]')) { const i = $('#tmIn'), v = i.value; i.value = ''; await tmCmd(v); i.focus(); }
    else if (e.target.matches('[data-tmbuild]')) tmBuildSave(e.target);
    else if (e.target.matches('[data-tlform]')) { const f = e.target, t = tlBuild().find(x => x.id === f.dataset.tlform), args = {}; (t.params || []).forEach(([k]) => { args[k] = f.elements[k].value; }); let lines; try { lines = tlRun(t, args); } catch (err) { lines = ['Could not run: ' + err.message]; } $('.tl-out', f).innerHTML = lines.map(l => `<p>${esc(l)}</p>`).join(''); }
    else if (e.target.matches('[data-tmwar]')) { const f = e.target, r = TOOLS.simulate_response({ rival: f.rival.value, cut_pct: +f.cut.value, weeks: 8 }); f.nextElementSibling.innerHTML = agFmt('simulate_response', r).map(l => `<p>${esc(l)}</p>`).join(''); }
  });
  app.addEventListener('keydown', e => {
    if (e.target.id !== 'tmIn' || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault(); TM.hi = clamp(TM.hi + (e.key === 'ArrowUp' ? 1 : -1), -1, TM.hist.length - 1); e.target.value = TM.hi < 0 ? '' : TM.hist[TM.hi];
  });
  // keep the live panels current while the terminal is on screen
  setInterval(() => {
    if (document.hidden) return; tmClock();
    const r = app.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const t = tmGet(TM.active); if (t) $$('.tm-p[data-k="kpi"], .tm-p[data-k="signals"], .tm-p[data-k="tasks"]', app).forEach(el => tmFill(el, t));
  }, 15000);
}

/* ---------- TOOL LIBRARY: 400+ tools that run on the platform's data, and the 340+ service catalog ---------- */
const tlSlug = s => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const tlM = v => v ? fmtMoney(v) : '—';
const tlNum = (v, d = 2) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('en-US');
const tlP = v => (Math.round(v * 1000) / 10).toLocaleString('en-US') + '%';
// calculators: [id, name, description, params [key, label, default], fn(params) -> lines]
const TL_CALC = [
  ['arpu', 'ARPU', 'Average revenue per user per month', [['revenue', 'Revenue for the period', 1.2e9], ['subs', 'Average subscribers', 4e6], ['months', 'Months in the period', 12]], p => [`ARPU: ${tlNum(p.revenue / p.subs / p.months)} per month`]],
  ['churncost', 'Churn cost', 'Revenue lost to churn over the remaining customer lifetime', [['subs', 'Subscribers', 4e6], ['churn', 'Monthly churn %', 1.8], ['arpu', 'ARPU per month', 25], ['months', 'Months of lost revenue', 24]], p => { const lost = p.subs * p.churn / 100; return [`${tlNum(lost, 0)} customers leave each month`, `Revenue lost per monthly cohort: ${tlNum(lost * p.arpu * p.months, 0)}`, `Per year: ${tlNum(lost * 12 * p.arpu * p.months, 0)}`]; }],
  ['clv', 'Customer lifetime value', 'ARPU × margin ÷ churn', [['arpu', 'ARPU per month', 25], ['margin', 'Margin %', 45], ['churn', 'Monthly churn %', 1.8]], p => [`Expected lifetime: ${tlNum(100 / p.churn, 1)} months`, `Lifetime value: ${tlNum(p.arpu * p.margin / 100 / (p.churn / 100))}`]],
  ['payback', 'Acquisition payback', 'Months to earn back the cost of winning a customer', [['cac', 'Cost to acquire', 120], ['arpu', 'ARPU per month', 25], ['margin', 'Margin %', 45]], p => [`Payback: ${tlNum(p.cac / (p.arpu * p.margin / 100), 1)} months`]],
  ['netadds', 'Net adds', 'Gross adds minus disconnections', [['gross', 'Gross adds', 120000], ['churn', 'Disconnections', 95000]], p => [`Net adds: ${tlNum(p.gross - p.churn, 0)}`, `Replacement ratio: ${tlP(p.churn / p.gross)}`]],
  ['share', 'Market share', 'Your lines as a share of the market', [['own', 'Your lines', 14.8e6], ['total', 'Market lines', 24.3e6]], p => [`Share: ${tlP(p.own / p.total)}`]],
  ['hhi', 'Market concentration (HHI)', 'Herfindahl-Hirschman index from market shares in %', [['shares', 'Shares, comma-separated', '61,39']], p => { const s = String(p.shares).split(',').map(Number).filter(x => x > 0); const h = s.reduce((a, x) => a + x * x, 0); return [`HHI: ${tlNum(h, 0)} (${h > 2500 ? 'highly concentrated' : h > 1500 ? 'moderately concentrated' : 'unconcentrated'})`]; }],
  ['ebitdam', 'EBITDA margin', 'EBITDA ÷ revenue', [['ebitda', 'EBITDA', 26.7e9], ['revenue', 'Revenue', 57.6e9]], p => [`EBITDA margin: ${tlP(p.ebitda / p.revenue)}`]],
  ['capexint', 'Capex intensity', 'Capex ÷ revenue', [['capex', 'Capex', 7.7e9], ['revenue', 'Revenue', 57.6e9]], p => [`Capex intensity: ${tlP(p.capex / p.revenue)}`]],
  ['ofcf', 'Operating free cash flow', 'EBITDA minus capex', [['ebitda', 'EBITDA', 26.7e9], ['capex', 'Capex', 7.7e9]], p => [`Operating free cash flow: ${tlNum(p.ebitda - p.capex, 0)}`, `Cash conversion: ${tlP((p.ebitda - p.capex) / p.ebitda)}`]],
  ['leverage', 'Net debt ÷ EBITDA', 'Leverage ratio', [['debt', 'Net debt', 17.7e9], ['ebitda', 'Annual EBITDA', 35.6e9]], p => [`Leverage: ${tlNum(p.debt / p.ebitda)}x`]],
  ['ev', 'Implied enterprise value', 'EV from an EV/EBITDA multiple', [['ebitda', 'Annual EBITDA', 2e9], ['multiple', 'EV/EBITDA multiple', 7.5]], p => [`Enterprise value: ${tlNum(p.ebitda * p.multiple, 0)}`]],
  ['elastic', 'Price elasticity response', 'Volume change from a price change', [['elasticity', 'Elasticity', -0.6], ['price', 'Price change %', -10]], p => { const v = p.elasticity * p.price; return [`Volume change: ${tlNum(v, 1)}%`, `Revenue change: ${tlNum(((1 + p.price / 100) * (1 + v / 100) - 1) * 100, 1)}%`]; }],
  ['breakeven', 'Price-cut break-even', 'New customers needed to offset a price cut', [['base', 'Current customers', 1e6], ['price', 'Price', 65], ['cut', 'Cut %', 10]], p => { const lost = p.base * p.price * p.cut / 100, np = p.price * (1 - p.cut / 100); return [`Monthly revenue given away: ${tlNum(lost, 0)}`, `New customers needed at the new price: ${tlNum(lost / np, 0)} (${tlP(lost / np / p.base)} of the base)`]; }],
  ['promoroi', 'Promotion ROI', 'Return on a promotion', [['margin', 'Incremental margin', 2.4e6], ['cost', 'Promotion cost', 1.5e6]], p => [`ROI: ${tlP((p.margin - p.cost) / p.cost)}`, p.margin > p.cost ? 'The promotion pays back.' : 'The promotion does not pay back.']],
  ['samplesize', 'A/B test sample size', 'Customers per group for a two-proportion test (5% significance, 80% power)', [['base', 'Control rate %', 14], ['uplift', 'Uplift to detect, points', 2]], p => { const p1 = p.base / 100, p2 = (p.base + p.uplift) / 100, pb = (p1 + p2) / 2; const n = Math.pow(1.96 * Math.sqrt(2 * pb * (1 - pb)) + 0.8416 * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2) / Math.pow(p2 - p1, 2); return [`${tlNum(Math.ceil(n), 0)} customers per group`, `${tlNum(Math.ceil(n) * 2, 0)} in total`]; }],
  ['significance', 'A/B test significance', 'Two-proportion z-test', [['n1', 'Control size', 4200], ['c1', 'Control conversions', 590], ['n2', 'Test size', 4200], ['c2', 'Test conversions', 680]], p => { const a = p.c1 / p.n1, b = p.c2 / p.n2, pb = (p.c1 + p.c2) / (p.n1 + p.n2), z = (b - a) / Math.sqrt(pb * (1 - pb) * (1 / p.n1 + 1 / p.n2)); return [`Control ${tlP(a)} vs test ${tlP(b)}`, `z = ${tlNum(z)}: ${Math.abs(z) >= 1.96 ? 'significant at 5%' : 'not significant at 5%'}`]; }],
  ['contactcap', 'Contact-cap check', 'Marketing contacts against a weekly cap', [['contacts', 'Contacts planned this week', 3], ['cap', 'Weekly cap', 2]], p => [p.contacts <= p.cap ? `Within the cap (${p.contacts} of ${p.cap})` : `Over the cap by ${p.contacts - p.cap}: drop the lowest-value contacts`]],
  ['quiethours', 'Quiet-hours check', 'Calls and SMS only between 08:00 and 21:00', [['hour', 'Planned hour (0–23)', 20]], p => [p.hour >= 8 && p.hour < 21 ? `${p.hour}:00 is allowed` : `${p.hour}:00 is outside quiet hours: move to 08:00–21:00`]],
  ['savevalue', 'Save-desk value', 'Value of saving customers net of offers', [['saves', 'Customers saved', 1200], ['clv', 'Lifetime value each', 600], ['offer', 'Offer cost each', 40]], p => [`Value kept: ${tlNum(p.saves * p.clv, 0)}`, `Net of offers: ${tlNum(p.saves * (p.clv - p.offer), 0)}`]],
  ['bundle', 'Bundle saving', 'Saving of a bundle against separate prices', [['separate', 'Separate prices total', 95], ['bundle', 'Bundle price', 79]], p => [`Saving: ${tlNum(p.separate - p.bundle)} (${tlP((p.separate - p.bundle) / p.separate)})`]],
  ['totalprice', 'Total monthly price', 'Plan price plus monthly fees', [['price', 'Plan price', 65], ['fees', 'Monthly fees', 4]], p => [`Total: ${tlNum(p.price + p.fees)} per month (${tlP(p.fees / p.price)} on top of the headline price)`]],
  ['pergb', 'Price per GB', 'Price ÷ data allowance', [['price', 'Price', 35], ['gb', 'Data GB', 20]], p => [`${tlNum(p.price / p.gb, 3)} per GB`]],
  ['permbps', 'Price per Mbps', 'Home internet value', [['price', 'Monthly price', 75], ['mbps', 'Speed Mbps', 500]], p => [`${tlNum(p.price / p.mbps, 3)} per Mbps`]],
  ['fx', 'Gulf currency converter', 'Converts USD at the official pegs (AED, SAR, QAR, BHD, OMR, JOD)', [['usd', 'USD amount', 1e6]], p => [['AED', 3.6725], ['SAR', 3.75], ['QAR', 3.64], ['BHD', 0.376], ['OMR', 0.3845], ['JOD', 0.709]].map(([c, r]) => `${c} ${tlNum(p.usd * r)}`)],
  ['cagr', 'Compound annual growth', 'CAGR between two values', [['start', 'Start value', 52.4e9], ['end', 'End value', 57.6e9], ['years', 'Years', 1]], p => [`CAGR: ${tlP(Math.pow(p.end / p.start, 1 / p.years) - 1)}`]],
  ['forecast', 'Revenue projection', 'Revenue grown at a steady rate', [['revenue', 'Revenue now', 72.9e9], ['growth', 'Growth % a year', 6], ['years', 'Years', 3]], p => Array.from({ length: Math.min(10, p.years) }, (_, i) => `Year ${i + 1}: ${tlNum(p.revenue * Math.pow(1 + p.growth / 100, i + 1), 0)}`)],
  ['fibre', 'Fibre take-up revenue', 'Homes passed → connected → revenue', [['homes', 'Homes passed', 200000], ['take', 'Take-up %', 35], ['arpu', 'ARPU per month', 75]], p => { const c = p.homes * p.take / 100; return [`${tlNum(c, 0)} connected homes`, `Revenue a year: ${tlNum(c * p.arpu * 12, 0)}`]; }],
  ['fwacap', 'Fixed-wireless capacity', 'Households a site network can serve', [['sites', 'Sites', 400], ['hh', 'Households per site', 120]], p => [`Capacity: ${tlNum(p.sites * p.hh, 0)} households`]],
  ['covgap', 'Coverage gap', 'Measured speed against the advertised speed', [['advertised', 'Advertised Mbps', 300], ['measured', 'Measured Mbps', 114]], p => [`Delivers ${tlP(p.measured / p.advertised)} of the claim`, p.measured / p.advertised < 0.5 ? 'Claim not met: fix or stop advertising it' : 'Within a reasonable range']],
  ['mhzpop', 'Spectrum price per MHz-pop', 'Auction price ÷ (MHz × population)', [['price', 'Price', 3e8], ['mhz', 'MHz', 100], ['pop', 'Population', 10e6]], p => [`${tlNum(p.price / (p.mhz * p.pop), 4)} per MHz-pop`]],
  ['tenancy', 'Tower tenancy uplift', 'Revenue from adding tenants to towers', [['towers', 'Towers', 4000], ['added', 'Tenants added per tower', 0.3], ['rent', 'Annual rent per tenant', 18000]], p => [`Extra revenue a year: ${tlNum(p.towers * p.added * p.rent, 0)}`]],
  ['roampass', 'Roaming pass value', 'Price per day of a roaming pass', [['price', 'Pass price', 99], ['days', 'Days', 7]], p => [`${tlNum(p.price / p.days)} per day`]],
  ['storeconv', 'Store conversion', 'Sales ÷ visitors', [['sales', 'Sales', 420], ['visitors', 'Visitors', 2600]], p => [`Conversion: ${tlP(p.sales / p.visitors)}`]],
  ['cpa', 'Cost per acquisition', 'Marketing spend ÷ gross adds', [['spend', 'Spend', 2.5e6], ['adds', 'Gross adds', 30000]], p => [`Cost per acquisition: ${tlNum(p.spend / p.adds)}`]],
  ['nps', 'Net Promoter Score', 'Promoters minus detractors', [['promoters', 'Promoters', 420], ['passives', 'Passives', 300], ['detractors', 'Detractors', 180]], p => { const t = p.promoters + p.passives + p.detractors; return [`NPS: ${tlNum((p.promoters - p.detractors) / t * 100, 0)}`]; }],
  ['backlog', 'Installation backlog', 'Days to clear open orders', [['orders', 'Open orders', 3600], ['capacity', 'Installs per day', 450]], p => [`${tlNum(p.orders / p.capacity, 1)} days of backlog`]],
  ['datagrowth', 'Data use projection', 'Monthly GB per user over time', [['gb', 'GB per user now', 18], ['growth', 'Growth % a year', 25], ['years', 'Years', 4]], p => Array.from({ length: Math.min(10, p.years) }, (_, i) => `Year ${i + 1}: ${tlNum(p.gb * Math.pow(1 + p.growth / 100, i + 1), 1)} GB a month`)],
  ['walletadopt', 'Wallet adoption', 'Active wallet users as a share of subscribers', [['active', 'Active wallet users', 1.2e6], ['subs', 'Subscribers', 16.5e6]], p => [`Adoption: ${tlP(p.active / p.subs)}`]],
  ['fraudrate', 'Fraud loss rate', 'Fraud losses ÷ revenue', [['loss', 'Fraud losses', 3.5e6], ['revenue', 'Revenue', 2e9]], p => [`Loss rate: ${tlNum(p.loss / p.revenue * 100, 3)}%`]],
  ['royalty', 'Royalty impact', 'Royalty paid on a revenue or profit base', [['base', 'Base', 1e9], ['rate', 'Rate %', 15]], p => [`Royalty: ${tlNum(p.base * p.rate / 100, 0)}`]],
  ['yield', 'Dividend yield', 'Dividend per share ÷ share price', [['dps', 'Dividend per share', 1.6], ['price', 'Share price', 30]], p => [`Yield: ${tlP(p.dps / p.price)}`]],
  ['capexpayback', 'Project payback', 'Years for a project to pay back', [['capex', 'Investment', 5e7], ['cash', 'Cash a year', 1.2e7]], p => [`Payback: ${tlNum(p.capex / p.cash, 1)} years`]],
  ['npv', 'Net present value', 'NPV of equal annual cash flows', [['capex', 'Investment', 5e7], ['cash', 'Cash a year', 1.2e7], ['years', 'Years', 7], ['rate', 'Discount rate %', 9]], p => { let v = -p.capex; for (let t = 1; t <= p.years; t++) v += p.cash / Math.pow(1 + p.rate / 100, t); return [`NPV: ${tlNum(v, 0)}`, v > 0 ? 'Creates value at this discount rate' : 'Destroys value at this discount rate']; }]
];
const TL_TOPICS = ['5G standalone', 'fixed wireless', 'fibre', 'eSIM', 'satellite', 'roaming', 'wallet', 'AI', 'data centre', 'towers', 'spectrum', 'regulator', 'privacy', 'price cut', 'promotion', 'churn', 'enterprise', 'IoT', 'cloud', 'cybersecurity', 'devices', 'retail stores', 'acquisition', 'dividend', 'results', 'ESG', 'energy', 'Ramadan', 'tourists', 'expatriates'];
let TL = null;
function tlBuild() {
  if (TL) return TL;
  const T = [], add = (fam, n, d, run, params) => T.push({ id: tlSlug(n), n, fam, d, run, params: params || [] });
  const ops = POS ? POS.operators : [], comps = LAND ? LAND.companies : [];
  // operator analytics by region
  [...new Set(ops.map(o => o.region))].forEach(R => {
    const in_ = () => ops.filter(o => o.region === R);
    add('Regions', `${R}: revenue ranking`, `Operators in ${R} by revenue`, () => in_().filter(revOf).sort((a, b) => revOf(b) - revOf(a)).map((o, i) => `${i + 1}. ${o.short || o.name}: ${tlM(revOf(o))} (${o.rev.period || ''})`));
    add('Regions', `${R}: growth leaders`, `Operators in ${R} by revenue growth`, () => in_().filter(o => o.growth && o.growth.v != null).sort((a, b) => b.growth.v - a.growth.v).map((o, i) => `${i + 1}. ${o.short || o.name}: ${o.growth.v > 0 ? '+' : ''}${o.growth.v}% (${o.growth.period || ''})`));
    add('Regions', `${R}: market values`, `Operators in ${R} by market value`, () => in_().filter(o => o.mcap && o.mcap.usd).sort((a, b) => b.mcap.usd - a.mcap.usd).map((o, i) => `${i + 1}. ${o.short || o.name}: ${tlM(o.mcap.usd)} (${o.mcap.asOf || ''})`));
    add('Regions', `${R}: quadrant mix`, `How ${R} operators split across the positioning quadrants`, () => { const c = {}; in_().forEach(o => { const q = POSM.ops.quad(o.x, o.y); (c[q] = c[q] || []).push(o.short || o.name); }); return Object.entries(c).map(([q, l]) => `${q} (${l.length}): ${l.join(', ')}`); });
    add('Regions', `${R}: innovation scorecard`, `Innovation checklist for ${R} operators (5G SA, fixed wireless, fibre, satellite, fintech, AI, cloud)`, () => in_().sort((a, b) => innovCount(b) - innovCount(a)).map(o => `${o.short || o.name}: ${innovCount(o)}/7 ${INNOV.filter(([k]) => o.innov && o.innov[k] && o.innov[k][0] === true).map(x => x[1]).join(', ')}`));
    add('Regions', `${R}: ownership and state stakes`, `State, sovereign, PE and infrastructure owners in ${R}`, () => in_().map(o => `${o.short || o.name}: ${(o.holders || []).filter(h => !/float/.test(h.t)).map(h => `${h.n} ${h.pct || ''}`).join('; ') || 'widely held'}`));
    add('Regions', `${R}: recent moves`, `Latest moves by ${R} operators`, () => in_().flatMap(o => (o.moves || []).map(m => [m[0], `${m[0]} · ${o.short || o.name}: ${m[1]}`])).sort((a, b) => String(b[0]).localeCompare(String(a[0]))).slice(0, 12).map(x => x[1]));
    if (in_().some(o => o.share && o.share.v != null)) add('Regions', `${R}: market shares`, `Home-market shares of ${R} operators, where sourced`, () => in_().filter(o => o.share && o.share.v != null).sort((a, b) => b.share.v - a.share.v).map(o => `${o.short || o.name}: ${o.share.v}% · ${o.share.basis || ''}`));
  });
  // country markets
  [...new Set(ops.map(o => o.country).filter(c => c && !/[/;(]/.test(c)))].sort().forEach(C => add('Countries', `${C}: market overview`, `Operators in ${C}: revenue, growth, share and market value`, () => ops.filter(o => o.country === C).sort((a, b) => revOf(b) - revOf(a)).map(o => `${o.short || o.name}: revenue ${tlM(revOf(o))}${o.growth && o.growth.v != null ? ', growth ' + o.growth.v + '%' : ''}${o.share && o.share.v != null ? ', share ' + o.share.v + '%' : ''}${o.mcap && o.mcap.usd ? ', value ' + tlM(o.mcap.usd) : ''}`)));
  // landscape segments
  [...new Set(comps.map(c => c.seg))].forEach(S => {
    const in_ = () => comps.filter(c => c.seg === S);
    add('Landscape', `${S}: largest by market value`, `${S} companies by market value`, () => in_().filter(c => c.mcap && c.mcap.usd).sort((a, b) => b.mcap.usd - a.mcap.usd).slice(0, 15).map((c, i) => `${i + 1}. ${c.name}: ${tlM(c.mcap.usd)}`));
    if (in_().some(c => c.val && c.val.usd)) add('Landscape', `${S}: private valuations`, `Latest private valuations in ${S}`, () => in_().filter(c => c.val && c.val.usd).sort((a, b) => b.val.usd - a.val.usd).slice(0, 15).map(c => `${c.name}: ${tlM(c.val.usd)} (${c.val.asOf || ''})`));
    add('Landscape', `${S}: PE, hedge-fund and state owners`, `${S} companies with private-equity, hedge-fund, infrastructure or state investors`, () => in_().filter(c => { const f = flagsOf(c); return f.pe || f.hf || f.state || f.infra; }).slice(0, 15).map(c => `${c.name}: ${(c.investors || []).map(i => i.n).slice(0, 3).join(', ')}`));
    add('Landscape', `${S}: recent moves`, `Recent moves of ${S} companies`, () => in_().filter(c => c.recent).slice(0, 12).map(c => `${c.name}: ${c.recent}`));
    add('Landscape', `${S}: market-value movers`, `${S} companies whose market value moved most since the last check`, () => in_().filter(c => c.mcap && c.mcap.usd && c.mcap.prev).map(c => [c, c.mcap.usd / c.mcap.prev - 1]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 12).map(([c, d]) => `${c.name}: ${tlPct(d)} → ${tlM(c.mcap.usd)}`));
  });
  // capital: investors and deal types
  (LAND && LAND.investors || []).forEach(I => {
    add('Capital', `${I.name}: telecom portfolio`, `${I.name} (${I.type}) telecom holdings`, () => [`${I.type}${I.aum ? ' · ' + I.aum : ''}`, `Focus: ${I.focus || '—'}`].concat((I.holdings || []).map(h => typeof h === 'string' ? h : `${h.n || h.name || ''} ${h.pct || ''} ${h.note || ''}`.trim())));
    add('Capital', `${I.name}: deals`, `Telecom deals involving ${I.name}`, () => { const k = I.name.split(/[ /(]/)[0].toLowerCase(); return (LAND.deals || []).filter(d => d.investor.toLowerCase().includes(k)).map(d => `${d.date}: ${d.investor} → ${d.target} (${d.status || ''})`); });
  });
  [...new Set((LAND && LAND.deals || []).map(d => d.type))].forEach(Ty => {
    add('Capital', `${Ty} deals`, `Telecom deals by ${Ty} investors`, () => LAND.deals.filter(d => d.type === Ty).map(d => `${d.date}: ${d.investor} → ${d.target}`));
    add('Capital', `${Ty} targets`, `What ${Ty} investors bought and why`, () => LAND.deals.filter(d => d.type === Ty).map(d => `${d.target}: ${d.what || ''}`));
  });
  // signals and the war room
  Object.keys(OPS).filter(k => k !== 'all' && k !== 'nim').forEach(k => {
    const nm = OPS[k].name;
    add('Signals', `${nm}: signal feed`, `Latest signals about ${nm}`, () => TOOLS.list_signals({ operator: nm, limit: 8 }).map(x => `[${x.id}] ${SEVL[x.severity]}: ${x.text}`));
    add('Signals', `${nm}: severity mix`, `How serious the signals about ${nm} are`, () => { const L = TOOLS.list_signals({ operator: nm, limit: 20 }); return ['crit', 'high', 'watch'].map(s => `${SEVL[s]}: ${L.filter(x => x.severity === s).length}`); });
    add('Signals', `${nm}: threat summary`, `Top signal about ${nm}, its evidence and the likely next move`, () => { const top = TOOLS.list_signals({ operator: nm, limit: 1 })[0]; if (!top) return ['No signals.']; const g = TOOLS.get_signal({ id: top.id }); return [`${g.id}: ${g.text}`, `Revenue at risk: ${tlM(g.revenue_at_risk_usd)}`, `Likely next move: ${g.predicted_next_move || '—'}`].concat((g.candidate_plays || []).slice(0, 3).map(p => `Play: ${p.play}`)); });
  });
  [...new Set(TPL.map(t => t.cls))].forEach(C => {
    add('Signals', `${C} signals`, `Signals of the ${C} class across all rivals`, () => [...events].filter(e => e.tpl.cls === C).sort((a, b) => score(b) - score(a)).slice(0, 8).map(e => `[${e.id}] ${OPS[e.tpl.op].short}: ${e.text}`));
    add('Signals', `${C} response plays`, `Candidate responses to the top ${C} signal`, () => { const e = [...events].filter(x => x.tpl.cls === C).sort((a, b) => score(b) - score(a))[0]; if (!e) return ['No signals of this class right now.']; const g = TOOLS.get_signal({ id: e.id }); return [`${g.id}: ${g.text}`].concat((g.candidate_plays || []).map(p => `${p.play}: ${p.action || ''} ${p.expected ? '(' + p.expected + ')' : ''}`)); });
  });
  ['arc', 'vtx', 'pls', 'kte'].forEach(r => [5, 10, 15, 20, 25, 30].forEach(c => add('War room', `${OPS[r].name} cuts ${c}%`, `War-room simulation: ${OPS[r].name} cuts prices ${c}% for 8 weeks`, () => agFmt('simulate_response', TOOLS.simulate_response({ rival: r, cut_pct: c, weeks: 8 })))));
  // pricing
  PLANS.forEach(P => {
    const nm = `${OPS[P.op].short} ${P.name}`;
    add('Pricing', `${nm}: rival comparison`, `${nm} against the closest rival plans`, () => agFmt('compare_plans', TOOLS.compare_plans({ plan_id: P.id })));
    add('Pricing', `${nm}: plan genes`, `Every gene of ${nm}`, () => [`Price $${P.price} · data ${P.data >= 999 ? 'unlimited' : P.data + ' GB'} · hotspot ${P.hotspot} GB`, `5G SA ${P.sa ? 'yes' : 'no'} · streaming ${P.stream ? '$' + P.stream + ' value' : 'none'} · roaming ${P.roam ? '$' + P.roam + ' value' : 'none'}`, `Contract ${P.contract ? P.contract + ' months' : 'none'} · fees $${P.fees} · satellite ${P.sat ? 'yes' : 'no'} · device credit $${P.credit}`]);
    add('Pricing', `${nm}: total price`, `${nm}: total monthly price and price per GB`, () => [`Total a month: $${P.price + P.fees}`, P.data >= 999 ? 'Unlimited data' : `Price per GB: $${tlNum((P.price + P.fees) / P.data)}`]);
  });
  [...new Set(PLANS.map(p => p.op))].forEach(o => add('Pricing', `${OPS[o].name}: plan ladder`, `${OPS[o].name}'s plans from cheapest to dearest`, () => PLANS.filter(p => p.op === o).sort((a, b) => a.price - b.price).map((p, i, a) => `${p.name}: $${p.price}${i ? ' (+' + tlP(p.price / a[i - 1].price - 1) + ')' : ''}`)));
  // predictions, geo and sizing
  ['fwa', 'cut', 'sat'].forEach(m => {
    const P = PRED.find(x => x.id === m); if (!P) return;
    add('Forecasts', `Forecast: ${P.short || P.title || m}`, 'Probability and window of a rival move', () => agFmt('predict_move', TOOLS.predict_move({ move_id: m })));
    add('Forecasts', `Sensitivity: ${P.short || P.title || m}`, 'How the forecast changes without its first signal', () => { const a = TOOLS.predict_move({ move_id: m }), b = TOOLS.predict_move({ move_id: m, exclude: [0] }); return [`With all signals: ${a.probability_pct}%`, `Without the first signal: ${b.probability_pct}%`, `Change: ${b.probability_pct - a.probability_pct} points`]; });
  });
  ['churn', 'coverage', 'retail'].forEach(L => {
    add('Geo', `${L[0].toUpperCase() + L.slice(1)} hotspots`, `Districts ranked on the ${L} layer`, () => agFmt('geo_hotspots', TOOLS.geo_hotspots({ layer: L })));
    add('Geo', `${L[0].toUpperCase() + L.slice(1)} action plan`, `What to do in the top ${L} districts`, () => TOOLS.geo_hotspots({ layer: L }).hotspots.slice(0, 3).map(h => `${h.district}: ${L === 'churn' ? 'targeted save offers and a store visit this week' : L === 'coverage' ? 'fix the gap first, then stop claims the network cannot meet' : 'staff up at peak hours and brief stores on the rival offer'}`));
  });
  SEG.forEach(S => add('Sizing', `Market size: ${S.l}`, `TAM, SAM and SOM for ${S.l}`, () => agFmt('size_market', TOOLS.size_market({ segments: [S.k] }))));
  add('Sizing', 'Market size: all segments', 'TAM, SAM and SOM across every segment', () => agFmt('size_market', TOOLS.size_market({})));
  // innovation lab
  EL_DOM.forEach(([k, dn]) => {
    add('Innovation', `${dn}: lab status`, `Tools and services for ${dn} by status`, () => { const L = elBuild().filter(x => x.k === k); return ['Live', 'Prototype', 'Service', 'Designed'].map(s => `${s}: ${L.filter(x => x.status === s).length}`); });
    add('Innovation', `${dn}: ready now`, `Live and prototype items for ${dn}`, () => elBuild().filter(x => x.k === k && (x.status === 'Live' || x.status === 'Prototype')).map(x => `${x.status}: ${x.n}`).concat(elBuild().filter(x => x.k === k && x.status === 'Service').slice(0, 4).map(x => `Service: ${x.n}`)));
  });
  // sources
  MI_SRC.forEach(S => {
    add('Sources', `${S.n}: profile`, `What ${S.n} covers and how it is collected`, () => [`Category: ${S.cat}`, `Examples: ${S.ex}`, `Collection: ${S.conn}`, `Format: ${S.fmt} · access: ${S.acc}`, `Rules: ${S.rule}`]);
    add('Sources', `${S.n}: freshness and trust`, `Half-life and reliability of ${S.n}`, () => [`Half-life: ${S.hl} hours`, `Reliability: ${Math.round(S.rel * 100)}%`, `Refresh at least every ${S.min} hour${S.min === 1 ? '' : 's'}`]);
  });
  // intelligence topics
  TL_TOPICS.forEach(t => add('Intelligence', `Intel: ${t}`, `Knowledge-base items about ${t}`, () => { const R = miSearch(t, 'all'); return R.res.slice(0, 8).map(r => `${r.d.type}: ${r.d.title}`).concat([`${R.total || R.res.length} matches in all`]); }));
  // department kits
  AG_DEPTS.forEach(D => add('Departments', `${D.n}: department kit`, `Agents, services and resources for ${D.n}`, () => [`Agents: ${D.agents.map(a => a.n).join(', ')}`, `Core services: ${D.svc.map(k => (svcByKey(k) || { name: k }).name).join(', ')}`, `Catalog services: ${SVC_CAT.filter(s => s.dept === D.k).length}`, `Resources: ${D.res.map(agResLabel).filter(Boolean).join(', ') || '—'}`]));
  // calculators
  TL_CALC.forEach(([id, n, d, params, fn]) => T.push({ id: 'calc-' + id, n: 'Calculator: ' + n, fam: 'Calculators', d, params, run: p => fn(p) }));
  const seen = new Set(); T.forEach(t => { let id = t.id, i = 2; while (seen.has(id)) id = t.id + '-' + i++; t.id = id; seen.add(id); });
  return (TL = T);
}
const tlPct = v => (v > 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
const TL_FAMS = () => [...new Set(tlBuild().map(t => t.fam))];
function tlRun(t, args) {
  const p = {}; (t.params || []).forEach(([k, , def], i) => { const v = args && (args[k] ?? args[i]); p[k] = typeof def === 'number' ? (v === undefined || v === '' || isNaN(+v) ? def : +v) : (v === undefined || v === '' ? def : String(v)); });
  const out = t.run(p); return Array.isArray(out) && out.length ? out : ['No results in the current data.'];
}
const tlFind = q => { const s = tlSlug(q); if (!s) return null; const T = tlBuild(); return T.find(t => t.id === s || t.id === 'calc-' + s) || T.find(t => tlSlug(t.n).includes(s)) || T.find(t => s.split('-').every(w => tlSlug(t.n + ' ' + t.fam).includes(w))); };
function tlPanelHtml(tid, sel) {
  const T = tlBuild(), t = sel && T.find(x => x.id === sel);
  return `<div class="tl-bar"><label class="sr" for="tlQ${tid}">Find a tool</label><input class="inp-search" id="tlQ${tid}" data-tlq type="search" placeholder="Search ${T.length} tools…" autocomplete="off"><label class="sr" for="tlF${tid}">Family</label><select class="inp" id="tlF${tid}" data-tlfam><option value="">All families</option>${TL_FAMS().map(f => `<option>${esc(f)}</option>`).join('')}</select></div>
    <div class="tl-list" data-tllist>${tlListHtml('', '')}</div>
    <div class="tl-run" data-tlrun>${t ? tlFormHtml(t) : '<p class="tiny muted">Pick a tool to run it.</p>'}</div>`;
}
function tlListHtml(q, fam) {
  const s = q.toLowerCase(), L = tlBuild().filter(t => (!fam || t.fam === fam) && (!s || (t.n + ' ' + t.d + ' ' + t.fam).toLowerCase().includes(s)));
  return L.slice(0, 60).map(t => `<button type="button" class="tl-item" data-tlpick="${esc(t.id)}"><b>${esc(t.n)}</b><span class="tiny muted">${esc(t.fam)} · ${esc(t.d)}</span></button>`).join('') + (L.length > 60 ? `<p class="tiny muted">${L.length - 60} more: narrow the search.</p>` : L.length ? '' : '<p class="small muted">No tool matches.</p>');
}
function tlFormHtml(t) {
  return `<form class="tl-form" data-tlform="${esc(t.id)}"><b>${esc(t.n)}</b><span class="tiny muted">${esc(t.d)}</span>${(t.params || []).map(([k, l, d]) => `<label class="small">${esc(l)}<input class="inp-search" name="${esc(k)}" value="${esc(String(d))}"></label>`).join('')}<button class="btn sm accent" type="submit">Run tool</button><div class="tl-out" aria-live="polite"></div></form>`;
}
// service catalog: 4 signature services and 15 standard services for every department
const SV_FOCUS = { mi: 'competitor moves and market signals', mk: 'campaigns, segments and the brand', sl: 'channels, stores and the sales pipeline', cx: 'care, complaints and customer journeys', rl: 'churn, saves and loyalty', pr: 'plans, prices and promotions', en: 'enterprise and government accounts', sm: 'small-business offers and sales', nw: 'coverage, capacity and network investment', fh: 'fibre, fixed wireless and home services', dg: 'the app, eSIM and the wallet', dv: 'devices, stores and retail operations', ro: 'roaming, wholesale and partner deals', st: 'strategy, scenarios and investments', fn: 'valuation, capex and investor relations', rg: 'consultations, licences and compliance', da: 'data quality, models and analytics', sc: 'fraud, scams and security' };
const SV_SIG = {
  mi: [['Competitor deep-dive dossier', 'A full dossier on one rival: plans, network, finances, leadership and likely next moves.', '10 business days'], ['Launch watch', 'Daily alerts on every rival plan, brand and product launch, with a same-day brief.', 'Ongoing, daily'], ['Results-day pack', 'Rival quarterly results summarized for leadership within hours of publication.', 'Same day'], ['Market map refresh', 'Positioning, shares and ownership re-checked for every operator in the market.', '2 weeks']],
  mk: [['Campaign timing audit', 'Checks when and how campaigns reach customers, against consent and quiet hours.', '2 weeks'], ['Brand health tracker', 'Monthly brand, sentiment and share-of-voice tracking against rivals.', 'Monthly'], ['Segment discovery study', 'Finds under-served customer segments and sizes each one.', '4 weeks'], ['Creative testing program', 'A/B tests messages and creatives with clean control groups.', '6 weeks']],
  sl: [['Channel performance review', 'Compares stores, dealers, online and telesales on cost and conversion.', '3 weeks'], ['Mystery shopping', 'Visits our and rival stores to compare offers, service and talk tracks.', '2 weeks'], ['Sales script refresh', 'Rewrites scripts and objection answers against current rival offers.', '1 week'], ['Win-back program', 'Designs and runs fair win-back offers for recent leavers.', '6 weeks']],
  cx: [['Journey mapping', 'Maps an end-to-end journey and ranks its pain points.', '3 weeks'], ['Complaint root-cause study', 'Finds why the top complaints happen and who should fix them.', '3 weeks'], ['Chatbot tuning', 'Retrains the care chatbot on the questions it fails.', '2 weeks'], ['NPS program setup', 'Sets up NPS surveys, closed-loop follow-up and reporting.', '4 weeks']],
  rl: [['Churn model build', 'Builds and validates a churn-risk model on tokenized data.', '6 weeks'], ['Save-desk optimization', 'Improves save-desk scripts, offers and routing.', '4 weeks'], ['Loyalty program design', 'Designs rewards that keep customers longest for the least cost.', '6 weeks'], ['Contract-end renewal program', 'Contacts customers before contracts end with the right offer.', '4 weeks']],
  pr: [['Tariff DNA review', 'Compares every plan gene by gene with rival plans.', '2 weeks'], ['Price-response war room', 'Simulates rival price moves and pre-builds responses.', '2-day workshop'], ['Promotion effectiveness audit', 'Measures which promotions paid back.', '3 weeks'], ['Plan line-up redesign', 'Simplifies the plan ladder with clear steps up.', '4 weeks']],
  en: [['Tender response desk', 'Finds, qualifies and helps write responses to tenders.', 'Ongoing'], ['Industry solution design', 'Designs a 5G, cloud and AI offer for one industry.', '4 weeks'], ['Key account plans', 'Builds 12-month plans for the largest accounts.', '3 weeks'], ['Private 5G pilot design', 'Designs a paid private-5G pilot with clear KPIs.', '4 weeks']],
  sm: [['SME offer design', 'Builds simple bundles for small businesses.', '3 weeks'], ['SME lead scoring', 'Ranks small-business leads for the sales team.', '3 weeks'], ['Merchant payments program', 'Grows wallet and point-of-sale use among merchants.', '6 weeks'], ['SME churn rescue', 'Finds and saves small-business accounts at risk.', '4 weeks']],
  nw: [['Rival build tracker', 'Tracks rival site permits, hiring and network launches.', 'Ongoing'], ['Capex prioritization study', 'Ranks network investments by contested demand and return.', '4 weeks'], ['5G standalone readiness review', 'Checks readiness for 5G standalone and slicing.', '3 weeks'], ['Network energy savings study', 'Finds safe ways to cut network power use.', '4 weeks']],
  fh: [['Fibre rollout prioritization', 'Ranks areas for new fibre by demand and rival pressure.', '4 weeks'], ['Fixed-wireless launch plan', 'Plans where and how to launch fixed wireless.', '4 weeks'], ['Installer capacity review', 'Matches installer capacity to order demand.', '2 weeks'], ['Home bundle design', 'Designs mobile and home bundles with clear savings.', '3 weeks']],
  dg: [['App store optimization', 'Improves ratings, reviews and visibility in app stores.', '4 weeks'], ['eSIM journey redesign', 'Makes eSIM sign-up instant inside the app.', '4 weeks'], ['Wallet growth program', 'Grows active wallet users with timed offers.', '8 weeks'], ['Remittance corridor pricing study', 'Prices the top transfer corridors against rivals.', '3 weeks']],
  dv: [['Device range review', 'Decides which devices to stock, drop and promote.', '2 weeks'], ['Trade-in program design', 'Designs trade-in values and logistics.', '3 weeks'], ['Store network plan', 'Decides where to open, move or close stores.', '4 weeks'], ['Device launch readiness', 'Prepares stock, pre-orders and plans for a flagship launch.', '2 weeks']],
  ro: [['Roaming pass pricing review', 'Re-prices passes for the top destinations.', '2 weeks'], ['Inbound roaming deals review', 'Improves deals with the top partner operators.', '4 weeks'], ['Wholesale and MVNO strategy', 'Decides whether and how to host MVNOs.', '4 weeks'], ['Interconnect rate review', 'Checks interconnect and termination rates.', '3 weeks']],
  st: [['Scenario planning study', 'Builds best, base and worst cases with triggers.', '4 weeks'], ['M&A screening', 'Screens acquisitions, stakes and carve-outs.', '4 weeks'], ['New business case', 'Builds the case for one new business line.', '4 weeks'], ['Board strategy pack', 'Prepares the strategy pack for the board.', '2 weeks']],
  fn: [['Peer valuation pack', 'Compares valuation with peers and explains the gap.', '2 weeks'], ['Capex return review', 'Checks the return on recent and planned capex.', '4 weeks'], ['Revenue assurance sweep', 'Finds revenue leaks in billing and usage.', '4 weeks'], ['Investor Q&A preparation', 'Prepares answers to likely investor questions.', '1 week']],
  rg: [['Consultation response drafting', 'Drafts responses to regulator consultations.', '2 weeks'], ['Spectrum auction preparation', 'Values spectrum and sets a bidding envelope.', '6 weeks'], ['Licence obligations tracker', 'Tracks every licence obligation and deadline.', 'Ongoing'], ['Competition-law review', 'Reviews planned responses for competition-law risk.', '1 week']],
  da: [['Data quality audit', 'Checks freshness and accuracy of the main data sources.', '3 weeks'], ['Model risk review', 'Checks models for drift, bias and documentation.', '3 weeks'], ['Knowledge base clean-up', 'Merges duplicates and archives outdated items.', '2 weeks'], ['A/B testing program setup', 'Sets up pre-registered tests with the right sample sizes.', '4 weeks']],
  sc: [['Fraud pattern review', 'Finds rising fraud patterns and blocks them.', '3 weeks'], ['SIM-swap protection program', 'Adds checks that stop SIM-swap attacks.', '4 weeks'], ['Scam call blocking setup', 'Blocks scam calls and messages and warns customers.', '4 weeks'], ['Breach response drill', 'Runs a data-breach drill with legal and communications.', '1 week']]
};
const SV_TYPES = [
  ['diagnostic', 'diagnostic', 'A focused review of {f}: findings, quick wins and a 90-day plan.', '10 business days'],
  ['sprint', '90-day improvement sprint', 'A cross-functional sprint that moves one KPI in {f}, with weekly reviews.', '90 days'],
  ['workshop', 'hands-on workshop', 'A one-day workshop for the team on {f}, using live platform data.', '1 day'],
  ['analyst', 'analyst on demand', 'A specialist analyst answers questions about {f}.', '4-hour response'],
  ['benchmark', 'Gulf peer benchmark', 'Benchmarks {f} against Gulf peers with sourced data.', '15 business days'],
  ['feed', 'data feed setup', 'Connects the sources the team needs for {f} into the platform.', '2–4 weeks'],
  ['dashboard', 'dashboard build', 'Builds a dashboard the team uses every week for {f}.', '3 weeks'],
  ['agents', 'agent setup and tuning', 'Configures the department’s 12 AI agents on the team’s own data.', '2 weeks'],
  ['playbook', 'playbook build', 'Writes step-by-step playbooks for the most common situations in {f}.', '2 weeks'],
  ['wargame', 'war game', 'A war game on {f} against AI-simulated rivals.', '2-day workshop'],
  ['pilot', '30-day pilot', 'A 30-day shadow-mode pilot on {f} with a clear go/no-go.', '30 days'],
  ['managed', 'managed service', 'Cellvoyant runs the monitoring and reporting for {f} every month.', 'Monthly'],
  ['brief', 'weekly brief', 'A one-page weekly brief on {f}, with sources.', 'Weekly'],
  ['training', 'training and certification', 'Trains and certifies analysts on {f}.', '4 weeks'],
  ['exec', 'executive briefing', 'A one-hour briefing for leadership on {f}.', '1 hour']
];
const SVC_CAT = AG_DEPTS.flatMap(D => (SV_SIG[D.k] || []).map(([n, d, turn]) => ({ k: `${D.k}-${tlSlug(n)}`, name: n, desc: d, turn, dept: D.k, dn: D.n, kind: 'Signature' }))
  .concat(SV_TYPES.map(([k, n, d, turn]) => ({ k: `${D.k}-${k}`, name: `${D.n} ${n}`, desc: d.replace('{f}', SV_FOCUS[D.k]), turn, dept: D.k, dn: D.n, kind: 'Standard' }))));
SVC_EXTRA.push(...SVC_CAT);
const svFind = q => { const s = String(q || '').toLowerCase().trim(); return SVC_CAT.find(x => x.k === s) || SVC_CAT.find(x => x.name.toLowerCase() === s) || SVC_CAT.find(x => x.name.toLowerCase().includes(s)); };
function svListHtml(q, dept) {
  const s = q.toLowerCase(), L = SVC_CAT.filter(x => (!dept || x.dept === dept) && (!s || (x.name + ' ' + x.desc + ' ' + x.dn).toLowerCase().includes(s)));
  return L.slice(0, 40).map(x => `<div class="sv-item"><span><b>${esc(x.name)}</b><span class="tiny muted">${esc(x.kind)} · ${esc(x.turn)} · ${esc(x.desc)}</span></span><button type="button" class="btn sm" data-svbook="${esc(x.k)}">Request</button></div>`).join('') + (L.length > 40 ? `<p class="tiny muted">${L.length - 40} more: narrow the search.</p>` : L.length ? '' : '<p class="small muted">No service matches.</p>');
}
function svPanelHtml(tid, dept) {
  return `<div class="tl-bar"><label class="sr" for="svQ${tid}">Find a service</label><input class="inp-search" id="svQ${tid}" data-svq type="search" placeholder="Search ${SVC_CAT.length} services…" autocomplete="off"><label class="sr" for="svD${tid}">Department</label><select class="inp" id="svD${tid}" data-svdept><option value="">All departments</option>${AG_DEPTS.map(D => `<option value="${D.k}"${D.k === dept ? ' selected' : ''}>${esc(D.n)}</option>`).join('')}</select></div><div class="tl-list" data-svlist>${svListHtml('', dept || '')}</div>`;
}
async function svBook(key, note) {
  const s = svcByKey(key); if (!s) throw new Error('No such service: ' + key);
  const q = await createRequest({ service: s.k, details: note || `${s.name}${s.dn ? ' (' + s.dn + ')' : ''} requested from a terminal`, urgency: 'standard', via: 'terminal' });
  toast(`Requested: ${q.service}${q.saved ? '' : ' (this visit only)'}`); return q;
}

/* ---------- FIND ANYTHING: one search over chapters, tools, agents, companies, operators and sources ---------- */
const FIND = { items: null, list: [], sel: 0 };
const txtOf = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
function findFlash(el) { if (!el) return; el.classList.remove('cv-flash'); void el.offsetWidth; el.classList.add('cv-flash'); setTimeout(() => el.classList.remove('cv-flash'), 1900); }
function findGo(el, flash) { if (!el) return; el.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: flash ? 'center' : 'start' }); if (flash) findFlash(flash === true ? el : flash); }
const findCard = (sel, name) => $$(sel).find(e => txtOf(e) === name);
function findIndex() {
  if (FIND.items) return FIND.items;
  const it = [], add = (kind, t, d, go, extra) => { if (typeof t !== 'string' || !t) return; it.push({ kind, t, d: d || '', go, s: `${t} ${d || ''} ${extra || ''}`.toLowerCase() }); };
  $$('main section[id]').forEach(s => { const h = $('h2', s); if (h) add('Chapter', txtOf(h), txtOf($('.eyebrow', s)).replace(/^\d+/, ''), () => findGo(s)); });
  $$('main h3[id], main h4[id]').forEach(h => add('Section', txtOf(h), txtOf(h.closest('section') && $('h2', h.closest('section'))), () => findGo(h, true)));
  if ($('#tmApp')) tmAll().forEach(t => add('Terminal', t.n + ' terminal', t.p, () => { tmOpen(t.id); findGo($('#terminals')); }, t.panels.map(p => (TM_PANELS[p[0]] || [''])[0]).join(' ')));
  $$('#app .tab').forEach(t => add('Console view', txtOf(t), 'Live operations console', () => { selectTab(t.id); findGo($('#app')); }));
  if ($('#operators')) {
    $$('#odTabs [data-t]').forEach(b => add('Operator desk', txtOf(b), 'Operator desk tab', () => { b.click(); findGo($('#operators')); }));
    Object.entries(OD_PROBS).forEach(([k, p]) => add('Big problem', p.t, 'Problem studio: causes, options and a 90-day plan', () => { OD.tab = 'solve'; OD.prob = k; odRender(); findGo($('#operators')); }));
  }
  if ($('#deptHub')) {
    DEPTS.forEach(d => {
      const go = () => { deptMode = 'dept'; deptSel = d.k; renderDepts(); findGo($('#departments')); };
      add('Department', d.name, d.mission, go);
      d.teams.forEach(t => add('Team', t[0], `${d.name} · ${t[1]}`, go));
    });
    SECTORS.forEach(x => add('Sector', x.name, 'What to watch: ' + x.watch.join(', '), () => { deptMode = 'sector'; sectorSel = x.k; renderDepts(); findGo($('#departments')); }));
  }
  if ($('#wsGrid')) WORKSHOPS.forEach(w => add('Workshop', w.name, `${w.level} · ${w.dur} · ${w.desc}`, () => { acadAud = 'all'; renderAcademy(); findGo(document.getElementById(wsAnchor(w.k)), true); }));
  if ($('#resGrid')) {
    const open = (sel, name, cat) => { resCat = 'All'; resQ = ''; const q = $('#resQ'); if (q) q.value = ''; renderResources(); const el = findCard(sel, name); const box = el && (el.closest('details') || el.closest('article') || el.parentElement); if (box && box.tagName === 'DETAILS') box.open = true; findGo(box || $('#resources'), box); };
    RESOURCES.forEach(r => add('Resource', r[1], `${r[0]} · ${r[2]}`, () => open('#resGrid h4', r[1])));
    PLAYBOOKS.forEach(p => add('Playbook', p[0], p[1].join(' · '), () => open('#resGrid summary b', p[0])));
    GLOSSARY.forEach(g => add('Glossary', g[0], g[1], () => open('#resGrid dt', g[0])));
  }
  if ($('#agApp')) AG_DEPTS.forEach(D => {
    add('Agent department', D.n, D.agents.map(a => a.n).join(', '), () => { AG.q = ''; $('#agFind').value = ''; AG.dept = D.k; AG.agent = D.agents[0].id; agRenderList(); findGo($('#agents')); });
    D.agents.forEach(A => add('AI agent', A.n, `${D.n} · ${A.role}`, () => { AG.q = ''; $('#agFind').value = ''; AG.dept = D.k; AG.agent = A.id; agRenderList(); findGo($('#agents')); }));
  });
  const coreLab = new Set($('#labGrid') ? LAB.map(x => x[2]) : []);
  if ($('#elGrid')) elBuild().forEach(x => { if (!coreLab.has(x.n)) add('Innovation lab', x.n, `${x.dn} · ${x.type} · ${x.status}`, () => {
    Object.assign(EL, { q: x.n, dom: 'all', type: 'all', status: 'all', shown: 36 });
    $('#elQ').value = x.n; $('#elDom').value = 'all';
    $$('#elType [data-v], #elStatus [data-v]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === 'all')));
    elRender(); findGo($('#elab')); setTimeout(() => findFlash($('#elGrid > article')), 350);
  }, x.d); });
  if ($('#labGrid')) LAB.forEach(([c, , n, d]) => add('Core lab', n, `${c} · ${d}`, () => { labCat = 'All'; renderLab(); const h = findCard('#labGrid h4', n); findGo(h ? h.closest('article') : $('#lab'), h ? h.closest('article') : null); }));
  if (POS && $('#posChart')) [['ops', POS.operators, 'Operator'], ['vendors', POS.vendors, 'Competitor']].forEach(([k, list, kind]) => list.forEach(c => {
    if (c.id === 'cellvoyant') return;
    add(kind, c.name || c.short, k === 'ops' ? [c.country, c.region].filter(Boolean).join(' · ') : c.why || '', () => {
      posS.map = k; if (k === 'ops') posS.region = c.region || 'All regions'; posS.seg = 'all'; posS.cls = 'all'; posS.sel[k] = c.id; posRender(); findGo($('#positioning'));
    }, [c.short, c.group, c.ticker].filter(Boolean).join(' '));
  }));
  if (POS && $('#odOp')) odOps().forEach(c => add('Operator desk', `${c.id === 'e-emirates-telecom' ? 'etisalat UAE' : c.name} desk`, 'Marketing plan, sales playbook, strategy, problem studio and ideas', () => { const s = $('#odOp'); s.value = c.id; s.dispatchEvent(new Event('change')); findGo($('#operators')); }, c.short));
  if (LAND && $('#landQ')) LAND.companies.forEach(c => add('Company', c.name, [c.seg, c.hq].filter(Boolean).join(' · '), () => { const q = $('#landQ'); q.value = c.name; q.dispatchEvent(new Event('input', { bubbles: true })); findGo($('#landscape')); }, (c.investors || []).map(i => i.n).join(' ')));
  $$('#sources tr[id^="src-"]').forEach(r => { const a = $('a', r); add('Source', txtOf(a) || txtOf(r).slice(0, 80), `${txtOf($('.muted', r))} · source ${r.id.slice(4)}`, () => findGo(r, true), txtOf(r)); });
  $$('main details > summary').forEach(sm => { const d = sm.parentElement; if (d.closest('#resGrid')) return; add(d.closest('.faq') ? 'Question' : 'Detail', txtOf(sm), txtOf(d.closest('section') && $('h2', d.closest('section'))), () => { d.open = true; findGo(d, true); }); });
  if ($('#tmApp')) { tlBuild().forEach(t => add('Tool', t.n, `${t.fam} · ${t.d}`, () => { tmOpen('tools'); tmCmd('TOOL ' + t.id); findGo($('#terminals')); })); SVC_CAT.forEach(x => add('Service', x.name, `${x.dn} · ${x.turn} · ${x.desc}`, () => { tmOpen('tools'); tmCmd('SERVICES ' + x.name); findGo($('#terminals')); })); }
  TOOLDEFS.forEach(d => add('Assistant tool', d.name.replace(/_/g, ' '), d.description, () => { selectTab('tab-ask'); findGo($('#app')); }));
  return (FIND.items = it);
}
const FIND_ORDER = ['Chapter', 'Terminal', 'Tool', 'Service', 'Section', 'Operator', 'Operator desk', 'Company', 'Competitor', 'AI agent', 'Agent department', 'Innovation lab', 'Core lab', 'Department', 'Team', 'Sector', 'Big problem', 'Console view', 'Workshop', 'Resource', 'Playbook', 'Glossary', 'Question', 'Detail', 'Assistant tool', 'Source'];
function findSearch(raw) {
  const q = raw.trim().toLowerCase(), items = findIndex();
  if (!q) return items.filter(x => x.kind === 'Chapter').map(x => ({ x, sc: 1 }));
  const words = q.split(/\s+/), reW = new RegExp('(^|[^a-z0-9])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const hits = [];
  for (const x of items) {
    const t = x.t.toLowerCase();
    let sc = t === q ? 100 : t.startsWith(q) ? 80 : reW.test(t) ? 62 : t.includes(q) ? 48 : words.every(w => x.s.includes(w)) ? (words.every(w => t.includes(w)) ? 34 : 18) : 0;
    if (sc) hits.push({ x, sc: sc - FIND_ORDER.indexOf(x.kind) * .3 });
  }
  hits.sort((a, b) => b.sc - a.sc);
  const per = {}, out = [];
  for (const h of hits) { per[h.x.kind] = (per[h.x.kind] || 0) + 1; if (per[h.x.kind] <= 6) out.push(h); if (out.length >= 48) break; }
  return out;
}
function findMark(s, q) {
  const i = q ? s.toLowerCase().indexOf(q.toLowerCase()) : -1;
  return i < 0 ? esc(s) : esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length));
}
function findRender() {
  const raw = $('#findQ').value, q = raw.trim(), res = findSearch(raw), list = $('#findList');
  const acts = [];
  if (q) {
    acts.push({ kind: 'Ask', t: `Ask the AI assistant: “${q}”`, d: 'Opens the assistant in the console with your question', go: () => { selectTab('tab-ask'); const a = $('#askInput'); a.value = q; findGo($('#app')); setTimeout(() => a.focus(), 300); } });
    if ($('#agTask')) acts.push({ kind: 'Ask', t: `Give an AI agent this task: “${q}”`, d: `${AG_DEPTS.find(d => d.k === AG.dept).agents.find(a => a.id === AG.agent).n} is selected; pick another agent if you like`, go: () => { $('#agTask').value = q; findGo($('#agents')); setTimeout(() => $('#agTask').focus(), 300); } });
    if ($('#miQ')) acts.push({ kind: 'Ask', t: `Search the intelligence hub for “${q}”`, d: 'Ranked results from the market intelligence knowledge base', go: () => { const m = $('#miQ'); m.value = q; m.dispatchEvent(new Event('input', { bubbles: true })); m.form ? m.form.requestSubmit && m.form.requestSubmit() : null; findGo($('#miApp') || $('#challenge2')); } });
  }
  FIND.list = [...res.map(r => r.x), ...acts];
  FIND.sel = Math.min(FIND.sel, Math.max(0, FIND.list.length - 1));
  let html = '', last = '', i = 0;
  const head = k => k === 'Ask' ? 'Ask' : k === 'Chapter' && !q ? 'Jump to a chapter' : k;
  for (const x of FIND.list) {
    if (x.kind !== last) { html += `<div class="cmdk-g" role="presentation">${esc(head(x.kind))}</div>`; last = x.kind; }
    html += `<button type="button" class="cmdk-it" role="option" id="find-${i}" data-i="${i}" aria-selected="${i === FIND.sel}"><b>${findMark(x.t, q)}</b>${x.d ? `<span>${esc(x.d.length > 120 ? x.d.slice(0, 118) + '…' : x.d)}</span>` : ''}</button>`;
    i++;
  }
  list.innerHTML = html || '<p class="cmdk-none">Nothing found. Try another word, or ask the assistant.</p>';
  $('#findQ').setAttribute('aria-activedescendant', FIND.list.length ? 'find-' + FIND.sel : '');
  $('#findN').textContent = q ? `${res.length}${res.length >= 48 ? '+' : ''} result${res.length === 1 ? '' : 's'}` : `${findIndex().length.toLocaleString()} things to find`;
}
function findMove(d) {
  if (!FIND.list.length) return;
  FIND.sel = (FIND.sel + d + FIND.list.length) % FIND.list.length;
  $$('#findList .cmdk-it').forEach(b => b.setAttribute('aria-selected', String(+b.dataset.i === FIND.sel)));
  const b = $(`#find-${FIND.sel}`); if (b) b.scrollIntoView({ block: 'nearest' });
  $('#findQ').setAttribute('aria-activedescendant', 'find-' + FIND.sel);
}
function findPick(i) {
  const x = FIND.list[i]; if (!x) return;
  $('#findDlg').close();
  setTimeout(() => { try { x.go(); } catch (err) { console.warn('Cellvoyant: find', err); } }, 0);
}
function findOpen() {
  const d = $('#findDlg'); if (d.open) return;
  FIND.sel = 0; d.showModal(); const q = $('#findQ'); q.select(); findRender();
}
function initFind() {
  const bar = $('header.top .wrap'); if (!bar || $('#findDlg')) return;
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'find-btn'; btn.setAttribute('aria-keyshortcuts', mac ? 'Meta+K' : 'Control+K');
  btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><span>Search</span><kbd>${mac ? '⌘' : 'Ctrl'} K</kbd>`;
  bar.insertBefore(btn, $('.nav-cta, .ed-cta', bar) || null);
  const dlg = document.createElement('dialog');
  dlg.className = 'cmdk'; dlg.id = 'findDlg'; dlg.setAttribute('aria-label', 'Search everything');
  dlg.innerHTML = `<div class="cmdk-in"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
    <input id="findQ" type="search" autocomplete="off" spellcheck="false" placeholder="Search chapters, tools, agents, companies, operators, sources…" role="combobox" aria-expanded="true" aria-controls="findList" aria-autocomplete="list" aria-label="Search everything">
    <button type="button" class="cmdk-x" aria-label="Close search">Esc</button></div>
    <div class="cmdk-list" id="findList" role="listbox" aria-label="Results"></div>
    <div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span id="findN" aria-live="polite"></span></div>`;
  document.body.appendChild(dlg);
  btn.addEventListener('click', findOpen);
  $('.cmdk-x', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) { dlg.close(); return; } const b = e.target.closest('.cmdk-it'); if (b) findPick(+b.dataset.i); });
  let t; $('#findQ').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { FIND.sel = 0; findRender(); $('#findList').scrollTop = 0; }, 60); });
  $('#findQ').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); findMove(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); findMove(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); findPick(FIND.sel); }
  });
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName) || (document.activeElement && document.activeElement.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) { e.preventDefault(); dlg.open ? dlg.close() : findOpen(); }
    else if (e.key === '/' && !typing && !dlg.open && !e.metaKey && !e.ctrlKey) { e.preventDefault(); findOpen(); }
  });
}

/* ---------- boot ---------- */
$('#simClock').textContent = fmtClock();
setLive(live);
renderFeed(); kpis(); renderDetail();
[renderDNA, renderPred, runWar, renderLab, initTAM, initLandscape, initPositioning, initGeo, initRules, initExport, initDashboard, initWorkbench, initDepts, initAcademy, initWorkspace, initRT, initDeck, initMI, initOD, initValue, initAgents, initElab, initResources, initLaunch, initNav, initSpectrum, initTerminals, initFind]
  .forEach(f => { try { f(); } catch (err) { console.warn('Cellvoyant: ' + f.name + ' skipped', err); } });
const radar = initRadar();
renderServices(); renderReqs();
{ const top = [...events].sort((a, b) => score(b) - score(a))[0];
  addMsg('a', mdLite(`I'm the Cellvoyant assistant. I run the console's engines for you (signal scans, Tariff DNA comparisons, prediction what-ifs, war-room simulations, market sizing), write briefs and battlecards, and book services like analyst verification or a war-gaming sprint.\nMost urgent right now: **[${top.id}]** ${top.text}.`), 'Cellvoyant assistant'); }
})();
