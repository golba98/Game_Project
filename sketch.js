var gameChar_x;
var gameChar_y;
var floorPos_y;

// --- GAME STATES ---
const STATE_START = "START";
const STATE_PLAYING = "PLAYING";
const STATE_PAUSED = "PAUSED";
const STATE_GAMEOVER = "GAMEOVER";
const STATE_WIN = "WIN";
var gameState = STATE_START;

// --- SOUND MANAGER ---
class SoundManager {
    constructor() {
        this.audioCtx = null;
    }

    init() {
        if (!this.audioCtx) {
            let AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
    }

    play(type) {
        this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        
        let oscillator = this.audioCtx.createOscillator();
        let gainNode = this.audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        if (type === 'coin') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, now);
            oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        } else if (type === 'jump') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(150, now);
            oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        } else if (type === 'death') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(100, now);
            oscillator.frequency.linearRampToValueAtTime(20, now + 0.3);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        } else if (type === 'land') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(100, now);
            oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.1);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        }
        
        oscillator.start();
        oscillator.stop(now + 0.5);
    }
}
const sounds = new SoundManager();

var trees = [];
var mountains = [];
var clouds = [];

var collectables = [];
var canyons = [];
var cave;
var storyObjects = [];

// Extensions
var platforms = [];
var enemies = [];
var checkpoints = [];
var lastCheckpoint = { x: 100, y: 450 };

var isLeft = false;
var isRight = false;
var isFalling = false;
var isPlummeting = false;
var isHibernating = false;

var hibernationTimer = 0;
const HIBERNATION_DURATION = 600;

let coinAngle = 0;

const ORIGINAL_WIDTH = 1000;
const ORIGINAL_HEIGHT = 600;

var furColor;
var skinColor;

var timeOfDay = 0;
var cycleSpeed = 1.5;

const seasonSpecs = [
    { 
        name: "Spring", 
        sky: [180, 220, 255], 
        ground: [140, 190, 150], 
        grass: [80, 200, 120], 
        leaf: [255, 182, 193], // Cherry Blossom Pink
        leafStyle: "bloom",
        weather: { type: 'rain', density: 40, speed: 4, wind: 0.5, color: [180, 200, 255] },
        fog: { color: [240, 250, 255], alpha: 20 }
    },
    { 
        name: "Summer", 
        sky: [100, 180, 255], 
        ground: [160, 140, 100], 
        grass: [50, 160, 80], 
        leaf: [40, 120, 60], 
        leafStyle: "lush",
        weather: { type: 'none', density: 0, speed: 0, wind: 0, color: [0, 0, 0] },
        fog: { color: [255, 255, 255], alpha: 0 }
    },
    { 
        name: "Autumn", 
        sky: [255, 160, 100], 
        ground: [150, 100, 60], 
        grass: [180, 120, 50], 
        leaf: [200, 80, 40], 
        leafStyle: "crisp",
        weather: { type: 'rain', density: 80, speed: 7, wind: 2, color: [100, 100, 150] },
        fog: { color: [150, 100, 50], alpha: 40 }
    },
    { 
        name: "Winter", 
        sky: [160, 180, 200], // Deeper blue for better contrast
        ground: [220, 225, 235], // Slightly darker snow ground
        grass: [200, 210, 220], 
        leaf: [255, 255, 255], 
        leafStyle: "bare",
        weather: { type: 'snow', density: 100, speed: 2, wind: 1, color: [255, 255, 255] },
        fog: { color: [180, 190, 200], alpha: 60 } // Reduced from 120 for visibility
    }
];

var seasons = [];
var currentSeasonIndex = 0;
var seasonTime = 0;
const SEASON_DURATION = 720;

var weatherParticles = [];
var confetti = [];
var stars = [];
var shootingStar = null;

var game_score;
var flagpole;
var lives;

var gameFont;

// QoL Variables
var cameraPosX = 0;
var dustParticles = [];
var tutorialAlpha = 255;
var totalCollectables = 5;
var level = 1;

// QoL Variables
var jumpBufferTimer = 0;
const JUMP_BUFFER_LIMIT = 10;
var screenShakeAmount = 0;
var maxLevelDist = 4500; // Distance to flagpole

// Polish Variables
var coyoteTimer = 0;
const COYOTE_TIME_LIMIT = 5;
var charScaleX = 1;
var charScaleY = 1;
var invincibilityTimer = 0;
var heartPulse = 0;

// Physics Constants
var velocity_y = 0;
const gravity = 0.6;
const jumpPower = -15;

// --- Extension 2: Platform Factory ---
function createPlatform(x, y, length) {
    var p = {
        x: x, y: y, length: length,
        draw: function() {
            fill(120, 100, 80); rect(this.x, this.y, this.length, 20, 5);
            fill(150, 130, 100); rect(this.x, this.y, this.length, 5, 5);
            stroke(80, 60, 40, 100); for(let i = 10; i < this.length; i += 30) line(this.x + i, this.y + 5, this.x + i, this.y + 15); noStroke();
        },
        checkContact: function(gc_x, gc_y) {
            if (gc_x > this.x && gc_x < this.x + this.length) {
                var d = this.y - gc_y;
                if (d >= 0 && d <= velocity_y + 2) return true;
            }
            return false;
        }
    };
    return p;
}

