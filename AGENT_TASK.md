# Marks to Timetable: Build from Specification

Create 14 files in this repo. React + Vite + TypeScript app. No backend,
no auth, localStorage only. Do not modify files not listed. Every file
must be complete and syntactically valid.

The self-test file (File 12) is the CONTRACT. All 8 tests must pass.
If a rule is ambiguous, follow the tests.

Open a PR titled "Marks to Timetable v1" when done.

## Files to create

| # | Path | Purpose |
|---|---|---|
| 1 | package.json | Vite + React + TS. Scripts: dev, build, preview |
| 2 | tsconfig.json | ES2022, strict, jsx react-jsx, noEmit, include ["src"] |
| 3 | vite.config.ts | react() plugin |
| 4 | index.html | Vite entry, viewport-fit=cover, theme-color #f6f4ef |
| 5 | src/main.tsx | createRoot render App, import CSS |
| 6 | src/App.tsx | Renders MarksTimetableView |
| 7 | src/features/timetable/types.ts | Types (exact below) |
| 8 | src/features/timetable/analyse.ts | Marks analysis (rules below) |
| 9 | src/features/timetable/generate.ts | Timetable generation (rules below) |
| 10 | src/features/timetable/storage.ts | localStorage helpers |
| 11 | src/features/timetable/aiCoach.ts | Optional BYOK AI |
| 12 | src/features/timetable/selfTest.ts | Tests (exact below) |
| 13 | src/views/MarksTimetableView.tsx | Three-step UI |
| 14 | src/styles/marks-timetable.css | Paper palette UI |

Dependencies: react ^19, react-dom ^19.
DevDeps: @types/react ^19, @types/react-dom ^19, @vitejs/plugin-react ^4,
typescript ^5.7, vite ^6.

## Types (File 7 — exact)

```ts
export type SubjectMark = {
  id: string;
  name: string;
  theoryMarks: number;
  theoryMax: number;
  ptMarks?: number;
  ptMax?: number;
  ptWeight?: number;
};

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type FreeBlock = {
  id: string;
  day: Weekday;
  start: string;
  end: string;
};

export type WeaknessBand = "critical" | "weak" | "steady" | "strong";

export type SubjectAnalysis = {
  subjectId: string;
  name: string;
  theoryPercentage: number;
  ptPercentage: number | null;
  finalPercentage: number;
  band: WeaknessBand;
  weight: number;
  cbseGrade: string;
  blockMinutes: number;
  maxBlocksPerDay: number;
};

export type StudyBlock = {
  day: Weekday;
  start: string;
  end: string;
  subjectId: string;
  subjectName: string;
  minutes: number;
  reason: string;
};

export type TimetableWarning =
  | "no-subjects"
  | "no-free-time"
  | "not-enough-time"
  | "invalid-marks";

export type Timetable = {
  blocks: StudyBlock[];
  analyses: SubjectAnalysis[];
  totalFreeMinutes: number;
  totalPlannedMinutes: number;
  warnings: TimetableWarning[];
};
```

## Rules for analyse.ts (File 8)

- `theoryPercentage(mark)`: `(theoryMarks / theoryMax) * 100`, clamped 0-100, rounded to 1 decimal. Return 0 if theoryMax <= 0.
- `ptPercentage(mark)`: null if `ptMarks === undefined` OR `!ptMax` OR `ptMax <= 0`. Else percentage.
- `finalPercentage(mark)`: if ptPercentage is null OR `ptWeight === undefined` OR `ptWeight <= 0`, return theoryPercentage. Else `(theoryPct * (100 - ptWeight) + ptPct * ptWeight) / 100`, rounded 1 decimal.
- `bandFor(pct)`: <33 "critical", <51 "weak", <71 "steady", else "strong".
- `weightFor(band)`: critical 5, weak 4, steady 2, strong 1.
- `cbseGradeFor(pct)`: >=91 A1, >=81 A2, >=71 B1, >=61 B2, >=51 C1, >=41 C2, >=33 D, else E.
- `blockLengthFor(band)`: critical 25, weak 30, steady 35, strong 45.
- `maxBlocksFor(band)`: critical 1, weak 2, steady 2, strong 1.
- `reasonFor(analysis)`: return string like "Critical (35.1%, grade D). Below pass mark. Short, frequent blocks first." for critical; "Weak (...). Passing but fragile. Regular retrieval." for weak; "Steady (...). Safe. Keep it ticking over." for steady; "Strong (...). Maintenance only." for strong.
- `analyseMarks(marks)`: filter empty/whitespace names. Map to SubjectAnalysis. Sort by weight DESC, then name ASC.

## Rules for generate.ts (File 9)

