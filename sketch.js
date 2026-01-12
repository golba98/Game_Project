var gameChar_x;
var gameChar_y;
var floorPos_y;

var trees = [];
var mountains = [];
var clouds = [];

var collectables = [];
var canyons = [];
var cave;

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
var cycleSpeed = 1;

const seasonSpecs = [
    { 
        name: "Spring", 
        sky: [170, 220, 255], 
        ground: [150, 215, 165], 
        grass: [60, 190, 100], 
        leaf: [120, 200, 140], 
        leafStyle: "bloom",
        weather: { type: 'rain', density: 50, speed: 6, wind: 1, color: [150, 150, 200] },
        fog: { color: [255, 255, 255], alpha: 0 }
    },
    { 
        name: "Summer", 
        sky: [190, 230, 255], 
        ground: [130, 200, 140], 
        grass: [40, 160, 70], 
        leaf: [90, 190, 120], 
        leafStyle: "lush",
        weather: { type: 'none', density: 0, speed: 0, wind: 0, color: [0, 0, 0] },
        fog: { color: [255, 255, 255], alpha: 0 }
    },
    { 
        name: "Autumn", 
        sky: [220, 180, 170], 
        ground: [180, 140, 90], 
        grass: [140, 120, 60], 
        leaf: [200, 120, 80], 
        leafStyle: "crisp",
        weather: { type: 'rain', density: 120, speed: 9, wind: 3, color: [100, 100, 140] },
        fog: { color: [200, 200, 220], alpha: 30 }
    },
    { 
        name: "Winter", 
        sky: [160, 190, 220], 
        ground: [200, 210, 230], 
        grass: [200, 210, 230], 
        leaf: [200, 220, 240], 
        leafStyle: "bare",
        weather: { type: 'snow', density: 150, speed: 2, wind: 0.5, color: [255, 255, 255] },
        fog: { color: [220, 230, 240], alpha: 100 }
    }
];

var seasons = [];
var currentSeasonIndex = 0;
var seasonTime = 0;
const SEASON_DURATION = 720;

var weatherParticles = [];

var game_score;
var flagpole;
var lives;

var gameFont;

// QoL Variables
var cameraPosX = 0;
var dustParticles = [];
var tutorialAlpha = 255;
var totalCollectables = 5; // Matches generateCollectables count

function preload() {
    gameFont = loadFont('assets/font.ttf');
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    // 1. Setup Page Styles
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    
    // Set global font
    textFont(gameFont);

    // 2. Initialize Game Constants & Characters
    furColor = color(70, 45, 20);
    skinColor = color(180, 140, 110);
    floorPos_y = 450;
    
    lives = 3;
    startGame();
}

function startGame() {
    gameChar_x = 100;
    gameChar_y = floorPos_y;
    cameraPosX = 0; // Reset camera
    tutorialAlpha = 255; // Reset tutorial

    // Reset Game State
    game_score = 0;
    flagpole = { isReached: false, x_pos: 2800, height: 0 };
    
    // Reset Physics State
    isLeft = false;
    isRight = false;
    isFalling = false;
    isPlummeting = false;
    isHibernating = false;

    // 3. Generate World Elements (Order matters for collision checks)
    generateCanyons();      // Must be first (others check against this)
    generateCave();         // Checks canyons
    generateCollectables(); // Checks canyons
    initializeSeasons();    
    generateTrees();        // Checks canyons and cave
    generateMountains();    // Decoration (background)
    generateClouds();       // Decoration (sky)
    
    totalCollectables = collectables.length;
}

function generateCanyons() {
    canyons = [];
    for (var i = 0; i < 5; i++) {
        var validCanyon = false;
        var attempts = 0;
        
        while (!validCanyon && attempts < 100) {
            var cx = random(-2000, 3000);
            var cw = random(80, 140);
            validCanyon = true;

            // Check distance from other canyons
            for (var j = 0; j < canyons.length; j++) {
                if (abs(canyons[j].x_pos - cx) < 300) {
                    validCanyon = false;
                    break;
                }
            }

            // Check distance from game character start position
            if (cx < gameChar_x + 150 && cx + cw > gameChar_x - 150) {
                validCanyon = false;
            }

            if (validCanyon) {
                canyons.push({ x_pos: cx, width: cw });
            }
            attempts++;
        }
    }
}

function generateCave() {
    var validCave = false;
    var attempts = 0;

    while (!validCave && attempts < 100) {
        let cx = random(-1500, 2500);
        let cw = random(220, 320);
        let ch = random(160, 220);

        validCave = true;
        
        // Ensure cave doesn't overlap canyons
        for (var i = 0; i < canyons.length; i++) {
            if (cx + cw > canyons[i].x_pos - 50 && cx < canyons[i].x_pos + canyons[i].width + 50) {
                validCave = false;
                break;
            }
        }

        if (validCave) {
            cave = { x_pos: cx, width: cw, height: ch };
        }
        attempts++;
    }

    // Fallback if placement fails
    if (!cave) {
        cave = { x_pos: -1000, width: 250, height: 200 };
    }
}

function generateCollectables() {
    collectables = [];
    for (var i = 0; i < 5; i++) {
        var validCoin = false;
        var attempts = 0;

        while (!validCoin && attempts < 100) {
            var cx = random(-2000, 3000);
            validCoin = true;

            // Ensure coins don't spawn inside canyons
            for (var j = 0; j < canyons.length; j++) {
                if (cx > canyons[j].x_pos - 20 && cx < canyons[j].x_pos + canyons[j].width + 20) {
                    validCoin = false;
                    break;
                }
            }

            if (validCoin) {
                collectables.push({ x_pos: cx, y_pos: floorPos_y - 20, diameter: 50, isFound: false });
            }
            attempts++;
        }
    }
}

