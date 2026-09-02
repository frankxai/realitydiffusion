/**
 * The Reality Check workbench.
 *
 * State lives in one plain object, persisted to localStorage on every change and
 * nowhere else. There is no fetch, no XHR, no beacon, no worker, and no import
 * from any origin but this one — the CSP in index.html enforces that rather than
 * trusting this file. The engine is the same module the tests run against.
 */

import { INDICATORS, indicatorsFor, getIndicator, CATALOG_REVIEWED_AT } from './src/engine/indicators.js';
import { FAILURE_MODES } from './src/engine/failure-modes.js';
import { scoreClaim, BAND_LABEL, BANDS } from './src/engine/confidence.js';
import { exportMarkdown, exportJson, flagCertainty } from './src/engine/report.js';
import { meta } from './src/schema/types.js';

const STORE_KEY = 'reality-check.case.v1';
const OWNER = 'reviewer:local';
const M = () => meta(OWNER);

const FAMILY_NOTE = {
  provenance: 'Where the file says it came from, and whether that chain holds.',
  metadata: 'What is written inside the file. Editable by anyone, stripped by every platform.',
  distribution: 'How the material moved through the world, and who moved it first.',
  content: 'What is visible in the material itself. The weakest family, and the one that decays fastest.',
  signal: 'Machine readings and acoustic properties, including anything a detector told you.',
  corroboration: 'What independent records say about the event the material depicts.',
};

const BLANK = {
  title: '',
  kind: 'image',
  surfacedOn: '',
  claimedOrigin: '',
  chainOfCustody: 'unknown',
  recompression: 'unknown',
  descriptor: '',
  claim: '',
  falsifier: '',
  disposition: 'seek-more-evidence',
  reviewer: '',
  rationale: '',
  answers: {},   // indicatorId -> {state, note}
  alternatives: {}, // "indicatorId::index" -> {status, reason}
  createdAt: new Date().toISOString(),
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...BLANK };
    return { ...BLANK, ...JSON.parse(raw) };
  } catch {
    return { ...BLANK };
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    note('This browser refused to save the case locally. Export before you close the tab.');
  }
}

const $ = (id) => document.getElementById(id);

/* ---------- field binding ---------- */

const FIELDS = {
  'f-title': 'title',
  'f-kind': 'kind',
  'f-surfaced': 'surfacedOn',
  'f-origin': 'claimedOrigin',
  'f-custody': 'chainOfCustody',
  'f-recompression': 'recompression',
  'f-descriptor': 'descriptor',
  'f-claim': 'claim',
  'f-falsifier': 'falsifier',
  'f-disposition': 'disposition',
  'f-reviewer': 'reviewer',
  'f-rationale': 'rationale',
};

for (const [id, key] of Object.entries(FIELDS)) {
  const el = $(id);
  el.value = state[key] ?? '';
  el.addEventListener('input', () => {
    state[key] = el.value;
    save();
    if (key === 'kind') renderChecklist();
    if (key === 'claim') renderCertainty();
    renderAlternatives();
    renderReading();
  });
  el.addEventListener('change', () => {
    state[key] = el.value;
    save();
    if (key === 'kind') renderChecklist();
    renderReading();
  });
}

/* ---------- checklist ---------- */

const STATES = [
  ['observed', 'Observed'],
  ['absent', 'Checked, not present'],
  ['unknown', 'Not checked'],
  ['not-applicable', 'Not applicable'],
];

function renderChecklist() {
  const root = $('checklist');
  root.textContent = '';
  const applicable = indicatorsFor(state.kind);
  const families = [...new Set(applicable.map((i) => i.family))];

  for (const family of families) {
    const section = el('section', { class: 'family' });
    section.append(el('h3', {}, family));
    section.append(el('p', {}, FAMILY_NOTE[family] ?? ''));

    for (const ind of applicable.filter((i) => i.family === family)) {
      section.append(renderIndicator(ind));
    }
    root.append(section);
  }
}

