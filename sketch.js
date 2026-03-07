// ============================================================
// 1. CONSTANTS & GAME STATES
// ============================================================

const STATE_START = "START";
const STATE_PLAYING = "PLAYING";
const STATE_PAUSED = "PAUSED";
const STATE_SETTINGS = "SETTINGS";
const STATE_GAMEOVER = "GAMEOVER";
const STATE_WIN = "WIN";

const ORIGINAL_WIDTH = 1000;
const ORIGINAL_HEIGHT = 600;
const HIBERNATION_DURATION = 600;
const JUMP_BUFFER_LIMIT = 10;
const COYOTE_TIME_LIMIT = 5;
const SEASON_DURATION = 720;

const gravity = 0.6;
const jumpPower = -15;

const seasonSpecs = [
  {
    name: "Spring",
    sky: [180, 220, 255],
    ground: [140, 190, 150],
    grass: [80, 200, 120],
    leaf: [255, 182, 193], // Cherry Blossom Pink
    leafStyle: "bloom",
    weather: {
      type: "rain",
      density: 40,
      speed: 4,
      wind: 0.5,
      color: [180, 200, 255],
    },
    fog: { color: [240, 250, 255], alpha: 20 },
  },
  {
    name: "Summer",
    sky: [100, 180, 255],
    ground: [160, 140, 100],
    grass: [50, 160, 80],
    leaf: [40, 120, 60],
    leafStyle: "lush",
    weather: { type: "none", density: 0, speed: 0, wind: 0, color: [0, 0, 0] },
    fog: { color: [255, 255, 255], alpha: 0 },
  },
  {
    name: "Autumn",
    sky: [255, 160, 100],
    ground: [150, 100, 60],
    grass: [180, 120, 50],
    leaf: [200, 80, 40],
    leafStyle: "crisp",
    weather: {
      type: "rain",
      density: 80,
      speed: 7,
      wind: 2,
      color: [100, 100, 150],
    },
    fog: { color: [150, 100, 50], alpha: 40 },
  },
  {
    name: "Winter",
    sky: [160, 180, 200], // Deeper blue for better contrast
    ground: [220, 225, 235], // Slightly darker snow ground
    grass: [200, 210, 220],
    leaf: [255, 255, 255],
    leafStyle: "bare",
    weather: {
      type: "snow",
      density: 100,
      speed: 2,
      wind: 1,
      color: [255, 255, 255],
    },
    fog: { color: [180, 190, 200], alpha: 60 }, // Reduced from 120 for visibility
  },
];

// ============================================================
// 2. GLOBALS
// ============================================================

let gameState = STATE_START;
let previousState = STATE_START;

let gameChar_x;
let gameChar_y;
let floorPos_y;

let furColor;
let skinColor;

let lives;
let game_score;
let flagpole;
let gameFont;
let level = 1;

// Movement / physics
let velocity_y = 0;
let isLeft = false;
let isRight = false;
let isFalling = false;
let isPlummeting = false;
let isContact = false;

// Camera / display
let cameraPosX = 0;
let screenShakeAmount = 0;
let charScaleX = 1;
let charScaleY = 1;
let coinAngle = 0;
let tutorialAlpha = 255;
let heartPulse = 0;
let invincibilityTimer = 0;
let knockbackVX = 0;
let maxLevelDist = 4500; // Distance to flagpole

// Jump feel
let jumpBufferTimer = 0;
let coyoteTimer = 0;

// Hibernation
let isHibernating = false;
let hibernationTimer = 0;

// World collections
let trees = [];
let mountains = [];
let clouds = [];
let collectables = [];
let canyons = [];
let cave;
let storyObjects = [];
let platforms = [];
let enemies = [];
let mushrooms = [];
let checkpoints = [];
let lastCheckpoint = { x: 100, y: 450 };
let dustParticles = [];
let weatherParticles = [];
let confetti = [];
let stars = [];
let shootingStar = null;

// Seasons / time
let seasons = [];
let currentSeasonIndex = 0;
let seasonTime = 0;
let timeOfDay = 0;
let cycleSpeed = 1.5;
let totalCollectables = 5;

// Level progression
let levelStartFrame = 0;
let levelConfig = {};

// Music
let noteSequence = [220, 247, 261, 293, 329];
let currentNote = 0;

// ============================================================
// 3. SOUND MANAGER
// ============================================================

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.volume = 0.5; // Default volume
    this.loadVolume();
  }

  init() {
    if (!this.audioCtx) {
      let AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.connect(this.audioCtx.destination);
      this.updateMasterGain();
    }
  }

  loadVolume() {
    const saved = localStorage.getItem("gameVolume");
    if (saved !== null) this.volume = parseFloat(saved);
  }

  saveVolume() {
    localStorage.setItem("gameVolume", this.volume);
  }

  setVolume(v) {
    this.volume = constrain(v, 0, 1);
    this.init();
    this.updateMasterGain();
    this.saveVolume();
  }

  updateMasterGain() {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.volume,
        this.audioCtx.currentTime,
        0.05,
      );
    }
  }

  play(type) {
    this.init();
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();

    let oscillator = this.audioCtx.createOscillator();
    let gainNode = this.audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    const now = this.audioCtx.currentTime;

    const SOUND_DEFS = {
      coin: {
        wave: "sine",
        freqStart: 880,
        freqEnd: 1320,
        freqRamp: "exp",
        gainStart: 0.1,
        gainEnd: 0.01,
        gainRamp: "exp",
        dur: 0.3,
      },
      jump: {
        wave: "triangle",
        freqStart: 150,
        freqEnd: 400,
        freqRamp: "exp",
        gainStart: 0.1,
        gainEnd: 0.01,
        gainRamp: "exp",
        dur: 0.2,
      },
      death: {
        wave: "sawtooth",
        freqStart: 100,
        freqEnd: 20,
        freqRamp: "lin",
        gainStart: 0.2,
        gainEnd: 0.0,
        gainRamp: "lin",
        dur: 0.5,
      },
      land: {
        wave: "triangle",
        freqStart: 100,
        freqEnd: 40,
        freqRamp: "exp",
        gainStart: 0.05,
        gainEnd: 0.01,
        gainRamp: "exp",
        dur: 0.2,
      },
    };

    const def = SOUND_DEFS[type];
    if (!def) return;

    oscillator.type = def.wave;
    oscillator.frequency.setValueAtTime(def.freqStart, now);
    gainNode.gain.setValueAtTime(def.gainStart, now);

    if (def.freqRamp === "exp")
      oscillator.frequency.exponentialRampToValueAtTime(def.freqEnd, now + 0.1);
    else oscillator.frequency.linearRampToValueAtTime(def.freqEnd, now + 0.1);

    if (def.gainRamp === "exp")
      gainNode.gain.exponentialRampToValueAtTime(
        def.gainEnd || 0.001,
        now + def.dur,
      );
    else gainNode.gain.linearRampToValueAtTime(def.gainEnd, now + def.dur);

    oscillator.start();
    oscillator.stop(now + 0.5);
  }
}

const sounds = new SoundManager();

// ============================================================
// 4. ENTITY FACTORIES
// ============================================================

function createPlatforms(x, y, length) {
  return {
    x,
    y,
    length,
    draw() {
      fill(120, 100, 80);
      rect(this.x, this.y, this.length, 20, 5);
      fill(255, 50);
      rect(this.x, this.y, this.length, 5, 5);
    },
    checkContact(gc_x, gc_y) {
      const d = this.y - gc_y;
      return gc_x > this.x && gc_x < this.x + this.length && d >= 0 && d < 5;
    },
  };
}

function createMovingPlatform(x, y, length, type) {
  let p = {
    x,
    y,
    originX: x,
    originY: y,
    length,
    type,
    phase: random(TWO_PI),

    update: function () {
      if (this.type === "horizontal") {
        this.x = this.originX + sin(frameCount * 0.02 + this.phase) * 80;
      } else {
        this.y = this.originY + sin(frameCount * 0.03 + this.phase) * 40;
      }
    },

    draw: function () {
      fill(80, 60, 100);
      rect(this.x, this.y, this.length, 20, 5);
      fill(180, 140, 255, 80);
      rect(this.x, this.y, this.length, 5, 5);
    },

    checkContact: function (gc_x, gc_y) {
      if (gc_x > this.x && gc_x < this.x + this.length) {
        let d = this.y - gc_y;
        if (d > -3 && d < 5) return true;
      }
      return false;
    },
  };
  return p;
}

function createMushroom(x, y) {
  return {
    x,
    y,
    draw: function () {
      push();
      translate(this.x, this.y);
      let bounce = sin(frameCount * 0.1) * 3;
      let squish = map(bounce, -3, 3, 0.9, 1.1);
      noStroke();

      // Ground shadow (stays on ground)
      fill(0, 50);
      ellipse(0, 0, 40 * squish, 10);

      // Stem
      fill(240, 230, 210);
      beginShape();
      vertex(-8, 0);
      bezierVertex(-10, -10, -5, -20, -5, -25);
      vertex(5, -25);
      bezierVertex(5, -20, 10, -10, 8, 0);
      endShape(CLOSE);

      // Cap
      fill(220, 60, 60);
      arc(0, -25 + bounce, 70 * squish, 45 / squish, PI, TWO_PI, CHORD);

      // Cap highlight (rim light)
      fill(255, 120, 120, 180);
      arc(
        0,
        -29 + bounce,
        60 * squish,
        35 / squish,
        PI + 0.4,
        TWO_PI - 0.4,
        CHORD,
      );

      // Dots (with slight depth)
      fill(255, 230);
      ellipse(-15, -38 + bounce, 10, 8);
      ellipse(15, -35 + bounce, 12, 10);
      ellipse(0, -45 + bounce, 14, 12);
      ellipse(-20, -30 + bounce, 6, 5);
      ellipse(22, -28 + bounce, 7, 6);
      pop();
    },
    checkContact: function (gc_x, gc_y) {
      let d = dist(gc_x, gc_y, this.x, this.y - 25);
      return d < 45;
    },
  };
}