function initializeSeasons() {
    seasons = [];
    for (var i = 0; i < seasonSpecs.length; i++) {
        var spec = seasonSpecs[i];
        seasons.push({
            name: spec.name,
            sky: color(spec.sky[0], spec.sky[1], spec.sky[2]),
            ground: color(spec.ground[0], spec.ground[1], spec.ground[2]),
            grass: color(spec.grass[0], spec.grass[1], spec.grass[2]),
            leaf: color(spec.leaf[0], spec.leaf[1], spec.leaf[2])
        });
    }
}

function generateTrees() {
    trees = [];
    const CAVE_CLEARANCE = 220;

    for (var i = 0; i < 20; i++) {
        var validPosition = false;
        var maxAttempts = 100;
        var attempts = 0;
        var tx = 0;

        while (!validPosition && attempts < maxAttempts) {
            tx = random(-2000, 2900);
            validPosition = true;

            // Check canyon collision
            for (var c = 0; c < canyons.length; c++) {
                if (tx > canyons[c].x_pos - 80 && tx < canyons[c].x_pos + canyons[c].width + 80) {
                    validPosition = false;
                    break;
                }
            }

            // Check cave collision
            if (cave) {
                let caveCenter = cave.x_pos + cave.width / 2;
                if (abs(tx - caveCenter) < cave.width / 2 + CAVE_CLEARANCE) {
                    validPosition = false;
                }
            }

            // Check collision with other trees
            if (validPosition) {
                for (var j = 0; j < trees.length; j++) {
                    var d = abs(trees[j].x - tx);
                    if (d < 100) {
                        validPosition = false;
                        break;
                    }
                }
            }
            attempts += 1;
        }

        if (validPosition) {
            // Determine leaf style based on current season
            let currentSeasonSetup = seasons[currentSeasonIndex] || seasons[0];
            let seasonStyle = currentSeasonSetup.leafStyle;
            let baseLeaf = color(random(20, 60), random(100, 180), random(20, 60));

            trees.push({
                x: tx,
                y: floorPos_y,
                trunkW: random(30, 50),
                trunkH: random(90, 160),
                canopySize: random(110, 160),
                leafColor: baseLeaf,
                particlePhase: random(TWO_PI),
                style: seasonStyle
            });
        }
    }
}

function generateMountains() {
    mountains = [];
    for (var i = 0; i < 15; i++) {
        var tw = random(200, 500);
        var th = random(200, 450);
        var tx = random(-2000, 3000 - tw);
        var tc = random(80, 180);
        mountains.push({ x: tx, width: tw, height: th, color: tc });
    }
}

function generateClouds() {
    clouds = [];
    for (let i = 0; i < 14; i++) {
        let cx = random(-2000, 3000);
        let cy = random(60, 180);
        let cloudSpeed = random(0.2, 1.2);
        let col = color(random(220, 255), random(220, 255), random(230, 255), random(180, 230));
        clouds.push({ x: cx, y: cy, cloudSpeed: cloudSpeed, color: col });
    }
}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}


function drawMountains() {
    for (var i = 0; i < mountains.length; i++) {
        drawSingleMountain(mountains[i]);
    }
}

function drawSingleMountain(m) {
    // 1. Setup Dimensions & Coordinates
    let mWidth = m.width;
    let mHeight = m.height;
    let baseX = m.x;
    let baseY = floorPos_y;
    
    let peakX = baseX + mWidth / 2;
    let peakY = baseY - mHeight;

    noStroke();

    // 2. Draw Mountain Base
    // Left slope (Shaded side)
    fill(m.color - 40); 
    triangle(baseX, baseY, peakX, peakY, peakX, baseY);

    // Right slope (Lit side)
    fill(m.color);
    triangle(peakX, baseY, peakX, peakY, baseX + mWidth, baseY);

    // 3. Draw Snow Cap
    let currentSpec = seasonSpecs[currentSeasonIndex];
    let isWinter = currentSpec.name === "Winter";
    let capScale = isWinter ? 0.6 : 0.2; // Massive snow cap in winter
    
    let capH = mHeight * capScale;
    let capW = mWidth * capScale;
    let capBottomY = peakY + capH;

    // Left cap (Shaded side)
    fill(210, 210, 220);
    triangle(peakX, peakY, peakX - capW / 2, capBottomY, peakX, capBottomY);
    
    // Right cap (Lit side)
    fill(255, 255, 255);
    triangle(peakX, peakY, peakX + capW / 2, capBottomY, peakX, capBottomY);
}

function drawClouds() {
    for (let i = 0; i < clouds.length; i++) {
        let currentCloud = clouds[i];
        
        renderCloud(currentCloud);
        updateCloudPosition(currentCloud);
    }
}

function renderCloud(cloud) {
    let x = cloud.x;
    let y = cloud.y;
    
    // 1. Handle Color Defaults
    let col = cloud.color;
    if (col === undefined) {
        col = color(255, 255, 255, 200);
    }

    noStroke();

    // 2. Draw Main Cloud Body
    fill(col);
    ellipse(x, y, 80, 60);       // Left puff
    ellipse(x + 40, y, 100, 70); // Center puff
    ellipse(x + 80, y, 80, 60);  // Right puff

    // 3. Draw Highlight (Slightly lighter tint)
    let hr = constrain(red(col) + 10, 0, 255);
    let hg = constrain(green(col) + 10, 0, 255);
    let hb = constrain(blue(col) + 10, 0, 255);

    fill(hr, hg, hb, 140);
    ellipse(x + 30, y - 10, 50, 40);
}

function updateCloudPosition(cloud) {
    // Move cloud
    cloud.x += cloud.cloudSpeed;

    // Reset position if it moves too far off-screen
    if (cloud.x > 4000) {
        cloud.x = -800 - random(0, 600);
        cloud.y = random(60, 180);
        cloud.cloudSpeed = random(0.2, 1.2);
    }
}