// --- Extension 3: Enemy Constructor ---
function Enemy(x, y, range) {
    this.x = x; this.y = y; this.range = range; this.currentX = x; this.inc = 1;
    this.update = function() {
        let nextX = this.currentX + this.inc;
        if (nextX >= this.x + this.range || nextX <= this.x) { this.inc *= -1; return; }
        let isCliffAhead = false;
        for (let c of canyons) if (nextX > c.x_pos - 5 && nextX < c.x_pos + c.width + 5) { isCliffAhead = true; break; }
        if (isCliffAhead) this.inc *= -1; else this.currentX = nextX;
    };
    this.draw = function() {
        this.update(); push(); translate(this.currentX, this.y);
        let hover = sin(frameCount * 0.15) * 5; translate(0, hover);
        noStroke(); fill(150, 220, 255, 200); beginShape(); vertex(-20, 0); vertex(-25, -20); vertex(-10, -45); vertex(10, -45); vertex(25, -20); vertex(20, 0); endShape(CLOSE);
        fill(200, 240, 255, 150); triangle(-10, -45, 0, -10, 10, -45); triangle(-25, -20, 0, -10, -20, 0); triangle(25, -20, 0, -10, 20, 0);
        let eyePulse = 150 + sin(frameCount * 0.1) * 105; fill(0, eyePulse, 255); ellipse(-8, -30, 8, 8); ellipse(8, -30, 8, 8);
        fill(0, 100, 255, 50); ellipse(-8, -30, 15, 15); ellipse(8, -30, 15, 15); fill(255, 100); ellipse(0, -20, 10, 15); pop();
    };
    this.checkContact = function(gc_x, gc_y) {
        var d = dist(gc_x, gc_y, this.currentX, this.y - 20);
        if (d < 40) return true;
        return false;
    };
}

function playSeasonalAmbience() {
    if (frameCount % 180 !== 0 || !sounds.audioCtx) return;
    try {
        let audioCtx = sounds.audioCtx;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        let oscillator = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
        let s = seasons[currentSeasonIndex] || seasons[0];
        if (s.name === "Spring") { oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(random(1500, 2500), audioCtx.currentTime); gainNode.gain.setValueAtTime(0, audioCtx.currentTime); gainNode.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.1); gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2); }
        else if (s.name === "Summer") { oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); gainNode.gain.setValueAtTime(0, audioCtx.currentTime); gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2); gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); }
        else if (s.name === "Autumn") { oscillator.type = 'sawtooth'; oscillator.frequency.setValueAtTime(200, audioCtx.currentTime); gainNode.gain.setValueAtTime(0, audioCtx.currentTime); gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.5); gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1); }
        else { oscillator.type = 'sawtooth'; oscillator.frequency.setValueAtTime(50, audioCtx.currentTime); gainNode.gain.setValueAtTime(0, audioCtx.currentTime); gainNode.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 1); gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2); }
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 2);
    } catch (e) {}
}