function Enemy(x, y, range) {
  this.x = x;
  this.y = y;
  this.range = range;
  this.currentX = x;
  this.inc = 1;

  this.update = function () {
    this.currentX += this.inc;
    if (this.currentX >= this.x + this.range) {
      this.inc = -1;
    } else if (this.currentX < this.x) {
      this.inc = 1;
    }
  };

  this.draw = function () {
    this.update();

    let ex = this.currentX;
    let ey = this.y;
    let facing = this.inc >= 0 ? 1 : -1; // 1 = right, -1 = left

    push();
    noStroke();

    // Ground shadow
    fill(0, 40);
    ellipse(ex, ey, 44, 8);

    // Tail
    fill(30, 20, 15);
    push();
    translate(ex - facing * 14, ey - 14);
    rotate(facing * 0.5 + sin(frameCount * 0.15) * 0.3);
    ellipse(0, -10, 8, 20, 5);
    pop();

    // Body
    fill(35, 25, 18);
    ellipse(ex, ey - 16, 38, 22);

    // Neck
    fill(40, 28, 20);
    ellipse(ex + facing * 14, ey - 22, 18, 16);

    // Head
    fill(35, 25, 18);
    ellipse(ex + facing * 22, ey - 26, 24, 20);

    // Snout
    fill(60, 42, 30);
    ellipse(ex + facing * 32, ey - 24, 14, 10);

    // Nose
    fill(15, 10, 8);
    ellipse(ex + facing * 37, ey - 25, 5, 4);

    // Eye — glowing amber
    fill(220, 140, 20);
    ellipse(ex + facing * 25, ey - 29, 6, 5);
    fill(0);
    ellipse(ex + facing * 26, ey - 29, 3, 3);

    // Ear
    fill(30, 20, 14);
    triangle(
      ex + facing * 18,
      ey - 34,
      ex + facing * 24,
      ey - 44,
      ex + facing * 28,
      ey - 34,
    );

    // Legs (animated walk cycle)
    fill(30, 20, 14);
    let step = sin(frameCount * 0.2) * 6;
    rect(ex - 12, ey - 8, 7, 10, 3); // back-left leg
    rect(ex - 4, ey - 8, 7, 10 - step, 3); // back-right leg
    rect(ex + 4, ey - 8, 7, 10 + step, 3); // front-left leg
    rect(ex + 12, ey - 8, 7, 10, 3); // front-right leg

    pop();
  };

  this.checkContact = function (gc_x, gc_y) {
    return dist(gc_x, gc_y, this.currentX, this.y - 10) < 20;
  };
}

function FlyingEnemy(x, y, range) {
  this.x = x;
  this.y = y;
  this.range = range;
  this.currentX = x;
  this.currentY = y;
  this.inc = 1;
  this.phase = random(TWO_PI);

  this.update = function () {
    this.currentY += this.inc * 1.5;
    if (this.currentY >= this.y + this.range / 2) this.inc = -1;
    else if (this.currentY <= this.y - this.range / 2) this.inc = 1;
  };

  this.draw = function () {
    this.update();
    const bx = this.currentX;
    const by = this.currentY;
    const flapAngle = sin(frameCount * 0.25 + this.phase) * 0.6;

    function drawWing(angle, mirrored) {
      push();
      translate(bx, by);
      rotate(angle);
      if (mirrored) scale(-1, 1);
      beginShape();
      vertex(0, 0);
      bezierVertex(-10, -8, -30, -14, -36, -2);
      bezierVertex(-28, 4, -12, 2, 0, 0);
      endShape(CLOSE);
      pop();
    }

    push();
    noStroke();
    fill(30, 20, 40);
    ellipse(bx, by, 20, 14);
    fill(50, 30, 60, 220);
    drawWing(-flapAngle, false); // Left wing
    drawWing(flapAngle, true); // Right wing (mirrored)
    // Ears
    fill(60, 40, 70);
    triangle(bx - 6, by - 6, bx - 10, by - 18, bx - 2, by - 6);
    triangle(bx + 6, by - 6, bx + 10, by - 18, bx + 2, by - 6);
    // Eyes
    fill(220, 30, 30);
    ellipse(bx - 4, by - 1, 5, 5);
    ellipse(bx + 4, by - 1, 5, 5);
    pop();
  };

  this.checkContact = function (gc_x, gc_y) {
    return dist(gc_x, gc_y, this.currentX, this.currentY) < 22;
  };
}

// ============================================================
// 5. WORLD GENERATION
// ============================================================

function preload() {
  gameFont = loadFont("assets/font.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(gameFont);
  floorPos_y = 450;
  furColor = color(70, 45, 20);
  skinColor = color(180, 140, 110);
  lives = 3;
  startGame();
}

function startGame() {
  levelConfig = getLevelConfig(level);
  cycleSpeed = levelConfig.seasonSpeed;
  levelStartFrame = frameCount;

  gameChar_x = 100;
  gameChar_y = floorPos_y;
  velocity_y = 0;
  cameraPosX = 0;
  tutorialAlpha = 255;
  game_score = 0;
  flagpole = { isReached: false, x_pos: levelConfig.flagpoleX, height: 0 };
  isLeft = false;
  isRight = false;
  isFalling = false;
  isPlummeting = false;
  isHibernating = false;
  invincibilityTimer = 0;
  knockbackVX = 0;
  coyoteTimer = 0;
  lastCheckpoint = { x: 100, y: floorPos_y };

  generateCanyons(levelConfig);
  generateCave();
  initializeSeasons();
  generateTrees();
  generateMountains();
  generateClouds();
  generateStoryObjects();
  generateCheckpoints();
  generateStars();

  platforms = [];
  const platformCreators = {
    static: (p) => createPlatforms(p.x, p.y, p.length),
    moving_h: (p) => createMovingPlatform(p.x, p.y, p.length, "horizontal"),
    moving_v: (p) => createMovingPlatform(p.x, p.y, p.length, "vertical"),
  };
  for (let p of levelConfig.platforms ?? []) {
    if (platformCreators[p.type]) platforms.push(platformCreators[p.type](p));
  }

  generateMushrooms();
  generateCollectables(levelConfig);

  enemies = [];
  for (let i = 0; i < levelConfig.enemyCount; i++) {
    let safeX = 1200 + i * 800;
    let safe = false;
    let attempts = 0;
    while (!safe && attempts < 20) {
      safe = true;
      for (let c of canyons) {
        if (safeX > c.x_pos - 60 && safeX < c.x_pos + c.width + 60) {
          safe = false;
          safeX += 350;
          break;
        }
      }
      attempts++;
    }
    enemies.push(new Enemy(safeX, floorPos_y, 100 + i * 20));
  }

  for (let i = 0; i < levelConfig.flyingEnemyCount; i++) {
    enemies.push(
      new FlyingEnemy(1600 + i * 900, floorPos_y - 180 - i * 20, 120),
    );
  }

  totalCollectables = collectables.length;
}

function generateCheckpoints() {
  checkpoints = [];
  let targets = [1000, 2000, 3000, 4000];

  for (let tx of targets) {
    let safeX = tx;
    let isSafe = false;
    let attempts = 0;

    while (!isSafe && attempts < 10) {
      isSafe = true;
      for (let c of canyons) {
        if (safeX > c.x_pos - 20 && safeX < c.x_pos + c.width + 20) {
          isSafe = false;
          safeX += 100; // Move it along until it's safe
          break;
        }
      }
      attempts++;
    }
    checkpoints.push({ x: safeX, isReached: false });
  }
}

function generateMushrooms() {
  mushrooms = [];
  let mushroomSpawnX = [1300, 2000, 3800];

  for (let mx of mushroomSpawnX) {
    let safeX = mx;
    let isSafe = false;
    let attempts = 0;

    while (!isSafe && attempts < 10) {
      isSafe = true;
      // Check canyons
      for (let c of canyons) {
        if (safeX > c.x_pos - 40 && safeX < c.x_pos + c.width + 40) {
          isSafe = false;
          safeX += 150;
          break;
        }
      }
      // Check platforms (don't spawn under them)
      for (let p of platforms) {
        if (abs(safeX - p.x) < 50 && p.y < floorPos_y - 50) {
          isSafe = false;
          safeX += 200;
          break;
        }
      }
      attempts++;
    }
    mushrooms.push(createMushroom(safeX, floorPos_y));
  }
}

function generateStoryObjects() {
  storyObjects = [];

  // Find a safe spot for the camp
  let campX = -400;
  let isCampValid = false;
  while (!isCampValid && campX < 500) {
    isCampValid = true;
    for (let c of canyons) {
      if (campX > c.x_pos - 60 && campX < c.x_pos + c.width + 60) {
        isCampValid = false;
        campX += 150;
        break;
      }
    }
  }
  storyObjects.push({ type: "camp", x: campX });

  if (cave) {
    storyObjects.push({ type: "footprint", x: cave.x_pos - 100 });
  }

  for (let c of canyons) {
    if (random() > 0.5)
      storyObjects.push({ type: "bridge", x: c.x_pos, w: c.width });
  }
}

function generateCanyons(config) {
  canyons = [];
  // THE LEAP OF FAITH: wide but clearable (Max jump is ~250px)
  canyons.push({ x_pos: 1800, width: 220 });

  for (let i = 0; i < config.canyonCount; i++) {
    let cx = random(500, 4000);
    let cw = random(config.canyonMinWidth, config.canyonMaxWidth);
    let valid = true;

    for (let c of canyons) {
      if (abs(c.x_pos - cx) < 400) {
        valid = false;
        break;
      }
    }

    if (valid) {
      canyons.push({ x_pos: cx, width: cw });
    } else {
      i--;
    }
  }
}

function generateCave() {
  while (true) {
    let cx = random(-1500, 2500);
    let cw = random(220, 320);
    let ch = random(160, 220);
    let valid = true;

    for (let c of canyons) {
      if (cx + cw > c.x_pos - 50 && cx < c.x_pos + c.width + 50) {
        valid = false;
        break;
      }
    }

    if (valid) {
      cave = { x_pos: cx, width: cw, height: ch };
      break;
    }
  }
}

function generateCollectables(config) {
  collectables = [];
  collectables.push({ x_pos: 875, y_pos: floorPos_y - 330, isFound: false });

  for (let i = 0; i < config.collectableCount; i++) {
    let cx = random(200, 4000);
    let valid = true;

    for (let c of canyons) {
      if (cx > c.x_pos - 20 && cx < c.x_pos + c.width + 20) {
        valid = false;
        break;
      }
    }

    if (valid) {
      collectables.push({ x_pos: cx, y_pos: floorPos_y - 20, isFound: false });
    } else {
      i--;
    }
  }

  if (cave) {
    collectables.push({
      x_pos: cave.x_pos + cave.width / 2,
      y_pos: floorPos_y - 20,
      isFound: false,
    });
  }
}

function initializeSeasons() {
  seasons = [];
  for (let spec of seasonSpecs) {
    seasons.push({
      name: spec.name,
      sky: color(...spec.sky),
      ground: color(...spec.ground),
      grass: color(...spec.grass),
      leaf: color(...spec.leaf),
      leafStyle: spec.leafStyle,
    });
  }
}

function generateTrees() {
  trees = [];
  for (let i = 0; i < 20; i++) {
    let tx = random(-2000, 2900);
    let valid = true;

    for (let c of canyons) {
      if (tx > c.x_pos - 80 && tx < c.x_pos + c.width + 80) {
        valid = false;
        break;
      }
    }

    if (valid) {
      for (let t of trees) {
        if (abs(t.x - tx) < 100) {
          valid = false;
          break;
        }
      }
    }

    if (valid) {
      let s = seasons[currentSeasonIndex] || seasons[0];
      trees.push({
        x: tx,
        y: floorPos_y,
        trunkW: random(30, 50),
        trunkH: random(90, 160),
        canopySize: random(110, 160),
        leafColor: color(random(20, 60), random(100, 180), random(20, 60)),
        particlePhase: random(TWO_PI),
        style: s.leafStyle,
      });
    } else {
      i--;
    }
  }
}

function generateMountains() {
  mountains = [];
  for (let i = 0; i < 15; i++) {
    mountains.push({
      x: random(-2000, 3000),
      width: random(200, 500),
      height: random(200, 450),
      color: random(80, 180),
    });
  }
}

function generateClouds() {
  clouds = [];
  for (let i = 0; i < 15; i++) {
    let puffs = [];
    let numPuffs = floor(random(3, 6));
    for (let j = 0; j < numPuffs; j++) {
      puffs.push({
        ox: random(-40, 40),
        oy: random(-20, 20),
        size: random(40, 80),
      });
    }
    clouds.push({
      x: random(-2000, 3000),
      y: random(60, 180),
      puffs: puffs,
      speed: random(0.2, 0.8),
      bobOffset: random(TWO_PI),
    });
  }
}

function generateStars() {
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(width),
      y: random(height * 0.6),
      size: random(1, 3),
      twinkleSpeed: random(0.05, 0.1),
      phase: random(TWO_PI),
    });
  }
}

