# Feature: The Odoo Loop (2D HTML/CSS time-loop game)

## Objective
Playable 2D side-view (front camera, pixel-art) point-and-walk game in vanilla HTML/CSS/JS,
based on the "Save Developer Day: The Odoo Loop" script. Opens directly from `index.html` (file://).

## Scope
- One office scene, side-scrolling camera, walk with arrows/A-D, interact with E.
- Cast with pixelated photo heads: Flor, Alex (alejandro.png), Diego (diego.png, copy of fñpr.png.png), Federico, Sergio (messages only).
- Turn-based clock 16:42 → 17:00, scheduled events, persistent knowledge across loops (notebook).
- Endings: timeout, try/catch regression, works on my machine, scope creep, hotfix Friday, secret (Sergio), happy (BUS_FACTOR > 1).
- Optional gags: logs search, terminal, dog, ducks, juggling, Rubik, Sergio timesheet, meeting.

## Tasks
- [x] T1 Scaffold folders, Diego portrait copy (inline)
- [x] T2 Styles: pixel office, HUD, dialog, modals (inline)
- [x] T3 Engine: input, camera, time/events, memory, dialog, modals (inline)
- [x] T4 Story: dialogue trees, events, endings, logs, terminal, credits (inline)
- [x] T5 Smoke check: JS syntax + headless screenshot

## Checks
- TDD: no test runner in project (vanilla static game) → functional checks only.
- `node --check js/*.js`; headless Chrome screenshot of index.html.

## Notes
- Not a git repo: no work-unit commits.

## Iteration 2 — pixel-art restyle (2026-10-23)
- [x] T6 Procedural pixel sprites (js/sprites.js) replace photo heads; pixel portraits, dog, ducks
- [x] T7 Office redesigned in zones (Recepción, Open space, Sala Ctrl+Z, Rincón dev, Cocina) with real CC logo (assets/)
- [x] T8 Re-verified endings via headless bot: BUS_FACTOR > 1, hotfix, timeout, secret