function drawTrees() {
    const currentSeason = seasons[currentSeasonIndex] || seasons[0];
    
    for (var i = 0; i < trees.length; i++) {
        drawSingleTree(trees[i], currentSeason);
    }
}

function drawSingleTree(t, season) {
    // 1. Calculate common coordinates
    var cx = t.x + t.trunkW / 2;
    var baseY = t.y;

    // 2. Draw Base elements
    drawTreeShadow(t, cx);
    drawTreeTrunk(t, season);

    // 3. Draw Canopy based on Season
    if (season.name == "Winter") {
        drawWinterBranches(t, cx);
    } 
    else if (season.name == "Summer") {
        drawSummerCanopy(t, cx, baseY);
    } 
    else if (season.name == "Autumn") {
        drawAutumnCanopy(t, cx, baseY);
    } 
    else {
        // Default (Spring)
        drawSpringCanopy(t, cx, baseY, season);
    }
}

// --- TRUNK & SHADOW ---

function drawTreeShadow(t, cx) {
    fill(0, 50);
    ellipse(cx, t.y, t.trunkW * 1.5, 10);
}

function drawTreeTrunk(t, season) {
    let trunkColor = season.name === "Winter" ? color(90, 60, 40) : color(100, 50, 10);
    fill(trunkColor);
    rect(t.x, t.y - t.trunkH, t.trunkW, t.trunkH);
}

// --- SEASONAL CANOPIES ---

function drawWinterBranches(t, cx) {
    var winterY = t.y - t.trunkH;
    
    stroke(170, 150, 120);
    strokeWeight(3);
    
    line(cx, winterY, cx - 15, winterY - 30);
    line(cx, winterY, cx + 15, winterY - 35);
    line(cx - 5, winterY - 15, cx - 30, winterY - 45);
    line(cx + 5, winterY - 15, cx + 30, winterY - 50);
    
    noStroke();
}

function drawSummerCanopy(t, cx, baseY) {
    var baseColor = lerpColor(t.leafColor, color(210, 200, 150), 0.55);
    var highlight = lerpColor(baseColor, color(255), 0.3);
    var canopy = t.canopySize * 0.75;

    fill(baseColor);
    ellipse(cx, baseY - t.trunkH * 0.8, canopy, canopy * 0.7);
    
    fill(highlight);
    ellipse(cx - 22, baseY - t.trunkH * 0.95, canopy * 0.6, canopy * 0.6);
    ellipse(cx + 22, baseY - t.trunkH * 0.95, canopy * 0.6, canopy * 0.6);
    
    fill(baseColor);
    ellipse(cx, baseY - t.trunkH * 1.2, canopy * 0.5, canopy * 0.5);
}

function drawAutumnCanopy(t, cx, baseY) {
    var baseColor = lerpColor(t.leafColor, color(190, 110, 60), 0.7);
    var highlight = lerpColor(baseColor, color(255, 160, 80), 0.5);
    var canopy = t.canopySize * 0.8;

    // Draw main foliage
    fill(baseColor);
    ellipse(cx, baseY - t.trunkH * 0.8, canopy, canopy * 0.7);
    
    fill(highlight);
    ellipse(cx - 22, baseY - t.trunkH * 0.95, canopy * 0.6, canopy * 0.6);
    ellipse(cx + 22, baseY - t.trunkH * 0.95, canopy * 0.6, canopy * 0.6);
    
    fill(baseColor);
    ellipse(cx, baseY - t.trunkH * 1.2, canopy * 0.5, canopy * 0.5);

    // Draw falling leaves
    noStroke();
    for (var k = 0; k < 3; k++) {
        var drop = (frameCount * 0.4 + t.particlePhase * 30 + k * 25) % 60;
        var xOffset = cos(frameCount * 0.02 + t.particlePhase + k) * 25;
        
        fill(lerpColor(baseColor, color(220, 140, 60), 0.3), 200);
        ellipse(t.x + t.trunkW / 2 + xOffset, t.y + drop * 0.8 - 20, 6, 4);
    }
}

function drawSpringCanopy(t, cx, baseY, season) {
    var leafShade = lerpColor(t.leafColor, season.leaf, 0.45);
    var canopy = t.canopySize;

    fill(leafShade);
    ellipse(cx, baseY - t.trunkH * 0.8, canopy, canopy * 0.8);

    var highlight = color(
        min(red(leafShade) + 20, 255),
        min(green(leafShade) + 20, 255),
        min(blue(leafShade) + 20, 255)
    );
    
    fill(highlight);
    ellipse(cx - 20, baseY - t.trunkH, canopy * 0.7, canopy * 0.7);
    ellipse(cx + 20, baseY - t.trunkH, canopy * 0.7, canopy * 0.7);

    fill(leafShade);
    ellipse(cx, baseY - t.trunkH * 1.2, canopy * 0.6, canopy * 0.6);
}

function drawCanyon(canyon_object) {
    // 1. Setup Dimensions
    let x = canyon_object.x_pos;
    let y = floorPos_y;
    let w = canyon_object.width;
    let h = ORIGINAL_HEIGHT - floorPos_y;

    noStroke();

    // 2. Render Layers
    drawCanyonHole(x, y, w, h);
    drawCanyonWalls(x, y, w, h);
    drawCanyonDebris(x, y, w, h);
}

function drawCanyonHole(x, y, w, h) {
    // Main dark background
    fill(40, 20, 10);
    rect(x, y, w, h);
}