function getLevelConfig(lvl) {
  const levels = [
    {
      // Level 1: Introduction
      enemyCount: 1,
      canyonCount: 4,
      canyonMinWidth: 80,
      canyonMaxWidth: 150,
      collectableCount: 4,
      seasonSpeed: 1.5,
      flagpoleX: 3000,
      flyingEnemyCount: 0,
      platforms: [
        { type: "static", x: 500, y: floorPos_y - 100, length: 150 },
        { type: "static", x: 1000, y: floorPos_y - 100, length: 150 },
      ],
    },
    {
      // Level 2: Heightened
      enemyCount: 2,
      canyonCount: 5,
      canyonMinWidth: 100,
      canyonMaxWidth: 180,
      collectableCount: 5,
      seasonSpeed: 1.7,
      flagpoleX: 4000,
      flyingEnemyCount: 0,
      platforms: [
        { type: "static", x: 500, y: floorPos_y - 100, length: 150 },
        { type: "static", x: 1000, y: floorPos_y - 100, length: 150 },
        { type: "moving_h", x: 1800, y: floorPos_y - 130, length: 120 },
        { type: "moving_v", x: 2600, y: floorPos_y - 180, length: 100 },
      ],
    },
    {
      // Level 3: Aerial Threat
      enemyCount: 2,
      canyonCount: 6,
      canyonMinWidth: 120,
      canyonMaxWidth: 200,
      collectableCount: 6,
      seasonSpeed: 1.8,
      flagpoleX: 5000,
      flyingEnemyCount: 1,
      platforms: [
        { type: "static", x: 800, y: floorPos_y - 100, length: 150 },
        { type: "moving_h", x: 1600, y: floorPos_y - 130, length: 120 },
        { type: "moving_v", x: 2400, y: floorPos_y - 180, length: 100 },
        { type: "moving_h", x: 3200, y: floorPos_y - 150, length: 110 },
        { type: "moving_v", x: 3900, y: floorPos_y - 200, length: 100 },
      ],
    },
    {
      // Level 4: The Gauntlet
      enemyCount: 3,
      canyonCount: 7,
      canyonMinWidth: 140,
      canyonMaxWidth: 220,
      collectableCount: 7,
      seasonSpeed: 2.0,
      flagpoleX: 6000,
      flyingEnemyCount: 2,
      platforms: [
        { type: "static", x: 1000, y: floorPos_y - 100, length: 120 },
        { type: "moving_v", x: 1800, y: floorPos_y - 220, length: 90 },
        { type: "moving_h", x: 2800, y: floorPos_y - 160, length: 110 },
        { type: "moving_h", x: 3800, y: floorPos_y - 160, length: 110 },
        { type: "moving_v", x: 4800, y: floorPos_y - 200, length: 100 },
      ],
    },
    {
      // Level 5: The Last Stand
      enemyCount: 4,
      canyonCount: 8,
      canyonMinWidth: 160,
      canyonMaxWidth: 240,
      collectableCount: 8,
      seasonSpeed: 2.5,
      flagpoleX: 7500,
      flyingEnemyCount: 3,
      platforms: [
        { type: "moving_h", x: 1200, y: floorPos_y - 180, length: 120 },
        { type: "moving_v", x: 2200, y: floorPos_y - 240, length: 90 },
        { type: "moving_v", x: 3400, y: floorPos_y - 220, length: 90 },
        { type: "moving_h", x: 4600, y: floorPos_y - 180, length: 110 },
        { type: "moving_v", x: 5800, y: floorPos_y - 250, length: 90 },
        { type: "static", x: 6800, y: floorPos_y - 100, length: 150 },
      ],
    },
  ];

  // Clamp level to max index
  let index = constrain(lvl - 1, 0, levels.length - 1);
  return levels[index];
}

// ============================================================
// 6. UPDATE / GAME LOGIC
// ============================================================

function draw() {
  if (gameState === STATE_START) {
    drawStartMenu();
  } else if (gameState === STATE_PLAYING) {
    updateGame();
    drawGame();
  } else if (gameState === STATE_PAUSED) {
    drawGame();
    drawPauseScreen();
  } else if (gameState === STATE_SETTINGS) {
    if (previousState === STATE_PLAYING || previousState === STATE_PAUSED)
      drawGame();
    else background(0);
    drawSettingsMenu();
  } else if (gameState === STATE_GAMEOVER) {
    drawGameOver();
  } else if (gameState === STATE_WIN) {
    drawWinScreen();
  }
}

function updateGame() {
  updateDayNightCycle();
  updateSeasonCycle();
  updateHibernationLogic();
  playSeasonalAmbience();
  playProceduralMusic();

  charScaleX = lerp(charScaleX, 1, 0.2);
  charScaleY = lerp(charScaleY, 1, 0.2);
  heartPulse += 0.1;

  updateWeather();
  checkCheckpoints();

  coinAngle += 0.05;

  if (invincibilityTimer > 0) invincibilityTimer--;

  // Canyon plummet detection
  for (let c of canyons) {
    if (
      gameChar_x > c.x_pos &&
      gameChar_x < c.x_pos + c.width &&
      gameChar_y >= floorPos_y
    ) {
      isPlummeting = true;
    }
  }

  // Collectable pickup
  for (let col of collectables) {
    if (
      !col.isFound &&
      dist(gameChar_x, gameChar_y, col.x_pos, col.y_pos) < 50
    ) {
      col.isFound = true;
      game_score++;
      sounds.play("coin");
    }
  }

  // Platform contact resolution
  isContact = false;
  for (let p of platforms) {
    if (typeof p.update === "function") p.update();
    // Also pre-emptively check if the character will pass through this frame
    // (solves the tunneling problem for high velocity)
    if (
      p.checkContact(gameChar_x, gameChar_y) ||
      (velocity_y > 0 &&
        gameChar_y < p.y &&
        gameChar_y + velocity_y >= p.y &&
        gameChar_x > p.x &&
        gameChar_x < p.x + p.length)
    ) {
      isContact = true;
      // Snap to platform top. >= 0 also covers standing (velocity=0)
      // so moving platforms carry the player each frame.
      if (velocity_y >= 0) {
        gameChar_y = p.y;
        velocity_y = 0;
      }
    }
  }

  // Enemy hit detection
  for (let e of enemies) {
    if (invincibilityTimer <= 0 && e.checkContact(gameChar_x, gameChar_y)) {
      lives--;
      sounds.play("death");
      screenShakeAmount = 8;
      let ex = e.currentX !== undefined ? e.currentX : e.x;
      let dir = gameChar_x >= ex ? 1 : -1;
      knockbackVX = dir * 9;
      velocity_y = -8;
      invincibilityTimer = 90;
      if (lives < 1) gameState = STATE_GAMEOVER;
      break;
    }
  }

  // Flagpole reach detection
  if (!flagpole.isReached && abs(gameChar_x - flagpole.x_pos) < 20) {
    flagpole.isReached = true;
  }

  if (lives < 1) {
    gameState = STATE_GAMEOVER;
  }

  // Transition to win state only after flag animation finishes
  if (flagpole.isReached && flagpole.height >= 200) {
    gameState = STATE_WIN;
  }
}

