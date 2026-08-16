# BTC Helper Public Methodology

## Plain-English purpose

BTC Helper is a public daily Bitcoin model posture and private-plan translation aid. It does **not** try to predict tomorrow's price. It tries to answer a narrower practical question:

> Given today's public model posture and source health, how does a user's prewritten baseline-and-reserve rule map the current state?

The public methodology exists so a reader can understand what the daily read means, what the public decision record preserves, what the benchmark does and does not prove, and how to interpret degraded-data warnings.

## How to read the daily output

Each public read has four main parts.

### 1. Baseline instruction

The baseline instruction says what happens to the scheduled accumulation plan:

- **Continue**: the user's written baseline rule remains unchanged.
- **Hold**: BTC Helper affects the written baseline only when the user has explicitly selected an advanced baseline-affecting rule.

The default educational setting keeps the baseline separate from BTC Helper's optional-reserve context.

### 2. Reserve instruction

The reserve instruction says what happens to optional reserve capital:

- **Hold**: leave optional reserve untouched.
- **Review**: consider potentially optional reserve only if the user's written plan and household resilience boundary allow it.
- **Build**: let optional allocation accumulate as reserve rather than adding extra buying.

A user still executes manually outside BTC Helper.

### 3. Market context

Market context explains the backdrop behind the plan translation:

- **Aggressive**: conditions favor reviewing potentially optional reserve if the user's plan and household boundary allow it.
- **Normal**: the written baseline rule remains unchanged.
- **Cautious**: conditions are mixed; avoid discretionary extra buys.
- **Pause**: stand down from fresh discretionary accumulation until conditions improve.
- **Unclear**: the current source run does not support a sufficiently reliable market-context classification. BTC Helper does not infer a stronger posture from incomplete evidence.

These are accumulation contexts, not short-term trading signals.

Unclear is only the market-context label. It does not silently become every other state in the system. A degraded read may also show decision status as insufficient signal, baseline translation as written baseline unchanged, reserve translation as Hold, source health as Reduced, coverage as Limited, or benchmark eligibility as Withheld. Those fields describe different parts of the public contract.

### 4. Source health

Source health describes whether the current read is operationally useful enough to interpret. It reflects source coverage, freshness, internal consistency, and degraded-run handling.

It is **not** a probability that Bitcoin will go up or down.

A degraded run can still be published if the system can describe the limitation honestly. The point is to avoid pretending weak inputs are strong.

The public source-health rubric is based on named components:

- **Freshness**: whether each source is current for its own expected cadence.
- **Coverage**: whether required domains have enough public inputs to interpret the read.
- **Acquisition reliability**: whether collection was direct, fallback, import-assisted, or unstable.
- **Reproducibility/manual-review risk**: whether a reader can understand the public source family and timing without reconstructing the private engine.
- **Substitution severity**: whether missing inputs were replaced, softened, or withheld from benchmark language.

Exact model weights, private thresholds, and override logic remain private. The public purpose of this rubric is to make degraded or partially manual conditions visible instead of hiding them inside a single confidence label.

## What the benchmark tracks

BTC Helper compares two simple hypothetical accumulation paths:

- **Baseline DCA**: buys the same fixed daily amount every day.
- **BTC Helper policy**: follows the public posture using a reserve-aware rule.

The primary benchmark objective is behavior divergence and process accountability, not short-term price prediction. The public benchmark asks whether a frozen prospective reserve-aware policy has actually changed allocation behavior versus an equal-capital baseline, and whether those differences can be reviewed without rewriting history after the fact.

A useful public benchmark must preserve gap handling: degraded runs, missing publication dates, or weak coverage should be visible and should suppress or qualify performance language. Equal-capital alternatives and future seeded-reserve tests belong to the validation program, but no public timing advantage should be inferred before meaningful policy divergence exists.

The current public reserve rule is intentionally simple:

- **Normal / Cautious**: baseline continues; optional reserve is held.
- **Pause**: baseline remains separate by default; optional allocation is held or built as reserve.
- **Aggressive**: baseline continues; potentially optional reserve is marked for review if prior reserve exists and household checks allow it.

