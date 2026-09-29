/* Cellvoyant prototype — all market data below is simulated for fictional operators. */
(() => {
'use strict';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
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

/* ---------- COMMAND CENTER ---------- */
const feedEl = $('#feed'), detailEl = $('#detail');
function kpis(tick) {
  const open = events.filter(e => fresh(e) > .1);
  const crit = events.filter(e => e.tpl.sev === 'crit' && fresh(e) > .25).length;
  const risk = open.reduce((s, e) => s + (e.tpl.risk || 0) * e.tpl.conf * fresh(e), 0);
  if (tick || !riskHist.length) { riskHist.push(risk); if (riskHist.length > 60) riskHist.shift(); }
  const today = 37 + events.filter(e => simDate(e.t).toDateString() === simDate().toDateString()).length;
  const nim = PLANS.find(p => p.id === 'nim-u'), rivals = PLANS.filter(p => ['vtx-p', 'arc-p'].includes(p.id));
  const gap = nim.price - Math.min(...rivals.map(p => p.price));
  $('#kpis').innerHTML = [
    ['Signals today', fmtInt(today), '<span class="muted">from 41 sources</span>'],
    ['Critical, still fresh', crit, crit ? '<span class="down">act within hours</span>' : '<span class="up">all clear</span>'],
    ['Revenue at risk (open)', fmtMoney(risk), '<span class="warn">confidence × freshness · live</span>' + spark(riskHist)],
    ['Net port balance · 7d', (netPorts > 0 ? '+' : '−') + fmtInt(Math.abs(netPorts)), '<span class="down">vs −860 last week</span>'],
    ['Premium price gap', (gap >= 0 ? '+$' : '−$') + Math.abs(gap), '<span class="muted">vs cheapest rival MNO</span>']
  ].map(([l, v, d]) => `<div class="kpi"><span class="l">${l}</span><span class="v">${v}</span><span class="d">${d}</span></div>`).join('');
  $('#critCount').textContent = crit; $('#critCount').hidden = !crit;
}
function evHTML(e) {
  const T = e.tpl, f = fresh(e), op = OPS[T.op];
  return `<button type="button" class="ev${e.id === selId ? ' sel' : ''}${e.isNew ? ' new' : ''}" data-id="${e.id}">
    <span class="tm">${esc(fmtHM(e.t))}</span>
    <span class="body">
      <span class="line1"><span class="sev ${T.sev}">${SEVL[T.sev]}</span><span class="opt" style="--c:${opColor(T.op)}">${esc(op.short)}</span><span class="cls">${esc(T.cls)}</span>${e.rule ? '<span class="rulehit" title="' + esc(e.rule) + '">Rule</span>' : ''}</span>
      <span class="txt">${esc(e.text)}</span>
      <span class="meta"><span>${e.id}</span><span>${esc(T.src)}</span><span>conf ${Math.round(T.conf * 100)}%</span><span>${T.risk ? fmtMoney(T.risk) + ' at risk' : 'strategic'}</span></span>
      <span class="fresh${f < .25 ? ' stale' : ''}"><span>½-life ${fmtHL(T.hl)}</span><span class="track"><i style="width:${(f * 100).toFixed(1)}%"></i></span><span data-f>${Math.round(f * 100)}% fresh</span></span>
    </span></button>`;
}
function renderFeed() {
  const list = [...events].sort((a, b) => score(b) - score(a));
  feedEl.innerHTML = list.map(evHTML).join('');
  $('#feedCount').textContent = events.length + ' signals';
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
    <div class="row-btns"><button class="btn sm accent" type="button" id="draftBtn">Draft a counter-move with Claude</button>${WAR_OPS.includes(T.op) ? '<button class="btn sm" type="button" id="toWar">Simulate in War room</button>' : ''}</div>
    <div id="draftOut"></div>
  </div>`;
  $('#draftBtn').onclick = ev => draftCounter(e, ev.currentTarget, $('#draftOut'));
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
  b.setAttribute('aria-pressed', String(v)); $('span', b).textContent = v ? 'Live' : 'Paused';
  $('#liveDot').style.background = v ? 'var(--good)' : 'var(--line-strong)'; $('#liveDot').classList.toggle('live', v);
}
$('#liveBtn').onclick = () => setLive(!live);
function spawnEvent() {
  let i; do { i = Math.floor(rand() * TPL.length); } while (i === lastTpl);
  lastTpl = i;
  const e = mkEvent(i, simMin); e.isNew = true; events.push(e); onNewEvent(e);
  if (TPL[i].cls === 'Port-outs') netPorts -= 120 + Math.round(rand() * 80); else netPorts -= Math.round(rand() * 25);
  if (events.length > 24) { const oldest = [...events].sort((a, b) => score(a) - score(b))[0]; if (oldest.id !== selId) events.splice(events.indexOf(oldest), 1); }
  renderFeed(); kpis();
}
setInterval(() => {
  if (!live || document.hidden) return;
  simMin += 5; ticks++;
  $('#simClock').textContent = fmtClock();
  refreshFreshness();
  if (ticks % 8 === 0) spawnEvent(); kpis(true); GEO.t++; if (ticks % 3 === 0) geoJitter(); geoTick();
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
  { k: 'board_brief', name: 'Weekly board brief', turn: 'weekly', desc: 'An analyst-reviewed brief on rivals, capital moves and recommended responses.' }
];
const svcByKey = k => SERVICES.find(s => s.k === k);

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
  $('#svcList').innerHTML = SERVICES.map(s => `<div class="svc"><div class="hd"><b>${esc(s.name)}</b><button type="button" class="btn sm" data-open="${s.k}" aria-expanded="false">Request</button></div>
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
  capital_deals({ investor_type, target, investor, limit } = {}) {
    if (!LAND) throw new Error('Landscape data is not loaded.');
    const t = String(investor_type || '').toLowerCase(), tg = String(target || '').toLowerCase(), iv = String(investor || '').toLowerCase();
    const map = { pe: 'pe', 'private equity': 'pe', 'hedge fund': 'hf', hf: 'hf', activist: 'hf', infrastructure: 'infra', infra: 'infra', state: 'state', sovereign: 'state' };
    return (LAND.deals || []).filter(d => (!t || typeKey(d.type) === (map[t] || t)) && (!tg || String(d.target).toLowerCase().includes(tg)) && (!iv || String(d.investor).toLowerCase().includes(iv))).slice(0, clamp(+limit || 10, 1, 30))
      .map(d => ({ date: d.date, investor: d.investor, investor_type: d.type, target: d.target, what: d.what, value_usd: d.usd || null, status: d.status, source: d.src }));
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
const SUGG = ['What needs action today?', 'Where is churn spreading right now?', 'Rank operators by market cap to revenue', 'Alert me when Arcline makes a High pricing move', 'Export a brief', 'Which competitors are backed by hedge funds or private equity?', 'Simulate Arcline cutting 20% for 12 weeks and recommend a response', 'Compare our Unlimited Plus with the closest rival plans', 'What if we exclude the equipment filing from the Vertex FWA prediction?', 'Write a battlecard against Kite', 'Book an analyst to verify the Arcline price cut', 'Size the market for MVNOs and fiber ISPs only', 'Draft a 5-bullet exec brief for the CMO', 'What services can I request?'];
$('#sugg').innerHTML = SUGG.map(s => `<button type="button">${esc(s)}</button>`).join('');
$('#sugg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
const TOOLBOX = [
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
  ['Service desk', 'request_service', 'Book an analyst to verify the Arcline price cut.']
];
$('#toolbox').innerHTML = TOOLBOX.map(([n, t, p]) => `<button type="button" class="tool-btn" data-p="${esc(p)}"><span class="tb-h"><b>${esc(n)}</b><code>${t}</code></span><span>“${esc(p)}”</span></button>`).join('');
$('#toolbox').addEventListener('click', e => { const b = e.target.closest('.tool-btn'); if (b) ask(b.dataset.p); });

/* ---------- tabs ---------- */
const TABS = $$('.tab');
function selectTab(id) {
  TABS.forEach(t => { const on = t.id === id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = !on; });
  if (id === 'tab-cc') radar && radar.draw();
  if (id === 'tab-geo') { geoSize(); geoTick(); }
  if (id === 'tab-cap') renderCapital();
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
  const ctx = cv.getContext('2d'), css = getComputedStyle(document.documentElement), tok = n => css.getPropertyValue(n).trim();
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
  ['Trust & guardrails', '', 'Provenance Ledger', 'Every insight keeps a record of the sources, timestamps and reliability scores behind it.', 'Decisions that can’t be audited later']
];
const LIVE = new Set(['Move Predictor', 'Tariff DNA Sequencer', 'Market Digital Twin (War Room)', 'Insight Half-Life Router', 'Churn Contagion Radar', 'Coverage Truth Engine', 'Activist & Capital Radar', 'Alert Rules & Watchlists', 'One-click Brief Export', 'Cellvoyant AI Assistant']);
let labCat = 'All';
function renderLab() {
  const cats = ['All', 'Live now', ...new Set(LAB.map(x => x[0]))];
  const inCat = (x, c) => c === 'All' || (c === 'Live now' ? LIVE.has(x[2]) : x[0] === c);
  $('#labFilters').innerHTML = cats.map(c => `<button type="button" aria-pressed="${c === labCat}" data-c="${esc(c)}">${esc(c)}<span class="cnt">${LAB.filter(x => inCat(x, c)).length}</span></button>`).join('');
  const BL = { core: '<span class="badge core">Patent core</span>', new: '<span class="badge new">New idea</span>', svc: '<span class="badge svc">Service</span>' };
  $('#labGrid').innerHTML = LAB.filter(x => inCat(x, labCat)).map(([c, b, n, d, s]) => `<article class="inno"><div class="top-l"><span class="cat">${esc(c)}</span><span class="badges">${LIVE.has(n) ? '<span class="badge live">Live in console</span>' : ''}${BL[b] || ''}</span></div><h4>${esc(n)}</h4><p>${esc(d)}</p><div class="solves"><b>Solves:</b> ${esc(s)}</div></article>`).join('');
}
$('#labFilters').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; labCat = b.dataset.c; renderLab(); });

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
  const rows = C.map(c => ({ c, f: flagsOf(c) })).filter(({ c, f }) => (land.seg === 'All' || c.seg === land.seg) && (!land.capOnly || f.pe || f.hf || f.state || f.infra) && (!q || [c.name, c.hq, c.own, c.what, (c.investors || []).map(i => i.n).join(' ')].join(' ').toLowerCase().includes(q)))
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
      return `<tr class="row${land.openId === c.id ? ' open' : ''}" data-id="${esc(c.id)}" tabindex="0" aria-expanded="${land.openId === c.id}"><td class="co"><b>${esc(c.name)}</b><span>${esc(c.hq || '')}${c.ticker ? ' · ' + esc(c.ticker) : ''}</span></td><td>${esc(c.seg)}</td><td>${esc(c.own || '—')}<br>${badges}</td><td class="inv-names">${inv.slice(0, 4).map(i => esc(i.n)).join(', ') || '—'}${inv.length > 4 ? ` +${inv.length - 4}` : ''}</td><td class="num">${sz}</td><td class="num">${rv}</td><td class="num">${showAmt(c.raised) || '—'}</td></tr>` + detail;
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
function landRender() { if (!LAND) return; landDrawTiles(); landDrawSegs(); landDrawTable(); landDrawDeals(); landDrawInv(); renderCapital(); tickLandAge(); }
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

/* ---------- nav highlight ---------- */
function initNav() {
  const links = $$('.nav a'); const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.classList.remove('on')); const a = map.get(e.target.id); if (a) a.classList.add('on'); } }), { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

/* ---------- boot ---------- */
$('#simClock').textContent = fmtClock();
setLive(live);
renderFeed(); kpis(); renderDetail();
renderDNA(); renderPred(); runWar(); renderLab(); initTAM(); initLandscape(); initGeo(); initRules(); initExport(); initNav();
initSpectrum();
const radar = initRadar();
renderServices(); renderReqs();
{ const top = [...events].sort((a, b) => score(b) - score(a))[0];
  addMsg('a', mdLite(`I'm the Cellvoyant assistant. I run the console's engines for you (signal scans, Tariff DNA comparisons, prediction what-ifs, war-room simulations, market sizing), write briefs and battlecards, and book services like analyst verification or a war-gaming sprint.\nMost urgent right now: **[${top.id}]** ${top.text}.`), 'Cellvoyant assistant'); }
})();
