var gameChar_x;
var gameChar_y;
var floorPos_y;

var trees = [];
var mountains = []; 
var clouds = [];

var collectable;
var canyon;
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

// Day/night cycle variables
var timeOfDay = 0; // 0 to 1440 (represents minutes in a day)
var cycleSpeed = 1; // How fast time passes

const seasonSpecs = [
    {name: "Spring", sky: [170, 220, 255], ground: [150, 215, 165], grass: [60, 190, 100], leaf: [120, 200, 140], leafStyle: "bloom"},
    {name: "Summer", sky: [190, 230, 255], ground: [130, 200, 140], grass: [40, 160, 70], leaf: [90, 190, 120], leafStyle: "lush"},
    {name: "Autumn", sky: [220, 180, 170], ground: [180, 140, 90], grass: [140, 120, 60], leaf: [200, 120, 80], leafStyle: "crisp"},
    {name: "Winter", sky: [160, 190, 220], ground: [200, 210, 230], grass: [200, 210, 230], leaf: [200, 220, 240], leafStyle: "bare"}
];
var seasons = [];
var currentSeasonIndex = 0;
var seasonTime = 0;
const SEASON_DURATION = 720;

function setup() {
    createCanvas(windowWidth, windowHeight);

    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    furColor = color(70, 45, 20);
    skinColor = color(180, 140, 110);

    floorPos_y = 450;
    gameChar_x = 100;
    gameChar_y = floorPos_y;

    collectable = {x_pos: ORIGINAL_WIDTH / 2, y_pos: floorPos_y - 20, size: 50, isFound: false};

    canyon = {x_pos: 700, width: 100};
    generateCave();

    seasons = seasonSpecs.map((spec) => ({
        name: spec.name,
        sky: color(...spec.sky),
        ground: color(...spec.ground),
        grass: color(...spec.grass),
        leaf: color(...spec.leaf)
    }));

    generateTrees();
    generateMountains(); 
    generateClouds();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    let scaleX = width / ORIGINAL_WIDTH;
    let scaleY = height / ORIGINAL_HEIGHT;

    // Update time of day cycle
    timeOfDay += cycleSpeed;
    if (timeOfDay >= 1440) { // Reset after 24 hours (1440 minutes)
        timeOfDay = 0;
    }
    if (isHibernating) {
        hibernationTimer += 1;
        if (hibernationTimer >= HIBERNATION_DURATION) {
            isHibernating = false;
            hibernationTimer = 0;
        }
    }
    seasonTime += cycleSpeed;
    if (seasonTime >= SEASON_DURATION) {
        seasonTime -= SEASON_DURATION;
        cycleSeason(1, false);
    }

    const currentSeason = getCurrentSeason();

    drawSky();
    drawSeasonLabel();

    push();
    scale(scaleX, scaleY);

    var cameraPosX = gameChar_x - ORIGINAL_WIDTH / 2;

    translate(-cameraPosX, 0);
    noStroke();

    drawMountains(); 
    drawGround();    
    drawCave(cave.x_pos, floorPos_y, cave.width, cave.height);
    if (isHibernating) {
        drawSleepingFrame(cave);
    }
    drawClouds();
    drawTrees();
    drawCanyon(canyon.x_pos, floorPos_y, canyon.width, ORIGINAL_HEIGHT - floorPos_y);

    checkCanyon();
    checkCollectable();
    
    if (gameChar_y < ORIGINAL_HEIGHT + 100) {
        handleMovement();
    }

    if (!isHibernating) {
        renderGameChar();
    }
    updatePhysics();

    if (currentSeason.name === "Winter" && !isHibernating && isNearCaveEntrance()) {
        drawThoughtBubble(gameChar_x, gameChar_y - 120, "i need to sleep");
    }

    pop(); 

    if (gameChar_y > ORIGINAL_HEIGHT) {
        fill(40, 0, 0, 200);
        rect(0, 0, width, height);
        
        fill(0, 0, 0, 220);
        stroke(200, 0, 0);
        strokeWeight(4);
        rectMode(CENTER);
        rect(width / 2, height / 2, 400, 200, 20);
        rectMode(CORNER);
        
        textAlign(CENTER, CENTER);
        textSize(50);
        textStyle(BOLD);
        
        noStroke();
        fill(0, 0, 0); 
        text("GAME OVER", width / 2 + 3, height / 2 - 20 + 3);
        
        fill(255, 50, 50);
        text("GAME OVER", width / 2, height / 2 - 20);
        
        textSize(20);
        textStyle(NORMAL);
        fill(255);
        
        if (frameCount % 60 < 40) {
            text("Press SPACE to Respawn", width / 2, height / 2 + 50);
        }
    }

    coinAngle += 0.05;
}