This benchmark asks whether BTC Helper's public posture creates auditable reserve-aware behavior over time. It is not a claim of optimized trading performance, alpha, predictive accuracy, or superior timing.

The current public result should be read modestly: no reserve deployment has occurred, the public-policy reserve is zero unless a future summary says otherwise, 0 forward reads have changed allocation behavior where that remains factually current, and BTC Helper has not demonstrated timing advantage when it has not diverged from fixed DCA.

The planned benchmark program should distinguish fixed DCA from future equal-capital reserve tests:

- seeded reserve
- reserve with cash/T-bill-style yield or cash drag
- calendar deployment
- simple drawdown rule
- valuation-only rule
- matched random deployment
- frozen BTC Helper policy evaluated prospectively before methodology changes

## Why benchmark claims may be withheld

Benchmark snippets are intentionally suppressed or softened when daily coverage is degraded. BTC Helper should not create promotional-looking claims from weak source conditions.

That means a day can still have a posture and rationale, while performance comparison language is withheld because the run was not clean enough for that kind of public claim.

The public benchmark contract separates calculated values from interpretive eligibility:

- **Calculated**: technical accounting values may continue to exist for continuity and auditability.
- **Eligibility**: the current read states whether those values are eligible for public behavioral interpretation.
- **Withheld reason**: limited coverage, degraded run, insufficient signal, or another explicit reason explains why a comparison is withheld.
- **Public status**: withheld reads show a withheld public status rather than an interpretive status such as in-line.
- **Internal status**: technical calculations may retain an internal state for accounting review.

BTC Helper currently uses the conservative exposure decision of keeping technical values in the standard public record while clearly marking them as calculated but not eligible for interpretation on withheld reads. The goal is transparency without turning degraded-run arithmetic into an efficacy claim.

## Data-source posture

BTC Helper currently uses a mixed-source public beta posture:

- price data from practical live market sources
- on-chain and holder-context references where available
- derivatives/leverage context from practical market references
- macro context from public macro-style sources
- import-assisted or fallback handling where stronger live coverage is not yet available

Provider and source families are public. Direct source links, exact series mappings, raw inputs, thresholds, weights, overrides, and calibration details remain private.

The public output should communicate this honestly. Production-grade sourcing and partner-grade procurement remain a separate hardening step.

## Public evidence protocol

BTC Helper preserves a dated public decision history plus a public-safe evidence bundle for the latest daily read. The public surface shows daily decisions, publication timing, source-health summaries, coverage status, selected normalized factor states or directions, replay tiers, correction paths, and the latest bundle identifier/hash.

It still does **not** publish a complete point-in-time evidence audit for every input or every historical read. Older daily reads that predate evidence-bundle v1 remain partial public records and are not relabeled as captured point-in-time evidence. The current 2026-08-11 bundle is labeled as a grounded reconstruction: its source audit was captured before publication, but the evidence-bundle record was assembled after the already-live public read. Future true point-in-time bundles must be generated and frozen before publication. The evidence-bundle protocol includes:

- bundle ID and content hash
- decision timestamp and methodology version
- source as-of timestamp, retrieval timestamp, and expected source frequency
- frequency-aware freshness and degraded/unavailable status
- transformation/schema version used for public normalization
- fallback, stale, imported, or manually reviewed status
- correction/revision status and provenance label

Normalized factor states are public labels, not raw metric values. Where source-run history supports them, BTC Helper can show current state, direction, and recent movement. Older daily reads may not reconstruct factor-level snapshots if the public record did not retain them at the time.

A bundle ID or hash identifies the serialized evidence record and helps detect silent mutation. It does not prove the source was correct, that the private engine is accurate, or that future BTC outcomes will follow the read.

## Weekly macro boundary

The weekly macro thesis is interpretive context for valuation, holder behavior, flows, macro pressure, and leverage. It is not direct proof of engine efficacy, not equivalent to the evidence-bundle provenance record, and not a substitute for source-run provenance. Public weekly macro pages should avoid private source-chain details while still explaining how the context may affect the daily factor categories.

## Validation approach

BTC Helper is developed with several validation loops:

1. **Scenario review**: tests stylized market environments.
2. **Historical replay review**: checks whether the system behaves plausibly in recognizable past conditions.
3. **Policy audit**: checks whether posture-to-action behavior is internally consistent.
4. **Degraded-data review**: checks whether the system remains honest and useful under imperfect inputs.
5. **Explanation review**: checks whether the output is understandable to a human reader.

The goal is not to make every read look confident. The goal is to make each read human-readable, bounded, and operationally honest.

## Current validation state

BTC Helper does not currently make a public efficacy claim.

The Benchmark Lab review reached a conservative conclusion: a full five-domain strict historical replay is not currently defensible with the available historical source record. Sparse historical fixtures remain useful for scenario review, source-quality analysis, and methodology discipline, but they should not be treated as a backtest, a timing-advantage result, or proof that the BTC Helper policy improves outcomes.

Reduced-domain research can still be useful. For example, valuation-plus-macro diagnostics can describe how a limited research sample behaves, but that is not the same thing as validating BTC Helper's full daily process. Current public validation language should keep valuation-led findings, flow-data insufficiency, replay tiers, and live-history accumulation separate.

The primary future validation path is continuous live history. Daily public reads and private internal validation records are now accumulating prospectively so a later reassessment can evaluate real live decisions, posture transitions, reserve events, macro regimes, and source-health conditions without manufacturing missing historical detail.

Production rules should not be tuned using the same sparse historical research sample that motivated these limitations. Model changes need their own review gate and should preserve the boundary between research-only diagnostics, public methodology, and live forward evidence.

The public Track page reports replay evidence tiers at a high level: 16 replayed cases, 2 grounded candidate cases, 40 candidate cases, and 2 synthetic cases. These are project-level validation artifacts, not forward performance proof or a price-prediction record.

Before validation-relevant model changes, BTC Helper uses a review gate covering scenario review, policy audit, replay validation, replay consistency, historical replay, and public-quality checks when public copy changes. Provider and source families are public; direct source links, exact series mappings, raw inputs, thresholds, weights, overrides, and calibration details remain private while the public surface still shows evidence tiers, limitations, and next validation priorities.

Track is process evidence and governance evidence. It should not be read as efficacy proof until enough forward reserve-aware behavior, equal-capital comparison history, and properly labeled evidence support exist.

BTC Helper's public boundary remains: **NO PUBLIC EFFICACY CLAIM**. It does not publicly claim superior timing, DCA outperformance, reserve-policy efficacy, predictive accuracy, alpha, independently validated performance, or guaranteed future returns.

## Interpretation guide

### If BTC Helper and baseline DCA are equal

This usually means the public posture has mostly stayed Normal, or reserve behavior has not yet created a meaningful difference.

### If BTC Helper is ahead

This may mean prior Pause/Aggressive behavior helped the policy buy more effectively than plain daily DCA. It does not prove future outperformance.

### If BTC Helper is behind

This may mean the policy paused or became selective during a period when plain DCA benefited from continued buying. That is possible and should remain visible.

### If the sample is young

Early samples should be treated cautiously. A few weeks of public reads are not enough to make strong performance claims. The archive becomes more useful as it compounds over months and years.

## Transparency commitments

BTC Helper's public surface should follow five rules:

1. **No prediction theater**: do not imply certainty about future price.
2. **No hidden degradation**: call out incomplete, stale, fallback, or import-assisted data.
3. **No benchmark overclaiming**: suppress or qualify benchmark language when coverage is weak.
4. **Clear proprietary boundary**: explain the rationale in plain language while acknowledging that exact thresholds, weights, override rules, and calibration details are private.
5. **No financial-advice framing**: keep the product as decision support for manual user execution.
6. **No complete-audit implication**: describe today's public record as partial until point-in-time evidence bundles are actually retained and published.

For public questions, comments, data corrections, or accessibility issues, contact BTC Helper by email: [support@btchelper.app](mailto:support@btchelper.app). For security reports, use [security@btchelper.app](mailto:security@btchelper.app).

---

*This methodology document is part of BTC Helper's public decision-record commitment.*
*Last updated: 2026-08-16*