- `toMinutes(time)`: regex `/^([01]\d|2[0-3]):([0-5]\d)$/`. Return minutes since midnight, or null.
- `fromMinutes(total)`: clamp 0-1440, return "HH:MM".
- Empty analyses: warnings ["no-subjects"], no blocks.
- Empty valid free blocks (duration >= 25 after toMinutes): warnings ["no-free-time"], no blocks.
- If any mark has theoryMax <= 0 OR theoryMarks < 0: add "invalid-marks" warning (but still generate if possible).
- `totalFreeMinutes` = sum of (end - start) for valid free blocks where end > start and duration >= 25.
- `totalPlannedTarget` = floor(totalFreeMinutes * 0.8).
- Each subject target = `(weight / totalWeight) * totalPlannedTarget`.
- Sort free blocks by day, then start time.
- Maintain `lastSubjectByDay: Map<Weekday, string>` and `daySubjectCounts: Map<Weekday, Map<string, number>>`.
- For each free block, cursor at start. While cursor < end AND remainingMinutes > 0:
  - available = end - cursor
  - if available < 25, break
  - candidates = analyses filtered by: subjectId !== lastSubjectByDay.get(day), dayCount < maxBlocksPerDay, remaining target > 0. Sorted by remaining target DESC.
  - if candidates empty, break
  - pick = candidates[0]
  - slotLength = min(pick.blockMinutes, floor(available / 5) * 5)
  - if slotLength < 25, break
  - emit StudyBlock { day, start: fromMinutes(cursor), end: fromMinutes(cursor+slotLength), subjectId, subjectName, minutes: slotLength, reason: reasonFor(pick) }
  - decrement target, update lastSubjectByDay, increment dayCount
  - cursor += slotLength, remainingMinutes -= slotLength
- After loop: totalPlannedMinutes = sum of block.minutes. If < totalPlannedTarget * 0.6, add "not-enough-time".
- Return { blocks, analyses, totalFreeMinutes, totalPlannedMinutes, warnings }.

## Rules for storage.ts (File 10)

localStorage keys: `mt.marks.v1`, `mt.free.v1`, `mt.exam.v1`, `mt.aikey.v1`, `mt.aiprovider.v1`.

Functions:
- `saveState(state: {examName, marks, freeBlocks})`: save all three.
- `loadState(): {examName, marks, freeBlocks} | null`: read all three, return null if any missing or parse fails.
- `saveAiKey(key)`, `loadAiKey(): string`, `saveAiProvider(p)`, `loadAiProvider(): "gemini" | "openrouter"` (default "gemini").
- `exportState()`: create JSON blob, trigger download named `marks-timetable-YYYY-MM-DD.json`.
- `importState(file: File): Promise<{examName, marks, freeBlocks}>`: read text, parse JSON, validate marks and freeBlocks are arrays, save, return.

## Rules for aiCoach.ts (File 11)

- `buildCoachPrompt(examName, timetable): string`: return a prompt asking the AI for 5 short bullet points: which subject needs most attention and why, one concrete study technique for the weakest, how to use longest free block, one warning sign the plan needs adjusting, one sentence of encouragement. Include the marks summary and generated plan. Requirements: no emojis, plain text, under 120 words.
- `askAiCoach({provider, apiKey, examName, timetable}): Promise<string>`:
  - **gemini**: POST `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`. Body: `{contents:[{parts:[{text:prompt}]}], generationConfig:{maxOutputTokens:300, temperature:0.6}}`. Parse `data.candidates[0].content.parts[0].text`.
  - **openrouter**: POST `https://openrouter.ai/api/v1/chat/completions`. Headers include `Authorization: Bearer ${apiKey}`. Body: `{model:"google/gemini-2.0-flash-exp:free", messages:[{role:"user", content:prompt}], max_tokens:300, temperature:0.6}`. Parse `data.choices[0].message.content`.
  - Throw an Error with status code on non-OK response.

## Self-test file (File 12 — exact, the contract)