function updateDayNightCycle() {
  timeOfDay = (timeOfDay + cycleSpeed) % 1440;
}

function updateSeasonCycle() {
  seasonTime += cycleSpeed;
  if (seasonTime >= SEASON_DURATION) {
    seasonTime = 0;
    currentSeasonIndex = (currentSeasonIndex + 1) % seasons.length;
    if (seasons[currentSeasonIndex].name === "Summer") {
      isHibernating = false;
    }
  }
}

function updateHibernationLogic() {
  if (isHibernating && ++hibernationTimer >= HIBERNATION_DURATION) {
    isHibernating = false;
  }
}

function updateWeather() {
  let cur = seasonSpecs[currentSeasonIndex];
  let w = cur.weather;

  if (w.type === "none") {
    weatherParticles = [];
    return;
  }

  while (weatherParticles.length < w.density) {
    weatherParticles.push({
      x: random(width),
      y: random(-height, 0),
      z: random(0.5, 2),
      len: random(10, 20),
    });
  }

  stroke(w.color[0], w.color[1], w.color[2]);
  for (let p of weatherParticles) {
    p.y += w.speed * p.z;
    p.x += w.wind * p.z;
    if (p.y > height) {
      p.y = random(-50, 0);
      p.x = random(width);
    }

    if (w.type === "rain") {
      strokeWeight(p.z);
      line(p.x, p.y, p.x, p.y + p.len * p.z);
    } else {
      noStroke();
      fill(255);
      ellipse(p.x, p.y, 4 * p.z, 4 * p.z);
    }
  }
}

function checkCheckpoints() {
  for (let cp of checkpoints) {
    if (!cp.isReached && abs(gameChar_x - cp.x) < 50) {
      cp.isReached = true;
      lastCheckpoint = { x: cp.x, y: floorPos_y };
    }
  }
}

function processCharacter() {
  if (!isHibernating && !isPlummeting) {
    isLeft = keyIsDown(LEFT_ARROW) || keyIsDown(65);
    isRight = keyIsDown(RIGHT_ARROW) || keyIsDown(68);
    if (isLeft) gameChar_x -= 5;
    if (isRight) gameChar_x += 5;
    if (knockbackVX !== 0) {
      gameChar_x += knockbackVX;
      knockbackVX *= 0.75;
      if (abs(knockbackVX) < 0.2) knockbackVX = 0;
    }
  }

  if (!isHibernating) {
    gameChar_y += velocity_y;

    if (jumpBufferTimer > 0) jumpBufferTimer--;

    if (!isFalling) {
      coyoteTimer = COYOTE_TIME_LIMIT;
    } else if (coyoteTimer > 0) {
      coyoteTimer--;
    }

    if (gameChar_y < floorPos_y && !isContact) {
      velocity_y += gravity;
      isFalling = true;
    } else {
      if (isFalling) {
        createDust(gameChar_x, gameChar_y);
        charScaleX = 1.2;
        charScaleY = 0.8;
        sounds.play("land");
      }
      isFalling = false;
      if (!isPlummeting) {
        if (!isContact) gameChar_y = floorPos_y;
        if (velocity_y > 0) velocity_y = 0; // Only clear downward velocity so jumps work
      } else {
        velocity_y += gravity;
      }
    }

    // Mushroom interaction
    for (let m of mushrooms) {
      if (velocity_y > 0 && m.checkContact(gameChar_x, gameChar_y)) {
        velocity_y = jumpPower * 1.5; // Super jump!
        sounds.play("jump");
        charScaleX = 0.6;
        charScaleY = 1.4;
        createDust(gameChar_x, gameChar_y);
      }
    }

    // Apply buffered jump
    if (
      jumpBufferTimer > 0 &&
      (coyoteTimer > 0 || !isFalling) &&
      !isPlummeting
    ) {
      velocity_y = jumpPower;
      sounds.play("jump");
      charScaleX = 0.8;
      charScaleY = 1.2;
      coyoteTimer = 0;
      jumpBufferTimer = 0;
    }
  }

  if (gameChar_x < -3000 || gameChar_x > 5000) isPlummeting = true;

  // Only draw the active character body if not hibernating
  if (!isHibernating) {
    drawGameCharBody();
  }
}

function respawnCharacter() {
  gameChar_x = lastCheckpoint.x;
  gameChar_y = lastCheckpoint.y;
  velocity_y = 0;
  knockbackVX = 0;
  isPlummeting = false;
  isFalling = false;
  isLeft = false;
  isRight = false;
  invincibilityTimer = 60; // 1 second of invincibility on respawn
  cameraPosX = gameChar_x - ORIGINAL_WIDTH / 2;
}

function toggleHibernation() {
  let near = cave && abs(gameChar_x - (cave.x_pos + cave.width / 2)) < 100;
  if (isHibernating) {
    isHibernating = false;
    hibernationTimer = 0;
  } else if (seasons[currentSeasonIndex].name === "Winter" && near) {
    isHibernating = true;
    gameChar_x = cave.x_pos + cave.width / 2;
    gameChar_y = floorPos_y;
    hibernationTimer = 0;
  }
}

function checkPlayerDie() {
  if (gameChar_y > height && lives > 0) {
    screenShakeAmount = 10;
    fill(0, 200);
    rect(0, 0, width, height);
    textAlign(CENTER, CENTER);
    textSize(30);
    fill(255);
    text("The Freeze takes you. Press Space.", width / 2, height / 2);
  }
}

function createDust(x, y) {
  for (let i = 0; i < 5; i++) {
    dustParticles.push({
      x,
      y,
      size: random(5, 10),
      alpha: 200,
      vx: random(-1, 1),
      vy: random(-0.5, -2),
    });
  }
}

function updateAndDrawDust() {
  noStroke();
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    let p = dustParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 5;
    fill(200, p.alpha);
    ellipse(p.x, p.y, p.size);
    if (p.alpha <= 0) dustParticles.splice(i, 1);
  }
}

function setupAudioNode() {
  sounds.init();
  const audioCtx = sounds.audioCtx;
  if (audioCtx.state === "suspended") audioCtx.resume();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(sounds.masterGain);
  return { audioCtx, oscillator, gainNode };
}

function playSeasonalAmbience() {
  if (frameCount % 180 !== 0 || !sounds.audioCtx) return;

  const AMBIENCE_DEFS = {
    Spring: {
      wave: "sine",
      freq: () => random(1500, 2500),
      peakGain: 0.02,
      rampUp: 0.1,
      rampDown: 0.2,
    },
    Summer: {
      wave: "triangle",
      freq: () => 1000,
      peakGain: 0.01,
      rampUp: 0.2,
      rampDown: 0.5,
    },
    Autumn: {
      wave: "sawtooth",
      freq: () => 200,
      peakGain: 0.01,
      rampUp: 0.5,
      rampDown: 1.0,
    },
    Winter: {
      wave: "sawtooth",
      freq: () => 50,
      peakGain: 0.02,
      rampUp: 1.0,
      rampDown: 2.0,
    },
  };

  try {
    const { audioCtx, oscillator, gainNode } = setupAudioNode();
    const s = seasons[currentSeasonIndex] || seasons[0];
    const def = AMBIENCE_DEFS[s.name];
    if (!def) return;

    oscillator.type = def.wave;
    oscillator.frequency.setValueAtTime(def.freq(), audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      def.peakGain,
      audioCtx.currentTime + def.rampUp,
    );
    gainNode.gain.linearRampToValueAtTime(
      0,
      audioCtx.currentTime + def.rampUp + def.rampDown,
    );

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 2);
  } catch (e) {}
}

function playProceduralMusic() {
  if (frameCount % 30 !== 0 || !sounds.audioCtx) return;
  try {
    const { audioCtx, oscillator, gainNode } = setupAudioNode();
    const s = seasons[currentSeasonIndex] || seasons[0];
    const baseFreq = noteSequence[currentNote];
    currentNote = (currentNote + 1) % noteSequence.length;

    oscillator.type = s.name === "Winter" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + 0.4,
    );

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {}
}

function createConfetti(x, y) {
  for (let i = 0; i < 50; i++) {
    confetti.push({
      x,
      y,
      vx: random(-5, 5),
      vy: random(-10, -2),
      color: color(random(255), random(255), random(255)),
      size: random(5, 10),
      angle: random(TWO_PI),
      spin: random(-0.2, 0.2),
    });
  }
}

