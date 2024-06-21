const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let arrows = [];
let enemies = [];
let gameOver = false;
const heartImage = new Image();
heartImage.src = 'assets/heart.png';
const arrowImage = new Image();
arrowImage.src = 'assets/player/projectiles_and_effects/arrow/arrow_.png';

const enemyIdleFrames = [];
const totalEnemyIdleFrames = 6;
const enemySpeed = 3;

const background = new Image();
background.src = 'images/background.png';
let playerHealth = 3; // Set initial player health
let playerLives = 3; // Set initial player lives
let collidedWithEnemy = false;
const playerIdleFrames = [];
const playerRunFrames = [];
const playerJumpFrames = [];
const playerSlideFrames = [];
const playerAttackFrames = [];
const arrowFrames = [];
const totalIdleFrames = 12;
const totalRunFrames = 10;
const totalJumpFrames = 22;
const totalSlideFrames = 8;
const totalAttackFrames = 15;
const totalArrowFrames = 6;
const playerScale = 2;
const playerYOffset = 50;
let playerX = 0;
let playerY = canvas.height - playerYOffset; // Initialize playerY with canvas height
let playerWidth, playerHeight;
const playerSpeed = 5;
const jumpHeight = 20;
const gravity = 0.3;
let isJumping = false;
let jumpVelocity = -7;
let cameraX = 0;
let currentAnimation = playerIdleFrames;
let facingRight = true;
let isAttacking = false;
const keys = {
    left: false,
    right: false,
    space: false,
    shift: false
};
let frameIndex = 0;
const frameSpeed = 10;
let frameCount = 0;