function drawCanyonWalls(x, y, w, h) {
    // Left Wall (Lighter brown slope)
    fill(80, 45, 20);
    beginShape();
    vertex(x, y);
    vertex(x + 20, y + h);
    vertex(x, y + h);
    endShape(CLOSE);

    // Right Wall (Darker brown slope)
    fill(60, 30, 10);
    beginShape();
    vertex(x + w, y);
    vertex(x + w - 20, y + h);
    vertex(x + w, y + h);
    endShape(CLOSE);
}

function drawCanyonDebris(x, y, w, h) {
    // Small dark spikes at the bottom center
    fill(30, 10, 5);
    triangle(
        x + w / 2 - 10, y + h,      // Left point
        x + w / 2 + 10, y + h,      // Right point
        x + w / 2,      y + h - 30  // Top point
    );
}

function drawCollectable(collectable_object) {
    if (collectable_object.isFound == false) {
        push();
        translate(collectable_object.x_pos, collectable_object.y_pos);
        rotate(coinAngle);
        stroke(0);
        strokeWeight(1);

        fill(255, 223, 0);
        ellipse(0, 0, 40, 40);

        fill(200, 160, 0);
        ellipse(0, 0, 30, 30);

        fill(0);
        noStroke();
        textSize(20);
        textAlign(CENTER, CENTER);
        text("$", 0, 0);
        pop();
    }
}

function checkCollectable(collectable_object) {
    if (collectable_object.isFound == false) {
        if (dist(gameChar_x, gameChar_y, collectable_object.x_pos, collectable_object.y_pos) < 50) {
            collectable_object.isFound = true;
            game_score += 1;
            console.log("Coin Collected!");
        }
    }
}

function checkCanyon(canyon_object) {
    if (gameChar_x > canyon_object.x_pos && 
        gameChar_x < canyon_object.x_pos + canyon_object.width && 
        gameChar_y >= floorPos_y) {
        isPlummeting = true;
    }
}

function draw() {
    // 1. Setup Scaling
    let scaleX = width / ORIGINAL_WIDTH;
    let scaleY = height / ORIGINAL_HEIGHT;

    // 2. Update Game Logic (Time, Seasons, Physics)
    updateDayNightCycle();
    updateSeasonCycle();
    updateHibernationLogic();

    // 3. Draw Background (Sky, Sun, Moon, Stars)
    // Note: We do this before the camera transform so the sky stays fixed relative to screen
    drawSkyAndCelestialBodies();

    // 4. World Rendering (Everything affected by the camera)
    push();
    scale(scaleX, scaleY);
    
    // Camera Logic (Smooth Lerp)
    let targetCameraX = gameChar_x - ORIGINAL_WIDTH / 2;
    cameraPosX = lerp(cameraPosX, targetCameraX, 0.1);
    
    translate(-cameraPosX, 0);

    // Draw Static World Elements
    drawMountains();
    drawGroundAndGrass();
    
    // Draw Interactive Elements
    if (cave) drawCave();
    drawClouds();
    drawTrees();

    // Draw/Check Canyons
    for (var i = 0; i < canyons.length; i++) {
        drawCanyon(canyons[i]);
        checkCanyon(canyons[i]);
    }

    // Draw/Check Collectables
    for (var i = 0; i < collectables.length; i++) {
        drawCollectable(collectables[i]);
        checkCollectable(collectables[i]);
    }

    // Draw Dust (Before Character)
    updateAndDrawDust();

    // Handle Character (Movement & Drawing)
    processCharacter();

    // Draw In-Game UI (Speech bubbles, etc)
    drawCharacterStatusUI();
    
    renderFlagpole();

    pop(); // End Camera Transform
    
    // Draw Weather (Screen Space)
    updateWeather();
    drawFog();

    // 5. HUD & Overlays
    drawHUD();

    // Game Over / Level Complete Logic
    if (lives < 1) {
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);
        textAlign(CENTER, CENTER);
        fill(255);
        textSize(40);
        text("Game Over. Press Space to Restart.", width/2, height/2);
        return;
    }

    if (flagpole.isReached && flagpole.height >= 200) {
        fill(0, 0, 0, 100);
        rect(0, 0, width, height);
        textAlign(CENTER, CENTER);
        fill(255);
        textSize(40);
        text("Level Complete. Press Space to Restart.", width/2, height/2);
        return;
    }
    
    checkPlayerDie();
    if (!flagpole.isReached) {
        checkFlagpole();
    }
    
    // Animation tick
    coinAngle += 0.05;
}

function updateDayNightCycle() {
    timeOfDay += cycleSpeed;
    if (timeOfDay >= 1440) {
        timeOfDay = 0;
    }
}

function updateSeasonCycle() {
    seasonTime += cycleSpeed;
    if (seasonTime >= SEASON_DURATION) {
        seasonTime -= SEASON_DURATION;
        currentSeasonIndex = (currentSeasonIndex + 1 + seasons.length) % seasons.length;

        // Wake up bear if summer starts
        let seasonForCycle = seasons[currentSeasonIndex] || seasons[0];
        if (seasonForCycle.name === "Summer" && isHibernating) {
            isHibernating = false;
            hibernationTimer = 0;
        }
    }
}

function updateHibernationLogic() {
    if (isHibernating) {
        hibernationTimer += 1;
        if (hibernationTimer >= HIBERNATION_DURATION) {
            isHibernating = false;
            hibernationTimer = 0;
        }
    }
}