// --- MUSIC SYSTEM ---
var noteSequence = [220, 247, 261, 293, 329]; 
var currentNote = 0;
function playProceduralMusic() {
    if (frameCount % 30 !== 0 || !sounds.audioCtx) return;
    try {
        let audioCtx = sounds.audioCtx;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        let oscillator = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
        let s = seasons[currentSeasonIndex] || seasons[0];
        let baseFreq = noteSequence[currentNote];
        currentNote = (currentNote + 1) % noteSequence.length;
        if (s.name === "Winter") oscillator.type = 'sine'; else oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
}

function preload() { gameFont = loadFont('assets/font.ttf'); }
function setup() {
    createCanvas(windowWidth, windowHeight); textFont(gameFont);
    floorPos_y = 450; furColor = color(70, 45, 20); skinColor = color(180, 140, 110); lives = 3; startGame();
}

function startGame() {
    gameChar_x = 100; gameChar_y = floorPos_y; velocity_y = 0; cameraPosX = 0; tutorialAlpha = 255; game_score = 0; flagpole = { isReached: false, x_pos: 4500, height: 0 };
    isLeft = false; isRight = false; isFalling = false; isPlummeting = false; isHibernating = false; invincibilityTimer = 0; coyoteTimer = 0;
    lastCheckpoint = { x: 100, y: floorPos_y };
    generateCanyons(); generateCave(); initializeSeasons(); generateTrees(); generateMountains(); generateClouds(); generateStoryObjects();
    generateCheckpoints();
    generateStars();
    platforms = [];
    platforms.push(createPlatform(500, floorPos_y - 100, 150));
    platforms.push(createPlatform(650, floorPos_y - 200, 150));
    platforms.push(createPlatform(800, floorPos_y - 300, 150)); 
    platforms.push(createPlatform(1500, floorPos_y - 150, 200)); 
    platforms.push(createPlatform(2200, floorPos_y - 120, 200));
    platforms.push(createPlatform(2800, floorPos_y - 180, 150));
    platforms.push(createPlatform(3200, floorPos_y - 100, 250));
    generateCollectables(); generateEnemies(); totalCollectables = collectables.length;
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

function checkCheckpoints() {
    for (let cp of checkpoints) {
        if (!cp.isReached && dist(gameChar_x, floorPos_y, cp.x, floorPos_y) < 50) {
            cp.isReached = true;
            lastCheckpoint = { x: cp.x, y: floorPos_y };
            // Optional: play a "checkpoint reached" sound
        }
    }
}

function drawCheckpoints() {
    // Visual flags removed per user request
}

function generateStoryObjects() {
    storyObjects = []; let campX = -400; let isCampValid = false;
    while (!isCampValid && campX < 500) {
        isCampValid = true;
        for (let c of canyons) if (campX > c.x_pos - 60 && campX < c.x_pos + c.width + 60) { isCampValid = false; campX += 150; break; }
    }
    storyObjects.push({ type: "camp", x: campX });
    if (cave) storyObjects.push({ type: "footprint", x: cave.x_pos - 100 });
    for (let i = 0; i < canyons.length; i++) if (random() > 0.5) storyObjects.push({ type: "bridge", x: canyons[i].x_pos, w: canyons[i].width });
}

function generateEnemies() {
    enemies = []; let enemySpawnPoints = [1200, 2500, 3500];
    for (let ex of enemySpawnPoints) {
        let isValid = true;
        for (let c of canyons) if (ex > c.x_pos - 20 && ex < c.x_pos + c.width + 20) { isValid = false; break; }
        if (!isValid) ex += 200;
        enemies.push(new Enemy(ex, floorPos_y, random(150, 300)));
    }
}

function generateCanyons() {
    canyons = []; 
    // THE LEAP OF FAITH: wide but clearable (Max jump is ~250px)
    canyons.push({ x_pos: 1800, width: 220 }); 
    for (var i = 0; i < 4; i++) {
        var cx = random(500, 4000), cw = random(80, 180), valid = true;
        for (let c of canyons) if (abs(c.x_pos - cx) < 400) { valid = false; break; }
        if (valid) canyons.push({ x_pos: cx, width: cw }); else i--;
    }
}

function generateCave() {
    while (true) {
        let cx = random(-1500, 2500), cw = random(220, 320), ch = random(160, 220), valid = true;
        for (let c of canyons) if (cx + cw > c.x_pos - 50 && cx < c.x_pos + c.width + 50) { valid = false; break; }
        if (valid) { cave = { x_pos: cx, width: cw, height: ch }; break; }
    }
}

function generateCollectables() {
    collectables = [];
    collectables.push({ x_pos: 875, y_pos: floorPos_y - 330, isFound: false });
    for (let i = 0; i < 5; i++) {
        let cx = random(200, 4000), valid = true;
        for (let c of canyons) if (cx > c.x_pos - 20 && cx < c.x_pos + c.width + 20) { valid = false; break; }
        if (valid) collectables.push({ x_pos: cx, y_pos: floorPos_y - 20, isFound: false }); else i--;
    }
    if (cave) collectables.push({ x_pos: cave.x_pos + cave.width/2, y_pos: floorPos_y - 20, isFound: false });
}

function initializeSeasons() {
    seasons = [];
    for (let spec of seasonSpecs) seasons.push({ name: spec.name, sky: color(spec.sky[0], spec.sky[1], spec.sky[2]), ground: color(spec.ground[0], spec.ground[1], spec.ground[2]), grass: color(spec.grass[0], spec.grass[1], spec.grass[2]), leaf: color(spec.leaf[0], spec.leaf[1], spec.leaf[2]), leafStyle: spec.leafStyle });
}

function generateTrees() {
    trees = [];
    for (var i = 0; i < 20; i++) {
        var tx = random(-2000, 2900), valid = true;
        for (var c of canyons) if (tx > c.x_pos - 80 && tx < c.x_pos + c.width + 80) { valid = false; break; }
        if (valid) { for (var t of trees) if (abs(t.x - tx) < 100) { valid = false; break; } }
        if (valid) { let s = seasons[currentSeasonIndex] || seasons[0]; trees.push({ x: tx, y: floorPos_y, trunkW: random(30, 50), trunkH: random(90, 160), canopySize: random(110, 160), leafColor: color(random(20, 60), random(100, 180), random(20, 60)), particlePhase: random(TWO_PI), style: s.leafStyle }); }
        else i--;
    }
}

function generateMountains() {
    mountains = []; for (var i = 0; i < 15; i++) mountains.push({ x: random(-2000, 3000), width: random(200, 500), height: random(200, 450), color: random(80, 180) });
}

function generateClouds() {
    clouds = []; for (let i = 0; i < 14; i++) clouds.push({ x: random(-2000, 3000), y: random(60, 180), cloudSpeed: random(0.2, 1.2), color: color(random(220, 255), 200) });
}

function drawMountains() {
    for (var m of mountains) {
        let peakX = m.x + m.width / 2, peakY = floorPos_y - m.height; noStroke();
        fill(m.color - 40); triangle(m.x, floorPos_y, peakX, peakY, peakX, floorPos_y);
        fill(m.color); triangle(peakX, floorPos_y, peakX, peakY, m.x + m.width, floorPos_y);
        let s = seasons[currentSeasonIndex] || seasons[0], snowScale = s.name === "Winter" ? 0.6 : 0.25, snowDepth = m.height * snowScale;
        if (s.name !== "Summer") {
            fill(255); beginShape(); vertex(peakX, peakY); vertex(peakX - (m.width * snowScale * 0.2), peakY + (snowDepth * 0.4)); vertex(peakX - (m.width * snowScale * 0.3), peakY + (snowDepth * 0.3)); vertex(peakX - (m.width * snowScale * 0.5), peakY + snowDepth); vertex(peakX - (m.width * snowScale * 0.2), peakY + snowDepth * 0.8); vertex(peakX, peakY + snowDepth * 1.1); vertex(peakX + (m.width * snowScale * 0.2), peakY + snowDepth * 0.8); vertex(peakX + (m.width * snowScale * 0.5), peakY + snowDepth); vertex(peakX + (m.width * snowScale * 0.3), peakY + (snowDepth * 0.3)); vertex(peakX + (m.width * snowScale * 0.2), peakY + (snowDepth * 0.4)); endShape(CLOSE);
            fill(220, 230, 255); beginShape(); vertex(peakX, peakY); vertex(peakX - (m.width * snowScale * 0.2), peakY + (snowDepth * 0.4)); vertex(peakX - (m.width * snowScale * 0.3), peakY + (snowDepth * 0.3)); vertex(peakX - (m.width * snowScale * 0.5), peakY + snowDepth); vertex(peakX, peakY + snowDepth * 1.1); endShape(CLOSE);
        }
    }
}

function drawClouds() {
    for (let c of clouds) { fill(c.color || color(255, 200)); noStroke(); ellipse(c.x, c.y, 80, 60); ellipse(c.x + 40, c.y, 100, 70); ellipse(c.x + 80, c.y, 80, 60); c.x += c.cloudSpeed; if (c.x > 4000) c.x = -800; }
}

function drawTrees() {
    const s = seasons[currentSeasonIndex] || seasons[0];
    for (var t of trees) {
        let cx = t.x + t.trunkW / 2; fill(0, 40); ellipse(cx, t.y, t.trunkW * 2, 10);
        fill(s.name === "Winter" ? color(80, 50, 30) : color(100, 60, 20)); rect(t.x, t.y - t.trunkH, t.trunkW, t.trunkH, 2);
        stroke(0, 30); line(t.x + t.trunkW * 0.3, t.y - t.trunkH * 0.8, t.x + t.trunkW * 0.3, t.y - t.trunkH * 0.2); line(t.x + t.trunkW * 0.7, t.y - t.trunkH * 0.7, t.x + t.trunkW * 0.7, t.y - t.trunkH * 0.4); noStroke();
        if (s.name === "Winter") { stroke(80, 50, 30); strokeWeight(3); line(cx, t.y - t.trunkH, cx - 30, t.y - t.trunkH - 40); line(cx, t.y - t.trunkH, cx + 30, t.y - t.trunkH - 35); noStroke(); fill(255); ellipse(cx - 15, t.y - t.trunkH - 20, 10, 5); ellipse(cx + 15, t.y - t.trunkH - 18, 12, 6); }
        else { let leafCol = lerpColor(t.leafColor, s.leaf, 0.5); let foliageY = t.y - t.trunkH * 0.9, sz = t.canopySize; fill(lerpColor(leafCol, color(0), 0.2)); ellipse(cx, foliageY, sz, sz * 0.8); fill(leafCol); ellipse(cx - sz * 0.15, foliageY - sz * 0.1, sz * 0.8, sz * 0.7); ellipse(cx + sz * 0.15, foliageY - sz * 0.1, sz * 0.8, sz * 0.7); fill(lerpColor(leafCol, color(255), 0.2)); ellipse(cx, foliageY - sz * 0.3, sz * 0.6, sz * 0.5); if (s.name === "Autumn" || s.name === "Spring") { noStroke(); for (let i = 0; i < 2; i++) { let drop = (frameCount * (s.name === "Autumn" ? 1.5 : 0.8) + t.particlePhase * 50 + i * 30) % 100; ellipse(cx + sin(frameCount * 0.02 + t.particlePhase + i) * 40, t.y - t.trunkH + drop, 8, 5); } } }
    }
}

function drawCanyon(c) { fill(40, 20, 10); rect(c.x_pos, floorPos_y, c.width, ORIGINAL_HEIGHT - floorPos_y); fill(80, 45, 20); triangle(c.x_pos, floorPos_y, c.x_pos + 20, ORIGINAL_HEIGHT, c.x_pos, ORIGINAL_HEIGHT); fill(60, 30, 10); triangle(c.x_pos + c.width, floorPos_y, c.x_pos + c.width - 20, ORIGINAL_HEIGHT, c.x_pos + c.width, ORIGINAL_HEIGHT); }

function drawCollectable(t) {
    if (t.isFound) return;
    let bob = sin(frameCount * 0.1) * 8, rotX = cos(frameCount * 0.05); push(); translate(t.x_pos, t.y_pos + bob); scale(rotX, 1); noStroke(); fill(101, 67, 33); beginShape(); vertex(0, -25); bezierVertex(-15, -15, -20, 5, 0, 15); bezierVertex(20, 5, 15, -15, 0, -25); endShape(CLOSE); fill(255, 215, 0); for (let r = 0; r < 4; r++) { let y = -15 + r * 8, count = 3 - abs(r - 2); for (let i = 0; i <= count; i++) { let x = -10 + i * 7 + (r % 2 === 0 ? 3 : 0); fill(255, 223, 0); ellipse(x, y, 8, 10); fill(184, 134, 11, 150); arc(x, y, 8, 10, 0, PI); } } fill(255, 180); ellipse(-5, -15, 6, 10); pop();
}

function drawStoryObjects() {
    for (let obj of storyObjects) {
        if (obj.type === "camp") { push(); translate(obj.x, floorPos_y); fill(100, 120, 80); triangle(-40, 0, 0, -50, 40, 0); fill(80, 100, 60); triangle(-10, 0, 0, -50, 10, 0); pop(); }
        else if (obj.type === "bridge") { push(); translate(obj.x, floorPos_y); stroke(80, 50, 20); strokeWeight(8); line(0, 0, 20, 40); line(obj.w, 0, obj.w - 20, 40); pop(); }
        else if (obj.type === "footprint") { push(); translate(obj.x, floorPos_y + 5); fill(0, 30); noStroke(); ellipse(0, 0, 40, 60); pop(); }
    }
}

function draw() {
    if (gameState === STATE_START) {
        drawStartMenu();
    } else if (gameState === STATE_PLAYING) {
        updateGame();
        drawGame();
    } else if (gameState === STATE_PAUSED) {
        drawGame();
        drawPauseScreen();
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
    
    if (lives < 1) gameState = STATE_GAMEOVER;
    
    // Transition to win state only after flag animation finishes
    if (flagpole.isReached && flagpole.height >= 200) {
        gameState = STATE_WIN;
    }
}

function drawGame() {
    let scaleX = width / ORIGINAL_WIDTH, scaleY = height / ORIGINAL_HEIGHT;
    drawSkyAndCelestialBodies();
    
    push(); 
    // Apply screen shake
    if (screenShakeAmount > 0) {
        translate(random(-screenShakeAmount, screenShakeAmount), random(-screenShakeAmount, screenShakeAmount));
        screenShakeAmount *= 0.9;
        if (screenShakeAmount < 0.1) screenShakeAmount = 0;
    }

    scale(scaleX, scaleY); 
    cameraPosX = lerp(cameraPosX, gameChar_x - ORIGINAL_WIDTH / 2, 0.1);
    
    push(); translate(-cameraPosX * 0.2, 0); drawMountains(); pop(); 
    push(); translate(-cameraPosX * 0.5, 0); drawClouds(); pop();
    
    translate(-cameraPosX, 0); 
    drawGroundAndGrass(); 
    drawStoryObjects(); 
    if (cave) drawCave(); 
    drawTrees();
    drawCheckpoints();
    
    for (var c of canyons) { 
        drawCanyon(c); 
        if (gameChar_x > c.x_pos && gameChar_x < c.x_pos + c.width && gameChar_y >= floorPos_y) isPlummeting = true; 
    }
    
    for (var col of collectables) { 
        drawCollectable(col); 
        if (!col.isFound && dist(gameChar_x, gameChar_y, col.x_pos, col.y_pos) < 50) { 
            col.isFound = true; 
            game_score++; 
            sounds.play('coin'); 
        } 
    }
    
    for (let p of platforms) p.draw();
    if (invincibilityTimer > 0) invincibilityTimer--;
    
    for (let e of enemies) { 
        e.draw(); 
        if (!isHibernating && invincibilityTimer === 0 && e.checkContact(gameChar_x, gameChar_y)) { 
            lives--; 
            screenShakeAmount = 15;
            sounds.play('death'); 
            invincibilityTimer = 90; 
            if (lives > 0) respawnCharacter(); 
        } 
    }
    
    updateAndDrawDust(); 
    processCharacter(); 
    drawCharacterStatusUI(); 
    
    // Flagpole collision detection
    if (!flagpole.isReached && abs(gameChar_x - flagpole.x_pos) < 20) {
        flagpole.isReached = true;
    }
    
    renderFlagpole(); 
    pop(); 
    
    updateAndDrawConfetti();
    drawFog(); 
    drawHUD();
    checkPlayerDie();
    coinAngle += 0.05;
}

function drawStartMenu() {
    background(0);
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(40);
    text("THE GREAT FREEZE", width / 2, height / 2 - 50);
    textSize(20);
    text("Press ENTER to Start", width / 2, height / 2 + 50);
}

function drawPauseScreen() {
    fill(0, 150);
    rect(0, 0, width, height);
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(40);
    text("PAUSED", width / 2, height / 2);
    textSize(20);
    text("Press P to Resume", width / 2, height / 2 + 50);
}

function drawGameOver() {
    fill(0, 200);
    rect(0, 0, width, height);
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(40);
    text("The Great Freeze wins.", width / 2, height / 2);
    textSize(20);
    text("Press SPACE to try again", width / 2, height / 2 + 50);
}

function drawWinScreen() {
    fill(0, 200);
    rect(0, 0, width, height);
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(40);
    if (game_score < totalCollectables) {
        text("More pine cones needed!", width / 2, height / 2);
        textSize(20);
        text("Press SPACE to restart", width / 2, height / 2 + 50);
    } else {
        text("Home repaired for now!", width / 2, height / 2);
        textSize(20);
        text("Press N for Level " + (level + 1), width / 2, height / 2 + 50);
    }
}

function updateDayNightCycle() { timeOfDay = (timeOfDay + cycleSpeed) % 1440; }
function updateSeasonCycle() { seasonTime += cycleSpeed; if (seasonTime >= SEASON_DURATION) { seasonTime = 0; currentSeasonIndex = (currentSeasonIndex + 1) % seasons.length; if (seasons[currentSeasonIndex].name === "Summer") isHibernating = false; } }
function updateHibernationLogic() { if (isHibernating && ++hibernationTimer >= HIBERNATION_DURATION) isHibernating = false; }

function generateStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: random(width),
            y: random(height * 0.6),
            size: random(1, 3),
            twinkleSpeed: random(0.05, 0.1),
            phase: random(TWO_PI)
        });
    }
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
            // Add subtle parallax: stars move slightly with camera
            let px = (star.x - cameraPosX * 0.05) % width;
            if (px < 0) px += width;
            ellipse(px, star.y, star.size, star.size);
        }

        // Shooting Star logic
        if (!shootingStar && random() < 0.005 && dayRatio < 0.3) {
            shootingStar = {
                x: random(width),
                y: random(height * 0.4),
                vx: random(10, 20),
                vy: random(2, 5),
                life: 1.0
            };
        }

        if (shootingStar) {
            stroke(255, shootingStar.life * 255);
            strokeWeight(2);
            line(shootingStar.x, shootingStar.y, shootingStar.x - shootingStar.vx * 2, shootingStar.y - shootingStar.vy * 2);
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

    if (dayRatio > 0.25) { // Sun
        noStroke();
        fill(255, 255, 150);
        ellipse(cx, cy, 60, 60);
        fill(255, 255, 100, 50);
        ellipse(cx, cy, 80, 80);
    } else { // Moon
        let mx = width / 2 + cos(angle + PI) * (width * 0.4);
        let my = height * 0.6 + sin(angle + PI) * (height * 0.4);
        noStroke();
        fill(220, 220, 255);
        ellipse(mx, my, 50, 50);
        fill(skyColor);
        ellipse(mx + 10, my - 5, 45, 45);
    }
}

