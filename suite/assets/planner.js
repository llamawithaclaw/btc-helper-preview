/* Household planner prototype (candidate, 2026-10-05). Local-only: no network requests, no analytics.
   Blank means unknown, never zero. Household safety takes precedence over any market read. */
(function (root) {
  'use strict';

  // Versioned assumption bundle. Each assumption names its kind and the exact research version it relates to.
  const ASSUMPTIONS = Object.freeze({
    bundle: 'household-assumptions/0.1-prototype',
    items: [
      { id: 'A1', text: 'Safety floor = both (1) emergency cash (accessible cash minus earmarked money) of at least one month of essential costs plus minimum debt payments, and (2) monthly room (take-home income minus essential costs, minimum debt payments and flexible spending) of zero or more.',
        kind: 'product assumption (an editorial choice, not an evidence-derived optimum)',
        relatedResearch: { title: 'Emergency Buffers, Borrowed Resilience, and Household Hardship (working paper)', version: 'May 2026 PDF, sha256 a6e96536…', role: 'context: describes why buffers matter; does not set this number' } },
      { id: 'A2', text: 'Buffer target is chosen by the household (1, 3 or 6 months). The default of 3 months is a common planning convention.',
        kind: 'household choice with a product default',
        relatedResearch: { title: 'When Is Credit Resilience Rather Than Fragility?', version: 'v2 review draft 2026-10-05 (unpublished)', role: 'context: borrowing can bridge timing gaps; it is not counted as buffer here' } },
      { id: 'A3', text: 'Money already earmarked (taxes, known bills, near-term purchases) is not emergency cash.',
        kind: 'definition', relatedResearch: null }
    ]
  });

  // Parse a field value: '' → null (unknown); a finite number ≥ 0 → number; anything else → an error.
  function parseAmount(raw) {
    if (raw === null || raw === undefined) return { value: null };
    const text = String(raw).trim().replace(/[,$\s]/g, '');
    if (text === '') return { value: null };
    const n = Number(text);
    if (!Number.isFinite(n)) return { error: 'Enter a number, or leave blank if unknown.' };
    if (n < 0) return { error: 'Enter zero or a positive amount.' };
    return { value: n };
  }

  const NEEDS = {
    income: 'monthly take-home income', essentials: 'monthly essential costs', debtMin: 'minimum debt payments',
    cash: 'accessible cash', earmarked: 'money already earmarked'
  };

  // Pure calculation. `input` holds numbers or null. Returns results with explicit "needs" lists.
  function calc(input) {
    const i = { income: null, essentials: null, debtMin: null, flexible: null, cash: null, earmarked: null, targetMonths: 3, ...input };
    const missing = (keys) => keys.filter((k) => i[k] === null || i[k] === undefined).map((k) => NEEDS[k]);
    const out = { assumptions: ASSUMPTIONS.bundle };

    const needKeys = ['essentials', 'debtMin'];
    out.monthlyNeed = missing(needKeys).length ? { value: null, needs: missing(needKeys) } : { value: i.essentials + i.debtMin };

    const roomKeys = ['income', 'essentials', 'debtMin'];
    if (missing(roomKeys).length) out.monthlyRoom = { value: null, needs: missing(roomKeys) };
    else {
      const before = i.income - i.essentials - i.debtMin;
      out.roomBeforeFlexible = before;
      // Unknown flexible spending makes the actual room unknown (never assumed zero).
      out.monthlyRoom = i.flexible === null || i.flexible === undefined
        ? { value: null, needs: ['flexible spending (or 0)'], subtotalBeforeFlexible: before }
        : { value: before - i.flexible };
    }

    const cashKeys = ['cash', 'earmarked'];
    out.emergencyCash = missing(cashKeys).length ? { value: null, needs: missing(cashKeys) } : { value: Math.max(0, i.cash - i.earmarked), shortfallOfEarmarks: Math.max(0, i.earmarked - i.cash) };

    if (out.monthlyNeed.value === null || out.emergencyCash.value === null) {
      out.bufferMonths = { value: null, needs: [...(out.monthlyNeed.needs ?? []), ...(out.emergencyCash.needs ?? [])] };
    } else if (out.monthlyNeed.value === 0) {
      out.bufferMonths = { value: null, note: 'Monthly need is zero, so months of buffer are not meaningful.' };
    } else {
      out.bufferMonths = { value: out.emergencyCash.value / out.monthlyNeed.value };
    }

    const floor = out.monthlyNeed.value;           // A1: one month of need
    const target = out.monthlyNeed.value === null ? null : out.monthlyNeed.value * i.targetMonths;
    out.floor = { value: floor, months: 1 };
    out.target = { value: target, months: i.targetMonths };

    // Status. Unknowns never produce a reassuring status (fail closed). Buffer adequacy and budget
    // completeness are separate: an unknown flexible-spending answer can still show the buffer, but it
    // blocks any optional-investing message.
    const roomKnown = out.monthlyRoom.value !== null;
    const definitelyNegative = (roomKnown && out.monthlyRoom.value < 0) || (out.roomBeforeFlexible !== undefined && out.roomBeforeFlexible < 0);
    let status;
    if (out.bufferMonths.value === null || out.roomBeforeFlexible === undefined) status = 'incomplete';
    else if (definitelyNegative || out.bufferMonths.value < 1) status = 'floor_not_met';
    else if (out.bufferMonths.value < i.targetMonths) status = 'building';
    else status = 'target_met';
    out.status = status;
    out.budgetComplete = roomKnown;

    // Optional investing (any asset, including Bitcoin) is only ever discussed once the floor is met,
    // the budget is complete, and there is positive monthly room.
    out.optionalInvesting = (() => {
      if (status === 'incomplete') return { allowed: false, text: 'Some answers are unknown, so this planner does not say anything about optional investing yet.' };
      if (status === 'floor_not_met') return { allowed: false, text: 'Household safety first: optional investing, including any Bitcoin plan, waits until the safety floor is met. This holds whatever any market read says.' };
      if (!roomKnown) return { allowed: false, text: 'Enter your flexible spending (or 0) to see whether any monthly room is left for optional investing. Until then this planner says nothing about it.' };
      if (out.monthlyRoom.value <= 0) return { allowed: false, text: 'There is no monthly room left after spending, so there is nothing to consider for optional investing.' };
      if (status === 'building') return { allowed: false, text: 'Your floor is met, and the buffer is still building toward your target. Building the buffer usually comes before optional investing.' };
      return { allowed: true, text: 'Your buffer meets the target you chose. Any optional investing, in any asset or none, comes from monthly room after essentials.' };
    })();

    if (status === 'building' && roomKnown && out.monthlyRoom.value > 0) {
      out.monthsToTarget = Math.ceil((target - out.emergencyCash.value) / out.monthlyRoom.value);
    }
    return out;
  }

  // Presentation only: puts a calc() result into words. It reads calc() outputs and never changes them.
  // The safety floor (A1) has two parts, cash and monthly room, and the text always names the part that decides.
  const usd = (v) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function explain(r, values = {}) {
    const room = r.monthlyRoom.value;            // null when unknown
    const before = r.roomBeforeFlexible;         // undefined when income, essentials or debt is unknown
    const cash = r.emergencyCash.value; const floor = r.floor.value;
    const cashPart = r.bufferMonths.value === null ? 'unknown' : r.bufferMonths.value >= 1 ? 'met' : 'not_met';
    const roomPart = room !== null ? (room >= 0 ? 'met' : 'not_met') : (before !== undefined && before < 0 ? 'not_met' : 'unknown');
    const flexBlank = before !== undefined && room === null;
    // Known monthly shortfall; with flexible spending blank it is a minimum ("at least").
    const shortfall = room !== null && room < 0 ? -room : before !== undefined && before < 0 ? -before : null;
    const gap = shortfall === null ? '' : `${flexBlank ? 'at least ' : ''}${usd(shortfall)}`;
    const shortfallText = shortfall === null ? ''
      : room === null ? `Your essential costs and minimum debt payments alone are ${usd(shortfall)} a month more than your take-home income, so you spend at least ${usd(shortfall)} a month more than you take home. Flexible spending is not known yet and would add to that.`
      : before < 0 && room === before ? `Your essential costs and minimum debt payments are ${usd(shortfall)} a month more than your take-home income, so you spend ${usd(shortfall)} a month more than you take home.`
      : before < 0 ? `You spend ${usd(shortfall)} a month more than you take home. Your essential costs and minimum debt payments alone are already ${usd(-before)} more than your income.`
      : `You spend ${usd(shortfall)} a month more than you take home. Your essential costs and minimum debt payments fit within your income, but flexible spending of ${usd(values.flexible ?? 0)} takes you over.`;
    const roomUnknownText = `Flexible spending is blank, so the planner cannot tell whether you spend less than you take home. Before flexible spending, ${usd(before ?? 0)} a month is left. If your flexible spending is more than that, you are spending more than you take home, and the safety floor is not met.`;
    const missingText = 'some answers it needs are missing (listed below).';
    const floorCheck = [
      { part: 'cash', label: 'Cash', state: cashPart, text: cashPart === 'unknown' ? missingText
        : `emergency cash of ${usd(cash)} ${cashPart === 'met' ? 'covers at least' : 'is less than'} one month of essential costs and minimum debt payments (${usd(floor)}).` },
      { part: 'room', label: 'Monthly room', state: roomPart, text: roomPart === 'met' ? (room === 0 ? '$0 a month. You do not spend more than you take home, but nothing is left over.' : `${usd(room)} a month. You do not spend more than you take home.`)
        : roomPart === 'not_met' ? `a shortfall of ${gap} a month. You spend more than you take home.`
        : before !== undefined ? `flexible spending is blank (${usd(before)} a month is left before flexible spending).`
        : missingText }
    ];
    const noMoney = 'no money for optional investing or extra purchases, including any Bitcoin plan, has been shown, whatever any market read says.';
    let title; let summary; let nextStep = null; let investingNote = null;
    if (r.status === 'incomplete') {
      title = 'Not enough information yet';
      summary = 'Some answers are unknown. That is fine: the result names exactly what is missing instead of guessing.';
      if (shortfall !== null) summary += ` What is already clear: ${shortfallText.charAt(0).toLowerCase()}${shortfallText.slice(1)} The safety floor is not met while that is so, whatever the missing answers turn out to be.`;
      nextStep = shortfall !== null ? `Fill in the missing answers listed below. Closing the monthly shortfall of ${gap} comes first either way.` : 'Fill in the missing answers listed below to finish the check.';
      investingNote = `Until then, ${noMoney}`;
    } else if (r.status === 'floor_not_met') {
      title = 'Safety floor not yet met';
      if (roomPart === 'not_met' && cashPart === 'met') {
        summary = `${shortfallText} Your emergency cash covers at least one month, but savings alone do not meet the safety floor while you spend more than you take home: the gap is paid from savings every month.`;
        nextStep = `Next step: close the monthly shortfall of ${gap} (spend less or bring in more). Your cash already covers the one-month minimum, so a bigger buffer is not the first priority.`;
      } else if (roomPart === 'not_met') {
        summary = `${shortfallText} Your emergency cash of ${usd(cash)} is also less than one month of essential costs and minimum debt payments (${usd(floor)}).`;
        nextStep = `Next step: focus on essentials and close the monthly shortfall of ${gap} first. A buffer cannot grow while you spend more than you take home.`;
      } else {
        summary = `Your emergency cash of ${usd(cash)} is less than one month of essential costs and minimum debt payments (${usd(floor)}).${roomPart === 'unknown' ? ' Your monthly room is not known yet, because flexible spending is blank.' : ''}`;
        nextStep = `Next step: build emergency cash up to one month of essential costs and minimum debt payments (${usd(floor)}).${roomPart === 'unknown' ? ' Also enter your flexible spending (or 0), so the planner can check your monthly room.' : ''}`;
      }
    } else {
      const target = r.status === 'target_met';
      const cashText = target ? 'Your emergency cash meets the target you chose.' : 'Your emergency cash covers at least one month of need.';
      if (roomPart === 'unknown') {
        title = target ? 'Buffer target met, monthly room unknown' : 'Cash floor covered, monthly room unknown';
        summary = `${cashText} ${roomUnknownText}`;
        nextStep = 'Next step: enter your flexible spending (or 0) to finish the check.';
        investingNote = `Until then, ${noMoney}`;
      } else if (room === 0) {
        title = target ? 'Buffer target met, no monthly room' : 'Floor met, no monthly room';
        summary = `${cashText} Your monthly room is $0: everything you take home is already spent${target ? '' : ', so the buffer cannot grow from income'}.`;
        investingNote = 'That includes any Bitcoin plan, whatever any market read says.';
      } else {
        title = target ? 'Buffer target met' : 'Floor met, buffer building';
        summary = `${cashText} You spend less than you take home.`;
        if (!target) investingNote = 'This holds whatever any market read says.';
      }
    }
    const roomLine = `Monthly room = take-home income − essential costs − minimum debt payments − flexible spending = ${room !== null ? `${usd(room)}${room < 0 ? ' (a monthly shortfall)' : ''}`
      : before !== undefined ? `unknown, because flexible spending is blank (${before < 0 ? `already a shortfall of ${usd(-before)}` : usd(before)} before flexible spending)` : 'unknown'}`;
    return { title, summary, nextStep, floorCheck, investingNote, roomLine };
  }

  const STORAGE_KEY = 'suitePlannerPrototypeV1';
  const api = { ASSUMPTIONS, parseAmount, calc, explain, STORAGE_KEY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SuitePlanner = api;

  // ---------- browser UI ----------
  if (typeof document === 'undefined') return;
  const money = (v) => (v === null ? '—' : v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }));
  const FIELDS = ['income', 'essentials', 'debtMin', 'flexible', 'cash', 'earmarked'];

  function readForm(form) {
    const values = {}; const errors = {};
    for (const f of FIELDS) {
      const el = form.elements[f];
      const unknownBox = form.elements[`${f}Unknown`];
      if (unknownBox && unknownBox.checked) { values[f] = null; continue; }
      const p = parseAmount(el.value);
      if (p.error) errors[f] = p.error; else values[f] = p.value;
    }
    const t = form.elements.targetMonths; values.targetMonths = Number(t.value) || 3;
    return { values, errors };
  }

  function showErrors(form, errors) {
    for (const f of FIELDS) {
      const el = form.elements[f]; const msg = document.getElementById(`${f}-error`);
      if (errors[f]) { el.setAttribute('aria-invalid', 'true'); msg.textContent = errors[f]; }
      else { el.removeAttribute('aria-invalid'); msg.textContent = ''; }
    }
  }

  const PART_STATE = { met: 'met', not_met: 'not met', unknown: 'not known yet' };

  function render(result, values) {
    const box = document.getElementById('result');
    const needsList = (r) => (r.needs ? `<span class="muted">needs: ${r.needs.join(', ')}</span>` : '');
    const ex = explain(result, values);
    box.innerHTML = `
      <h2 id="result-title" tabindex="-1">${ex.title}</h2>
      <p>${ex.summary}</p>
      ${ex.nextStep ? `<p>${ex.nextStep.replace(/^Next step:/, '<strong>Next step:</strong>')}</p>` : ''}
      <h3 id="floor-check-h">Safety floor check (both parts must be met)</h3>
      <ul class="floor-check" aria-labelledby="floor-check-h">${ex.floorCheck.map((c) => `<li data-part="${c.part}" data-state="${c.state}"><strong>${c.label} (${PART_STATE[c.state]}):</strong> ${c.text}</li>`).join('')}</ul>
      <div class="cards">
        <div class="card"><span class="kind">Calculation</span><h3>Months of buffer</h3><p class="small"><a href="#assumption-A3">What counts as emergency cash?</a></p><p class="result-figure">${result.bufferMonths.value === null ? '—' : result.bufferMonths.value.toFixed(1)}</p>${needsList(result.bufferMonths)}${result.bufferMonths.note ? `<p class="small">${result.bufferMonths.note}</p>` : ''}</div>
        <div class="card"><span class="kind">Calculation</span><h3>Monthly room</h3><p class="result-figure">${money(result.monthlyRoom.value)}</p>${needsList(result.monthlyRoom)}${result.monthlyRoom.subtotalBeforeFlexible !== undefined ? `<p class="small">Before flexible spending: ${money(result.monthlyRoom.subtotalBeforeFlexible)}</p>` : ''}</div>
        <div class="card"><span class="kind">Assumption A1</span><h3>Safety floor</h3><p class="result-figure">${money(result.floor.value)}</p><p class="small">Cash part: one month of essentials and minimum debt payments. The floor also needs monthly room of $0 or more. <a href="#assumption-A1">Why one month?</a></p></div>
      </div>
      <div class="${result.optionalInvesting.allowed ? 'ok' : result.status === 'incomplete' ? 'note' : 'warn'}"><p>${result.status === 'floor_not_met' ? result.optionalInvesting.text.replace('Household safety first:', '<strong>Household safety first:</strong>') : result.optionalInvesting.text}${ex.investingNote ? ` ${ex.investingNote}` : ''}</p></div>
      ${result.monthsToTarget ? `<p>At your current monthly room, about <strong>${result.monthsToTarget} month${result.monthsToTarget === 1 ? '' : 's'}</strong> to reach a ${result.target.months}-month buffer (${money(result.target.value)}), if all room is saved. <span class="muted">(Illustration: no interest, no changes in spending.)</span></p>` : ''}
      ${result.emergencyCash.shortfallOfEarmarks > 0 ? '<p class="warn">Earmarked money is larger than your cash, so known bills are not fully covered.</p>' : ''}
      <details><summary>How this was calculated</summary>
        <ul>
          <li>Monthly need = essential costs + minimum debt payments = ${money(result.monthlyNeed.value)}</li>
          <li>Emergency cash = accessible cash − earmarked money = ${money(result.emergencyCash.value)} (assumption A3)</li>
          <li>Months of buffer = emergency cash ÷ monthly need</li>
          <li>${ex.roomLine}</li>
          <li>Safety floor (assumption A1) = both parts: emergency cash of at least one month of need, and monthly room of $0 or more. Savings alone do not meet the floor while you spend more than you take home.</li>
          <li>Blank answers are treated as unknown, never as zero.</li>
          <li>Borrowing is not counted as buffer: <a href="#assumption-credit">why, and the research behind it</a>.</li>
        </ul></details>`;
    box.hidden = false;
  }

  function init() {
    const form = document.getElementById('planner');
    if (!form) return;
    const steps = [...form.querySelectorAll('[data-step]')];
    const progress = [...document.querySelectorAll('.progress li')];
    let current = 0;
    const show = (n, moveFocus = true) => {
      current = n;
      steps.forEach((s, idx) => { s.hidden = idx !== n; });
      progress.forEach((p, idx) => (idx === n ? p.setAttribute('aria-current', 'step') : p.removeAttribute('aria-current')));
      if (moveFocus) steps[n].querySelector('input:not([disabled]), select, button')?.focus();
    };
    form.addEventListener('click', (ev) => {
      const t = ev.target.closest('button[data-go]');
      if (!t) return;
      ev.preventDefault();
      const { values, errors } = readForm(form);
      showErrors(form, errors);
      const stepFields = [...steps[current].querySelectorAll('input[type="text"]')].map((x) => x.name);
      if (t.dataset.go === 'next' && stepFields.some((f) => errors[f])) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
      if (t.dataset.go === 'next') show(Math.min(current + 1, steps.length - 1));
      if (t.dataset.go === 'back') show(Math.max(current - 1, 0));
      if (t.dataset.go === 'result') {
        if (Object.keys(errors).length) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
        document.getElementById('result-status').textContent = '';
        render(calc(values), values);
        document.getElementById('result-title')?.focus();
      }
    });
    // Any edit makes a shown result obsolete: clear it and say so.
    const invalidate = () => {
      const box = document.getElementById('result');
      if (!box.hidden) {
        box.hidden = true; box.innerHTML = '';
        document.getElementById('result-status').textContent = 'Your answers changed, so the earlier result was cleared. Press "See my result" again.';
      }
    };
    form.addEventListener('input', invalidate);
    form.addEventListener('change', invalidate);
    for (const f of FIELDS) {
      const box = form.elements[`${f}Unknown`];
      if (box) box.addEventListener('change', () => { form.elements[f].disabled = box.checked; if (box.checked) form.elements[f].value = ''; });
    }
    document.getElementById('example')?.addEventListener('click', () => {
      const ex = { income: 4200, essentials: 2400, debtMin: 180, flexible: 450, cash: 6500, earmarked: 900 };
      for (const [k, v] of Object.entries(ex)) { form.elements[k].value = v; form.elements[k].disabled = false; const b = form.elements[`${k}Unknown`]; if (b) b.checked = false; }
      invalidate();
      document.getElementById('storage-status').textContent = 'Filled a fictional example household. Nothing was saved.';
    });
    const status = document.getElementById('storage-status');
    document.getElementById('save')?.addEventListener('click', () => {
      const { values } = readForm(form);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, assumptions: ASSUMPTIONS.bundle, savedAt: new Date().toISOString(), values })); status.textContent = 'Saved in this browser only. Use "Erase" to remove it.'; }
      catch { status.textContent = 'This browser did not allow saving. Nothing was stored.'; }
    });
    document.getElementById('erase')?.addEventListener('click', () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable: nothing to erase */ }
      form.reset(); FIELDS.forEach((f) => { form.elements[f].disabled = false; });
      document.getElementById('result').hidden = true; document.getElementById('result').innerHTML = ''; show(0);
      status.textContent = 'Erased. This browser holds no planner data.';
    });
    document.getElementById('export')?.addEventListener('click', () => {
      const { values } = readForm(form);
      const blob = new Blob([JSON.stringify({ version: 1, assumptions: ASSUMPTIONS.bundle, exportedAt: new Date().toISOString(), values }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'household-plan.json'; a.click(); URL.revokeObjectURL(a.href);
      status.textContent = 'Downloaded a copy to your device. You control that file.';
    });
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.values && saved.assumptions !== ASSUMPTIONS.bundle) {
        status.textContent = `You saved answers under different planner assumptions (${saved.assumptions ?? 'unknown'}). They were not loaded automatically; erase them or re-enter your answers.`;
      } else if (saved?.values) {
        const t = String(saved.values.targetMonths);
        if (['1', '3', '6'].includes(t)) form.elements.targetMonths.value = t;
        else status.textContent = 'Your saved buffer target was not valid, so it was not restored. Choose it again in step 3.';
        for (const f of FIELDS) {
          const v = saved.values[f];
          if (v === null || v === undefined) { const b = form.elements[`${f}Unknown`]; if (b) { b.checked = true; form.elements[f].disabled = true; } }
          else form.elements[f].value = v;
        }
        if (!status.textContent) status.textContent = `Loaded answers you saved in this browser on ${saved.savedAt?.slice(0, 10)}, including your ${t}-month target.`;
      }
    } catch { /* private mode or blocked storage: start empty */ }
    show(0, false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
