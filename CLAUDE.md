# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Open `index.html` in any modern browser. No build process, server, or npm is required — this is a vanilla JavaScript project.

## Architecture

All game logic lives in a single file: `sketch.js` (~1,200 lines). It uses [p5.js](https://p5js.org/) for rendering and the browser's native Web Audio API for sound.

### Game States

Six states control which screen is shown and how input is handled:

```
STATE_START → STATE_PLAYING ↔ STATE_PAUSED → STATE_SETTINGS
                   ↓
            STATE_GAMEOVER / STATE_WIN
```

`keyPressed()` is the central dispatcher for all state transitions. `draw()` calls the appropriate render and update functions per state.

### Core Loop (`draw()`)

Each frame: `updateGame()` → physics/collision/timers → `drawGame()` → rendering with camera offset applied via `translate()`.

### Procedural Generation

Triggered at game start via `startGame()`, which calls individual `generate*()` functions (canyons, trees, platforms, enemies, collectables, etc.). Each generator does collision avoidance to keep the level playable. Results are stored in global arrays.

### Key Global State

- `gameChar_x / gameChar_y` — player world position
- `cameraX` — smooth-lerped camera offset (lerp factor 0.1)
- `gameState` — current state string constant
- `velocity_y`, `gravity`, `jumpPower` — physics constants
- `lives`, `game_score` — player stats
- `currentSeason`, `timeOfDay` — environmental systems that affect rendering, music, and gameplay

### Entity Patterns

- **Factories:** `createPlatforms(x, y, length)`, `createMushroom(x, y)` — return objects with `draw()` and collision methods
- **Constructor:** `Enemy(x, y, range)` — patrol logic and collision
- **Object literals in arrays:** collectables, checkpoints, clouds, stars, particles, story objects

### Audio

`SoundManager` class wraps Web Audio API oscillators to synthesize all SFX and music procedurally (no audio files). Volume is persisted to `localStorage`. All audio calls are wrapped in try/catch to handle browsers that block autoplay.

### Rendering

The world is wider than the canvas. `drawGame()` applies `translate(-cameraX, 0)` so all world coordinates are in "world space." Background layers (mountains at 0.2×, clouds at 0.5×) scroll at different speeds for parallax.

The bear character has 8 animation poses drawn procedurally in `drawGameCharBody()` based on movement state and direction.

### Seasonal & Day/Night Systems

- `updateSeasonCycle()` advances `currentSeason` over time
- `updateDayNightCycle()` advances `timeOfDay` and controls sun/moon position
- Both affect sky colors, ground colors, weather particle type (rain vs snow), tree appearance, and procedural music tones
- Winter adds a hibernation mechanic: player can press `W` near the cave to sleep (600 frames), skipping the season