function createConfetti(x, y) {
    for (let i = 0; i < 50; i++) {
        confetti.push({
            x: x,
            y: y,
            vx: random(-5, 5),
            vy: random(-10, -2),
            color: color(random(255), random(255), random(255)),
            size: random(5, 10),
            angle: random(TWO_PI),
            spin: random(-0.2, 0.2)
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
        rect(-p.size/2, -p.size/2, p.size, p.size/2);
        pop();
        
        if (p.y > height) confetti.splice(i, 1);
    }
}

function drawGroundAndGrass() { const s = seasons[currentSeasonIndex] || seasons[0]; noStroke(); fill(lerpColor(color(139, 69, 19), s.ground, 0.45)); rect(-3000, floorPos_y, 8000, ORIGINAL_HEIGHT / 2); fill(lerpColor(color(34, 139, 34), s.grass, 0.55)); rect(-3000, floorPos_y, 8000, 20); }

function drawCave() {
    let cx = cave.x_pos + cave.width / 2; fill(95, 75, 55); arc(cx, floorPos_y, cave.width, cave.height * 1.2, PI, TWO_PI, CHORD); fill(10, 8, 4); arc(cx, floorPos_y - 8, cave.width * 0.65, cave.height * 0.5, PI, TWO_PI, CHORD);
    if (isHibernating) { let fy = floorPos_y - 6; push(); fill(furColor); rect(cx - 36, fy - 18, 72, 40, 12); ellipse(cx - 14, fy + 6, 12, 10); ellipse(cx + 14, fy + 6, 12, 10); rect(cx - 44, fy - 20, 10, 28, 6); rect(cx + 34, fy - 20, 10, 28, 6); fill(skinColor); ellipse(cx + 34, fy - 12, 34, 34); fill(furColor); ellipse(cx + 34, fy - 12, 48, 48); fill(skinColor); ellipse(cx + 34, fy - 12, 30, 30); fill(0); ellipse(cx + 28, fy - 14, 4, 4); ellipse(cx + 40, fy - 14, 4, 4); fill(0); textSize(18); text("Zzz", cx + 48, fy - 26); pop(); }
}

function processCharacter() {
    if (!isHibernating && !isPlummeting) { isLeft = keyIsDown(LEFT_ARROW) || keyIsDown(65); isRight = keyIsDown(RIGHT_ARROW) || keyIsDown(68); if (isLeft) gameChar_x -= 5; if (isRight) gameChar_x += 5; }
    if (!isHibernating) { 
        gameChar_y += velocity_y; 
        
        if (jumpBufferTimer > 0) jumpBufferTimer--;

        if (!isFalling) coyoteTimer = COYOTE_TIME_LIMIT; 
        else if (coyoteTimer > 0) coyoteTimer--; 
        
        if (gameChar_y < floorPos_y) { 
            let on = false; 
            for (let p of platforms) if (p.checkContact(gameChar_x, gameChar_y) && velocity_y >= 0) { 
                on = true; isFalling = false; gameChar_y = p.y; velocity_y = 0; break; 
            } 
            if (!on) { velocity_y += gravity; isFalling = true; } 
        } else { 
            if (isFalling) { 
                createDust(gameChar_x, floorPos_y); 
                charScaleX = 1.2; 
                charScaleY = 0.8; 
                sounds.play('land'); 
            } 
            isFalling = false; 
            if (!isPlummeting) { 
                gameChar_y = floorPos_y; 
                velocity_y = 0; 
            } else velocity_y += gravity; 
        }

        // Apply Buffered Jump
        if (jumpBufferTimer > 0 && (coyoteTimer > 0 || !isFalling) && !isPlummeting) {
            velocity_y = jumpPower;
            sounds.play('jump');
            charScaleX = 0.8;
            charScaleY = 1.2;
            coyoteTimer = 0;
            jumpBufferTimer = 0;
        }
    }
    if (gameChar_x < -3000 || gameChar_x > 5000) isPlummeting = true; 
    drawGameCharBody(); 
}

function drawGameCharBody() {
    if (invincibilityTimer % 10 > 5) return; push(); translate(gameChar_x, gameChar_y); scale(charScaleX, charScaleY); translate(-gameChar_x, -gameChar_y);
    function head(xo, d) { fill(furColor); ellipse(gameChar_x + xo, gameChar_y - 65, 40, 45); fill(skinColor); ellipse(gameChar_x + xo + d*4, gameChar_y - 65, 24, 28); fill(0); ellipse(gameChar_x + xo + d*4 - 6, gameChar_y - 67, 4, 4); ellipse(gameChar_x + xo + d*4 + 6, gameChar_y - 67, 4, 4); }
    noStroke();
    if (isLeft && isFalling) { fill(furColor); rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10); head(0, -1); push(); translate(gameChar_x - 15, gameChar_y - 50); rotate(-2.5); rect(0, 0, 12, 35, 6); pop(); push(); translate(gameChar_x + 10, gameChar_y - 50); rotate(0.5); rect(0, 0, 12, 35, 6); pop(); rect(gameChar_x - 15, gameChar_y - 25, 14, 14, 7); rect(gameChar_x + 2, gameChar_y - 20, 14, 14, 7); }
    else if (isRight && isFalling) { fill(furColor); rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10); head(0, 1); push(); translate(gameChar_x + 15, gameChar_y - 50); rotate(2.5); rect(-12, 0, 12, 35, 6); pop(); push(); translate(gameChar_x - 10, gameChar_y - 50); rotate(-0.5); rect(-12, 0, 12, 35, 6); pop(); rect(gameChar_x - 15, gameChar_y - 20, 14, 14, 7); rect(gameChar_x + 2, gameChar_y - 25, 14, 14, 7); }
    else if (isLeft) { fill(furColor); push(); translate(gameChar_x + 5, gameChar_y - 20); rotate(0.4); rect(-6, 0, 12, 25, 6); pop(); push(); translate(gameChar_x, gameChar_y); rotate(-0.1); rect(-18, -60, 36, 45, 10); pop(); head(-4, -1); push(); translate(gameChar_x - 5, gameChar_y - 20); rotate(-0.4); rect(-6, 0, 12, 25, 6); pop(); push(); translate(gameChar_x, gameChar_y - 50); rotate(0.5); rect(-6, 0, 12, 40, 6); pop(); }
    else if (isRight) { fill(furColor); push(); translate(gameChar_x - 5, gameChar_y - 20); rotate(-0.4); rect(-6, 0, 12, 25, 6); pop(); push(); translate(gameChar_x, gameChar_y); rotate(0.1); rect(-18, -60, 36, 45, 10); pop(); head(4, 1); push(); translate(gameChar_x + 5, gameChar_y - 20); rotate(0.4); rect(-6, 0, 12, 25, 6); pop(); push(); translate(gameChar_x, gameChar_y - 50); rotate(-0.5); rect(-6, 0, 12, 40, 6); pop(); }
    else if (isFalling || isPlummeting) { fill(furColor); rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10); head(0, 0); fill(0); ellipse(gameChar_x, gameChar_y - 58, 8, 10); rect(gameChar_x - 30, gameChar_y - 65, 12, 40, 6); rect(gameChar_x + 18, gameChar_y - 65, 12, 40, 6); rect(gameChar_x - 15, gameChar_y - 20, 12, 15, 6); rect(gameChar_x + 3, gameChar_y - 20, 12, 15, 6); }
    else { fill(furColor); rect(gameChar_x - 20, gameChar_y - 60, 40, 50, 12); head(0, 0); rect(gameChar_x - 32, gameChar_y - 55, 14, 45, 7); rect(gameChar_x + 18, gameChar_y - 55, 14, 45, 7); rect(gameChar_x - 15, gameChar_y - 12, 14, 15, 6); rect(gameChar_x + 1, gameChar_y - 12, 14, 15, 6); } pop();
}