function renderIndicator(ind) {
  const wrap = el('div', { class: 'item' });
  const fs = el('fieldset');
  const legend = el('legend', {}, ind.question);
  legend.append(el('span', { class: 'weight' }, `  weight ${ind.weight}${ind.basis === 'absence' ? ' · absence' : ''}`));
  fs.append(legend);

  const answers = el('div', { class: 'answers' });
  const current = state.answers[ind.id]?.state ?? '';
  for (const [value, label] of STATES) {
    const input = el('input', { type: 'radio', name: `ind-${ind.id}`, value });
    if (current === value) input.checked = true;
    input.addEventListener('change', () => {
      state.answers[ind.id] = { ...(state.answers[ind.id] ?? {}), state: value };
      save();
      renderAlternatives();
      renderReading();
      renderFailureModes();
    });
    answers.append(el('label', {}, input, document.createTextNode(label)));
  }
  fs.append(answers);

  const noteBox = el('textarea', { rows: '2', placeholder: 'What exactly did you see, and on which copy?', 'aria-label': `Note for: ${ind.question}` });
  noteBox.value = state.answers[ind.id]?.note ?? '';
  noteBox.addEventListener('input', () => {
    patch(ind.id, { note: noteBox.value });
  });
  fs.append(noteBox);

  const source = el('input', { type: 'text', placeholder: 'Source consulted, if any', 'aria-label': `Source for: ${ind.question}` });
  source.value = state.answers[ind.id]?.source ?? '';
  source.addEventListener('input', () => { patch(ind.id, { source: source.value }); });
  fs.append(source);

  if (ind.family === 'signal' && ind.id.startsWith('detector-')) {
    fs.append(toolFields(ind));
  }
  wrap.append(fs);

  const why = el('details', { class: 'why' });
  why.append(el('summary', {}, 'How to answer this, and how it goes wrong'));
  why.append(el('h4', {}, 'Rule'));
  why.append(el('p', {}, ind.evaluationRule));
  why.append(el('h4', {}, 'Why it misleads'));
  why.append(el('p', {}, ind.teaching));
  why.append(el('h4', {}, 'Innocent explanations'));
  const ul = el('ul');
  for (const a of ind.alternatives) ul.append(el('li', {}, a));
  why.append(ul);
  wrap.append(why);
  return wrap;
}

/**
 * Detector entry. A tool result is recorded as a third-party claim with a
 * calibration status, because "what did it say" and "does anyone know how often
 * it is wrong on media like this" are different questions. The engine reads the
 * second one and caps the claim accordingly.
 */
function toolFields(ind) {
  const box = el('div', { class: 'tool' });
  const name = el('input', { type: 'text', placeholder: 'Which tool, and which version', 'aria-label': 'Detector name and version' });
  name.value = state.answers[ind.id]?.tool ?? '';
  name.addEventListener('input', () => { patch(ind.id, { tool: name.value }); renderReading(); });
  box.append(el('label', { for: `cal-${ind.id}` }, 'Detector, and whether its error rate is published'), name);

  const cal = el('select', { id: `cal-${ind.id}` });
  for (const [value, label] of [
    ['unknown', 'No published error rate for media like this'],
    ['vendor-claim-only', 'Vendor states accuracy, no benchmark reference'],
    ['published-benchmark', 'Published benchmark on comparable media'],
  ]) {
    const opt = el('option', { value }, label);
    if ((state.answers[ind.id]?.calibration ?? 'unknown') === value) opt.selected = true;
    cal.append(opt);
  }
  cal.addEventListener('change', () => { patch(ind.id, { calibration: cal.value }); renderReading(); });
  box.append(cal);
  return box;
}

function patch(indicatorId, fields) {
  state.answers[indicatorId] = { state: 'unknown', ...(state.answers[indicatorId] ?? {}), ...fields };
  save();
}

/* ---------- alternatives ---------- */

function activeAlternatives() {
  const out = [];
  for (const [indicatorId, answer] of Object.entries(state.answers)) {
    if (answer.state !== 'observed') continue;
    const ind = getIndicator(indicatorId);
    if (!ind) continue;
    ind.alternatives.forEach((statement, i) => {
      const key = `${indicatorId}::${i}`;
      const held = state.alternatives[key] ?? { status: 'open', reason: '' };
      out.push({ key, statement, ...held });
    });
  }
  return out;
}

function renderAlternatives() {
  const root = $('alternatives');
  root.textContent = '';
  const items = activeAlternatives();
  if (items.length === 0) {
    root.append(el('p', { class: 'empty' }, 'Answer a question above and the alternative explanations that come with it will appear here.'));
    return;
  }
  for (const item of items) {
    const box = el('div', { class: 'alt' });
    box.append(el('p', {}, item.statement));
    const status = el('div', { class: 'status' });
    for (const [value, label] of [['open', 'Still open'], ['weakened', 'Weakened'], ['ruled-out', 'Ruled out']]) {
      const input = el('input', { type: 'radio', name: `alt-${item.key}`, value });
      if (item.status === value) input.checked = true;
      input.addEventListener('change', () => {
        state.alternatives[item.key] = { ...(state.alternatives[item.key] ?? {}), status: value };
        save();
        renderAlternatives();
        renderReading();
      });
      status.append(el('label', {}, input, document.createTextNode(label)));
    }
    box.append(status);
    if (item.status !== 'open') {
      const reason = el('input', { type: 'text', placeholder: 'Why this no longer explains what you saw', 'aria-label': `Reason for: ${item.statement}` });
      reason.value = item.reason ?? '';
      reason.addEventListener('input', () => {
        state.alternatives[item.key] = { ...(state.alternatives[item.key] ?? { status: item.status }), reason: reason.value };
        save();
        renderReading();
      });
      box.append(reason);
    }
    root.append(box);
  }
}

