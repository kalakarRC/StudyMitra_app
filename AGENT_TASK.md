# Marks-to-Timetable: Working App from Scratch

## Overview
Build a complete, working app that takes CBSE Class 10 exam marks, analyses
weak subjects, and generates a weekly study timetable weighted toward them.

This is a standalone, working app. It has no auth, no database, no network
dependency. It stores data in localStorage and exports/imports JSON.

## Rules
- Create or replace every file below with the EXACT path shown.
- Every file must be 100% complete. No placeholders. No abbreviations.
- Do not modify any file not listed here.
- If you cannot output a file in one message, split across commits, but every
  file must be syntactically valid before you open the PR.
- After all files are in place, open a pull request titled
  "Working marks-to-timetable app" with a short summary.

---

## File 1: package.json (REPLACE)

```json
{
  "name": "marks-timetable",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.5"
  }
}