function updateAndDrawConfetti() {
  for (let i = confetti.length - 1; i >= 0; i--) {
    let p = confetti[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2; // Gravity
    p.angle += p.spin;

    push();
    translate(p.x, p.y);
    rotate(p.angle);
    fill(p.color);
    noStroke();
    rect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
    pop();

    if (p.y > height) confetti.splice(i, 1);
  }
}

// ============================================================
// 7. RENDERING
// ============================================================

function drawGame() {
  let scaleX = width / ORIGINAL_WIDTH;
  let scaleY = height / ORIGINAL_HEIGHT;

  drawSkyAndCelestialBodies();

  push();

  // Screen shake
  if (screenShakeAmount > 0) {
    translate(
      random(-screenShakeAmount, screenShakeAmount),
      random(-screenShakeAmount, screenShakeAmount),
    );
    screenShakeAmount *= 0.9;
    if (screenShakeAmount < 0.1) screenShakeAmount = 0;
  }

  scale(scaleX, scaleY);
  cameraPosX = lerp(cameraPosX, gameChar_x - ORIGINAL_WIDTH / 2, 0.1);

  // Parallax background layers
  push();
  translate(-cameraPosX * 0.2, 0);
  drawMountains();
  pop();
  push();
  translate(-cameraPosX * 0.5, 0);
  drawClouds();
  pop();

  translate(-cameraPosX, 0);

  drawGroundAndGrass();
  drawStoryObjects();
  if (cave) drawCave();
  drawTrees();

  for (let c of canyons) {
    drawCanyon(c);
  }

  for (let col of collectables) {
    drawCollectable(col);
  }

  for (let p of platforms) {
    p.draw();
  }

  for (let m of mushrooms) {
    m.draw();
  }

  for (let e of enemies) {
    e.draw();
  }

  updateAndDrawDust();
  processCharacter();
  drawCharacterStatusUI();

  renderFlagpole();
  pop();

  updateAndDrawConfetti();
  drawFog();
  drawHUD();
  checkPlayerDie();
}

function drawSkyAndCelestialBodies() {
  let s = seasons[currentSeasonIndex] || seasons[0];
  let dayRatio = 1 - abs(timeOfDay - 720) / 720;
  let nightColor = color(10, 10, 30);
  let dayColor = s.sky;
  let skyColor = lerpColor(nightColor, dayColor, dayRatio);

  background(skyColor);

  // Stars at night
  if (dayRatio < 0.6) {
    let starAlpha = map(dayRatio, 0, 0.6, 255, 0);
    noStroke();
    for (let star of stars) {
      let twinkle = Math.sin(frameCount * star.twinkleSpeed + star.phase);
      let alpha = map(twinkle, -1, 1, starAlpha * 0.3, starAlpha);
      fill(255, alpha);
      // Subtle parallax: stars move slightly with camera
      let px = (star.x - cameraPosX * 0.05) % width;
      if (px < 0) px += width;
      ellipse(px, star.y, star.size, star.size);
    }

    // Shooting star logic
    if (!shootingStar && random() < 0.005 && dayRatio < 0.3) {
      shootingStar = {
        x: random(width),
        y: random(height * 0.4),
        vx: random(10, 20),
        vy: random(2, 5),
        life: 1.0,
      };
    }

    if (shootingStar) {
      stroke(255, shootingStar.life * 255);
      strokeWeight(2);
      line(
        shootingStar.x,
        shootingStar.y,
        shootingStar.x - shootingStar.vx * 2,
        shootingStar.y - shootingStar.vy * 2,
      );
      shootingStar.x += shootingStar.vx;
      shootingStar.y += shootingStar.vy;
      shootingStar.life -= 0.02;
      if (shootingStar.life <= 0) shootingStar = null;
    }
  }

  // Celestial movement
  let angle = map(timeOfDay, 0, 1440, PI, 3 * PI);
  let cx = width / 2 + cos(angle) * (width * 0.4);
  let cy = height * 0.6 + sin(angle) * (height * 0.4);

  if (dayRatio > 0.25) {
    // Sun
    noStroke();
    fill(255, 255, 150);
    ellipse(cx, cy, 60, 60);
    fill(255, 255, 100, 50);
    ellipse(cx, cy, 80, 80);
  } else {
    // Moon
    let mx = width / 2 + cos(angle + PI) * (width * 0.4);
    let my = height * 0.6 + sin(angle + PI) * (height * 0.4);
    noStroke();
    fill(220, 220, 255);
    ellipse(mx, my, 50, 50);
    fill(skyColor);
    ellipse(mx + 10, my - 5, 45, 45);
  }
}

function drawMountains() {
  for (let m of mountains) {
    let peakX = m.x + m.width / 2;
    let peakY = floorPos_y - m.height;
    noStroke();

    fill(m.color - 40);
    triangle(m.x, floorPos_y, peakX, peakY, peakX, floorPos_y);
    fill(m.color);
    triangle(peakX, floorPos_y, peakX, peakY, m.x + m.width, floorPos_y);

    let s = seasons[currentSeasonIndex] || seasons[0];
    let snowScale = s.name === "Winter" ? 0.6 : 0.25;
    let snowDepth = m.height * snowScale;

    if (s.name !== "Summer") {
      fill(255);
      beginShape();
      vertex(peakX, peakY);
      vertex(peakX - m.width * snowScale * 0.2, peakY + snowDepth * 0.4);
      vertex(peakX - m.width * snowScale * 0.3, peakY + snowDepth * 0.3);
      vertex(peakX - m.width * snowScale * 0.5, peakY + snowDepth);
      vertex(peakX - m.width * snowScale * 0.2, peakY + snowDepth * 0.8);
      vertex(peakX, peakY + snowDepth * 1.1);
      vertex(peakX + m.width * snowScale * 0.2, peakY + snowDepth * 0.8);
      vertex(peakX + m.width * snowScale * 0.5, peakY + snowDepth);
      vertex(peakX + m.width * snowScale * 0.3, peakY + snowDepth * 0.3);
      vertex(peakX + m.width * snowScale * 0.2, peakY + snowDepth * 0.4);
      endShape(CLOSE);

      fill(220, 230, 255);
      beginShape();
      vertex(peakX, peakY);
      vertex(peakX - m.width * snowScale * 0.2, peakY + snowDepth * 0.4);
      vertex(peakX - m.width * snowScale * 0.3, peakY + snowDepth * 0.3);
      vertex(peakX - m.width * snowScale * 0.5, peakY + snowDepth);
      vertex(peakX, peakY + snowDepth * 1.1);
      endShape(CLOSE);
    }
  }
}

function drawClouds() {
  for (let c of clouds) {
    let bob = sin(frameCount * 0.02 + c.bobOffset) * 5;
    noStroke();

    for (let p of c.puffs) {
      // Main puff body
      fill(255, 200);
      ellipse(c.x + p.ox, c.y + p.oy + bob, p.size, p.size * 0.8);

      // Subtle highlight on top
      fill(255, 255, 255, 150);
      ellipse(
        c.x + p.ox,
        c.y + p.oy + bob - p.size * 0.1,
        p.size * 0.8,
        p.size * 0.4,
      );
    }

    c.x += c.speed;
    if (c.x > 4500) c.x = -1500;
  }
}

function drawTrees() {
  const s = seasons[currentSeasonIndex] || seasons[0];
  for (let t of trees) {
    let cx = t.x + t.trunkW / 2;

    // Ground shadow
    fill(0, 40);
    ellipse(cx, t.y, t.trunkW * 2, 10);

    // Trunk
    fill(s.name === "Winter" ? color(80, 50, 30) : color(100, 60, 20));
    rect(t.x, t.y - t.trunkH, t.trunkW, t.trunkH, 2);

    // Bark detail
    stroke(0, 30);
    line(
      t.x + t.trunkW * 0.3,
      t.y - t.trunkH * 0.8,
      t.x + t.trunkW * 0.3,
      t.y - t.trunkH * 0.2,
    );
    line(
      t.x + t.trunkW * 0.7,
      t.y - t.trunkH * 0.7,
      t.x + t.trunkW * 0.7,
      t.y - t.trunkH * 0.4,
    );
    noStroke();

    if (s.name === "Winter") {
      // Bare winter branches with snow
      stroke(80, 50, 30);
      strokeWeight(3);
      line(cx, t.y - t.trunkH, cx - 30, t.y - t.trunkH - 40);
      line(cx, t.y - t.trunkH, cx + 30, t.y - t.trunkH - 35);
      noStroke();
      fill(255);
      ellipse(cx - 15, t.y - t.trunkH - 20, 10, 5);
      ellipse(cx + 15, t.y - t.trunkH - 18, 12, 6);
    } else {
      let leafCol = lerpColor(t.leafColor, s.leaf, 0.5);
      let foliageY = t.y - t.trunkH * 0.9;
      let sz = t.canopySize;

      // Canopy layers
      fill(lerpColor(leafCol, color(0), 0.2));
      ellipse(cx, foliageY, sz, sz * 0.8);
      fill(leafCol);
      ellipse(cx - sz * 0.15, foliageY - sz * 0.1, sz * 0.8, sz * 0.7);
      ellipse(cx + sz * 0.15, foliageY - sz * 0.1, sz * 0.8, sz * 0.7);
      fill(lerpColor(leafCol, color(255), 0.2));
      ellipse(cx, foliageY - sz * 0.3, sz * 0.6, sz * 0.5);

      // Falling leaf particles for Autumn and Spring
      if (s.name === "Autumn" || s.name === "Spring") {
        noStroke();
        for (let i = 0; i < 2; i++) {
          let drop =
            (frameCount * (s.name === "Autumn" ? 1.5 : 0.8) +
              t.particlePhase * 50 +
              i * 30) %
            100;
          ellipse(
            cx + sin(frameCount * 0.02 + t.particlePhase + i) * 40,
            t.y - t.trunkH + drop,
            8,
            5,
          );
        }
      }
    }
  }
}

function drawCanyon(c) {
  fill(40, 20, 10);
  rect(c.x_pos, floorPos_y, c.width, ORIGINAL_HEIGHT - floorPos_y);
  fill(80, 45, 20);
  triangle(
    c.x_pos,
    floorPos_y,
    c.x_pos + 20,
    ORIGINAL_HEIGHT,
    c.x_pos,
    ORIGINAL_HEIGHT,
  );
  fill(60, 30, 10);
  triangle(
    c.x_pos + c.width,
    floorPos_y,
    c.x_pos + c.width - 20,
    ORIGINAL_HEIGHT,
    c.x_pos + c.width,
    ORIGINAL_HEIGHT,
  );
}

function drawGroundAndGrass() {
  const s = seasons[currentSeasonIndex] || seasons[0];
  noStroke();
  fill(lerpColor(color(139, 69, 19), s.ground, 0.45));
  rect(-3000, floorPos_y, 8000, ORIGINAL_HEIGHT / 2);
  fill(lerpColor(color(34, 139, 34), s.grass, 0.55));
  rect(-3000, floorPos_y, 8000, 20);
}

function drawCave() {
  let cx = cave.x_pos + cave.width / 2;

  // Cave exterior
  fill(95, 75, 55);
  arc(cx, floorPos_y, cave.width, cave.height * 1.2, PI, TWO_PI, CHORD);
  fill(10, 8, 4);
  arc(
    cx,
    floorPos_y - 8,
    cave.width * 0.65,
    cave.height * 0.5,
    PI,
    TWO_PI,
    CHORD,
  );

  // Hibernating bear inside cave
  if (isHibernating) {
    let fy = floorPos_y - 6;
    push();
    fill(furColor);
    rect(cx - 36, fy - 18, 72, 40, 12);
    ellipse(cx - 14, fy + 6, 12, 10);
    ellipse(cx + 14, fy + 6, 12, 10);
    rect(cx - 44, fy - 20, 10, 28, 6);
    rect(cx + 34, fy - 20, 10, 28, 6);
    fill(skinColor);
    ellipse(cx + 34, fy - 12, 34, 34);
    fill(furColor);
    ellipse(cx + 34, fy - 12, 48, 48);
    fill(skinColor);
    ellipse(cx + 34, fy - 12, 30, 30);
    fill(0);
    ellipse(cx + 28, fy - 14, 4, 4);
    ellipse(cx + 40, fy - 14, 4, 4);
    fill(0);
    textSize(18);
    text("Zzz", cx + 48, fy - 26);
    pop();
  }
}

function drawCollectable(t) {
  if (t.isFound) return;

  let bob = sin(frameCount * 0.1) * 8;
  let rotX = cos(frameCount * 0.05);

  push();
  translate(t.x_pos, t.y_pos + bob);
  scale(rotX, 1);
  noStroke();

  // Pine cone body
  fill(101, 67, 33);
  beginShape();
  vertex(0, -25);
  bezierVertex(-15, -15, -20, 5, 0, 15);
  bezierVertex(20, 5, 15, -15, 0, -25);
  endShape(CLOSE);

  // Scales
  for (let r = 0; r < 4; r++) {
    let y = -15 + r * 8;
    let count = 3 - abs(r - 2);
    for (let i = 0; i <= count; i++) {
      let x = -10 + i * 7 + (r % 2 === 0 ? 3 : 0);
      fill(255, 223, 0);
      ellipse(x, y, 8, 10);
      fill(184, 134, 11, 150);
      arc(x, y, 8, 10, 0, PI);
    }
  }

  // Highlight
  fill(255, 180);
  ellipse(-5, -15, 6, 10);
  pop();
}

function drawStoryObjects() {
  const storyDrawers = {
    camp(obj) {
      fill(100, 120, 80);
      triangle(-40, 0, 0, -50, 40, 0);
      fill(80, 100, 60);
      triangle(-10, 0, 0, -50, 10, 0);
    },
    bridge(obj) {
      stroke(80, 50, 20);
      strokeWeight(8);
      line(0, 0, 20, 40);
      line(obj.w, 0, obj.w - 20, 40);
      line(0, 0, obj.w, 0);
    },
    footprint(obj) {
      fill(0, 30);
      noStroke();
      ellipse(0, 0, 40, 10);
    },
  };

  for (let obj of storyObjects) {
    if (storyDrawers[obj.type]) {
      push();
      translate(obj.x, floorPos_y);
      storyDrawers[obj.type](obj);
      pop();
    }
  }
}

function drawGameCharBody() {
  if (invincibilityTimer % 10 > 5) return;

  push();
  translate(gameChar_x, gameChar_y);
  scale(charScaleX, charScaleY);
  translate(-gameChar_x, -gameChar_y);

  function head(xo, d) {
    fill(furColor);
    ellipse(gameChar_x + xo, gameChar_y - 65, 40, 45);
    fill(skinColor);
    ellipse(gameChar_x + xo + d * 4, gameChar_y - 65, 24, 28);
    fill(0);
    ellipse(gameChar_x + xo + d * 4 - 6, gameChar_y - 67, 4, 4);
    ellipse(gameChar_x + xo + d * 4 + 6, gameChar_y - 67, 4, 4);
  }

  noStroke();

  // --- Pose: Moving left while falling ---
  if (isLeft && isFalling) {
    fill(furColor);
    rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10);
    head(0, -1);
    push();
    translate(gameChar_x - 15, gameChar_y - 50);
    rotate(-2.5);
    rect(0, 0, 12, 35, 6);
    pop();
    push();
    translate(gameChar_x + 10, gameChar_y - 50);
    rotate(0.5);
    rect(0, 0, 12, 35, 6);
    pop();
    rect(gameChar_x - 15, gameChar_y - 25, 14, 14, 7);
    rect(gameChar_x + 2, gameChar_y - 20, 14, 14, 7);

    // --- Pose: Moving right while falling ---
  } else if (isRight && isFalling) {
    fill(furColor);
    rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10);
    head(0, 1);
    push();
    translate(gameChar_x + 15, gameChar_y - 50);
    rotate(2.5);
    rect(-12, 0, 12, 35, 6);
    pop();
    push();
    translate(gameChar_x - 10, gameChar_y - 50);
    rotate(-0.5);
    rect(-12, 0, 12, 35, 6);
    pop();
    rect(gameChar_x - 15, gameChar_y - 20, 14, 14, 7);
    rect(gameChar_x + 2, gameChar_y - 25, 14, 14, 7);

    // --- Pose: Moving left on ground ---
  } else if (isLeft) {
    fill(furColor);
    push();
    translate(gameChar_x + 5, gameChar_y - 20);
    rotate(0.4);
    rect(-6, 0, 12, 25, 6);
    pop();
    push();
    translate(gameChar_x, gameChar_y);
    rotate(-0.1);
    rect(-18, -60, 36, 45, 10);
    pop();
    head(-4, -1);
    push();
    translate(gameChar_x - 5, gameChar_y - 20);
    rotate(-0.4);
    rect(-6, 0, 12, 25, 6);
    pop();
    push();
    translate(gameChar_x, gameChar_y - 50);
    rotate(0.5);
    rect(-6, 0, 12, 40, 6);
    pop();

    // --- Pose: Moving right on ground ---
  } else if (isRight) {
    fill(furColor);
    push();
    translate(gameChar_x - 5, gameChar_y - 20);
    rotate(-0.4);
    rect(-6, 0, 12, 25, 6);
    pop();
    push();
    translate(gameChar_x, gameChar_y);
    rotate(0.1);
    rect(-18, -60, 36, 45, 10);
    pop();
    head(4, 1);
    push();
    translate(gameChar_x + 5, gameChar_y - 20);
    rotate(0.4);
    rect(-6, 0, 12, 25, 6);
    pop();
    push();
    translate(gameChar_x, gameChar_y - 50);
    rotate(-0.5);
    rect(-6, 0, 12, 40, 6);
    pop();

    // --- Pose: Falling / Plummeting ---
  } else if (isFalling || isPlummeting) {
    fill(furColor);
    rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10);
    head(0, 0);
    fill(0);
    ellipse(gameChar_x, gameChar_y - 58, 8, 10);
    rect(gameChar_x - 30, gameChar_y - 65, 12, 40, 6);
    rect(gameChar_x + 18, gameChar_y - 65, 12, 40, 6);
    rect(gameChar_x - 15, gameChar_y - 20, 12, 15, 6);
    rect(gameChar_x + 3, gameChar_y - 20, 12, 15, 6);

    // --- Pose: Standing idle ---
  } else {
    fill(furColor);
    rect(gameChar_x - 20, gameChar_y - 60, 40, 50, 12);
    head(0, 0);
    rect(gameChar_x - 32, gameChar_y - 55, 14, 45, 7);
    rect(gameChar_x + 18, gameChar_y - 55, 14, 45, 7);
    rect(gameChar_x - 15, gameChar_y - 12, 14, 15, 6);
    rect(gameChar_x + 1, gameChar_y - 12, 14, 15, 6);
  }

  pop();
}