/* ---------- report assembly ---------- */

function buildReport() {
  const at = new Date().toISOString();
  const evidenceId = 'item-1';
  const sources = [];
  const toolResults = [];
  const observations = Object.entries(state.answers)
    .filter(([id, a]) => getIndicator(id) && a.state)
    .map(([id, a], i) => {
      const sourceIds = [];
      const toolResultIds = [];
      if (a.source) {
        const sid = `src-${sources.length + 1}`;
        sources.push({ id: sid, kind: 'other', label: a.source, locator: null, independence: 'unknown', accessedAt: at, meta: M() });
        sourceIds.push(sid);
      }
      if (a.tool) {
        const tid = `tool-${toolResults.length + 1}`;
        toolResults.push({
          id: tid,
          tool: a.tool,
          toolVersion: null,
          reported: a.note || (a.state === 'observed' ? 'Reported a result the reviewer recorded as observed.' : 'Recorded without a stated result.'),
          calibration: a.calibration ?? 'unknown',
          benchmarkRef: null,
          meta: meta(OWNER, { provenance: 'tool-reported' }),
        });
        toolResultIds.push(tid);
      }
      return {
        id: `obs-${i + 1}`,
        indicatorId: id,
        evidenceId,
        state: a.state,
        note: a.note ?? '',
        sourceIds,
        toolResultIds,
        recordedAt: at,
        meta: M(),
      };
    });

  const alternatives = activeAlternatives().map((a, i) => ({
    id: `alt-${i + 1}`,
    statement: a.statement,
    status: a.status,
    ...(a.status === 'open' ? {} : { reason: a.reason || 'Closed without a reason recorded.' }),
    meta: M(),
  }));

  if (alternatives.length === 0) {
    alternatives.push({
      id: 'alt-1',
      statement: 'The material is what it is claimed to be, and nothing observed here rules that out.',
      status: 'open',
      meta: M(),
    });
  }

  return {
    schema: 'RealityCheck.v1',
    id: 'local-case',
    title: state.title || 'Untitled case',
    createdAt: state.createdAt ?? at,
    updatedAt: at,
    capture: {
      id: 'capture-1',
      surfacedOn: state.surfacedOn || 'not recorded',
      claimedOrigin: state.claimedOrigin || null,
      claimedCapturedAt: null,
      chainOfCustody: state.chainOfCustody,
      recompression: state.recompression,
      meta: M(),
    },
    evidence: [{
      id: evidenceId,
      kind: state.kind,
      descriptor: state.descriptor || 'not described',
      locator: null,
      firstSeenAt: null,
      meta: M(),
    }],
    sources,
    observations,
    toolResults,
    claims: [{
      id: 'claim-1',
      statement: state.claim || 'The material is not what it is presented as.',
      evidenceIds: [evidenceId],
      observationIds: observations.map((o) => o.id),
      alternatives,
      falsifier: state.falsifier || '',
      meta: M(),
    }],
    reviewers: state.reviewer
      ? [{ id: 'rev-1', handle: state.reviewer, role: 'primary', declaredInterest: null, meta: M() }]
      : [],
    decision: {
      id: 'dec-1',
      disposition: state.disposition,
      rationale: state.rationale || 'No rationale recorded.',
      nextEvidenceSought: state.falsifier ? [state.falsifier] : [],
      decidedBy: state.reviewer || null,
      decidedAt: at,
      meta: M(),
    },
    versions: [{ version: 1, at, summary: 'Recorded in the Reality Check workbench.', supersedes: null, meta: M() }],
  };
}

function scored() {
  const report = buildReport();
  const confidence = scoreClaim(report.claims[0], { observations: report.observations, toolResults: report.toolResults });
  report.claims[0].confidence = confidence;
  return report;
}

/* ---------- reading ---------- */