function drawSkyAndCelestialBodies() {
    let sunMoonSize = 80;
    let starCount = 0;
    let drawOverlay = null;
    let c1, c2;

    // --- Calculate Sun/Moon Positions ---
    let sunProgress = map(constrain(timeOfDay, 240, 1140), 240, 1140, 0, 1);
    let sunX = map(sunProgress, 0, 1, -100, width + 100);
    let sunY = 150 - sin(sunProgress * PI) * 120;

    let moonCycleTime = timeOfDay < 240 ? timeOfDay + 1440 : timeOfDay;
    let moonProgress = map(constrain(moonCycleTime, 1140, 1680), 1140, 1680, 0, 1);
    let moonX = map(moonProgress, 0, 1, width + 100, -100);
    let moonY = 150 - sin(moonProgress * PI) * 120;

    // --- Determine Colors based on Time ---
    if (timeOfDay < 240) { // Night
        let t = map(timeOfDay, 0, 240, 0, 1);
        c1 = lerpColor(color(10, 10, 40), color(15, 15, 50), t);
        c2 = lerpColor(color(20, 20, 60), color(25, 25, 70), t);
        starCount = 200;
        drawOverlay = { type: 'moon', x: moonX, y: moonY, diameter: sunMoonSize, glowAlpha: 120, coreAlpha: 255, craterAlpha: 200 };
    } 
    else if (timeOfDay < 420) { // Sunrise
        let t = map(timeOfDay, 240, 420, 0, 1);
        c1 = lerpColor(color(15, 15, 50), color(255, 150, 100), t);
        c2 = lerpColor(color(25, 25, 70), color(135, 206, 250), t);
        if (t < 0.5) {
            let moonFade = (1 - t * 2);
            starCount = int(moonFade * 200);
            drawOverlay = { type: 'moon', x: moonX, y: moonY, diameter: sunMoonSize, glowAlpha: 120 * moonFade, coreAlpha: 255 * moonFade, craterAlpha: 200 * moonFade };
        } else {
            let sunGrow = (t - 0.5) * 2;
            drawOverlay = { type: 'sun', x: sunX, y: sunY, diameter: sunMoonSize, glowAlpha: 200 * sunGrow, rimAlpha: 180 * sunGrow, coreAlpha: 255 * sunGrow };
        }
    } 
    else if (timeOfDay < 900) { // Day
        let t = map(timeOfDay, 420, 900, 0, 1);
        c1 = lerpColor(color(135, 206, 250), color(100, 150, 255), t);
        c2 = lerpColor(color(200, 230, 255), color(180, 220, 255), t);
        drawOverlay = { type: 'sun', x: sunX, y: sunY, diameter: sunMoonSize, glowAlpha: 200, rimAlpha: 150, coreAlpha: 255 };
    } 
    else if (timeOfDay < 1140) { // Sunset
        let t = map(timeOfDay, 900, 1140, 0, 1);
        c1 = lerpColor(color(100, 150, 255), color(180, 80, 120), t);
        c2 = lerpColor(color(180, 220, 255), color(50, 30, 80), t);
        let sunFade = max(0, 1 - t / 0.7);
        if (sunFade > 0) {
            drawOverlay = { type: 'sun', x: sunX, y: sunY, diameter: sunMoonSize, glowAlpha: 200 * sunFade, rimAlpha: 160 * sunFade, coreAlpha: 255 * sunFade };
        }
        if (t >= 0.7) starCount = int(((t - 0.7) / 0.3) * 100);
    } 
    else { // Late Night
        let t = map(timeOfDay, 1140, 1440, 0, 1);
        c1 = lerpColor(color(180, 80, 120), color(10, 10, 40), t);
        c2 = lerpColor(color(50, 30, 80), color(20, 20, 60), t);
        starCount = int(t * 200 + 50);
        drawOverlay = { type: 'moon', x: moonX, y: moonY, diameter: sunMoonSize, glowAlpha: 130, coreAlpha: 255, craterAlpha: 220 };
    }

    // --- Draw Gradient ---
    const currentSeason = seasons[currentSeasonIndex] || seasons[0];
    noFill();
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(c1, c2, inter);
        c = lerpColor(c, currentSeason.sky, 0.25);
        stroke(c);
        line(0, y, width, y);
    }

    // --- Draw Stars ---
    if (starCount > 0) {
        randomSeed(42);
        noStroke();
        for (let i = 0; i < starCount; i++) {
            let sx = random(width);
            let sy = random(height * 0.6);
            let twinkle = sin(frameCount * 0.05 + i) * 0.5 + 0.5;
            fill(255, 255, 255, 150 + twinkle * 100);
            ellipse(sx, sy, 2, 2);
        }
        randomSeed(millis());
    }

    // --- Draw Sun/Moon Overlay ---
    if (drawOverlay) {
        if (drawOverlay.type === 'sun') {
            noStroke();
            fill(255, 255, 0, drawOverlay.glowAlpha);
            ellipse(drawOverlay.x, drawOverlay.y, drawOverlay.diameter + 60, drawOverlay.diameter + 60);
            fill(255, 255, 0, drawOverlay.rimAlpha);
            ellipse(drawOverlay.x, drawOverlay.y, drawOverlay.diameter + 40, drawOverlay.diameter + 40);
            fill(255, 255, 0, drawOverlay.coreAlpha);
            ellipse(drawOverlay.x, drawOverlay.y, drawOverlay.diameter, drawOverlay.diameter);
        } else if (drawOverlay.type === 'moon') {
            noStroke();
            fill(220, 220, 235, drawOverlay.glowAlpha);
            ellipse(drawOverlay.x, drawOverlay.y, drawOverlay.diameter + 30, drawOverlay.diameter + 30);
            fill(240, 240, 255, drawOverlay.coreAlpha);
            ellipse(drawOverlay.x, drawOverlay.y, drawOverlay.diameter, drawOverlay.diameter);
            fill(230, 230, 245, drawOverlay.craterAlpha);
            ellipse(drawOverlay.x - 12, drawOverlay.y - 6, drawOverlay.diameter * 0.25, drawOverlay.diameter * 0.25);
            ellipse(drawOverlay.x + 8, drawOverlay.y + 5, drawOverlay.diameter * 0.2, drawOverlay.diameter * 0.2);
        }
    }
}

