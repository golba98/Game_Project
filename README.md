BIGFOOT ADVENTURE
=================

A dynamic 2D side-scrolling platformer created by Jordan Vorster using p5.js.
Explore a living, procedurally generated world that changes with the seasons. Collect coins, brave the elements, and find your way home.

**[Play Online](index.html)** (Open index.html in a browser)

## 🎮 Controls

| Action | Key(s) |
| :--- | :--- |
| **Move Left** | `Left Arrow` or `A` |
| **Move Right** | `Right Arrow` or `D` |
| **Jump** | `Spacebar` |
| **Hibernate** | `W` (When near cave in Winter) |
| **Cycle Seasons** | `T` (Next) / `R` (Previous) |
| **Respawn** | `Spacebar` (After death) |

---

## ✨ Key Features

### 🌍 Dynamic Environment
*   **4 Distinct Seasons:** The world transforms visually and mechanically.
    *   **Spring:** Blooming pink trees and light showers.
    *   **Summer:** Lush green foliage and clear sunny skies.
    *   **Autumn:** Orange leaves fall from trees, accompanied by heavy rain and wind.
    *   **Winter:** Trees go bare, heavy snow falls, and fog rolls in.
*   **Day/Night Cycle:** Watch the sun set and moon rise, changing the sky gradient and lighting.
*   **Procedural Weather:** Rain and snow are generated with a particle system that reacts to wind and camera movement.

### 🐻 Character & Gameplay
*   **Physics-Based Movement:** Smooth running and jumping with gravity.
*   **Hibernation Mechanic:** In Winter, finding a cave allows the bear to sleep through the cold.
*   **Lives System:** You start with 3 hearts. Falling into a canyon loses a life.
*   **Collectables:** Find all 5 gold coins hidden throughout the level.
*   **Victory Condition:** Reach the flagpole at the end of the level to raise the flag and win.

### 💅 Polish & "Game Juice"
*   **Smooth Camera:** The camera follows the player with a smooth scrolling effect (lerp).
*   **Particle Effects:** Dust kicks up when jumping or landing.
*   **Visual Feedback:** Animated flag, HUD with hearts, and fading tutorial text.
*   **Custom Assets:** Includes custom font for a cohesive aesthetic.

---

## 🛠️ Technical Details

### Project Structure
*   `index.html`: The entry point for the web page.
*   `sketch.js`: Contains all game logic, drawing code, and state management.
*   `p5.js`: The graphics library used for rendering.
*   `assets/`: Contains external resources like fonts.

### Implementation Highlights
*   **State Management:** Game states (Play, GameOver, LevelComplete) are managed via flags and conditional rendering.
*   **Procedural Generation:** Mountains, trees, clouds, and canyons are randomly placed at the start of each run, ensuring a unique experience.
*   **Object-Oriented Design:** Game entities (Clouds, Particles, Canyons) are structured as objects with properties for cleaner code.
*   **Vector Math:** Used for particle physics and weather simulation.

---

## 🚀 Installation & Running

1.  Ensure you have `index.html`, `sketch.js`, `p5.js`, and the `assets` folder in the same directory.
2.  Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).
3.  Enjoy!

---

## 👨‍💻 Credits

**Created by:** Jordan Vorster
**Built with:** [p5.js](https://p5js.org/)