function renderReading() {
  const root = $('reading');
  root.textContent = '';
  const report = scored();
  const c = report.claims[0].confidence;
  const answered = report.observations.filter((o) => o.state === 'observed').length;

  if (answered === 0 && report.observations.length === 0) {
    root.append(el('p', { class: 'empty' }, 'Nothing recorded yet. The reading appears as you answer the checklist, and it will usually be weaker than you expect.'));
    return;
  }

  root.append(el('p', { class: 'band' }, BAND_LABEL[c.band]));
  root.append(el('p', { class: 'lean' }, `Lean: ${leanText(c.lean)} · score ${c.score.toFixed(2)} · ceiling ${c.cap}`));

  const meter = el('div', { class: 'meter', role: 'img', 'aria-label': `Band ${c.band}, ${BANDS.indexOf(c.band) + 1} of ${BANDS.length}` });
  BANDS.forEach((b, i) => meter.append(el('span', { class: i <= BANDS.indexOf(c.band) && c.band !== 'indeterminate' ? 'on' : '' })));
  root.append(meter);

  root.append(noteBlock('Why it cannot go higher', c.capReason));
  root.append(noteBlock('Residual doubt', c.residualDoubt));
  root.append(el('p', { class: 'breadth' },
    `${c.breadth.observationsUsed} observation(s) across ${c.breadth.familiesObserved} evidence family(ies); ${c.breadth.unknownCount} question(s) left unanswered. Catalog last reviewed ${CATALOG_REVIEWED_AT}.`));

  renderPreview(report);
}

function noteBlock(label, text) {
  const p = el('p', { class: 'reading-note' });
  p.append(el('strong', {}, label));
  p.append(document.createTextNode(text));
  return p;
}

function leanText(lean) {
  return {
    'toward-synthetic': 'toward synthetic or manipulated',
    'toward-authentic': 'toward what it is claimed to be',
    conflicting: 'conflicting — the evidence points both ways',
    none: 'none',
  }[lean];
}

function renderCertainty() {
  const box = $('certainty-warning');
  const violations = flagCertainty(scored());
  if (violations.length === 0) { box.hidden = true; box.textContent = ''; return; }
  box.hidden = false;
  box.textContent = `Certainty language blocks the export: ${violations.map((v) => `"${v.phrase}" in ${v.where}`).join(', ')}. State the lean, the ceiling, and what would overturn it instead.`;
}

/* ---------- failure modes ---------- */

function renderFailureModes() {
  const root = $('failure-modes');
  root.textContent = '';
  const answered = Object.entries(state.answers).filter(([, a]) => a.state === 'observed' || a.state === 'absent').map(([id]) => id);
  const exposed = new Set();
  for (const ind of INDICATORS) {
    if (!answered.includes(ind.id)) continue;
    for (const fm of ind.failureModes ?? []) exposed.add(fm);
  }
  for (const fm of FAILURE_MODES) {
    const box = el('div', { class: 'fm' });
    const h = el('h3', {}, fm.name);
    if (exposed.has(fm.id)) h.append(el('span', { class: 'tag' }, 'in play here'));
    box.append(h);
    box.append(el('p', {}, fm.what));
    box.append(el('p', { class: 'guard' }, fm.guard));
    root.append(box);
  }
}

/* ---------- export ---------- */

function renderPreview(report) {
  try {
    $('preview').textContent = exportMarkdown(report, { exportedAt: new Date().toISOString() });
  } catch (err) {
    $('preview').textContent = err.message;
  }
}

function download(filename, text, type) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = el('a', { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    note(`${filename} written. It contains what you typed, and nothing about your device.`);
  } catch {
    note('This browser blocked the download. Use "Copy report to clipboard" instead — the full text is in the preview below.');
  }
}

function note(text) { $('export-note').textContent = text; }

function withReport(fn) {
  try {
    fn(scored());
  } catch (err) {
    note(err.message);
    renderCertainty();
  }
}

$('btn-md').addEventListener('click', () => withReport((r) => {
  download(`reality-check-${slug(state.title)}.md`, exportMarkdown(r, { exportedAt: new Date().toISOString() }), 'text/markdown');
}));

$('btn-json').addEventListener('click', () => withReport((r) => {
  download(`reality-check-${slug(state.title)}.json`, JSON.stringify(exportJson(r, { exportedAt: new Date().toISOString() }), null, 2), 'application/json');
}));

$('btn-copy').addEventListener('click', () => withReport(async (r) => {
  const md = exportMarkdown(r, { exportedAt: new Date().toISOString() });
  try {
    await navigator.clipboard.writeText(md);
    note('Report copied.');
  } catch {
    note('Clipboard access was refused. The full report is in the preview below; select it and copy.');
  }
}));

$('btn-reset').addEventListener('click', () => {
  state = { ...BLANK, createdAt: new Date().toISOString(), answers: {}, alternatives: {} };
  try { localStorage.removeItem(STORE_KEY); } catch { /* nothing to clear */ }
  for (const [id, key] of Object.entries(FIELDS)) $(id).value = state[key] ?? '';
  renderAll();
  note('Case cleared from this browser.');
});

/* ---------- helpers ---------- */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === '' && k === 'class') continue;
    node.setAttribute(k, v);
  }
  for (const c of children) node.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return node;
}

function slug(s) {
  return (s || 'case').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'case';
}

function renderAll() {
  renderChecklist();
  renderAlternatives();
  renderReading();
  renderCertainty();
  renderFailureModes();
}

renderAll();