function generateMountains() {
    mountains = [];
    for (var i = 0; i < 15; i++) {
        var tw = random(200, 500); 
        var th = random(200, 450);
        
        var tx = random(-2000, 3000 - tw); 
        
        var tc = random(80, 180); 
        
        mountains.push({x: tx, width: tw, height: th, color: tc});
    }
}

function generateClouds() {
    clouds = [];

    for (let i = 0; i < 14; i++) {
        let cx = random(-2000, 3000);
        let cy = random(60, 180);
        let speed = random(0.2, 1.2);
       
        let col = color(random(220, 255), random(220, 255), random(230, 255), random(180, 230));

        clouds.push({x: cx, y: cy, speed: speed, color: col});
    }
}

function generateCave() {
    let cx = random(-1500, 2500);
    let cw = random(220, 320);
    let ch = random(160, 220);
    cave = {x_pos: cx, width: cw, height: ch};
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

            if (tx > canyon.x_pos - 80 && tx < canyon.x_pos + canyon.width + 80) {
                validPosition = false;
            }

            if (cave) {
                let caveCenter = cave.x_pos + cave.width / 2;
                if (abs(tx - caveCenter) < cave.width / 2 + CAVE_CLEARANCE) {
                    validPosition = false;
                }
            }
            
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
            let seasonStyle = getCurrentSeason().leafStyle;
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

function drawMountains() {
    for (var i = 0; i < mountains.length; i++) {
        var m = mountains[i];
        drawMountain(m);
    }
}

function drawMountain(m) {
    let x = m.x;
    let y = floorPos_y;
    let w = m.width;
    let h = m.height;
    let c = m.color; 

    let peakX = x + w / 2;
    let peakY = y - h;

    noStroke();
    fill(c - 40); 
    triangle(x, y, peakX, peakY, peakX, y);

    fill(c); 
    triangle(peakX, y, peakX, peakY, x + w, y);

    let capScale = 0.2; 
    let capH = h * capScale;
    let capW = w * capScale; 
    let capBottomY = peakY + capH;
    
    fill(210, 210, 220); 
    triangle(peakX, peakY, peakX - capW / 2, capBottomY, peakX, capBottomY);
    
    fill(255, 255, 255); 
    triangle(peakX, peakY, peakX + capW / 2, capBottomY, peakX, capBottomY);
}

function drawTrees() {
    const season = getCurrentSeason();
    for (var i = 0; i < trees.length; i++) {
        var t = trees[i];
        fill(0, 50);
        ellipse(t.x + t.trunkW / 2, t.y, t.trunkW * 1.5, 10);

        let trunkColor = season.name === "Winter" ? color(90, 60, 40) : color(100, 50, 10);
        fill(trunkColor);
        rect(t.x, t.y - t.trunkH, t.trunkW, t.trunkH);

        switch (season.name) {
            case "Spring":
                drawSpringTree(t, season);
                break;
            case "Summer":
                drawSummerTree(t, season);
                break;
            case "Autumn":
                drawAutumnTree(t, season);
                break;
            case "Winter":
                drawWinterTree(t, season);
                break;
            default:
                drawSpringTree(t, season);
                break;
        }
    }
}

function drawSpringTree(tree, season) {
    let cx = tree.x + tree.trunkW / 2;
    let baseY = tree.y;
    let leafShade = lerpColor(tree.leafColor, season.leaf, 0.45);
    let canopy = tree.canopySize;

    fill(leafShade);
    ellipse(cx, baseY - tree.trunkH * 0.8, canopy, canopy * 0.8);

    let highlight = color(
        min(red(leafShade) + 20, 255),
        min(green(leafShade) + 20, 255),
        min(blue(leafShade) + 20, 255)
    );
    fill(highlight);
    ellipse(cx - 20, baseY - tree.trunkH, canopy * 0.7, canopy * 0.7);
    ellipse(cx + 20, baseY - tree.trunkH, canopy * 0.7, canopy * 0.7);

    fill(leafShade);
    ellipse(cx, baseY - tree.trunkH * 1.2, canopy * 0.6, canopy * 0.6);
}

function drawLeafCanopy(tree, primaryColor, highlightColor, sizeScale = 1) {
    let cx = tree.x + tree.trunkW / 2;
    let baseY = tree.y;
    let canopy = tree.canopySize * sizeScale;

    fill(primaryColor);
    ellipse(cx, baseY - tree.trunkH * 0.75, canopy, canopy * 0.6);

    fill(highlightColor);
    ellipse(cx - 12, baseY - tree.trunkH * 0.95, canopy * 0.45, canopy * 0.45);
    ellipse(cx + 12, baseY - tree.trunkH * 0.95, canopy * 0.45, canopy * 0.45);

    fill(primaryColor);
    ellipse(cx, baseY - tree.trunkH * 1.12, canopy * 0.35, canopy * 0.35);
}

function drawSeasonalCanopy(tree, baseColor, highlightColor, sizeScale = 0.8) {
    let cx = tree.x + tree.trunkW / 2;
    let baseY = tree.y;
    let canopy = tree.canopySize * sizeScale;

    fill(baseColor);
    ellipse(cx, baseY - tree.trunkH * 0.8, canopy, canopy * 0.7);
    fill(highlightColor);
    ellipse(cx - 22, baseY - tree.trunkH * 0.95, canopy * 0.6, canopy * 0.6);
    ellipse(cx + 22, baseY - tree.trunkH * 0.95, canopy * 0.6, canopy * 0.6);
    fill(baseColor);
    ellipse(cx, baseY - tree.trunkH * 1.2, canopy * 0.5, canopy * 0.5);
}

function drawSummerTree(tree, season) {
    let baseColor = lerpColor(tree.leafColor, color(210, 200, 150), 0.55);
    let highlight = lerpColor(baseColor, color(255), 0.3);
    drawSeasonalCanopy(tree, baseColor, highlight, 0.75);
}

function drawAutumnTree(tree, season) {
    let baseColor = lerpColor(tree.leafColor, color(190, 110, 60), 0.7);
    let highlight = lerpColor(baseColor, color(255, 160, 80), 0.5);
    drawSeasonalCanopy(tree, baseColor, highlight);

    noStroke();
    for (let i = 0; i < 3; i++) {
        let drop = (frameCount * 0.4 + tree.particlePhase * 30 + i * 25) % 60;
        let xOffset = cos(frameCount * 0.02 + tree.particlePhase + i) * 25;
        fill(lerpColor(baseColor, color(220, 140, 60), 0.3), 200);
        ellipse(tree.x + tree.trunkW / 2 + xOffset, tree.y + drop * 0.8 - 20, 6, 4);
    }
}

function drawWinterTree(tree, season) {
    let cx = tree.x + tree.trunkW / 2;
    let baseY = tree.y - tree.trunkH;

    stroke(170, 150, 120);
    strokeWeight(3);
    line(cx, baseY, cx - 15, baseY - 30);
    line(cx, baseY, cx + 15, baseY - 35);
    line(cx - 5, baseY - 15, cx - 30, baseY - 45);
    line(cx + 5, baseY - 15, cx + 30, baseY - 50);
    noStroke();
}

function handleMovement() {
    if (isHibernating) {
        return;
    }
    isLeft = false;
    isRight = false;

    if (isPlummeting == false) {
        if (keyIsDown(37) || keyIsDown(65)) {
            gameChar_x -= 5;
            isLeft = true;
        }
        if (keyIsDown(39) || keyIsDown(68)) {
            gameChar_x += 5;
            isRight = true;
        }
    }
}

function updatePhysics() {
    if (isHibernating) {
        return;
    }
    if (gameChar_y < floorPos_y) {
        gameChar_y += 2;
        isFalling = true;
    } 
    else {
        isFalling = false;
    }

    if(gameChar_x < -2000 || gameChar_x > 3000) {
        isPlummeting = true;
    }

    if (isPlummeting == true) {
        gameChar_y += 5; 
    }
}

function checkCanyon() {
    if (gameChar_x > canyon.x_pos && gameChar_x < canyon.x_pos + canyon.width && gameChar_y >= floorPos_y) {
        isPlummeting = true;
    }
}

function checkCollectable() {
    if (collectable.isFound == false) {
        drawCoin(collectable.x_pos, collectable.y_pos);

        if (dist(gameChar_x, gameChar_y, collectable.x_pos, collectable.y_pos) < 50) {
            collectable.isFound = true;
            console.log("Coin Collected!");
        }
    }
}

function keyPressed() {
    const season = getCurrentSeason();
    if (key === 'W' || key === 'w') {
        if (isHibernating) {
            isHibernating = false;
            hibernationTimer = 0;
        } else if (season.name === "Winter" && isNearCaveEntrance()) {
            isHibernating = true;
            hibernationTimer = 0;
            gameChar_x = cave.x_pos + cave.width / 2;
            gameChar_y = floorPos_y;
        }
        return;
    }
    if (key === 'T' || key === 't') {
        cycleSeason(1);
        return;
    }
    if (key === 'R' || key === 'r') {
        cycleSeason(-1);
        return;
    }
    if (gameChar_y > ORIGINAL_HEIGHT) {
        if (keyCode == 32) { 
            gameChar_x = 100;
            gameChar_y = floorPos_y;
            isPlummeting = false;
            isFalling = false;
            isLeft = false;
            isRight = false;
            generateTrees();
            generateMountains(); 
        }
        return; 
    }

    if (isPlummeting) { return; }

    if (keyCode == 32) {
        if (!isFalling && !isPlummeting) {
            gameChar_y -= 100;
        }
    }
}

function renderGameChar() {
    if (isLeft && isFalling) {
        fill(furColor);
        rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10);

        drawBigfootHead(gameChar_x, gameChar_y, -1);
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
        fill(furColor);
        rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10);
        drawBigfootHead(gameChar_x, gameChar_y, 1);
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

        drawBigfootHead(gameChar_x - 4, gameChar_y, -1);

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

        drawBigfootHead(gameChar_x + 4, gameChar_y, 1);

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
        fill(furColor);
        rect(gameChar_x - 18, gameChar_y - 60, 36, 45, 10);

        drawBigfootHead(gameChar_x, gameChar_y, 0);

        fill(0);
        ellipse(gameChar_x, gameChar_y - 58, 8, 10);
        rect(gameChar_x - 30, gameChar_y - 65, 12, 40, 6);
        rect(gameChar_x + 18, gameChar_y - 65, 12, 40, 6);
        rect(gameChar_x - 15, gameChar_y - 20, 12, 15, 6);
        rect(gameChar_x + 3, gameChar_y - 20, 12, 15, 6);
    } 
    else {
        fill(furColor);
        rect(gameChar_x - 20, gameChar_y - 60, 40, 50, 12);

        drawBigfootHead(gameChar_x, gameChar_y, 0);

        rect(gameChar_x - 32, gameChar_y - 55, 14, 45, 7);
        rect(gameChar_x + 18, gameChar_y - 55, 14, 45, 7);
        rect(gameChar_x - 15, gameChar_y - 12, 14, 15, 6);
        rect(gameChar_x + 1, gameChar_y - 12, 14, 15, 6);
    }
}