function drawCharacterStatusUI() {
    const s = seasons[currentSeasonIndex] || seasons[0]; let isNearCave = cave && abs(gameChar_x - (cave.x_pos + cave.width/2)) < 100;
    if (s.name === "Winter" && !isHibernating && isNearCave) { let x = gameChar_x, y = gameChar_y - 120, message = "i need to sleep (W)"; push(); textSize(16); let padding = 12, bW = textWidth(message) + padding * 2, bH = 40; fill(255); stroke(0); strokeWeight(2); rect(x - bW/2, y - bH, bW, bH, 15); noStroke(); fill(255); triangle(x - 10, y - bH + 38, x + 10, y - bH + 38, x, y - bH + 50); stroke(0); line(x - 10, y - bH + 38, x, y - bH + 50); line(x + 10, y - bH + 38, x, y - bH + 50); noStroke(); fill(0); textAlign(CENTER, CENTER); text(message, x, y - bH/2); pop(); }
}

function respawnCharacter() { 
    gameChar_x = lastCheckpoint.x; 
    gameChar_y = lastCheckpoint.y; 
    velocity_y = 0; 
    isPlummeting = false; 
    isFalling = false; 
    isLeft = false; 
    isRight = false; 
    invincibilityTimer = 60; // 1 second of invincibility on respawn
    cameraPosX = gameChar_x - ORIGINAL_WIDTH / 2; 
}

