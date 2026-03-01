

# Overtime, Smart Streaks, Missed Time Tracking, and Edit Bug Fixes

## Overview

Four improvements: overtime calculation based on your schedule, schedule-aware streak tracking that ignores off days, missed hours/days tracking, and fixing bugs in the session editing logic.

---

## 1. Fix Session Editing Bugs

**Problems found:**
- When you edit a session and change the date, the `date` field on the session never updates -- only `startTime`/`endTime`/`notes`/`project` are passed through.
- The `updateSession` hook function doesn't accept or update the `date` field at all.
- The `handleEditSave` in `SessionLogsCard` strips out the `date` from the save data before passing it to the hook.

**Fix:**
- Update `updateSession` in `useEarningsTracker.ts` to also accept and apply `date` changes.
- Update `handleEditSave` in `SessionLogsCard.tsx` to pass the `date` field through to `onUpdateSession`.
- Extend the `onUpdateSession` prop type to include `date`.

---

## 2. Overtime Tracking

A new card/section that calculates overtime by comparing actual hours worked each day against scheduled hours.

**How it works:**
- For each day with a schedule entry, calculate `scheduled hours = endTime - startTime`.
- Sum actual session durations for that day.
- If actual > scheduled, the difference is **overtime**.
- Display daily, weekly, and monthly overtime totals.
- Optionally show an overtime multiplier (e.g., 1.5x) with estimated overtime earnings.

**Files:**
- **New:** `src/components/earnings/OvertimeCard.tsx` -- Displays overtime summary (today, this week, this month) with a breakdown table.
- **`src/types/earnings.ts`** -- Add an `overtimeMultiplier` field (default 1.5) to `Settings`.
- **`src/components/earnings/SettingsCard.tsx`** -- Add an overtime multiplier input field.
- **`src/components/earnings/Dashboard.tsx`** -- Add the OvertimeCard to the Analytics tab.

---

## 3. Schedule-Aware Streaks

Currently, streaks break when you skip a day -- even if that day is disabled in your schedule (e.g., weekends). This fix makes streaks only count scheduled work days.

**Changes:**
- **`src/components/earnings/StreakAchievements.tsx`** -- Update `calculateStreak` to accept the `schedule` array and skip disabled days when checking for consecutive work. For example, if Saturday and Sunday are off, working Friday then Monday still counts as consecutive.
- **`src/components/earnings/Dashboard.tsx`** -- Pass `schedule` prop to `StreakAchievements`.

**Logic:**
```text
For each gap between work days:
  - Get all dates in the gap
  - Check if ALL of those dates are disabled in the schedule
  - If yes: streak continues (they were off days)
  - If no: streak breaks (a scheduled work day was missed)
```

---

## 4. Missed Hours and Days Tracking

A new component that shows which scheduled shifts were missed or had insufficient hours.

**How it works:**
- Look back over the past 30 days.
- For each day that had an enabled schedule entry, check if any sessions exist for that day.
- If no sessions: mark as a **missed day**.
- If sessions exist but total hours are less than scheduled: calculate **missed hours**.
- Display a summary: total missed days, total missed hours, and a scrollable list of specific missed/short days.

**Files:**
- **New:** `src/components/earnings/MissedTimeCard.tsx` -- Shows missed days count, missed hours total, and a list of specific dates with details.
- **`src/components/earnings/Dashboard.tsx`** -- Add MissedTimeCard to the Analytics tab.

---

## Summary of File Changes

| File | Action |
|------|--------|
| `src/types/earnings.ts` | Add `overtimeMultiplier` to `Settings` |
| `src/hooks/useEarningsTracker.ts` | Fix `updateSession` to handle `date` field |
| `src/components/earnings/SessionLogsCard.tsx` | Fix `handleEditSave` to pass `date` |
| `src/components/earnings/OvertimeCard.tsx` | **New** -- overtime calculation and display |
| `src/components/earnings/MissedTimeCard.tsx` | **New** -- missed days/hours tracking |
| `src/components/earnings/StreakAchievements.tsx` | Make streak calculation schedule-aware |
| `src/components/earnings/SettingsCard.tsx` | Add overtime multiplier setting |
| `src/components/earnings/Dashboard.tsx` | Wire up new components and pass schedule to streaks |

---

## Technical Details

**Overtime calculation:**
```text
scheduledHours = (scheduleEnd - scheduleStart) in hours
actualHours = sum of session durations for that day
overtime = max(0, actualHours - scheduledHours)
overtimeEarnings = overtime * hourlyRate * overtimeMultiplier
```

**Missed time calculation:**
- Only checks past dates (not today, since today is still in progress).
- Only checks days where `schedule[dayOfWeek].enabled === true`.
- A day is "missed" if zero sessions exist for it.
- A day is "short" if total session hours < scheduled hours.

**Schedule-aware streak logic:**
- When checking the gap between two consecutive work days, iterate through each date in the gap and check if its day-of-week is enabled in the schedule.
- If any gap date falls on a scheduled (enabled) day with no work, the streak breaks.
- If all gap dates are off days, the streak continues.