```ts
import { analyseMarks } from "./analyse";
import { generateTimetable } from "./generate";
import type { FreeBlock, SubjectMark } from "./types";

export type TestResult = {
  name: string;
  passed: boolean;
  detail?: string;
};

export function runTimetableSelfTests(): TestResult[] {
  const results: TestResult[] = [];

  const marks: SubjectMark[] = [
    { id: "m", name: "Maths", theoryMarks: 30, theoryMax: 80, ptMarks: 8, ptMax: 25, ptWeight: 5 },
    { id: "s", name: "Science", theoryMarks: 48, theoryMax: 80, ptMarks: 15, ptMax: 25, ptWeight: 5 },
    { id: "e", name: "English", theoryMarks: 60, theoryMax: 80, ptMarks: 20, ptMax: 25, ptWeight: 5 },
    { id: "h", name: "History", theoryMarks: 72, theoryMax: 80, ptMarks: 22, ptMax: 25, ptWeight: 5 },
  ];

  const analyses = analyseMarks(marks);
  const maths = analyses.find((a) => a.name === "Maths")!;
  const history = analyses.find((a) => a.name === "History")!;

  results.push({
    name: "final % combines theory and PT weight",
    passed: maths.finalPercentage === 35.1,
    detail: "Maths final: " + maths.finalPercentage + "%",
  });
  results.push({
    name: "below 33 is critical, above 70 is strong",
    passed: maths.band === "weak" && history.band === "strong",
    detail: "Maths: " + maths.band + ", History: " + history.band,
  });
  results.push({
    name: "CBSE grade letters are correct",
    passed: maths.cbseGrade === "D" && history.cbseGrade === "A2",
    detail: "Maths: " + maths.cbseGrade + ", History: " + history.cbseGrade,
  });
  results.push({
    name: "adaptive block length by band",
    passed: maths.blockMinutes === 30 && history.blockMinutes === 45,
  });

  const free: FreeBlock[] = [
    { id: "1", day: 0, start: "16:00", end: "18:00" },
    { id: "2", day: 1, start: "16:00", end: "18:00" },
    { id: "3", day: 2, start: "16:00", end: "18:00" },
  ];

  const timetable = generateTimetable(marks, free);
  const mathsMinutes = timetable.blocks
    .filter((b) => b.subjectName === "Maths")
    .reduce((s, b) => s + b.minutes, 0);
  const historyMinutes = timetable.blocks
    .filter((b) => b.subjectName === "History")
    .reduce((s, b) => s + b.minutes, 0);

  results.push({
    name: "weakest subject gets more time than strongest",
    passed: mathsMinutes > historyMinutes,
    detail: "Maths " + mathsMinutes + " vs History " + historyMinutes,
  });
  results.push({
    name: "no subject exceeds its daily block cap",
    passed: timetable.blocks.every((b) => {
      const a = analyses.find((x) => x.subjectId === b.subjectId)!;
      const sameDay = timetable.blocks.filter(
        (x) => x.day === b.day && x.subjectId === b.subjectId,
      );
      return sameDay.length <= a.maxBlocksPerDay;
    }),
  });
  results.push({
    name: "no blocks generated without free time",
    passed: generateTimetable(marks, []).blocks.length === 0,
  });
  results.push({
    name: "no blocks generated without subjects",
    passed: generateTimetable([], free).blocks.length === 0,
  });

  return results;
}
```

## UI requirements (File 13)

Single component, no router. useState for: step (1|2|3), examName, marks, freeBlocks, timetable, aiKey, aiProvider, aiNote, aiLoading, aiError, showSettings, testResults, importError.

On mount: load from storage. On any change: save.

**Step 1 (Marks):** exam name input. List of subjects: name input, theory input + "/ {theoryMax}" text, PT input + "/ {ptMax}", weight input, remove button. "Add subject" button. "Continue" button.

**Step 2 (Free time):** for each day Mon-Sun (indexes 0-6): day header, "Add block" button, list of blocks each with start "HH:MM" text input + "to" + end text input + remove button. "Back" button. "Generate timetable" button.

**Step 3 (Timetable):** warnings banner if any (human text). Summary "Free time: X min. Planned: Y min across Z blocks". Blocks grouped by day, each showing time range, subject, minutes, reason. If no blocks, message. AI panel: if no key, hint; if key, "Get coach note" button. Show aiError and aiNote. "Edit marks" and "Edit free time" buttons. "Export JSON" and "Import JSON" buttons (hidden file input). "Run self-test" button at bottom.

**Settings modal:** provider choice (two buttons, not select), API key password input, hint "Key stored on this phone only", "Clear key", "Save", "Close".

**Self-test modal:** title "Self-test: X / Y passed", list with PASS/FAIL and detail, "Close".

No emojis anywhere. No native `<select>`. Focus rings required. Tabular numbers on time and number inputs.

## CSS requirements (File 14)

CSS variables: --paper #f6f4ef, --paper-raised #fffefb, --ink #211f1c, --ink-muted #6d675f, --border #ded8cd, --accent #1f6f5c, --accent-soft #dcece6, --warning #8a5a12, --warning-soft #f7ecd7, --danger #a3342a, --radius 10px.

Body margin 0, font-family system-ui stack, background paper, color ink.
App: max-width 42rem, margin 0 auto, padding 16px, padding-bottom calc(32px + env(safe-area-inset-bottom)), min-height 100dvh.
Inputs: min-height 2.75rem, border 1px solid border, border-radius radius, background paper-raised, font-size 1rem, padding 8px 12px.
Primary button: background accent, color white, min-height 2.75rem.
Secondary: background paper-raised, color ink, border border.
Ghost: transparent, color ink-muted, min-height 2.25rem.
Focus: 3px solid accent, 2px offset on all interactive elements.
Numeric inputs: font-variant-numeric: tabular-nums.

Class names to use: app, app-header, app-header__row, app-header__title, app-header__settings, steps, screen, screen__heading, screen__hint, screen__actions, field, field--inline, field__suffix, subjects, subject, subject__name, subject__row, button, button--primary, button--secondary, button--ghost, day-group, day-group__header, day-group__title, day-group__empty, time-block, time-block__sep, study-block, study-block__time, study-block__subject, study-block__minutes, study-block__reason, warnings, warning, ai-panel, ai-panel__title, ai-panel__note, modal, modal__card, modal__title, choice-row, choice-button, test-list, test-list__pass, test-list__fail, test-list__detail, app-footer.

## Done

All 14 files exist. Vercel build succeeds. Manual test: add 4 subjects, add 3 free blocks, generate. Self-test button shows 8/8 passed. 