function keyPressed() {
    if (gameState === STATE_START) {
        if (keyCode === ENTER || keyCode === 32) {
            gameState = STATE_PLAYING;
            sounds.init();
        }
        return false;
    }

    if (gameState === STATE_PAUSED) {
        if (key === 'P' || key === 'p' || keyCode === 27) gameState = STATE_PLAYING;
        return false;
    }

    if (gameState === STATE_GAMEOVER) {
        if (keyCode === 32) {
            level = 1; lives = 3; gameState = STATE_PLAYING; startGame();
        }
        return false;
    }

    if (gameState === STATE_WIN) {
        if (key === 'N' || key === 'n') {
            if (game_score === totalCollectables) {
                level++; gameState = STATE_PLAYING; startGame();
            }
        } else if (keyCode === 32) {
            gameState = STATE_PLAYING; startGame();
        }
        return false;
    }

    if (gameState === STATE_PLAYING) {
        if (key === 'P' || key === 'p' || keyCode === 27) {
            gameState = STATE_PAUSED;
            return false;
        }

        if (lives < 1 && keyCode == 32) { 
            level = 1; lives = 3; setup(); return false; 
        }
        
        // Jump Buffering: Store the jump intent even if not on ground yet
        if (keyCode == 32 && !isHibernating) {
            jumpBufferTimer = JUMP_BUFFER_LIMIT;
        }

        if (flagpole.isReached && flagpole.height >= 200 && (key === 'N' || key === 'n')) { 
            if (game_score === totalCollectables) { level++; startGame(); return false; } 
        }
        if (flagpole.isReached && flagpole.height >= 200 && keyCode == 32) { 
            startGame(); return false; 
        }
        if (gameChar_y > height && keyCode == 32) { 
            lives--; sounds.play('death'); if (lives > 0) respawnCharacter(); return false; 
        }
        if (key === 'W' || key === 'w') toggleHibernation();
        if (keyCode == 32 && (coyoteTimer > 0) && !isPlummeting && !isHibernating) { 
            velocity_y = jumpPower; sounds.play('jump'); charScaleX = 0.8; charScaleY = 1.2; coyoteTimer = 0; 
        }
    }
    return false;
}

