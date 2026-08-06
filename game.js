const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const jumpSound = new Audio("assets/jump.wav");
const hitSound = new Audio("assets/hit.wav");
const scoreSound = new Audio("assets/score.wav");

let floatingTexts = [];

let scoreScale = 1;

let restartAnim = 0;

let shake = 0;

let particles = [];

let animationId;

let hasPlayedHit = false;

let highScore = localStorage.getItem("highScore") || 0;

let gameStarted = false;

let bgX1 = 0;
let bgX2 = canvas.width;
let bgSpeed = 1;

const restartBtn = document.getElementById("restartBtn");

const bgMusic = new Audio("assets/bg.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;

// IMAGES
const dragonImg = new Image();
dragonImg.src = "assets/dragon.png";

const bgImg = new Image();
bgImg.src = "assets/BG.png";

let dragon = {
    x: 80,
    y: 200,
    width: 65,
    height: 65,
    velocity: 0
};

let gravity = 0.5;
let jumpPower = -8;

let pipes = [];
let pipeWidth = 60;
let pipeGap = 160;
let pipeSpeed = 2;

let score = 0;
let gameOver = false;


// DRAW BACKGROUND
function drawBackground() {

    ctx.drawImage(bgImg, bgX1, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, bgX2, 0, canvas.width, canvas.height);

}


// DRAW DRAGON
function drawDragon() {

    ctx.save();

    let rotation = dragon.velocity * 0.05;

    ctx.translate(
        dragon.x + dragon.width / 2,
        dragon.y + dragon.height / 2
    );

    ctx.rotate(rotation);

    ctx.drawImage(
        dragonImg,
        -dragon.width / 2,
        -dragon.height / 2,
        dragon.width,
        dragon.height
    );

    ctx.restore();

}


// CREATE PIPE
function createPipe() {

    let topHeight = Math.random() * 250 + 50;

    pipes.push({
        x: canvas.width,
        top: topHeight,
        bottom: topHeight + pipeGap,
        passed: false
    });

    if (Math.random() < 0.5) {
        pipes[pipes.length - 1].coin = {
            x: canvas.width + pipeWidth / 2,
            y: topHeight + pipeGap / 2,
            collected: false
        };
    }

}


// DRAW PIPES
function drawPipes() {


    pipes.forEach(pipe => {

        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#00ff99");
        gradient.addColorStop(1, "#006644");

        ctx.fillStyle = gradient;

        // TOP
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);

        // BOTTOM
        ctx.fillRect(
            pipe.x,
            pipe.bottom,
            pipeWidth,
            canvas.height - pipe.bottom
        );

        // Glow effect
        ctx.shadowColor = "#00ff99";
        ctx.shadowBlur = 15;

        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(
            pipe.x,
            pipe.bottom,
            pipeWidth,
            canvas.height - pipe.bottom
        );

        ctx.shadowBlur = 0; // reset
    });

}

function drawCoins() {

    pipes.forEach(pipe => {

        if (pipe.coin && !pipe.coin.collected) {

            // 🔥 glow
            ctx.shadowColor = "gold";
            ctx.shadowBlur = 15;

            // 🟡 coin
            ctx.fillStyle = "gold";
            ctx.beginPath();
            ctx.arc(pipe.coin.x, pipe.coin.y, 8, 0, Math.PI * 2);
            ctx.fill();

            // ✨ inner shine
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.beginPath();
            ctx.arc(pipe.coin.x - 2, pipe.coin.y - 2, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0; // reset
        }

    });

}

function drawFloatingTexts() {

    floatingTexts.forEach((f, index) => {

        f.y -= 1;          // move up
        f.alpha -= 0.02;   // fade

        ctx.fillStyle = "rgba(0,0,0," + f.alpha + ")";
        ctx.font = "20px Arial";
        ctx.fillText(f.text, f.x, f.y);

        // remove when invisible
        if (f.alpha <= 0) {
            floatingTexts.splice(index, 1);
        }

    });

}

// UPDATE PIPES
function updatePipes() {

    pipes.forEach(pipe => {

        if (pipe.coin) {
            pipe.coin.x -= pipeSpeed;
        }

        pipe.x -= pipeSpeed;

        if (!pipe.passed && pipe.x + pipeWidth < dragon.x) {
            score++;
            pipe.passed = true;   // ✅ IMPORTANT
            scoreScale = 1.3;
            scoreSound.currentTime = 0;
            scoreSound.play();

            // ✅ Difficulty scaling (safe place)
            if (score % 5 === 0 && pipeSpeed < 6) {
                pipeSpeed += 0.2;
            }
        }

        if (
            dragon.x < pipe.x + pipeWidth &&
            dragon.x + dragon.width > pipe.x &&
            (dragon.y < pipe.top || dragon.y + dragon.height > pipe.bottom)
        ) {
            if (!gameOver) {
                gameOver = true;
                shake = 10;
            }
        }

        // 🟡 ✅ ADD COIN COLLISION HERE
        if (pipe.coin && !pipe.coin.collected) {
            if (
                dragon.x < pipe.coin.x + 10 &&
                dragon.x + dragon.width > pipe.coin.x - 10 &&
                dragon.y < pipe.coin.y + 10 &&
                dragon.y + dragon.height > pipe.coin.y - 10
            ) {
                pipe.coin.collected = true;
                score += 1;

                scoreSound.play(); // or new coinSound
                scoreScale = 1.5;

                floatingTexts.push({
                    x: pipe.coin.x,
                    y: pipe.coin.y,
                    text: "+2",
                    alpha: 1
                }
                )
            }
        }

        pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    });

}

function updateBackground() {

    bgX1 -= bgSpeed;
    bgX2 -= bgSpeed;

    if (bgX1 <= -canvas.width) {
        bgX1 = bgX2 + canvas.width;
    }
    if (bgX2 <= -canvas.width) {
        bgX2 = bgX1 + canvas.width;
    }

}



// DRAW SCORE
function drawScore() {

    // update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }

    // 🎯 SCORE POP EFFECT
    ctx.save();

    ctx.translate(70, 30); // anchor position
    ctx.scale(scoreScale, scoreScale);

    ctx.fillStyle = "black";
    ctx.font = "24px Arial";
    ctx.fillText("Score: " + score, -60, 0);

    ctx.restore();

    // 🟡 HIGH SCORE (no animation)
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("High: " + highScore, 10, 60);

    // smooth scale back to normal
    scoreScale += (1 - scoreScale) * 0.1;
}

function drawRestartButton() {

    let x = canvas.width / 2 - 80;
    let y = canvas.height / 2 + 40;
    let w = 140;
    let h = 50;

    ctx.fillStyle = "#222";
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Restart", x + 35, y + 30);
}

function createParticles() {
    particles.push({
        x: dragon.x,
        y: dragon.y + dragon.height / 2,
        size: Math.random() * 6 + 4,
        speedX: Math.random() * -2 - 1,
        alpha: 1
    });
}

function drawParticles() {

    particles.forEach((p, index) => {

        p.x += p.speedX;
        p.alpha -= 0.03;

        ctx.fillStyle = "rgba(255, 120, 0, " + p.alpha + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.alpha <= 0) {
            particles.splice(index, 1);
        }

    });

}


