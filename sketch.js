var gameChar_x;
var gameChar_y;
var floorPos_y;

var trees = [];
var mountains = []; 

var collectable;
var canyon;

var isLeft = false;
var isRight = false;
var isFalling = false;
var isPlummeting = false;

let coinAngle = 0;

const ORIGINAL_WIDTH = 1000;
const ORIGINAL_HEIGHT = 600;

var furColor;
var skinColor;

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

    generateTrees();
    generateMountains(); 
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    let scaleX = width / ORIGINAL_WIDTH;
    let scaleY = height / ORIGINAL_HEIGHT;

    drawSky();

    push();
    scale(scaleX, scaleY);

    var cameraPosX = gameChar_x - ORIGINAL_WIDTH / 2;

    translate(-cameraPosX, 0);
    noStroke();

    drawMountains(); 
    drawGround();    
    drawClouds();
    drawTrees();
    drawCanyon(canyon.x_pos, floorPos_y, canyon.width, ORIGINAL_HEIGHT - floorPos_y);

    checkCanyon();
    checkCollectable();
    
    if (gameChar_y < ORIGINAL_HEIGHT + 100) {
        handleMovement();
    }

    renderGameChar();
    updatePhysics();

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

function generateTrees() {
    trees = [];

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
            trees.push({
                x: tx, 
                y: floorPos_y, 
                trunkW: random(30, 50), 
                trunkH: random(90, 160), 
                canopySize: random(110, 160), 
                leafColor: color(random(20, 60), random(100, 180), random(20, 60))
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
    for (var i = 0; i < trees.length; i++) {
        var t = trees[i];
        fill(0, 50);
        ellipse(t.x + t.trunkW / 2, t.y, t.trunkW * 1.5, 10);

        fill(100, 50, 10);
        rect(t.x, t.y - t.trunkH, t.trunkW, t.trunkH);

        fill(t.leafColor);
        ellipse(t.x + t.trunkW / 2, t.y - t.trunkH * 0.8, t.canopySize, t.canopySize * 0.8);

        fill(red(t.leafColor) + 20, green(t.leafColor) + 20, blue(t.leafColor) + 20);
        ellipse(t.x + t.trunkW / 2 - 20, t.y - t.trunkH, t.canopySize * 0.7, t.canopySize * 0.7);
        ellipse(t.x + t.trunkW / 2 + 20, t.y - t.trunkH, t.canopySize * 0.7, t.canopySize * 0.7);

        fill(t.leafColor);
        ellipse(t.x + t.trunkW / 2, t.y - t.trunkH * 1.2, t.canopySize * 0.6, t.canopySize * 0.6);
    }
}

function handleMovement() {
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

    if (keyCode == 32 || keyCode == 87) {
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
    
    fill(139, 69, 19); 
    rect(-2000, floorPos_y, ORIGINAL_WIDTH + 4000, ORIGINAL_HEIGHT / 2);

    fill(34, 139, 34); 
    rect(-2000, floorPos_y, ORIGINAL_WIDTH + 4000, 20); 

    fill(20, 80, 20, 100);
    rect(-2000, floorPos_y + 20, ORIGINAL_WIDTH + 4000, 5);
}

function drawClouds() {
    drawCloud(-450, 90);
    drawCloud(-200, 120);
    drawCloud(150, 100);
    drawCloud(300, 150);
    drawCloud(450, 70);
    drawCloud(600, 120);
    drawCloud(800, 80);
    drawCloud(1100, 140);
    drawCloud(1400, 100);
}


function drawCloud(x, y) {
    noStroke();
    fill(255, 255, 255, 200); 
    ellipse(x, y, 80, 60);
    ellipse(x + 40, y, 100, 70);
    ellipse(x + 80, y, 80, 60);
    
    fill(255, 255, 255, 100); 
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

function drawSky() {
    let c1 = color(100, 150, 255); 
    let c2 = color(200, 230, 255);
    
    noFill();
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(c1, c2, inter);
        stroke(c);
        line(0, y, width, y);
    }

    noStroke();
    fill(255, 255, 0, 100); 
    ellipse(width - 150, 100, 140, 140);
    fill(255, 255, 0, 150); 
    ellipse(width - 150, 100, 120, 120); 
    fill(255, 255, 0);      
    ellipse(width - 150, 100, 80, 80);   
}