function mouseWheel() { return false; }
function keyReleased() { return false; }

function toggleHibernation() {
    let near = cave && abs(gameChar_x - (cave.x_pos + cave.width / 2)) < 100;
    if (isHibernating) { isHibernating = false; hibernationTimer = 0; }
    else if (seasons[currentSeasonIndex].name === "Winter" && near) { isHibernating = true; gameChar_x = cave.x_pos + cave.width / 2; gameChar_y = floorPos_y; hibernationTimer = 0; }
}

function renderFlagpole() { 
    push(); 
    stroke(100); 
    strokeWeight(4); 
    line(flagpole.x_pos, floorPos_y, flagpole.x_pos, floorPos_y - 250); 
    
    if (flagpole.isReached && flagpole.height < 200) {
        flagpole.height += 4;
        if (flagpole.height >= 200) {
            createConfetti(flagpole.x_pos - cameraPosX, height/2);
            sounds.play('coin'); // Use coin sound as a temporary victory chime
        }
    }
    
    fill(255, 50, 50); 
    rect(flagpole.x_pos, floorPos_y - 50 - flagpole.height, 60, 40); 
    pop(); 
}

function checkPlayerDie() { 
    if (gameChar_y > height && lives > 0) { 
        screenShakeAmount = 10;
        fill(0, 200); rect(0, 0, width, height); textAlign(CENTER, CENTER); textSize(30); fill(255); text("The Freeze takes you. Press Space.", width/2, height/2); 
    } 
}

