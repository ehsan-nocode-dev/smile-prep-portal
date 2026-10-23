# AGENTS.md

- Frontend-only prototype: all state lives in React contexts (`src/lib/store.tsx`, `src/contexts/*`) seeded from mock data; no backend. Why: it is a design/behaviour alignment prototype.
- Challenge rules (boost crowns, goal progress, conflicts, phases) are pure functions in `src/lib/challenges.ts`, covered by `src/lib/challenges.test.ts`; `ChallengesContext` only orchestrates state, payouts and simulated emails. Why: rules stay testable and in one place.
- Team Goals are re-evaluated in a `ChallengesContext` effect whenever submissions change, so any approval path completes/closes goals without extra wiring. Why: approval screens don't need to know about goals.
- Boost eligibility is judged by `Submission.submittedAt` (falls back to `date`), never by approval time. Why: logs submitted during a Boost keep it even if approved later.
- Challenge demo seeds use `DEMO_ANCHORS` in `mock-data.ts` (relative to now). Why: the seeded Boost/Team Goal always look live in a demo.
- `awardCrowns` reads balances through a ref so several awards in one tick stay correct. Why: boost bonus + team payouts award multiple times at once.