// GAME LOOP
function update() {

    animationId = requestAnimationFrame(update);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // if (!gameStarted) {
    //     ctx.clearRect(0, 0, canvas.width, canvas.height);
    //     ctx.fillStyle = "white";
    //     ctx.font = "30px Roboto";
    //     ctx.fillText("Tap to Start", 110, 300);
    //     gameStarted = true;
    //     // bgMusic.play();
    //     return;
    // }

    if (!gameStarted) {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 🟢 draw background
        updateBackground();
        drawBackground();

        // 🐉 show dragon idle
        dragon.y += Math.sin(Date.now() * 0.005) * 0.5;
        drawDragon();

        // ✨ subtle particles
        createParticles();
        drawParticles();

        // 🟡 UI text
        ctx.fillStyle = "Black";
        ctx.font = "30px Arial bold";
        ctx.fillText("Tap to Start", 115, 300);
        bgMusic.play();

        return;
    }


    if (!gameOver) {
        dragon.velocity += gravity;
        dragon.y += dragon.velocity;
    }

    if (dragon.y + dragon.height >= canvas.height) {
        dragon.y = canvas.height - dragon.height;

        if (!gameOver) {
            gameOver = true;
            bgMusic.pause();
            shake = 10; // 🔥 shake on ground hit
        }

    }

    let shakeX = 0;
    let shakeY = 0;

    if (shake > 0) {
        shakeX = (Math.random() - 0.5) * shake;
        shakeY = (Math.random() - 0.5) * shake;
        shake -= 0.5;
    }

    ctx.setTransform(1, 0, 0, 1, shakeX, shakeY);

    if (restartAnim > 0) {
        ctx.globalAlpha = restartAnim;
        restartAnim -= 0.03;
    }



    updateBackground();
    drawBackground();
    if (!gameOver) {
        createParticles();
    }
    drawParticles();
    drawDragon();

    drawPipes();
    drawCoins();
    if (!gameOver) {
        updatePipes(); // ❌ stop moving pipes after game over
    }

    drawFloatingTexts();
    drawScore();

    if (gameOver) {

        if (!hasPlayedHit) {
            hitSound.play();
            hasPlayedHit = true;
        }


        // ctx.fillStyle = "red";
        // ctx.font = "40px Arial bold";
        // ctx.fillText("Game Over", 100, 300);
        // // gameOver = true;
        // // hitSound.play();
        // // hasPlayedHit = false;

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.font = "36px Arial";
        ctx.fillText("GAME OVER", 90, 260);

        ctx.font = "20px Arial";
        ctx.fillText("Score: " + score, 140, 300);
        ctx.fillText("High: " + highScore, 140, 330);
        drawRestartButton();
    }

    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}


update();



// JUMP
document.addEventListener("click", () => {


    if (!gameStarted) {
        gameStarted = true;
        return;
    }

    if (!gameOver) {
        dragon.velocity = jumpPower;
        jumpSound.currentTime = 0;
        jumpSound.play();
    }
});

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();

    if (!gameStarted) {
        gameStarted = true;
        return;
    }

    if (!gameOver) {
        dragon.velocity = jumpPower;
    }
});


// PIPE SPAWN
setInterval(createPipe, 2000);


// RESTART GAME
canvas.addEventListener("click", (e) => {

    if (!gameOver) return;

    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;

    let x = canvas.width / 2 - 80;
    let y = canvas.height / 2 + 40;
    let w = 160;
    let h = 50;

    if (mx > x && mx < x + w && my > y && my < y + h) {

        cancelAnimationFrame(animationId); // ✅ stop old loop

        restartAnim = 1;

        dragon.y = 200;
        dragon.velocity = 0;

        pipes = [];
        score = 0;

        gameOver = false;
        hasPlayedHit = false;

        update();
    }

});