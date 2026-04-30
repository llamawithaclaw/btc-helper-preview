# BTC Helper Public Proof-of-Work Methodology

## Purpose

This document describes the methodology behind BTC Helper's public proof-of-work tracking system.

## Core Principle

BTC Helper's public proof-of-work is not about predicting price.
It is about demonstrating **operational discipline** and **run usability** over time.

## What We Track

### 1. Daily Regime Posture
- **Regime**: The current accumulation posture (Aggressive, Normal, Cautious, Pause)
- **Action**: The recommended accumulation behavior (Increase, Maintain, Be Selective, Pause)
- **Confidence**: shorthand for run usability, coverage quality, and operational trustworthiness of the current run, not certainty about future price

### 2. Portfolio Performance Benchmark
- **BTC Helper Portfolio**: Value of a hypothetical portfolio following BTC Helper's accumulation policy
- **Baseline DCA Portfolio**: Value of a hypothetical portfolio following simple dollar-cost averaging
- **Benchmark Difference**: Percentage difference between the two strategies

### 3. Data Quality Metrics
- **Coverage**: Percentage of required fields with live data
- **Import Reliance**: Number of fields coming from imported/manual-assisted sources
- **Run Quality**: Overall usability rating (Live, Degraded, Recently Recovered, etc.)

## Methodology Details

### Portfolio Tracking

The benchmark uses a simple model:
- **Starting capital**: $1,000 (or equivalent in BTC)
- **Baseline DCA**: Buys $10 every day regardless of market conditions
- **BTC Helper**: Adjusts daily buy amount based on regime:
  - Aggressive: $15 (50% increase)
  - Normal: $10 (baseline)
  - Cautious: $5 (50% decrease)
  - Pause: $0 (no buy)

### Data Sources

- **Price**: CryptoCompare API (daily close)
- **On-chain metrics**: Glassnode-style historical references
- **Derivatives**: OKX or CoinGlass-style references
- **Macro**: FRED-style references

### Validation Approach

Each daily run is:
1. Executed with current live data
2. Evaluated against scenario expectations
3. Logged with full domain breakdown
4. Published with confidence and coverage ratings

## Transparency Commitments

### 1. Honest Degradation Reporting
When data is incomplete or imported, this is clearly stated in the daily output.

### 2. Clear Methodology Notes
All benchmark calculations are explained and reproducible.

### 3. Public Archive
All historical posts are preserved in the `archive.txt` file.

### 4. No Performance Theater
We do not claim predictive accuracy.
We claim operational discipline and explainable decision-making.

## Interpretation Guide

### When Benchmark Difference is Zero
This means BTC Helper and baseline DCA are performing identically.
This can happen when:
- The regime is "Normal" (baseline accumulation)
- Market conditions are neutral

### When Benchmark Difference is Positive
This means BTC Helper is outperforming baseline DCA.
This can happen when:
- Aggressive accumulation occurred before price increases
- Pause/Selective accumulation avoided buying at peaks

### When Benchmark Difference is Negative
This means BTC Helper is underperforming baseline DCA.
This can happen when:
- Aggressive accumulation occurred before price decreases
- Pause/Selective accumulation missed buying opportunities

### Sample Size Warning
Early readings (first 30 days) should be interpreted with caution.
The benchmark requires months or years to provide meaningful signals.

## Future Enhancements

### Planned
- Extended backtesting over historical regimes
- Multiple benchmark variants (different DCA frequencies)
- Sharpe ratio and drawdown metrics
- Visualization of regime transitions

### Not Planned
- Short-term price prediction
- Guaranteed outperformance claims
- Black-box optimization

## Contact

For questions about methodology or to report issues:
[Open an issue in the BTC Helper repository]

---

*This methodology document is part of BTC Helper's public proof-of-work commitment.*
*Last updated: 2026-04-21*
