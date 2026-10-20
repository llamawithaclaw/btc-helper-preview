/* Budget starter (Field guide, "Your household").
   Runs only in this browser. It makes no network requests, sets no cookies and saves nothing unless the reader presses
   "Save in this browser". Downloads happen only when the reader presses a download button.
   The pure logic (amount parsing, frequency conversion, totals with blank = unknown, CSV and JSON) is exported for tests. */
(function (root) {
  'use strict';

  // The Household Planner's six groups, with its labels exactly as plan.html shows them.
  const GROUPS = [
    { id: 'income', label: 'Monthly take-home income', kind: 'flow' },
    { id: 'essentials', label: 'Essential costs per month', kind: 'flow' },
    { id: 'debtMin', label: 'Minimum debt payments per month', kind: 'flow' },
    { id: 'flexible', label: 'Flexible spending per month (optional)', kind: 'flow' },
    { id: 'cash', label: 'Accessible cash', kind: 'balance' },
    { id: 'earmarked', label: 'Money already earmarked', kind: 'balance' },
  ];
  const GROUP = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
  const FREQS = [
    { id: 'monthly', label: 'per month' },
    { id: 'weekly', label: 'per week' },
    { id: 'yearly', label: 'per year' },
  ];
  const FREQ = Object.fromEntries(FREQS.map((f) => [f.id, f]));
  const RULE = 'Weekly amounts are multiplied by 52 and divided by 12. Yearly amounts are divided by 12. Monthly amounts are used as entered. '
    + 'Each line is then rounded to the nearest cent (half a cent rounds up), and totals add the rounded lines. '
    + 'Accessible cash and money already earmarked are amounts you hold now, so they are not converted.';
  const MAX_DIGITS = 12;
  const MAX_TEXT = 120;

  // '' -> unknown (null). Plain decimal amounts only ("1250", "1,250.50", "$80"); anything else is an error, never a guess.
  function parseAmount(raw) {
    if (raw === null || raw === undefined) return { cents: null };
    const text = String(raw).trim().replace(/[,$\s]/g, '');
    if (text === '') return { cents: null };
    if (/^-/.test(text)) return { error: 'Enter zero or a positive amount.' };
    const m = /^(\d*)(?:\.(\d*))?$/.exec(text);
    if (!m || (m[1] === '' && !m[2])) return { error: 'Enter a number, such as 1250 or 1250.50, or leave it blank if you do not know yet.' };
    const whole = m[1].replace(/^0+(?=\d)/, '');
    if (whole.length > MAX_DIGITS) return { error: 'That amount is too large for this list.' };
    // Dollars and cents only: more than two decimal places is an error, never silently rounded, so the one rounding step
    // stated on the page (after converting weekly/yearly to monthly) is the only rounding there is.
    if ((m[2] || '').length > 2) return { error: 'Use dollars and cents: at most two decimal places, such as 1250.50.' };
    const frac = (m[2] || '').padEnd(2, '0');
    const cents = Number(whole || '0') * 100 + Number(frac);
    return { cents };
  }

  // Monthly cents for one line. Balances (cash, earmarked) are amounts held now and are never converted.
  function monthlyCents(cents, frequency, group) {
    if (cents === null || cents === undefined) return null;
    if (GROUP[group] && GROUP[group].kind === 'balance') return cents;
    if (frequency === 'weekly') return Math.round((cents * 52) / 12);
    if (frequency === 'yearly') return Math.round(cents / 12);
    return cents;
  }

  // One line as the preview and the exports see it.
  function lineResult(item) {
    const p = parseAmount(item.amount);
    const g = GROUP[item.group] ? item.group : 'essentials';
    const freq = GROUP[g].kind === 'balance' ? 'held' : (FREQ[item.frequency] ? item.frequency : 'monthly');
    if (p.error) return { group: g, frequency: freq, cents: null, monthly: null, status: 'invalid', error: p.error };
    if (p.cents === null) return { group: g, frequency: freq, cents: null, monthly: null, status: 'unknown' };
    return { group: g, frequency: freq, cents: p.cents, monthly: monthlyCents(p.cents, freq, g), status: 'known' };
  }

  // Totals per planner group. A group with any blank (or unreadable) line is "incomplete": its known lines are shown as a
  // part-sum, never as the total. A group with no lines has no total (it is not $0).
  function totals(state) {
    const out = {};
    for (const g of GROUPS) out[g.id] = { group: g.id, label: g.label, kind: g.kind, lines: 0, unknown: 0, invalid: 0, known: 0, total: null, status: 'none' };
    for (const c of state.categories) for (const it of c.items) {
      const r = lineResult(it); const t = out[r.group];
      t.lines += 1;
      if (r.status === 'known') t.known += r.monthly; else if (r.status === 'unknown') t.unknown += 1; else t.invalid += 1;
    }
    for (const t of Object.values(out)) {
      if (!t.lines) t.status = 'none';
      else if (t.unknown || t.invalid) t.status = 'incomplete';
      else { t.status = 'complete'; t.total = t.known; }
    }
    return out;
  }

  function isComplete(state) {
    const t = totals(state);
    return GROUPS.every((g) => t[g.id].status === 'complete');
  }

  const plain = (cents) => (cents === null || cents === undefined ? '' : `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`);
  const usd = (cents) => (cents === null || cents === undefined ? '' : `$${Math.floor(cents / 100).toLocaleString('en-US')}.${String(cents % 100).padStart(2, '0')}`);

  // ---------- CSV ----------
  const COLUMNS = [
    { id: 'category', label: 'Category' },
    { id: 'item', label: 'Item' },
    { id: 'group', label: 'Household Planner group' },
    { id: 'amount', label: 'Amount entered' },
    { id: 'frequency', label: 'How often' },
    { id: 'monthly', label: 'Monthly amount (cash and earmarked: amount held)' },
    { id: 'status', label: 'Status' },
  ];
  const STATUS_TEXT = { known: 'known', unknown: 'unknown (blank)', invalid: 'not a valid amount' };
  const FREQ_TEXT = { monthly: 'per month', weekly: 'per week', yearly: 'per year', held: 'amount held now' };

  // Control characters (other than tab, line feed and carriage return) are removed: they are never meaningful in a
  // budget list and a spreadsheet may skip them on import. A cell whose first meaningful character could start a formula
  // (= + - @, their full-width forms, a tab or a carriage return), after any leading spaces or invisible format
  // characters, gets a leading apostrophe so it stays text. Cells with a comma, quote or line break are quoted (RFC 4180).
  const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
  const INVISIBLE_LEAD = /^[\s\u00A0\u00AD\u180E\u200B-\u200F\u2028-\u202F\u205F-\u206F\u3000\uFEFF]+/u;
  function csvCell(v) {
    if (v === null || v === undefined) return '';
    let s = String(v).replace(CONTROL, '');
    if (/^[=+\-@\t\r\uFF1D\uFF0B\uFF0D\uFF20]/.test(s) || /^[=+\-@\uFF1D\uFF0B\uFF0D\uFF20]/.test(s.replace(INVISIBLE_LEAD, ''))) s = `'${s}`;
    if (/[",\r\n]/.test(s) || /^\s|\s$/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function csvRows(state, opts = {}) {
    const cols = COLUMNS.filter((c) => !opts.columns || opts.columns.includes(c.id));
    const groups = opts.groups || GROUPS.map((g) => g.id);
    const rows = [cols.map((c) => c.label)];
    for (const c of state.categories) for (const it of c.items) {
      const r = lineResult(it);
      if (!groups.includes(r.group)) continue;
      const v = { category: c.name, item: it.name, group: GROUP[r.group].label, amount: r.cents === null ? (r.status === 'invalid' ? it.amount : '') : plain(r.cents),
        frequency: FREQ_TEXT[r.frequency], monthly: plain(r.monthly), status: STATUS_TEXT[r.status] };
      rows.push(cols.map((col) => v[col.id]));
    }
    if (opts.totalRows) {
      const t = totals(state);
      for (const g of GROUPS) {
        if (!groups.includes(g.id)) continue;
        const x = t[g.id];
        const status = x.status === 'complete' ? 'total' : x.status === 'none' ? 'no lines (not counted as zero)'
          : `incomplete: ${x.unknown + x.invalid} line${x.unknown + x.invalid === 1 ? '' : 's'} without an amount; the known lines add up to ${plain(x.known)}`;
        const v = { category: 'Total', item: g.label, group: g.label, amount: '', frequency: g.kind === 'balance' ? 'amount held now' : 'per month', monthly: plain(x.total), status };
        rows.push(cols.map((col) => v[col.id]));
      }
    }
    return rows;
  }

  function buildCsv(state, opts = {}) {
    const body = csvRows(state, opts).map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
    return (opts.bom ? '﻿' : '') + body;
  }

  const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fileName = (ext, d = new Date()) => `budget-starter-${isoDate(d)}.${ext}`;

  // ---------- JSON (a plain copy of everything on screen, for any other program) ----------
  function buildJson(state, opts = {}, now = new Date()) {
    const groups = opts.groups || GROUPS.map((g) => g.id);
    const t = totals(state);
    const dollars = (c) => (c === null ? null : c / 100);
    return {
      format: 'budget-starter', version: 1, exportedAt: now.toISOString(),
      note: 'A starting list, not advice and not a score. A blank amount is unknown, never zero. Amounts are US dollars.',
      conversionRule: RULE,
      totals: GROUPS.filter((g) => groups.includes(g.id)).map((g) => ({ group: g.id, label: g.label, amountKind: g.kind === 'balance' ? 'held now' : 'monthly',
        status: t[g.id].status, total: dollars(t[g.id].total), knownLinesSum: dollars(t[g.id].lines ? t[g.id].known : null), lines: t[g.id].lines, linesWithoutAmount: t[g.id].unknown + t[g.id].invalid })),
      categories: state.categories.map((c) => ({ name: c.name, items: c.items.map((it) => ({ it, r: lineResult(it) })).filter((x) => groups.includes(x.r.group)).map(({ it, r }) => ({
        name: it.name, group: r.group, groupLabel: GROUP[r.group].label, amount: dollars(r.cents), frequency: r.frequency, monthly: dollars(r.monthly), status: r.status })) })),
    };
  }

  // ---------- state ----------
  const text = (v) => (typeof v === 'string' ? v.slice(0, MAX_TEXT) : '');
  // Only well-formed saved lists are restored; anything else is ignored rather than guessed at.
  function normalize(obj) {
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.categories) || obj.categories.length > 200) return null;
    const categories = [];
    for (const c of obj.categories) {
      if (!c || typeof c !== 'object' || !Array.isArray(c.items) || c.items.length > 500) return null;
      categories.push({ name: text(c.name), items: c.items.map((it) => ({ name: text(it && it.name), amount: text(it && it.amount),
        frequency: FREQ[it && it.frequency] ? it.frequency : 'monthly', group: GROUP[it && it.group] ? it.group : 'essentials' })) });
    }
    return { categories };
  }

  const L = (name, amount, group, frequency = 'monthly') => ({ name, amount, group, frequency });
  const EXAMPLES = {
    renters: { title: 'Example: a two-adult renter household (fictional)', categories: [
      { name: 'Pay', items: [L('Take-home pay, adult 1', '2900', 'income'), L('Take-home pay, adult 2 (paid weekly)', '410', 'income', 'weekly')] },
      { name: 'Home', items: [L('Rent', '1650', 'essentials'), L('Electricity and gas', '120', 'essentials'), L('Internet and phones', '95', 'essentials'), L("Renters' insurance", '180', 'essentials', 'yearly')] },
      { name: 'Food', items: [L('Groceries', '160', 'essentials', 'weekly'), L('Eating out', '45', 'flexible', 'weekly')] },
      { name: 'Getting around', items: [L('Car loan payment', '310', 'debtMin'), L('Fuel', '35', 'essentials', 'weekly')] },
      { name: 'Debts', items: [L('Credit card minimum payment', '75', 'debtMin'), L('Student loan payment', '140', 'debtMin')] },
      { name: 'Fun', items: [L('Streaming services', '28', 'flexible'), L('Gym', '40', 'flexible')] },
      { name: 'Money we hold', items: [L('Checking account', '1800', 'cash'), L('Savings account', '4200', 'cash'), L('Set aside for car registration', '320', 'earmarked')] },
    ] },
    parent: { title: 'Example: a single parent with irregular income (fictional)', categories: [
      { name: 'Income', items: [L('Wages', '520', 'income', 'weekly'), L('Tips (they vary; not known yet)', '', 'income', 'weekly'), L('Child support received', '300', 'income')] },
      { name: 'Home and family', items: [L('Rent', '1100', 'essentials'), L('Childcare', '95', 'essentials', 'weekly'), L('Groceries', '110', 'essentials', 'weekly'), L('Phone', '45', 'essentials')] },
      { name: 'Car', items: [L('Car insurance', '960', 'essentials', 'yearly'), L('Fuel', '25', 'essentials', 'weekly')] },
      { name: 'Payments', items: [L('Medical bill payment plan', '50', 'debtMin')] },
      { name: 'Extras', items: [L("Children's activities (not known yet)", '', 'flexible')] },
      { name: 'Savings', items: [L('Checking account', '640', 'cash'), L('Set aside for school costs', '250', 'earmarked')] },
    ] },
  };

  const STORAGE_KEY = 'btcHelperBudgetStarterV1';
  const api = { GROUPS, FREQS, RULE, COLUMNS, EXAMPLES, STORAGE_KEY, parseAmount, monthlyCents, lineResult, totals, isComplete, csvCell, csvRows, buildCsv, buildJson, fileName, normalize, plain, usd };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BudgetStarter = api;

  // ---------- browser UI ----------
  if (typeof document === 'undefined') return;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  let state = { categories: [] };
  let seq = 0;
  const uid = (p) => `${p}${(seq += 1)}`;
  const withIds = (s) => ({ categories: s.categories.map((c) => ({ id: uid('c'), name: c.name, items: c.items.map((it) => ({ id: uid('i'), ...it })) })) });
  const bare = () => ({ categories: state.categories.map((c) => ({ name: c.name, items: c.items.map(({ name, amount, frequency, group }) => ({ name, amount, frequency, group })) })) });

  const say = (id, msg) => { const el = $(id); if (el) el.textContent = msg; };
  const opts = (list, sel) => list.map((o) => `<option value="${o.id}"${o.id === sel ? ' selected' : ''}>${esc(o.label)}</option>`).join('');

  function lineHtml(c, it, n) {
    const r = lineResult(it);
    const balance = GROUP[r.group].kind === 'balance';
    const freq = balance
      ? `<div class="field bs-freq"><span class="bs-flabel">How often</span><p class="bs-held">Amount held now (not monthly)</p></div>`
      : `<div class="field bs-freq"><label for="${it.id}-freq">How often</label><select id="${it.id}-freq" data-k="frequency">${opts(FREQS, r.frequency)}</select></div>`;
    return `<li class="bs-line" data-item="${it.id}"><fieldset><legend>Line ${n}</legend>
<div class="field bs-name"><label for="${it.id}-name">What is it?</label><input type="text" id="${it.id}-name" data-k="name" maxlength="${MAX_TEXT}" autocomplete="off" value="${esc(it.name)}"></div>
<div class="field bs-amt"><label for="${it.id}-amt">Amount in dollars</label><input type="text" inputmode="decimal" id="${it.id}-amt" data-k="amount" maxlength="20" autocomplete="off" value="${esc(it.amount)}" aria-describedby="${it.id}-amt-hint ${it.id}-amt-err"${r.status === 'invalid' ? ' aria-invalid="true"' : ''}><span class="hint" id="${it.id}-amt-hint">Blank means not known yet.</span><span class="hint" id="${it.id}-amt-err" role="alert">${r.status === 'invalid' ? esc(r.error) : ''}</span></div>
${freq}
<div class="field bs-group"><label for="${it.id}-group">Household Planner group</label><select id="${it.id}-group" data-k="group">${opts(GROUPS, r.group)}</select></div>
<button type="button" class="bs-remove" data-act="remove-line">Remove line ${n}<span class="visually-hidden"> from ${esc(c.name || `category ${state.categories.indexOf(c) + 1}`)}</span></button>
</fieldset></li>`;
  }

  function renderEditor(focusSel) {
    const box = $('bs-editor');
    box.innerHTML = state.categories.map((c, ci) => `<section class="bs-cat" data-cat="${c.id}" aria-labelledby="${c.id}-h">
<h3 id="${c.id}-h">Category ${ci + 1}<span class="bs-catname">${c.name ? `: ${esc(c.name)}` : ''}</span></h3>
<div class="field bs-cname"><label for="${c.id}-name">Category name</label><input type="text" id="${c.id}-name" data-k="cname" maxlength="${MAX_TEXT}" autocomplete="off" value="${esc(c.name)}"></div>
<ol class="bs-lines">${c.items.map((it, n) => lineHtml(c, it, n + 1)).join('')}</ol>
${c.items.length ? '' : '<p class="small">No lines in this category yet.</p>'}
<div class="actions"><button type="button" data-act="add-line">Add a line<span class="visually-hidden"> to category ${ci + 1}</span></button><button type="button" class="secondary" data-act="remove-cat">Remove category ${ci + 1}<span class="visually-hidden">${c.name ? `: ${esc(c.name)}` : ''} and its lines</span></button></div>
</section>`).join('');
    $('bs-empty').hidden = state.categories.length > 0;
    renderPreview();
    if (focusSel) box.querySelector(focusSel)?.focus();
  }

  const groupStatus = (x) => (x.status === 'complete' ? usd(x.total) : x.status === 'none' ? 'No lines yet (not counted as $0)'
    : `Incomplete: ${x.unknown + x.invalid} line${x.unknown + x.invalid === 1 ? '' : 's'} without an amount${x.lines > x.unknown + x.invalid ? `. The other lines add up to ${usd(x.known)}` : ''}`);

  function renderPreview() {
    const rows = [];
    for (const c of state.categories) for (const it of c.items) {
      const r = lineResult(it);
      const val = r.status === 'known' ? usd(r.monthly) : r.status === 'unknown' ? '<span class="bs-unknown">Unknown</span>' : '<span class="bs-unknown">Not a valid amount</span>';
      const how = r.status !== 'known' ? '' : r.frequency === 'held' ? ' <span class="small">held now</span>' : r.frequency === 'monthly' ? '' : ` <span class="small">from ${usd(r.cents)} ${FREQ_TEXT[r.frequency]}</span>`;
      rows.push(`<tr><td data-label="Category">${esc(c.name || '(no name)')}</td><th scope="row" data-label="Item">${esc(it.name || '(no name)')}</th><td data-label="Group">${esc(GROUP[r.group].label)}</td><td data-label="Monthly" class="bs-num">${val}${how}</td></tr>`);
    }
    $('bs-lines-body').innerHTML = rows.join('') || '<tr><td colspan="4">No lines yet.</td></tr>';
    const t = totals(state);
    $('bs-totals-body').innerHTML = GROUPS.map((g) => `<tr data-group="${g.id}" data-status="${t[g.id].status}"><th scope="row">${esc(g.label)}${g.kind === 'balance' ? ' <span class="small">(amount held now)</span>' : ''}</th><td class="bs-num">${groupStatus(t[g.id])}</td></tr>`).join('');
    const incomplete = GROUPS.filter((g) => t[g.id].status !== 'complete');
    $('bs-overall').textContent = !state.categories.some((c) => c.items.length) ? 'Nothing to add up yet.'
      : incomplete.length ? `Incomplete: ${incomplete.length} of the six groups ${incomplete.length === 1 ? 'has' : 'have'} a blank amount or no lines. Blank amounts are unknown, not zero, so those totals are not shown as complete.`
        : 'Every line has an amount, and every group has at least one line.';
    $('bs-handoff').innerHTML = GROUPS.map((g) => `<div data-group="${g.id}"><dt>${esc(g.label)}</dt><dd>${t[g.id].status === 'complete' ? usd(t[g.id].total)
      : t[g.id].status === 'none' ? 'Not known: no lines. Leave it blank in the planner, or tick “I don’t know yet”.' : 'Not known yet: a line has no amount. Leave it blank in the planner, or tick “I don’t know yet”.'}</dd></div>`).join('');
    renderExportNote();
  }

  function exportOptions() {
    return {
      columns: [...document.querySelectorAll('input[name="bs-col"]:checked')].map((x) => x.value),
      groups: [...document.querySelectorAll('input[name="bs-grp"]:checked')].map((x) => x.value),
      bom: $('bs-bom').checked, totalRows: $('bs-totrows').checked,
    };
  }
  function renderExportNote() {
    const o = exportOptions();
    const n = state.categories.reduce((a, c) => a + c.items.filter((it) => o.groups.includes(lineResult(it).group)).length, 0);
    say('bs-export-summary', `The CSV file will be named ${fileName('csv')} and have ${o.columns.length} column${o.columns.length === 1 ? '' : 's'} and ${n} line${n === 1 ? '' : 's'}${o.totalRows ? ', plus a total row for each included group' : ''}.`);
  }

  function download(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function find(el) {
    const ce = el.closest('[data-cat]'); const le = el.closest('[data-item]');
    const c = ce && state.categories.find((x) => x.id === ce.dataset.cat);
    const it = c && le && c.items.find((x) => x.id === le.dataset.item);
    return { c, it };
  }

  function init() {
    const box = $('bs-editor');
    if (!box) return;
    $('bs-add-cat').addEventListener('click', () => {
      const c = { id: uid('c'), name: '', items: [{ id: uid('i'), name: '', amount: '', frequency: 'monthly', group: 'essentials' }] };
      state.categories.push(c); renderEditor(`#${c.id}-name`);
      say('bs-status', `Added category ${state.categories.length} with one empty line. Nothing was saved.`);
    });
    box.addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-act]'); if (!b) return;
      const { c, it } = find(b); if (!c) return;
      const ci = state.categories.indexOf(c);
      if (b.dataset.act === 'add-line') {
        const n = { id: uid('i'), name: '', amount: '', frequency: 'monthly', group: c.items.length ? c.items[c.items.length - 1].group : 'essentials' };
        c.items.push(n); renderEditor(`#${n.id}-name`); say('bs-status', `Added line ${c.items.length} to category ${ci + 1}.`);
      } else if (b.dataset.act === 'remove-line' && it) {
        const k = c.items.indexOf(it); c.items.splice(k, 1);
        const next = c.items[Math.min(k, c.items.length - 1)];
        renderEditor(next ? `#${next.id}-name` : `[data-cat="${c.id}"] button[data-act="add-line"]`);
        say('bs-status', `Removed line ${k + 1} from category ${ci + 1}.`);
      } else if (b.dataset.act === 'remove-cat') {
        state.categories.splice(ci, 1);
        const next = state.categories[Math.min(ci, state.categories.length - 1)];
        renderEditor(next ? `#${next.id}-name` : null);
        if (!next) $('bs-add-cat').focus();
        say('bs-status', `Removed category ${ci + 1} and its lines.`);
      }
    });
    box.addEventListener('input', (ev) => {
      const el = ev.target; const k = el.dataset.k; if (!k) return;
      const { c, it } = find(el); if (!c) return;
      if (k === 'cname') { c.name = el.value; const h = box.querySelector(`#${c.id}-h .bs-catname`); if (h) h.textContent = c.name ? `: ${c.name}` : ''; }
      else if (it && (k === 'name' || k === 'amount')) {
        it[k] = el.value;
        if (k === 'amount') { const r = lineResult(it); const err = $(`${it.id}-amt-err`); if (r.status === 'invalid') { el.setAttribute('aria-invalid', 'true'); if (err.textContent !== r.error) err.textContent = r.error; } else { el.removeAttribute('aria-invalid'); err.textContent = ''; } }
      }
      renderPreview();
    });
    box.addEventListener('change', (ev) => {
      const el = ev.target; const k = el.dataset.k; if (k !== 'frequency' && k !== 'group') return;
      const { it } = find(el); if (!it) return;
      const wasBalance = GROUP[it.group].kind === 'balance';
      it[k] = el.value;
      if (k === 'group' && wasBalance !== (GROUP[it.group].kind === 'balance')) renderEditor(`#${it.id}-group`);   // "How often" applies to monthly groups only
      else renderPreview();
    });
    for (const [btn, key] of [['bs-ex-a', 'renters'], ['bs-ex-b', 'parent']]) {
      $(btn).addEventListener('click', () => {
        state = withIds(EXAMPLES[key]); renderEditor();
        say('bs-status', `Loaded “${EXAMPLES[key].title}”. It is a fictional household, not real data. Nothing was saved.`);
      });
    }
    document.querySelectorAll('input[name="bs-col"], input[name="bs-grp"], #bs-bom, #bs-totrows').forEach((x) => x.addEventListener('change', renderExportNote));
    $('bs-csv').addEventListener('click', () => {
      const o = exportOptions();
      if (!o.columns.length) { say('bs-export-status', 'Choose at least one column first. Nothing was downloaded.'); return; }
      if (!o.groups.length) { say('bs-export-status', 'Choose at least one group first. Nothing was downloaded.'); return; }
      const name = fileName('csv'); download(name, buildCsv(bare(), o), 'text/csv;charset=utf-8');
      say('bs-export-status', `Downloaded ${name} to your device. You control that file.`);
    });
    $('bs-json').addEventListener('click', () => {
      const o = exportOptions();
      const name = fileName('json'); download(name, `${JSON.stringify(buildJson(bare(), { groups: o.groups.length ? o.groups : undefined }), null, 2)}\n`, 'application/json');
      say('bs-export-status', `Downloaded ${name} to your device. You control that file.`);
    });
    $('bs-save').addEventListener('click', () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), ...bare() })); say('bs-storage', 'Saved in this browser only. Use "Erase" to remove it.'); }
      catch { say('bs-storage', 'This browser did not allow saving. Nothing was stored.'); }
    });
    $('bs-erase').addEventListener('click', () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable: nothing to erase */ }
      state = { categories: [] }; renderEditor();
      say('bs-storage', 'Erased. This browser holds no budget starter data.');
    });
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      const s = saved && saved.version === 1 ? normalize(saved) : null;
      if (s) { state = withIds(s); say('bs-storage', `Loaded the list you saved in this browser on ${String(saved.savedAt || '').slice(0, 10) || 'an earlier date'}.`); }
      else if (saved) say('bs-storage', 'A saved list was found but could not be read, so it was not loaded. Erase it or start again.');
    } catch { /* private mode or blocked storage: start empty */ }
    renderEditor();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
