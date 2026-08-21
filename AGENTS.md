# AGENTS.md

- Pure HTML5 Canvas game, no build system, no dependencies, no bundler.
- All game logic is in `game.js` (~650 lines). `index.html` loads it directly via `<script>` tag.
- Run with `npx serve .` or open `index.html` directly in a browser.
- No lint, typecheck, test suite, or formatter configured.
- Language: Spanish (code comments, README, HUD text).
- Includes a ShootingStar class (extends Asteroid) that spawns every 12-18s with 2x speed, 6s TTL, 200 bonus points.