function drawCharacterStatusUI() {
  const s = seasons[currentSeasonIndex] || seasons[0];
  let isNearCave =
    cave && abs(gameChar_x - (cave.x_pos + cave.width / 2)) < 100;

  if (s.name === "Winter" && !isHibernating && isNearCave) {
    let x = gameChar_x;
    let y = gameChar_y - 120;
    let message = "i need to sleep (W)";

    push();
    textSize(16);
    let padding = 12;
    let bW = textWidth(message) + padding * 2;
    let bH = 40;

    // Speech bubble box
    fill(255);
    stroke(0);
    strokeWeight(2);
    rect(x - bW / 2, y - bH, bW, bH, 15);

    // Speech bubble tail
    noStroke();
    fill(255);
    triangle(x - 10, y - bH + 38, x + 10, y - bH + 38, x, y - bH + 50);
    stroke(0);
    line(x - 10, y - bH + 38, x, y - bH + 50);
    line(x + 10, y - bH + 38, x, y - bH + 50);

    // Text
    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    text(message, x, y - bH / 2);
    pop();
  }
}

function renderFlagpole() {
  push();
  stroke(100);
  strokeWeight(4);
  line(flagpole.x_pos, floorPos_y, flagpole.x_pos, floorPos_y - 250);

  if (flagpole.isReached && flagpole.height < 200) {
    flagpole.height += 4;
    if (flagpole.height >= 200) {
      createConfetti(flagpole.x_pos - cameraPosX, height / 2);
      sounds.play("coin"); // Victory chime
    }
  }

  fill(255, 50, 50);
  rect(flagpole.x_pos, floorPos_y - 50 - flagpole.height, 60, 40);
  pop();
}