function preloadImages(paths) {
    return Promise.all(paths.map(path => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Error loading ${path}`));
            img.src = path;
        });
    }));
}

function loadEnemyAnimations() {
    return preloadImages(Array.from({ length: totalEnemyIdleFrames }, (_, i) => `assets/enemy/idle/idle_${i + 1}.png`));
}

function loadPlayerAnimations() {
    return Promise.all([
        preloadImages(Array.from({ length: totalIdleFrames }, (_, i) => `assets/player/idle/idle_${i + 1}.png`)),
        preloadImages(Array.from({ length: totalRunFrames }, (_, i) => `assets/player/run/run_${i + 1}.png`)),
        preloadImages(Array.from({ length: totalJumpFrames }, (_, i) => `assets/player/jump_full/jump_${i + 1}.png`)),
        preloadImages(Array.from({ length: totalSlideFrames }, (_, i) => `assets/player/slide/slide_${i + 1}.png`)),
        preloadImages(Array.from({ length: totalAttackFrames }, (_, i) => `assets/player/2_atk/2_atk_${i + 1}.png`)),
        preloadImages(Array.from({ length: totalArrowFrames }, (_, i) => `assets/player/projectiles_and_effects/arrow_hit/arrow_hit_${i + 1}.png`))
    ]);
}

function initialize() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousedown', handleMouseDown);

    // Set canvas size initially
    resizeCanvas();

    Promise.all([
        loadPlayerAnimations(),
        loadEnemyAnimations()
    ]).then(([playerAnimationData, enemyIdleImages]) => {
        const [idleImages, runImages, jumpImages, slideImages, attackImages, arrowImages] = playerAnimationData;
        playerIdleFrames.push(...idleImages);
        playerRunFrames.push(...runImages);
        playerJumpFrames.push(...jumpImages);
        playerSlideFrames.push(...slideImages);
        playerAttackFrames.push(...attackImages);
        arrowFrames.push(...arrowImages);
        enemyIdleFrames.push(...enemyIdleImages);

        // Initialize player position and size
        playerWidth = playerIdleFrames[0].width * playerScale;
        playerHeight = playerIdleFrames[0].height * playerScale;
        playerX = canvas.width / 2 - playerWidth / 2;
        playerY = canvas.height - playerHeight - playerYOffset;

        console.log('All assets loaded');
        draw(); // Start the game loop after loading assets
    }).catch(error => {
        console.error('Error loading assets:', error);
    });
}

function handleKeyDown(e) {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') keys.space = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;
    if (e.code === 'KeyH') shootArrow();
}

function handleKeyUp(e) {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space') keys.space = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
}

function handleMouseDown(e) {
    if (e.button === 0 && !isAttacking) {
        shootArrow();
    }
}

function shootArrow() {
    if (isAttacking) return;

    const newArrow = {
        x: playerX + (facingRight ? playerWidth : 0),
        y: playerY + playerHeight / 3.8,
        width: arrowFrames[0].width * playerScale,
        height: arrowFrames[0].height * playerScale,
        direction: facingRight ? 1 : -1
    };

    arrows.push(newArrow);
    currentAnimation = playerAttackFrames;
    isAttacking = true;
}

function moveArrows() {
    arrows.forEach(arrow => {
        arrow.x += arrow.direction * 10;
    });

    arrows = arrows.filter(arrow => arrow.x >= 0 && arrow.x <= canvas.width);
}

function drawArrows() {
    arrows.forEach(arrow => {
        ctx.drawImage(arrowImage, arrow.x, arrow.y, arrow.width, arrow.height);
    });
}

function spawnEnemy() {
    if (enemies.length === 0) {
        if (Math.random() < 0.01) {
            const enemy = {
                x: canvas.width,
                y: canvas.height - enemyIdleFrames[0].height - 20,
                width: enemyIdleFrames[0].width,
                height: enemyIdleFrames[0].height,
                frames: enemyIdleFrames,
                frameIndex: 0,
                frameCount: 0,
                frameSpeed: 10
            };
           
            enemies.push(enemy);
        }
    }
}

function moveEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.collidedWithPlayer) {
            enemy.x -= enemySpeed;
        }
    });

    enemies = enemies.filter(enemy => enemy.x + enemy.width > 0);

    enemies.forEach(enemy => {
        if (enemy.wasColliding && !enemyIsColliding(enemy)) {
            enemy.wasColliding = false;
        }
    });
}

function handleCollision() {
    if (!gameOver) {
        playerHealth--;

        if (playerHealth <= 0 || playerLives <= 0) {
            gameOver = true;
            console.log("Game Over");
            return;
        }

        console.log("Collision detected.");

    } else {
        playerX = canvas.width / 2 - playerWidth / 2;
        playerY = canvas.height / 2 - playerHeight / 2;
    }
}

function enemyIsColliding(enemy) {
    const enemyRect = {
        x: enemy.x,
        y: enemy.y,
        width: enemy.width,
        height: enemy.height
    };
    return rectCollision(playerRect, enemyRect);
}

function hasCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

function drawEnemies() {
    enemies.forEach(enemy => {
        const frame = enemy.frames[enemy.frameIndex];
        if (frame.complete) {
            ctx.drawImage(frame, enemy.x, enemy.y, enemy.width, enemy.height);
            enemy.frameCount++;
            if (enemy.frameCount >= enemy.frameSpeed) {
                enemy.frameIndex = (enemy.frameIndex + 1) % enemy.frames.length;
                enemy.frameCount = 0;
            }
        }
    });
}

function drawLiveCounter() {
    const heartSize = 80;
    const margin = 10;
    const spacing = 2;

    for (let i = 0; i < playerLives; i++) {
        ctx.drawImage(heartImage, margin + i * (heartSize + spacing), margin, heartSize, heartSize);
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    playerY = canvas.height - playerHeight - playerYOffset;
}

function draw() {
    if (!playerIdleFrames.length || !playerRunFrames.length || !playerJumpFrames.length || !playerSlideFrames.length || !playerAttackFrames.length || !arrowFrames.length) {
        requestAnimationFrame(draw);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bgWidth = background.width;
    const bgHeight = canvas.height;

    for (let i = -1; i <= Math.ceil(canvas.width / bgWidth); i++) {
        ctx.drawImage(background, i * bgWidth - cameraX % bgWidth, 0, bgWidth, bgHeight);
    }

    drawEnemies();

    if (!gameOver) {
        if (keys.left) {
            playerX -= playerSpeed;
            facingRight = false;
        } else if (keys.right) {
            playerX += playerSpeed;
            facingRight = true;
        }

        if (keys.space && !isJumping) {
            isJumping = true;
            jumpVelocity = -jumpHeight;
            currentAnimation = playerJumpFrames;
        } else if (isJumping) {
            playerY += jumpVelocity;
            jumpVelocity += gravity;
            if (playerY >= canvas.height - playerHeight - playerYOffset) {
                playerY = canvas.height - playerHeight - playerYOffset;
                isJumping = false;
                currentAnimation = keys.left || keys.right ? playerRunFrames : playerIdleFrames;
            }
        } else {
            if (keys.shift) {
                currentAnimation = playerSlideFrames;
            } else {
                currentAnimation = keys.left || keys.right ? playerRunFrames : playerIdleFrames;
            }
        }

        if (isAttacking) {
            currentAnimation = playerAttackFrames;
            if (frameIndex === 11) {
                shootArrow();
            }
        }

        const playerFrame = currentAnimation[frameIndex];
        if (playerFrame && playerFrame.complete) {
            playerWidth = playerFrame.width * playerScale;
            playerHeight = playerFrame.height * playerScale;
            cameraX = playerX - canvas.width / 2 + playerWidth / 2;
            ctx.save();
            ctx.translate(facingRight ? 0 : canvas.width, 0);
            ctx.scale(facingRight ? 1 : -1, 1);
            ctx.drawImage(playerFrame, facingRight ? playerX - cameraX : canvas.width - (playerX - cameraX) - playerWidth, playerY, playerWidth, playerHeight);
            ctx.restore();
        }

        if (currentAnimation === playerAttackFrames) {
            if (frameIndex === playerAttackFrames.length - 1) {
                isAttacking = false;
            }
        }

        if (isAttacking) {
            currentAnimation = playerAttackFrames;
        }

        moveArrows();
        drawArrows();
        frameCount++;
        if (frameCount >= frameSpeed) {
            frameIndex = (frameIndex + 1) % currentAnimation.length;
            frameCount = 0;
        }

        spawnEnemy();
        moveEnemies();
        const playerRect = {
            x: playerX,
            y: playerY,
            width: playerWidth,
            height: playerHeight
        };

        enemies.forEach(enemy => {
            const enemyRect = {
                x: enemy.x,
                y: enemy.y,
                width: enemy.width,
                height: enemy.height
            };
            if (rectCollision(playerRect, enemyRect)) {
                console.log("Enemy collided with player!");
                handleCollision();
            }
        });

        if (!gameOver) {
            requestAnimationFrame(draw);
        } else {
            ctx.fillStyle = "white";
            ctx.font = "48px Arial";
            ctx.fillText("Game Over", canvas.width / 2 - 120, canvas.height / 2);
        }

        drawLiveCounter();
    }
}

function rectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

initialize();
