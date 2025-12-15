BIGFOOT ADVENTURE
=================

A 2D side-scrolling platformer by Jordan Vorster.
Explore a procedurally generated landscape, collect coins, and avoid hazards.


HOW TO PLAY
-----------
Open `index.html` in your web browser (with `p5.js` present) to run the game.

CONTROLS
- Move Left:   Left Arrow or `A`
- Move Right:  Right Arrow or `D`
- Jump:        Spacebar
- Hibernation / Interact: `W` (use near the winter cave entrance)
- Cycle Seasons: `T` (forward) / `R` (backward)
- Respawn:     Spacebar (press when Game Over screen appears)

OBJECTIVE
- Run and jump to navigate the world.
- Collect gold coins to increase score.
- Avoid canyons and falling off the world.


FEATURES (New additions)
------------------------
- Dynamic Day / Night Cycle: The sky, sun and moon transition over time.
- Seasonal System: Four seasons (Spring, Summer, Autumn, Winter) change palettes and foliage.
- Seasonal Trees: Tree canopies and colors update per season; Autumn has falling leaf particles.
- Procedural Cave: A winter-only cave is generated randomly each run; trees avoid spawning near it.
- Hibernation Mechanic: In Winter, approach the cave and press `W` to hibernate. While hibernating:
	- The player lies down inside the cave (sleeping pose) and cannot move.
	- A thought bubble (`i need to sleep`) appears near the character when close to the cave.
	- Hibernation automatically ends when the season becomes Summer (or press `W` again to wake).
- Sleeping Frame: A simple sleeping pose and on-screen "Zzz" indicate hibernation state.

 - Sleeping Character: The sleeping pose reuses the main character shapes (head, body, limbs) arranged horizontally
	 so the character lies on the cave floor while hibernating. The sleeping sprite is shown in-place of the standing
	 sprite during hibernation; it includes small "Zzz" markers and keeps the same palette so the character remains
	 visually consistent with the active sprite.


FEATURES (Existing)
-------------------
- Procedural Generation: Trees and mountains are randomized each run.
- Physics: Gravity, jumping, and collision detection.
- Camera: Side-scrolling view that follows the player.
- Parallax Background: Clouds and layers move for depth.


NOTES / IMPLEMENTATION DETAILS
- Cave Placement & Clearance: Trees are prevented from spawning within a buffer around the cave so the entrance remains clear.
- Cave Art: The cave entrance is drawn as a single semicircular opening with shaded interior for depth.
- Hibernation Keys: `W` toggles hibernation only when near the cave during Winter; `Space` remains jump/respawn.

 - Sleeping implementation: The sleeping sprite is drawn by the same `sketch.js` renderer and positioned at the cave
	 entrance (center). Trees are prevented from spawning near the cave so the sleeping area stays clear. Hibernation
	 blocks player input while active and the game will automatically wake the player when the season advances to Summer.


INSTALLATION
------------
1. Keep `index.html`, `sketch.js`, and `p5.js` in the same folder.
2. Open `index.html` in a modern browser to play.


CREDITS
-------
Created by: Jordan Vorster
Built with: JavaScript and p5.js

If you want me to expand this README (screenshots, controls table, or development notes), tell me what you'd like added.