function drawFog() {
  let fog = seasonSpecs[currentSeasonIndex].fog;
  if (fog.alpha > 0) {
    noStroke();
    fill(...fog.color, fog.alpha);
    rect(0, 0, width, height);
  }
}

// ============================================================
// 8. HUD & UI
// ============================================================

function drawButton(x, y, w, h, label, hint, enabled = true) {
  let hovering =
    enabled && mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
  noStroke();
  if (!enabled) {
    fill(40, 40, 40, 200);
  } else {
    fill(hovering ? color(255, 255, 255) : color(10, 10, 10, 220));
  }
  rect(x, y, w, h, 6);
  stroke(enabled ? color(255) : color(150));
  strokeWeight(2);
  noFill();
  rect(x, y, w, h, 6);
  noStroke();
  fill(enabled ? (hovering ? 0 : 255) : color(150));
  textAlign(CENTER, CENTER);
  textSize(20);
  text(label, x + w / 2, y + h / 2 - 2);
  if (hint) {
    fill(enabled ? (hovering ? color(50) : color(200)) : color(150));
    textSize(10);
    textAlign(RIGHT, BOTTOM);
    text(hint, x + w - 8, y + h - 6);
  }
}

function drawStarShape(x, y, r1, r2, filled) {
  let angle = -HALF_PI;
  let step = TWO_PI / 10;
  fill(filled ? color(255, 215, 0) : color(80, 80, 80));
  noStroke();
  beginShape();
  for (let i = 0; i < 10; i++) {
    let r = i % 2 === 0 ? r1 : r2;
    vertex(x + cos(angle) * r, y + sin(angle) * r);
    angle += step;
  }
  endShape(CLOSE);
}

function drawHUD() {
  drawQuestCompass();

  // Progress bar
  let barW = 200;
  let barH = 10;
  let barX = width / 2 - barW / 2;
  let barY = 30;
  noStroke();
  fill(0, 100);
  rect(barX, barY, barW, barH, 5);
  let progress = map(gameChar_x, 100, flagpole.x_pos, 0, barW, true);
  fill(255, 215, 0);
  rect(barX, barY, progress, barH, 5);
  fill(255);
  textSize(10);
  textAlign(CENTER, BOTTOM);
  text("PROGRESS TO HOME", width / 2, barY - 5);

  // Lives — heart shapes
  for (let i = 0; i < lives; i++) {
    let s = i === lives - 1 && lives === 1 ? 1 + sin(heartPulse) * 0.2 : 1;
    push();
    translate(30 + i * 40, 40);
    scale(s);
    noStroke();
    fill(255, 50, 50);
    beginShape();
    vertex(0, 5);
    bezierVertex(-2, 2, -10, -6, -10, -2);
    bezierVertex(-10, -9, -2, -13, 0, -7);
    bezierVertex(2, -13, 10, -9, 10, -2);
    bezierVertex(10, -6, 2, 2, 0, 5);
    endShape(CLOSE);
    // Highlight
    fill(255, 120, 120, 160);
    ellipse(-3, -6, 5, 4);
    pop();
  }

  fill(255, 215, 0);
  stroke(0);
  strokeWeight(2);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Pine Cones: " + game_score + " / " + totalCollectables, 20, 70);

  fill(255);
  textSize(16);
  noStroke();
  text("P: Pause | W: Hibernate", 20, height - 30);

  if (tutorialAlpha > 0) {
    fill(255, tutorialAlpha);
    textAlign(CENTER, CENTER);
    textSize(30);
    text(
      "Repair your home before the Great Freeze!",
      width / 2,
      height / 2 - 150,
    );
    text("ARROWS to Move, SPACE to Jump", width / 2, height / 2 - 100);
    if (isLeft || isRight || isFalling) tutorialAlpha -= 2;
  }
}

function drawQuestCompass() {
  // Find nearest uncollected pine cone
  let targetX = -1;
  let label = "";
  let minDist = Infinity;

  for (let col of collectables) {
    if (!col.isFound) {
      let d = abs(gameChar_x - col.x_pos);
      if (d < minDist) {
        minDist = d;
        targetX = col.x_pos;
        label = "PINE CONE";
      }
    }
  }

  if (targetX === -1) {
    targetX = flagpole.x_pos;
    label = "HOME";
  }

  // Draw compass
  push();
  let compassX = width - 80;
  let compassY = 80;
  fill(0, 150);
  stroke(255, 200);
  strokeWeight(2);
  ellipse(compassX, compassY, 60, 60);

  let angle = targetX > gameChar_x ? 0 : PI;
  if (abs(gameChar_x - targetX) < 50) {
    angle = frameCount * 0.2;
  }

  translate(compassX, compassY);
  rotate(angle);
  fill(255, 0, 0);
  triangle(20, 0, 0, -8, 0, 8);
  fill(255);
  triangle(-20, 0, 0, -8, 0, 8);
  pop();

  textAlign(CENTER, CENTER);
  noStroke();
  fill(255);
  textSize(10);
  text(label, width - 80, 120);
}

function drawStartMenu() {
  updateDayNightCycle();
  drawSkyAndCelestialBodies();

  let cx = width / 2;
  let cy = height / 2;

  // Title panel
  let panelW = 600;
  let panelH = 280;

  noStroke();
  fill(35, 45, 55, 250);
  rect(cx - panelW / 2, cy - 140, panelW, panelH, 12);
  stroke(255);
  strokeWeight(2);
  noFill();
  rect(cx - panelW / 2, cy - 140, panelW, panelH, 12);

  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("THE GREAT FREEZE", cx, cy - 80);
  fill(200, 220, 255);
  textSize(22);
  text("A Bear's Last Stand", cx, cy - 35);

  // Buttons
  let bw = 210;
  let bh = 55;
  let bx = cx - bw / 2;
  drawButton(bx, cy + 10, bw, bh, "PLAY", "ENTER");
  drawButton(bx, cy + 80, bw, bh, "SETTINGS", "S");
}

function drawPauseScreen() {
  fill(0, 160);
  rect(0, 0, width, height);

  let cx = width / 2;
  let cy = height / 2;

  let panelW = 500;
  let panelH = 240;
  noStroke();
  fill(35, 45, 55, 250);
  rect(cx - panelW / 2, cy - 120, panelW, panelH, 12);
  stroke(255);
  strokeWeight(2);
  noFill();
  rect(cx - panelW / 2, cy - 120, panelW, panelH, 12);

  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("PAUSED", cx, cy - 60);

  let bw = 210;
  let bh = 55;
  let bx = cx - bw / 2;
  drawButton(bx, cy - 5, bw, bh, "RESUME", "P");
  drawButton(bx, cy + 65, bw, bh, "SETTINGS", "S");
}

function drawSettingsMenu() {
  fill(0, 200);
  rect(0, 0, width, height);

  let cx = width / 2;
  let cy = height / 2;

  let panelW = 600;
  let panelH = 400;
  let panelX = cx - panelW / 2;
  let panelY = cy - panelH / 2;

  noStroke();
  fill(35, 45, 55, 250);
  rect(panelX, panelY, panelW, panelH, 12);
  stroke(255);
  strokeWeight(2);
  noFill();
  rect(panelX, panelY, panelW, panelH, 12);

  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("SETTINGS", cx, panelY + 45);

  // Volume slider
  let sliderX = cx - 120;
  let sliderY = panelY + 110;
  let sliderW = 240;

  fill(100);
  rect(sliderX, sliderY, sliderW, 10, 5);

  let handleX = sliderX + sounds.volume * sliderW;
  fill(255);
  ellipse(handleX, sliderY + 5, 20, 20);

  fill(255);
  textSize(20);
  text("Volume: " + floor(sounds.volume * 100) + "%", cx, sliderY - 25);

  if (mouseIsPressed) {
    if (
      mouseX >= sliderX &&
      mouseX <= sliderX + sliderW &&
      mouseY >= sliderY - 20 &&
      mouseY <= sliderY + 30
    ) {
      let newVal = (mouseX - sliderX) / sliderW;
      sounds.setVolume(newVal);
    }
  }

  // Controls reference panel
  let ctrlW = 380;
  let ctrlH = 140;
  let ctrlX = cx - ctrlW / 2;
  let ctrlY = panelY + 150;

  fill(20, 25, 30, 200);
  rect(ctrlX, ctrlY, ctrlW, ctrlH, 8);
  stroke(255, 100);
  strokeWeight(1);
  noFill();
  rect(ctrlX, ctrlY, ctrlW, ctrlH, 8);

  noStroke();
  fill(255);
  textAlign(CENTER, TOP);
  textSize(18);
  text("CONTROLS", cx, ctrlY + 12);

  fill(255, 80);
  rect(ctrlX + 20, ctrlY + 36, ctrlW - 40, 1);

  let controls = [
    ["Left/Right / A D", "Move"],
    ["SPACE", "Jump"],
    ["W", "Hibernate"],
    ["P / ESC", "Pause"],
  ];
  textSize(14);
  let rowY = ctrlY + 46;
  for (let [k, v] of controls) {
    fill(200, 220, 255);
    textAlign(LEFT, TOP);
    text(k, ctrlX + 30, rowY);
    fill(255);
    textAlign(RIGHT, TOP);
    text(v, ctrlX + ctrlW - 30, rowY);
    rowY += 22;
  }

  // Back button
  let bw = 210;
  let bh = 55;
  drawButton(cx - bw / 2, panelY + panelH - bh - 20, bw, bh, "BACK", "ESC");
}

