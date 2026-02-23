# THE GREAT FREEZE

A dynamic 2D side-scrolling platformer created by Jordan Vorster using p5.js.
Explore a living, procedurally generated world that changes with the seasons. Collect pine cones, brave the elements, avoid enemies, traverse platforms, and find your way home before the freeze takes you.

**[Play Online](index.html)** (Open index.html in a browser)

## 🎮 Controls

| Action                | Key(s)                                             |
| :-------------------- | :------------------------------------------------- |
| **Move Left**         | `Left Arrow` or `A`                                |
| **Move Right**        | `Right Arrow` or `D`                               |
| **Jump**              | `Spacebar` (Supports Jump Buffering & Coyote Time) |
| **Hibernate**         | `W` (When near cave in Winter)                     |
| **Pause**             | `P` or `ESC`                                       |
| **Settings / Volume** | `S`                                                |
| **Respawn/Restart**   | `Spacebar` (After death or game over)              |

---

## ✨ Key Features

### 🌍 Dynamic Environment

- **4 Distinct Seasons:** The world transforms visually and mechanically.
  - **Spring:** Blooming pink trees and light showers.
  - **Summer:** Lush green foliage and clear sunny skies.
  - **Autumn:** Orange leaves fall from trees, accompanied by heavy rain and wind.
  - **Winter:** Trees go bare, heavy snow falls, and fog rolls in.
- **Day/Night Cycle:** Watch the sun set and moon rise, changing the sky gradient and lighting.
- **Procedural Weather & Music:** Rain and snow are generated with a particle system, accompanied by procedural ambient and seasonal music.

### 🐻 Character & Gameplay

- **Physics-Based Movement:** Smooth running and jumping with gravity, jump buffering, and coyote time.
- **Obstacles & Platforms:** Traverse static, moving, and crumbling platforms. Use bouncy mushrooms for super jumps!
- **Enemies:** Avoid patrolling icy foes that stand in your way.
- **Hibernation Mechanic:** In Winter, finding a cave allows the bear to sleep through the cold.
- **Lives System:** You start with 3 hearts. Falling into a canyon or touching an enemy loses a life.
- **Collectables:** Find all hidden pine cones to repair your home.
- **Victory Condition:** Reach the flagpole at the end of the level to raise the flag and survive.

### 💅 Polish & "Game Juice"

- **Smooth Camera:** The camera follows the player with a smooth scrolling effect (lerp).
- **Particle Effects:** Dust kicks up when jumping or landing, and confetti drops on victory.
- **Screen Shake & Visual Feedback:** Dynamic impact effects when taking damage, animated flag, and interactive menus.
- **Dynamic Audio:** A fully integrated sound manager for volume control, SFX (jump, land, coin, death), and synthetic procedural music.

---

## 🛠️ Technical Details

### Project Structure

- `index.html`: The entry point for the web page.
- `sketch.js`: Contains all game logic, drawing code, and state management.
- `p5.js`: The graphics library used for rendering.
- `assets/`: Contains external resources like fonts.

### Implementation Highlights

- **State Management:** Game states (Start, Playing, Paused, Settings, GameOver, Win) are managed via robust state switching.
- **Procedural Generation:** Level layout, platforms, enemies, and nature elements are generated procedurally while ensuring paths are playable.
- **Object-Oriented Design:** Factories (e.g., `createPlatforms`, `createMushroom`) and Constructors (e.g., `Enemy`) keep entity code modular.

---

## 🚀 Installation & Running

1.  Ensure you have `index.html`, `sketch.js`, `p5.js`, and the `assets` folder in the same directory.
2.  Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).
3.  Enjoy!

---

## 👨‍💻 Credits

**Created by:** Jordan Vorster
**Built with:** [p5.js](https://p5js.org/)