function drawGroundAndGrass() {
    const currentSeason = seasons[currentSeasonIndex] || seasons[0];
    noStroke();
    
    // Dirt
    fill(lerpColor(color(139, 69, 19), currentSeason.ground, 0.45));
    rect(-2000, floorPos_y, ORIGINAL_WIDTH + 4000, ORIGINAL_HEIGHT / 2);

    // Main Grass
    fill(lerpColor(color(34, 139, 34), currentSeason.grass, 0.55));
    rect(-2000, floorPos_y, ORIGINAL_WIDTH + 4000, 20);

    // Grass shadow/highlight
    fill(currentSeason.grass.levels ? color(currentSeason.grass.levels[0], currentSeason.grass.levels[1], currentSeason.grass.levels[2], 120) : color(20, 80, 20, 100));
    rect(-2000, floorPos_y + 20, ORIGINAL_WIDTH + 4000, 5);
}

function drawCave() {
    let x = cave.x_pos;
    let y = floorPos_y;
    let w = cave.width;
    let h = cave.height;
    let centerX = x + w / 2;
    
    fill(95, 75, 55);
    arc(centerX, y, w, h * 1.2, PI, TWO_PI, CHORD);
    
    fill(10, 8, 4);
    arc(centerX, y - 8, w * 0.65, h * 0.5, PI, TWO_PI, CHORD);
    
    stroke(70, 55, 40);
    strokeWeight(3);
    line(centerX - w * 0.2, y - 5, centerX - w * 0.08, y + 8);
    line(centerX + w * 0.2, y - 5, centerX + w * 0.08, y + 8);
    noStroke();

    // Draw Sleeping Bear if hibernating
    if (isHibernating) {
        let fy = floorPos_y - 6;
        let cx = centerX;
        push();
        fill(furColor);
        rect(cx - 36, fy - 18, 72, 40, 12); // body
        ellipse(cx - 14, fy + 6, 12, 10); // leg
        ellipse(cx + 14, fy + 6, 12, 10); // leg
        rect(cx - 44, fy - 20, 10, 28, 6); // arm
        rect(cx + 34, fy - 20, 10, 28, 6); // arm
        fill(skinColor);
        ellipse(cx + 34, fy - 12, 34, 34); // head back
        fill(furColor);
        ellipse(cx + 34, fy - 12, 48, 48); // head main
        fill(skinColor);
        ellipse(cx + 34, fy - 12, 30, 30); // face
        fill(0);
        ellipse(cx + 28, fy - 14, 4, 4); // eye
        ellipse(cx + 40, fy - 14, 4, 4); // eye
        fill(0);
        textSize(18);
        textAlign(LEFT, TOP);
        text("Zzz", cx + 48, fy - 26);
        pop();
    }
}

function processCharacter() {
    // 1. Handle Movement Physics
    if (gameChar_y < ORIGINAL_HEIGHT + 100) {
        if (!isHibernating) {
            if (isLeft && !keyIsDown(LEFT_ARROW) && !keyIsDown(65)) isLeft = false;
            if (isRight && !keyIsDown(RIGHT_ARROW) && !keyIsDown(68)) isRight = false;
            
            if (isPlummeting == false) {
                if (isLeft) gameChar_x -= 5;
                if (isRight) gameChar_x += 5;
            }
        }
    }

    if (!isHibernating) {
        if (gameChar_y < floorPos_y) {
            gameChar_y += 2;
            isFalling = true;
        } else {
            // Just landed?
            if (isFalling) {
                createDust(gameChar_x, floorPos_y);
            }
            isFalling = false;
        }
        if (gameChar_x < -2000 || gameChar_x > 3000) {
            isPlummeting = true;
        }
        if (isPlummeting == true) {
            gameChar_y += 5;
        }
    }

    // 2. Render Character based on state
    if (!isHibernating) {
        drawGameCharBody();
    }
}

function drawGameCharBody() {
    // Helper to draw head since it's used in every state
    function drawHead(xOffset, dir) {
        let x = gameChar_x + xOffset;
        let y = gameChar_y;
        fill(furColor);
        ellipse(x, y - 65, 40, 45);
        fill(skinColor);
        ellipse(x + (dir * 4), y - 65, 24, 28);
        fill(0);
        ellipse(x + (dir * 4) - 6, y - 67, 4, 4);
        ellipse(x + (dir * 4) + 6, y - 67, 4, 4);
    }

    // State Machine for Drawing
    if (isLeft && isRight && !isFalling) {
        // Standing Front (Pressing both keys)
        fill(furColor);
        rect(gameChar_x - 20, gameChar_y - 60, 40, 50, 12);
        drawHead(0, 0);
        rect(gameChar_x - 32, gameChar_y - 55, 14, 45, 7);
        rect(gameChar_x + 18, gameChar_y - 55, 14, 45, 7);
        rect(gameChar_x - 15, gameChar_y - 12, 14, 15, 6);
        rect(gameChar_x + 1, gameChar_y - 12, 14, 15, 6);
    } 
    else if (isLeft && isFalling) {
        // Jumping Left
        fill(furColor);
        rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10);
        drawHead(0, -1);
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
    } 
    else if (isRight && isFalling) {
        // Jumping Right
        fill(furColor);
        rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10);
        drawHead(0, 1);
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
    } 
    else if (isLeft) {
        // Walking Left
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
        drawHead(-4, -1);
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
    } 
    else if (isRight) {
        // Walking Right
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
        drawHead(4, 1);
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
    } 
    else if (isFalling || isPlummeting) {
        // Falling Front
        fill(furColor);
        rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10);
        drawHead(0, 0);
        fill(0);
        ellipse(gameChar_x, gameChar_y - 58, 8, 10); // Mouth/Nose diff?
        rect(gameChar_x - 30, gameChar_y - 65, 12, 40, 6); // Arms Up
        rect(gameChar_x + 18, gameChar_y - 65, 12, 40, 6);
        rect(gameChar_x - 15, gameChar_y - 20, 12, 15, 6);
        rect(gameChar_x + 3, gameChar_y - 20, 12, 15, 6);
    } 
    else {
        // Standing Front (Default)
        fill(furColor);
        rect(gameChar_x - 20, gameChar_y - 60, 40, 50, 12);
        drawHead(0, 0);
        rect(gameChar_x - 32, gameChar_y - 55, 14, 45, 7);
        rect(gameChar_x + 18, gameChar_y - 55, 14, 45, 7);
        rect(gameChar_x - 15, gameChar_y - 12, 14, 15, 6);
        rect(gameChar_x + 1, gameChar_y - 12, 14, 15, 6);
    }
}