function drawBigfootHead(x, y, dir) {
    fill(furColor);
    ellipse(x, y - 65, 40, 45);

    fill(skinColor);
    ellipse(x + (dir * 4), y - 65, 24, 28);

    fill(0);
    ellipse(x + (dir * 4) - 6, y - 67, 4, 4);
    ellipse(x + (dir * 4) + 6, y - 67, 4, 4);
}

function drawGround() {
    noStroke();
    const season = getCurrentSeason();
    fill(lerpColor(color(139, 69, 19), season.ground, 0.45)); 
    rect(-2000, floorPos_y, ORIGINAL_WIDTH + 4000, ORIGINAL_HEIGHT / 2);

    fill(lerpColor(color(34, 139, 34), season.grass, 0.55)); 
    rect(-2000, floorPos_y, ORIGINAL_WIDTH + 4000, 20); 

    fill(season.grass.levels ? color(season.grass.levels[0], season.grass.levels[1], season.grass.levels[2], 120) : color(20, 80, 20, 100));
    rect(-2000, floorPos_y + 20, ORIGINAL_WIDTH + 4000, 5);
}

function drawClouds() {
    for (let i = 0; i < clouds.length; i++) {
        let c = clouds[i];
        drawCloud(c.x, c.y, c.color);

        c.x += c.speed;

        if (c.x > 4000) {
            c.x = -800 - random(0, 600);
            c.y = random(60, 180);
            c.speed = random(0.2, 1.2);
        }
    }
}


