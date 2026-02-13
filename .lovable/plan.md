

# Session Management Upgrades

This plan adds three powerful features to the Logs tab: editing sessions, deleting individual sessions, adding manual entries, and tagging sessions with a project/client name.

---

## What You'll Get

1. **Edit Sessions** -- Click an edit button on any session log to change its start/end time, notes, or project tag in a dialog form.
2. **Delete Individual Sessions** -- Remove a single session with a confirmation prompt (instead of only "clear all").
3. **Manual Time Entry** -- An "Add Session" button at the top of the Logs tab opens a form where you pick a date, start time, end time, notes, and project/client tag. Earnings are auto-calculated from your hourly rate.
4. **Project/Client Tagging** -- Every session gets an optional `project` field. A dropdown/input lets you pick from previously used tags or type a new one. Tags appear as colored badges on each log entry.

---

## Changes Overview

### 1. Update the WorkSession type
**File:** `src/types/earnings.ts`
- Add an optional `project?: string` field to the `WorkSession` interface.

### 2. Add hook functions for edit, delete, and manual add
**File:** `src/hooks/useEarningsTracker.ts`
- **`deleteSession(id)`** -- Removes a single session by ID from state.
- **`updateSession(id, updates)`** -- Updates a session's fields (startTime, endTime, notes, project) and recalculates duration/earnings.
- **`addManualSession(data)`** -- Creates a new WorkSession from manual input (date, start/end times, notes, project), calculates duration and earnings from the hourly rate, and appends it to sessions.
- Expose all three from the hook's return object.

### 3. Create a Session Edit/Add Dialog component
**File:** `src/components/earnings/SessionFormDialog.tsx` (new)
- A reusable dialog used for both editing and adding sessions.
- Fields: Date picker, Start Time, End Time, Notes (textarea), Project/Client (combobox input with suggestions from past sessions).
- Validates that end time is after start time.
- Shows calculated earnings preview based on duration and hourly rate.
- Two modes: "Add Session" (empty form) and "Edit Session" (pre-filled with existing data).

### 4. Update SessionLogsCard with edit/delete actions and project badges
**File:** `src/components/earnings/SessionLogsCard.tsx`
- Add `onDeleteSession`, `onUpdateSession`, and `hourlyRate` props.
- Each expanded LogEntry gets **Edit** and **Delete** buttons.
- Delete shows an AlertDialog confirmation for that single session.
- Edit opens the SessionFormDialog in edit mode.
- Display the `project` tag as a small badge next to the session date.

### 5. Add "Add Session" button and manual entry to Dashboard
**File:** `src/components/earnings/Dashboard.tsx`
- In the Logs tab, add an "Add Session" button that opens the SessionFormDialog in add mode.
- Pass the new `deleteSession`, `updateSession`, and `addManualSession` functions down to SessionLogsCard.
- Pass `settings.hourlyRate` so earnings can be calculated.

---

## Technical Details

**Session Form Validation (using basic checks, no extra deps):**
- Date: required, cannot be in the future
- Start/End time: required, end must be after start
- Project: optional, max 50 characters, trimmed
- Notes: optional, max 500 characters

**Earnings auto-calculation in manual entry:**
```
duration = (endTime - startTime) in seconds
earnings = (duration / 3600) * hourlyRate
```

**Project tag suggestions:** Derived by collecting unique `session.project` values from all existing sessions, displayed as a datalist or combobox dropdown.

**Backward compatibility:** The `project` field is optional, so all existing sessions continue to work without changes. Import/export will naturally include the new field when present.