function drawCharacterStatusUI() {
    const currentSeason = seasons[currentSeasonIndex] || seasons[0];
    let isNearCave = false;
    
    if (cave) {
        let center = cave.x_pos + cave.width / 2;
        if (abs(gameChar_x - center) < cave.width / 2 + 40 && abs(gameChar_y - floorPos_y) < 40) {
            isNearCave = true;
        }
    }

    if (currentSeason.name === "Winter" && !isHibernating && isNearCave) {
        let x = gameChar_x;
        let y = gameChar_y - 120;
        let message = "i need to sleep";
        
        push();
        textSize(16);
        let padding = 12;
        let bubbleWidth = max(textWidth(message) + padding * 2, 120);
        let bubbleHeight = 50;
        let bubbleX = x - bubbleWidth / 2;
        let bubbleY = y - bubbleHeight;
        
        stroke(40);
        strokeWeight(2);
        fill(255);
        rect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 18);
        triangle(x - 12, bubbleY + bubbleHeight, x - 4, bubbleY + bubbleHeight + 12, x, bubbleY + bubbleHeight);
        triangle(x + 12, bubbleY + bubbleHeight, x + 4, bubbleY + bubbleHeight + 12, x, bubbleY + bubbleHeight);
        
        noStroke();
        fill(30);
        textAlign(LEFT, CENTER);
        text(message, bubbleX + padding, bubbleY + bubbleHeight / 2);
        pop();
    }
}




function keyPressed() {
    // 1. Handle Game Over / Level Complete / Respawn
    if (lives < 1 || (flagpole.isReached && flagpole.height >= 200)) {
        if (keyCode == 32) {
            setup(); // Full Restart
            return;
        }
    }
    
    if (gameChar_y > height) {
        if (keyCode == 32) {
            if (lives > 0) {
                lives -= 1;
                if (lives > 0) {
                    respawnCharacter();
                }
            }
        }
        return; 
    }

    // 2. Handle System Controls
    // 'W' to Hibernate
    if (key === 'W' || key === 'w') {
        toggleHibernation();
        return;
    }

    // 'T' for Next Season
    if (key === 'T' || key === 't') {
        changeSeason(1);
        return;
    }

    // 'R' for Previous Season
    if (key === 'R' || key === 'r') {
        changeSeason(-1);
        return;
    }

    // 3. Handle Movement Controls
    handleMovementInput();
}

function respawnCharacter() {
    // Reset Character Position Only
    gameChar_x = 100;
    gameChar_y = floorPos_y;
    isPlummeting = false;
    isFalling = false;
    isLeft = false;
    isRight = false;
}

function toggleHibernation() {
    // Check proximity to cave
    let isNearCave = false;
    if (cave) {
        let center = cave.x_pos + cave.width / 2;
        if (abs(gameChar_x - center) < cave.width / 2 + 40 && abs(gameChar_y - floorPos_y) < 40) {
            isNearCave = true;
        }
    }

    // Toggle Logic
    let currentSeason = seasons[currentSeasonIndex] || seasons[0];
    
    if (isHibernating) {
        // Wake up manually
        isHibernating = false;
        hibernationTimer = 0;
    } 
    else if (currentSeason.name === "Winter" && isNearCave) {
        // Go to sleep
        isHibernating = true;
        hibernationTimer = 0;
        gameChar_x = cave.x_pos + cave.width / 2;
        gameChar_y = floorPos_y;
    }
}

function changeSeason(direction) {
    // Cycle index forward or backward
    currentSeasonIndex = (currentSeasonIndex + direction + seasons.length) % seasons.length;
    seasonTime = 0;

    // Wake bear if it becomes Summer
    let seasonForCycle = seasons[currentSeasonIndex] || seasons[0];
    if (seasonForCycle.name === "Summer" && isHibernating) {
        isHibernating = false;
        hibernationTimer = 0;
    }
}

function handleMovementInput() {
    if (isPlummeting || isHibernating) { return; }

    // Jump
    if (keyCode == 32) {
        if (!isFalling && !isPlummeting) {
            gameChar_y -= 100;
            createDust(gameChar_x, floorPos_y);
        }
    }

    // Move Left
    if (keyCode == 37 || key == 'a' || key == 'A') {
        isLeft = true;
    }

    // Move Right
    if (keyCode == 39 || key == 'd' || key == 'D') {
        isRight = true;
    }
}

function keyReleased() {
    // Stop moving Left
    if (keyCode == 37 || key == 'a' || key == 'A') {
        isLeft = false;
    }

    // Stop moving Right
    if (keyCode == 39 || key == 'd' || key == 'D') {
        isRight = false;
    }
}