function drawCloud(x, y, col) {
    noStroke();
    if (col === undefined) {
        col = color(255, 255, 255, 200);
    }

    fill(col);
    ellipse(x, y, 80, 60);
    ellipse(x + 40, y, 100, 70);
    ellipse(x + 80, y, 80, 60);

    let hr = constrain(red(col) + 10, 0, 255);
    let hg = constrain(green(col) + 10, 0, 255);
    let hb = constrain(blue(col) + 10, 0, 255);
    fill(hr, hg, hb, 140);
    ellipse(x + 30, y - 10, 50, 40);
}

function drawCoin(x, y) {
    push();
    translate(x, y);
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

function drawCanyon(x, y, w, h) {
    noStroke();
    fill(40, 20, 10);
    rect(x, y, w, h);
    fill(80, 45, 20);

    beginShape();

    vertex(x, y);
    vertex(x + 20, y + h);
    vertex(x, y + h);
    endShape(CLOSE);

    fill(60, 30, 10);
    beginShape();
    vertex(x + w, y);
    vertex(x + w - 20, y + h);
    vertex(x + w, y + h);
    endShape(CLOSE);

    fill(30, 10, 5);
    triangle(x + w / 2 - 10, y + h, x + w / 2 + 10, y + h, x + w / 2, y + h - 30);
}

function drawCave(x, y, w, h) {
    if (!cave) { return; }
    let topY = y - h;
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
}

function drawSky() {
    const season = getCurrentSeason();
    let c1, c2;
    let sunMoonSize = 80;
    let starCount = 0;
    const overlays = [];

    let sunProgress = map(constrain(timeOfDay, 240, 1140), 240, 1140, 0, 1);
    let sunX = map(sunProgress, 0, 1, -100, width + 100);
    let sunY = 150 - sin(sunProgress * PI) * 120;

    let moonCycleTime = timeOfDay < 240 ? timeOfDay + 1440 : timeOfDay;
    let moonProgress = map(constrain(moonCycleTime, 1140, 1680), 1140, 1680, 0, 1);
    let moonX = map(moonProgress, 0, 1, width + 100, -100);
    let moonY = 150 - sin(moonProgress * PI) * 120;
    
    if (timeOfDay < 240) {
        let t = map(timeOfDay, 0, 240, 0, 1);
        c1 = lerpColor(color(10, 10, 40), color(15, 15, 50), t);
        c2 = lerpColor(color(20, 20, 60), color(25, 25, 70), t);
        starCount = 200;
        overlays.push(() => renderMoon(moonX, moonY, sunMoonSize, 120, 255, 200));
    } else if (timeOfDay < 420) {
        let t = map(timeOfDay, 240, 420, 0, 1);
        c1 = lerpColor(color(15, 15, 50), color(255, 150, 100), t);
        c2 = lerpColor(color(25, 25, 70), color(135, 206, 250), t);
        if (t < 0.5) {
            let moonFade = (1 - t * 2);
            starCount = int(moonFade * 200);
            overlays.push(() => renderMoon(moonX, moonY, sunMoonSize, 120 * moonFade, 255 * moonFade, 200 * moonFade));
        } else {
            let sunGrow = (t - 0.5) * 2;
            overlays.push(() => renderSun(sunX, sunY, sunMoonSize, 200 * sunGrow, 180 * sunGrow, 255 * sunGrow));
        }
    } else if (timeOfDay < 900) {
        let t = map(timeOfDay, 420, 900, 0, 1);
        c1 = lerpColor(color(135, 206, 250), color(100, 150, 255), t);
        c2 = lerpColor(color(200, 230, 255), color(180, 220, 255), t);
        overlays.push(() => renderSun(sunX, sunY, sunMoonSize));
    } else if (timeOfDay < 1140) {
        let t = map(timeOfDay, 900, 1140, 0, 1);
        c1 = lerpColor(color(100, 150, 255), color(180, 80, 120), t);
        c2 = lerpColor(color(180, 220, 255), color(50, 30, 80), t);
        let sunFade = max(0, 1 - t / 0.7);
        if (sunFade > 0) {
            overlays.push(() => renderSun(sunX, sunY, sunMoonSize, 200 * sunFade, 160 * sunFade, 255 * sunFade));
        }
        if (t >= 0.7) {
            starCount = int(((t - 0.7) / 0.3) * 100);
        }
    } else {
        let t = map(timeOfDay, 1140, 1440, 0, 1);
        c1 = lerpColor(color(180, 80, 120), color(10, 10, 40), t);
        c2 = lerpColor(color(50, 30, 80), color(20, 20, 60), t);
        starCount = int(t * 200 + 50);
        overlays.push(() => renderMoon(moonX, moonY, sunMoonSize, 130, 255, 220));
    }
    
    noFill();
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(c1, c2, inter);
        c = lerpColor(c, season.sky, 0.25);
        stroke(c);
        line(0, y, width, y);
    }

    if (starCount > 0) {
        drawStars(starCount);
    }

    overlays.forEach(fn => fn());
}

