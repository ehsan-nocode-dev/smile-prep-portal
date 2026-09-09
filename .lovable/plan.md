# Staff Dashboard: progress stats upgrade

Add a richer stats layer to the Staff Dashboard so a staff member can see at a glance where they stand, what's next, and how they're trending.

## What gets added

**1. Level & XP card**
Prominent card at the top: current level, total XP, progress bar to the next level, and "N XP needed to reach Level X". Max level shows a "Max level" state.

**2. Closest badge**
Card showing the single nearest badge across all tasks: tier name, the task it belongs to, how many more approved completions are needed, and the bonus XP it awards.

**3. Highest badge**
Card showing the top tier earned so far (highest tier across all tasks), with the task name. Shows an empty state if nothing earned yet.

**4. Log type distribution (pie chart)**
Donut chart of approved completions split by task, with a legend showing task name, count and share. Uses tier/brand colours from the design system.

**5. XP over time (line chart)**
Line chart of XP gained, with a Week / Month toggle. Week shows the last 7 days; Month shows the last ~12 weeks.

**6. Week-on-week XP change**
Small figure: XP earned this week vs last week, shown as a signed percentage with up/down colouring and the raw values underneath.

## Layout order on the Staff Dashboard

```text
Page header
Existing 4 stat cards (Total / Approved / Pending / Badges)
[ Level & XP progress  ]  [ Closest badge ] [ Highest badge ]
[ XP over time (line, Week/Month toggle) ] [ Log distribution (donut) ]
Badge Portfolio (existing)
Recent Activity (existing)
```

Week-on-week change sits inside the XP-over-time card header.

## Mock data

Current mock data has only a few April 2025 submissions, so charts would be empty. Seed additional approved submissions for the demo staff user spread across the last ~12 weeks (including this week and last week, with an uneven split so the comparison shows a real change). Existing records stay untouched; new ones follow the same shape and use each task's XP value.

## Technical notes

- New helpers in `src/lib/levels.ts` (or a new `src/lib/stats.ts`): XP series by day/week, XP for a given date range, closest badge, highest badge, per-task approved counts.
- All calculations use approved submissions only, keyed off `reviewedDate` when present, otherwise `date`.
- Charts use `recharts` (already installed) via the existing shadcn chart wrapper; date bucketing with `date-fns`.
- New presentational components under `src/components/stats/`; `StaffDashboard.tsx` composes them.
- No backend, no routes, no changes to admin screens or the Crowns system.