function updateWeather() {
    let cur = seasonSpecs[currentSeasonIndex], w = cur.weather; if (w.type === 'none') { weatherParticles = []; return; }
    while (weatherParticles.length < w.density) weatherParticles.push({ x: random(width), y: random(-height, 0), z: random(0.5, 2), len: random(10, 20) });
    stroke(w.color[0], w.color[1], w.color[2]); for (let p of weatherParticles) { p.y += w.speed * p.z; p.x += w.wind * p.z; if (p.y > height) { p.y = random(-50, 0); p.x = random(width); } if (w.type === 'rain') { strokeWeight(p.z); line(p.x, p.y, p.x, p.y + p.len * p.z); } else { noStroke(); fill(255); ellipse(p.x, p.y, 4*p.z, 4*p.z); } }
}

function drawFog() { let fog = seasonSpecs[currentSeasonIndex].fog; if (fog.alpha > 0) { noStroke(); fill(fog.color[0], fog.color[1], fog.color[2], fog.alpha); rect(0, 0, width, height); } }

function drawHUD() {
    drawQuestCompass(); 
    
    // Progress Bar
    let barW = 200, barH = 10, barX = width/2 - barW/2, barY = 30;
    noStroke(); fill(0, 100); rect(barX, barY, barW, barH, 5);
    let progress = map(gameChar_x, 100, flagpole.x_pos, 0, barW, true);
    fill(255, 215, 0); rect(barX, barY, progress, barH, 5);
    fill(255); textSize(10); textAlign(CENTER, BOTTOM); text("PROGRESS TO HOME", width/2, barY - 5);

    for (let i = 0; i < lives; i++) { 
        let s = (i === lives - 1 && lives === 1) ? 1 + sin(heartPulse)*0.2 : 1; 
        fill(255, 50, 50); push(); translate(30 + i * 40, 40); scale(s); ellipse(0, 0, 25, 25); pop(); 
    }
    
    fill(255, 215, 0); stroke(0); strokeWeight(2); textSize(24); textAlign(LEFT, TOP); text("Pine Cones: " + game_score + " / " + totalCollectables, 20, 70); 
    fill(255); textSize(16); noStroke(); text("P: Pause | W: Hibernate", 20, height - 30);
    
    if (tutorialAlpha > 0) { 
        fill(255, tutorialAlpha); textAlign(CENTER, CENTER); textSize(30); text("Repair your home before the Great Freeze!", width/2, height/2 - 150); text("ARROWS to Move, SPACE to Jump", width/2, height/2 - 100); if (isLeft || isRight || isFalling) tutorialAlpha -= 2; 
    }
}

function drawQuestCompass() {
    let targetX = -1, label = "", minDist = Infinity; for (let col of collectables) if (!col.isFound) { let d = abs(gameChar_x - col.x_pos); if (d < minDist) { minDist = d; targetX = col.x_pos; label = "PINE CONE"; } }
    if (targetX === -1) { targetX = flagpole.x_pos; label = "HOME"; }
    push(); let compassX = width - 80, compassY = 80; fill(0, 150); stroke(255, 200); strokeWeight(2); ellipse(compassX, compassY, 60, 60); let angle = targetX > gameChar_x ? 0 : PI; if (abs(gameChar_x - targetX) < 50) angle = frameCount * 0.2; translate(compassX, compassY); rotate(angle); fill(255, 0, 0); triangle(20, 0, 0, -8, 0, 8); fill(255); triangle(-20, 0, 0, -8, 0, 8); pop(); textAlign(CENTER, CENTER); noStroke(); fill(255); textSize(10); text(label, width - 80, 120);
}

function createDust(x, y) { for (let i = 0; i < 5; i++) dustParticles.push({ x: x, y: y, size: random(5, 10), alpha: 200, vx: random(-1, 1), vy: random(-0.5, -2) }); }
function updateAndDrawDust() { noStroke(); for (let i = dustParticles.length - 1; i >= 0; i--) { let p = dustParticles[i]; p.x += p.vx; p.y += p.vy; p.alpha -= 5; fill(200, p.alpha); ellipse(p.x, p.y, p.size); if (p.alpha <= 0) dustParticles.splice(i, 1); } }