function drawSeasonLabel() {
    const season = getCurrentSeason();
    push();
    fill(255);
    stroke(0);
    strokeWeight(3);
    textSize(18);
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    text(`Season: ${season.name} (T/R to cycle)`, 18, 18);
    pop();
}

function drawSleepingFrame(cave) {
    if (!cave) {
        return;
    }
    push();
    let centerX = cave.x_pos + cave.width / 2;
    let floorY = floorPos_y - 5;

    fill(furColor);
    rect(centerX - 35, floorY - 15, 70, 20, 8);

    fill(skinColor);
    ellipse(centerX - 32, floorY - 18, 20, 18);

    fill(0);
    ellipse(centerX - 38, floorY - 20, 3, 3);
    ellipse(centerX - 28, floorY - 20, 3, 3);

    fill(furColor);
    rect(centerX - 38, floorY - 5, 8, 12, 4);
    rect(centerX + 30, floorY - 5, 8, 12, 4);

    fill(0);
    textSize(18);
    textAlign(CENTER, CENTER);
    text("Zzz", centerX + 18, floorY - 25);
    text("Zzz", centerX + 18, floorY - 15);
    pop();
}

function drawThoughtBubble(x, y, message) {
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

function isNearCaveEntrance() {
    if (!cave) { return false; }
    let center = cave.x_pos + cave.width / 2;
    return abs(gameChar_x - center) < cave.width / 2 + 40 && abs(gameChar_y - floorPos_y) < 40;
}

function cycleSeason(delta, resetTimer = true) {
    currentSeasonIndex = (currentSeasonIndex + delta + seasons.length) % seasons.length;
    if (resetTimer) {
        seasonTime = 0;
    }
    const season = getCurrentSeason();
    if (season.name === "Summer" && isHibernating) {
        isHibernating = false;
        hibernationTimer = 0;
    }
}

function getCurrentSeason() {
    return seasons[currentSeasonIndex] || seasons[0] || {name: "Default", sky: color(200, 230, 255), ground: color(150, 220, 140), grass: color(40, 160, 70), leaf: color(120, 200, 130)};
}

function drawStars(numStars) {
    randomSeed(42);
    noStroke();
    for (let i = 0; i < numStars; i++) {
        let sx = random(width);
        let sy = random(height * 0.6);
        let twinkle = sin(frameCount * 0.05 + i) * 0.5 + 0.5;
        fill(255, 255, 255, 150 + twinkle * 100);
        ellipse(sx, sy, 2, 2);
    }
    randomSeed(millis());
}

function renderSun(x, y, size, glowAlpha = 200, rimAlpha = 150, coreAlpha = 255, glowExtra = 60, rimExtra = 40) {
    noStroke();
    fill(255, 255, 0, glowAlpha);
    ellipse(x, y, size + glowExtra, size + glowExtra);
    fill(255, 255, 0, rimAlpha);
    ellipse(x, y, size + rimExtra, size + rimExtra);
    fill(255, 255, 0, coreAlpha);
    ellipse(x, y, size, size);
}

function renderMoon(x, y, size, glowAlpha = 120, coreAlpha = 255, craterAlpha = 200) {
    noStroke();
    fill(220, 220, 235, glowAlpha);
    ellipse(x, y, size + 30, size + 30);
    fill(240, 240, 255, coreAlpha);
    ellipse(x, y, size, size);
    fill(230, 230, 245, craterAlpha);
    ellipse(x - 12, y - 6, size * 0.25, size * 0.25);
    ellipse(x + 8, y + 5, size * 0.2, size * 0.2);
}