function renderFlagpole() {
    push();
    
    // Pole
    strokeWeight(4);
    stroke(100);
    line(flagpole.x_pos, floorPos_y, flagpole.x_pos, floorPos_y - 250);
    
    // Base
    noStroke();
    fill(80);
    arc(flagpole.x_pos, floorPos_y, 40, 20, PI, TWO_PI);
    
    // Knob at top
    fill(255, 215, 0); // Gold
    ellipse(flagpole.x_pos, floorPos_y - 250, 10, 10);

    // Flag Animation Logic
    if (flagpole.isReached) {
        if (flagpole.height < 200) {
            flagpole.height += 4; // Rise speed
        }
    } else {
        flagpole.height = 0;
    }

    let currentFlagY = floorPos_y - 50 - flagpole.height;
    let waveOffset = flagpole.isReached ? frameCount * 0.1 : 0;

    // Draw Flag (Waving)
    fill(255, 50, 50);
    beginShape();
    vertex(flagpole.x_pos, currentFlagY);
    
    // Create wave effect for the top edge
    for (let i = 0; i <= 60; i += 5) {
        let yWave = sin(waveOffset + i * 0.1) * 5;
        vertex(flagpole.x_pos + i, currentFlagY + yWave + 10);
    }
    
    // Create wave effect for the bottom edge
    for (let i = 60; i >= 0; i -= 5) {
        let yWave = sin(waveOffset + i * 0.1) * 5;
        vertex(flagpole.x_pos + i, currentFlagY + 40 + yWave);
    }
    
    vertex(flagpole.x_pos, currentFlagY + 40);
    endShape(CLOSE);

    pop();
}

function checkFlagpole() {
    var d = abs(gameChar_x - flagpole.x_pos);
    if (d < 15) {
        flagpole.isReached = true;
    }
}

function checkPlayerDie() {
    if (gameChar_y > height) {
        if (lives > 0) {
            // Player has fallen but has lives
            fill(0, 0, 0, 200);
            rect(0, 0, width, height);
            
            textAlign(CENTER, CENTER);
            textSize(30);
            fill(255);
            text("You Died!", width/2, height/2 - 40);
            textSize(20);
            text("Press Space to Continue. Lives remaining: " + (lives - 1), width/2, height/2 + 20);
        }
    }
}

function updateWeather() {
    let currentSeason = seasonSpecs[currentSeasonIndex]; // Use specs directly for weather config
    let w = currentSeason.weather;

    if (w.type === 'none') {
        weatherParticles = [];
        return;
    }

    // 1. Maintain Particle Count
    while (weatherParticles.length < w.density) {
        weatherParticles.push({
            x: random(width),
            y: random(-height, 0), // Spawn above screen
            z: random(0.5, 2),     // Depth scale
            len: random(10, 20)    // Rain length
        });
    }
    
    // Trim excess
    if (weatherParticles.length > w.density) {
        weatherParticles.splice(w.density);
    }

    // 2. Update and Draw
    let c = color(w.color[0], w.color[1], w.color[2]);
    stroke(c);
    fill(c);

    for (let i = 0; i < weatherParticles.length; i++) {
        let p = weatherParticles[i];

        // Update Physics
        p.y += w.speed * p.z;
        p.x += w.wind * p.z;
        
        // Simulating Camera movement effect (Screen space)
        if (isLeft) p.x += 1;
        if (isRight) p.x -= 1;

        // Wrap around
        if (p.y > height) {
            p.y = random(-50, 0);
            p.x = random(width);
        }
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;

        // Draw
        if (w.type === 'rain') {
            strokeWeight(1 * p.z);
            line(p.x, p.y, p.x - w.wind * 2, p.y + p.len * p.z);
        } else if (w.type === 'snow') {
            noStroke();
            let size = 4 * p.z;
            ellipse(p.x, p.y, size, size);
        }
    }
}

function drawFog() {
    let currentSeason = seasonSpecs[currentSeasonIndex];
    let fog = currentSeason.fog;
    
    if (fog && fog.alpha > 0) {
        noStroke();
        fill(fog.color[0], fog.color[1], fog.color[2], fog.alpha);
        rect(0, 0, width, height);
    }
}

function drawHUD() {
    // 1. Draw Lives (Hearts)
    for (let i = 0; i < lives; i++) {
        let x = 30 + i * 40;
        let y = 40;
        fill(255, 50, 50);
        noStroke();
        beginShape();
        vertex(x, y);
        bezierVertex(x - 15, y - 15, x - 30, y + 10, x, y + 25);
        bezierVertex(x + 30, y + 10, x + 15, y - 15, x, y);
        endShape(CLOSE);
        
        // Shine
        fill(255, 150, 150);
        ellipse(x - 8, y - 5, 6, 6);
    }

    // 2. Draw Score
    fill(255, 215, 0);
    stroke(0);
    strokeWeight(3);
    textSize(24);
    textAlign(LEFT, TOP);
    text("Coins: " + game_score + " / " + totalCollectables, 20, 70);
    noStroke();
    
    // 3. Draw Tutorial (Fading)
    if (tutorialAlpha > 0) {
        fill(255, 255, 255, tutorialAlpha);
        stroke(0, tutorialAlpha);
        strokeWeight(4);
        textAlign(CENTER, CENTER);
        textSize(40);
        text("ARROWS / WASD to Move", width / 2, height / 2 - 100);
        text("SPACE to Jump", width / 2, height / 2 - 50);
        noStroke();
        
        // Fade out if moving
        if (isLeft || isRight || isFalling) {
            tutorialAlpha -= 2;
        }
    }
}

function createDust(x, y) {
    for (let i = 0; i < 5; i++) {
        dustParticles.push({
            x: x + random(-10, 10),
            y: y + random(-5, 5),
            size: random(5, 10),
            alpha: 200,
            vx: random(-1, 1),
            vy: random(-0.5, -2)
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
        p.size *= 0.95;
        
        fill(200, 200, 200, p.alpha);
        ellipse(p.x, p.y, p.size);
        
        if (p.alpha <= 0) {
            dustParticles.splice(i, 1);
        }
    }
}