function drawGameOver() {
  fill(0, 200);
  rect(0, 0, width, height);

  let cx = width / 2;
  let cy = height / 2;

  let panelW = 520;
  let panelH = 260;
  noStroke();
  fill(35, 45, 55, 250);
  rect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 12);
  stroke(255);
  strokeWeight(2);
  noFill();
  rect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 12);

  noStroke();
  fill(255, 100, 100);
  textAlign(CENTER, CENTER);
  textSize(36);
  text("GAME OVER", cx, cy - 60);
  textSize(20);
  fill(200);
  text("The wilderness claims another soul.", cx, cy - 14);

  let bw = 210;
  let bh = 55;
  drawButton(cx - bw / 2, cy + 30, bw, bh, "TRY AGAIN", "SPACE");
}

function drawWinScreen() {
  fill(0, 200);
  rect(0, 0, width, height);

  let cx = width / 2;
  let cy = height / 2;

  // Card
  let cw = 500;
  let ch = 360;
  let cardX = cx - cw / 2;
  let cardY = cy - ch / 2;

  noStroke();
  fill(35, 45, 55, 250);
  rect(cardX, cardY, cw, ch, 12);
  stroke(255);
  strokeWeight(2);
  noFill();
  rect(cardX, cardY, cw, ch, 12);

  // Title
  noStroke();
  fill(255, 215, 0);
  textAlign(CENTER, TOP);
  textSize(36);
  text("LEVEL " + level + " COMPLETE!", cx, cardY + 24);

  // Star rating
  let allCones = game_score >= totalCollectables;
  let stars3 = allCones && lives >= 2;
  let stars2 = allCones && lives === 1;
  let filledStars = stars3 ? 3 : stars2 ? 2 : 1;
  let starY = cardY + 90;
  let starGap = 64;
  for (let i = 0; i < 3; i++) {
    drawStarShape(cx - starGap + i * starGap, starY, 26, 11, i < filledStars);
  }

  // Stats
  let statX = cardX + 40;
  let statX2 = cardX + cw - 40;
  let statY = cardY + 140;
  let rowH = 38;

  textSize(20);
  let timeSec = floor((frameCount - levelStartFrame) / 60);

  let rows = [
    ["Pine Cones", game_score + " / " + totalCollectables],
    ["Lives Left", "\u2665".repeat(lives)],
    ["Time", timeSec + "s"],
  ];

  for (let [label, val] of rows) {
    fill(200);
    textAlign(LEFT, TOP);
    text(label, statX, statY);
    fill(255);
    textAlign(RIGHT, TOP);
    text(val, statX2, statY);
    statY += rowH;
  }

  // Divider
  fill(255, 60);
  noStroke();
  rect(cardX + 30, statY + 8, cw - 60, 2);

  // Buttons
  let bw = 170;
  let bh = 55;
  let gap = 20;
  let totalBW = bw * 2 + gap;
  let btn1X = cx - totalBW / 2;
  let btn2X = btn1X + bw + gap;
  let btnY = cardY + ch - bh - 24;

  // NEXT LEVEL / MAIN MENU
  let canNext = game_score >= totalCollectables;
  if (level >= 5 && canNext) {
    drawButton(btn1X, btnY, bw, bh, "MAIN MENU", "N", true);
  } else {
    drawButton(btn1X, btnY, bw, bh, "NEXT", "N", canNext);
  }

  drawButton(btn2X, btnY, bw, bh, "RETRY", "SPACE");
}

// ============================================================
// 9. INPUT
// ============================================================

function keyPressed() {
  if (gameState === STATE_START) {
    if (keyCode === ENTER || keyCode === 32) {
      gameState = STATE_PLAYING;
      sounds.init();
    } else if (key === "S" || key === "s") {
      previousState = gameState;
      gameState = STATE_SETTINGS;
    }
    return false;
  }

  if (gameState === STATE_PAUSED) {
    if (key === "P" || key === "p" || keyCode === 27) {
      gameState = STATE_PLAYING;
    } else if (key === "S" || key === "s") {
      previousState = gameState;
      gameState = STATE_SETTINGS;
    }
    return false;
  }

  if (gameState === STATE_SETTINGS) {
    if (key === "S" || key === "s" || keyCode === 27) {
      gameState = previousState;
    }
    return false;
  }

  if (gameState === STATE_GAMEOVER) {
    if (keyCode === 32) {
      level = 1;
      lives = 3;
      gameState = STATE_PLAYING;
      startGame();
    }
    return false;
  }

  if (gameState === STATE_WIN) {
    if (key === "N" || key === "n") {
      if (game_score === totalCollectables) {
        if (level >= 5) {
          level = 1;
          lives = 3;
          gameState = STATE_START;
        } else {
          level++;
          gameState = STATE_PLAYING;
          startGame();
        }
      }
    } else if (keyCode === 32) {
      gameState = STATE_PLAYING;
      startGame();
    }
    return false;
  }

  if (gameState === STATE_PLAYING) {
    if (key === "P" || key === "p" || keyCode === 27) {
      gameState = STATE_PAUSED;
      return false;
    }

    if (key === "S" || key === "s") {
      previousState = gameState;
      gameState = STATE_SETTINGS;
      return false;
    }

    if (lives < 1 && keyCode == 32) {
      level = 1;
      lives = 3;
      setup();
      return false;
    }

    // Jump buffering: store jump intent even if not on ground yet
    if (keyCode == 32 && !isHibernating) {
      jumpBufferTimer = JUMP_BUFFER_LIMIT;
    }

    if (
      flagpole.isReached &&
      flagpole.height >= 200 &&
      (key === "N" || key === "n")
    ) {
      if (game_score === totalCollectables) {
        if (level >= 5) {
          level = 1;
          lives = 3;
          gameState = STATE_START;
          return false;
        }
        level++;
        startGame();
        return false;
      }
    }
    if (flagpole.isReached && flagpole.height >= 200 && keyCode == 32) {
      startGame();
      return false;
    }
    if (gameChar_y > height && keyCode == 32) {
      lives--;
      sounds.play("death");
      if (lives > 0) respawnCharacter();
      return false;
    }

    if (key === "W" || key === "w") toggleHibernation();

    if (keyCode == 32 && coyoteTimer > 0 && !isPlummeting && !isHibernating) {
      velocity_y = jumpPower;
      sounds.play("jump");
      charScaleX = 0.8;
      charScaleY = 1.2;
      coyoteTimer = 0;
    }
  }
  return false;
}

function mousePressed() {
  let cx = width / 2;
  let cy = height / 2;
  let bw = 200;
  let bh = 50;
  let bx = cx - bw / 2;

  if (gameState === STATE_START) {
    if (mouseX >= bx && mouseX <= bx + bw) {
      if (mouseY >= cy + 8 && mouseY <= cy + 8 + bh) {
        gameState = STATE_PLAYING;
        sounds.init();
      }
      if (mouseY >= cy + 72 && mouseY <= cy + 72 + bh) {
        previousState = STATE_START;
        gameState = STATE_SETTINGS;
      }
    }
    return false;
  }

  if (gameState === STATE_PAUSED) {
    if (mouseX >= bx && mouseX <= bx + bw) {
      if (mouseY >= cy - 10 && mouseY <= cy - 10 + bh) {
        gameState = STATE_PLAYING;
      }
      if (mouseY >= cy + 54 && mouseY <= cy + 54 + bh) {
        previousState = STATE_PAUSED;
        gameState = STATE_SETTINGS;
      }
    }
    return false;
  }

  if (gameState === STATE_SETTINGS) {
    let panelH = 160;
    let panelY = cy - 30;
    let backY = panelY + panelH + 20;
    if (
      mouseX >= bx &&
      mouseX <= bx + bw &&
      mouseY >= backY &&
      mouseY <= backY + bh
    ) {
      gameState = previousState;
    }
    return false;
  }

  if (gameState === STATE_WIN) {
    let cw = 500,
      ch = 360;
    let cardY = cy - ch / 2;
    let btnBW = 170,
      btnH = 55,
      gap = 20;
    let totalBW = btnBW * 2 + gap;
    let btn1X = cx - totalBW / 2;
    let btn2X = btn1X + btnBW + gap;
    let btnY = cardY + ch - btnH - 18;
    if (mouseY >= btnY && mouseY <= btnY + btnH) {
      if (
        mouseX >= btn1X &&
        mouseX <= btn1X + btnBW &&
        game_score >= totalCollectables
      ) {
        if (level >= 5) {
          level = 1;
          lives = 3;
          gameState = STATE_START;
        } else {
          level++;
          gameState = STATE_PLAYING;
          startGame();
        }
      }
      if (mouseX >= btn2X && mouseX <= btn2X + btnBW) {
        gameState = STATE_PLAYING;
        startGame();
      }
    }
    return false;
  }

  if (gameState === STATE_GAMEOVER) {
    let btnY = cy + 24;
    if (
      mouseX >= bx &&
      mouseX <= bx + bw &&
      mouseY >= btnY &&
      mouseY <= btnY + bh
    ) {
      level = 1;
      lives = 3;
      gameState = STATE_PLAYING;
      startGame();
    }
    return false;
  }
}

function mouseWheel() {
  return false;
}

function keyReleased() {
  if (gameState === STATE_PLAYING && keyCode === 32) {
    if (velocity_y < 0) velocity_y *= 0.3;
  }
  return false;
}
