const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let arrows = [];
let enemies = [];
let gameOver = false;
const heartImage = new Image();
heartImage.src = "assets/heart.png";
const arrowImage = new Image();
arrowImage.src = "assets/player/projectiles_and_effects/arrow/arrow_.png";
let distanceTraveled = 0;
const background = new Image();
background.src = "images/background.png";
let playerLives = 3;
const playerIdleFrames = [];
const playerRunFrames = [];
const playerJumpFrames = [];
const playerSlideFrames = [];
const playerAttackFrames = [];
const playerDeadFrames = [];
let lastUpdateTime = performance.now();
let distanceInMeters = 0;
const arrowFrames = [];
const totalIdleFrames = 12;
const totalDeadFrames = 19;
const totalRunFrames = 10;
const totalJumpFrames = 22;
const totalSlideFrames = 8;
const totalAttackFrames = 15;
const totalArrowFrames = 6;
const playerScale = 2;
const playerYOffset = 50;
let playerX = 0;
let playerY = canvas.height - playerYOffset;
let lastPlayerX = playerX;
let playerWidth, playerHeight;
const playerSpeed = 5;
const jumpHeight = 10;
const gravity = 0.1;
let isJumping = false;
let jumpVelocity = -9;
let cameraX = 0;
let currentAnimation = playerIdleFrames;
let facingRight = true;
let isAttacking = false;
let isDead = false;
let canMoveLeft = true;

const backgroundMusic = new Audio("audios/backgrouund.mp3");
const deadMusic = new Audio("audios/dead.wav");
const jumpMusic = new Audio("audios/jump.mp3");
const hitMusic = new Audio("audios/hit.wav");
const wonMusic = new Audio("audios/won.wav");
const arrowMusic = new Audio("audios/Rarrow.mp3");
const slidingMusic = new Audio("audios/sliding.mp3");

const keys = {
  left: false,
  right: false,
  space: false,
  shift: false,
};
let frameIndex = 0;
const frameSpeed = 10;
let frameCount = 0;
const spawnInterval = 2000;
function preloadImages(paths) {
  return Promise.all(
    paths.map((path) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Error loading ${path}`));
        img.src = path;
      });
    })
  );
}

let scoreWorker = 0;
let score = 0;

function updateScore() {
  let scoreDisplay = document.getElementById("scoreDisplay");
  if (!scoreDisplay) {
    scoreDisplay = document.createElement("div");
    scoreDisplay.style.position = "fixed";
    scoreDisplay.style.top = "20px";
    scoreDisplay.style.right = "20px";
    scoreDisplay.style.color = "white";
    scoreDisplay.style.fontFamily = "Arial, sans-serif";
    scoreDisplay.style.fontSize = "24px";
    scoreDisplay.id = "scoreDisplay";
    document.body.appendChild(scoreDisplay);
  }

  // Update score display immediately
  scoreDisplay.innerHTML = `Score: ${score}`;
}

function loadPlayerAnimations() {
  return Promise.all([
    preloadImages(
      Array.from(
        { length: totalIdleFrames },
        (_, i) => `assets/player/idle/idle_${i + 1}.png`
      )
    ),
    preloadImages(
      Array.from(
        { length: totalRunFrames },
        (_, i) => `assets/player/run/run_${i + 1}.png`
      )
    ),
    preloadImages(
      Array.from(
        { length: totalJumpFrames },
        (_, i) => `assets/player/jump_full/jump_${i + 1}.png`
      )
    ),
    preloadImages(
      Array.from(
        { length: totalSlideFrames },
        (_, i) => `assets/player/slide/slide_${i + 1}.png`
      )
    ),
    preloadImages(
      Array.from(
        { length: totalAttackFrames },
        (_, i) => `assets/player/2_atk/2_atk_${i + 1}.png`
      )
    ),
    preloadImages(
      Array.from(
        { length: totalAttackFrames },
        (_, i) => `assets/player/death/death_${i + 1}.png`
      )
    ),
    preloadImages(
      Array.from(
        { length: totalArrowFrames },
        (_, i) =>
          `assets/player/projectiles_and_effects/arrow_hit/arrow_hit_${
            i + 1
          }.png`
      )
    ),
  ]);
}

function initialize() {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("mousedown", handleMouseDown);

  resizeCanvas();
  backgroundMusic.play();
  Promise.all([loadPlayerAnimations()])
    .then(([playerAnimationData]) => {
      const [
        idleImages,
        runImages,
        jumpImages,
        slideImages,
        attackImages,
        arrowImages,
        deadImages,
      ] = playerAnimationData;
      playerIdleFrames.push(...idleImages);
      playerDeadFrames.push(...deadImages);
      playerRunFrames.push(...runImages);
      playerJumpFrames.push(...jumpImages);
      playerSlideFrames.push(...slideImages);
      playerAttackFrames.push(...attackImages);
      arrowFrames.push(...arrowImages);

      playerWidth = playerIdleFrames[0].width * playerScale;
      playerHeight = playerIdleFrames[0].height * playerScale;
      playerX = canvas.width / 2 - playerWidth / 2;
      playerY = canvas.height - playerHeight - playerYOffset;

      console.log("All assets loaded");
      draw();
    })
    .catch((error) => {
      console.error("Error loading assets:", error);
    });
}

function handleKeyDown(e) {
  if (e.code === "ArrowLeft") keys.left = true;
  if (e.code === "ArrowRight") keys.right = true;
  if (e.code === "Space") keys.space = true;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = true;
}

function handleKeyUp(e) {
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowRight") keys.right = false;
  if (e.code === "Space") keys.space = false;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
    keys.shift = false;
    slidingMusic.pause();
  }
}


function handleMouseDown(e) {
  if (e.button === 0 && !isAttacking) {
    shootArrow();
    arrowMusic.play();
    R
  }
}
const arrowOffset = -300;
function shootArrow() {
  if (isAttacking) return;

  const arrowStartingX = facingRight
    ? playerX + playerWidth + arrowOffset
    : playerX - arrowFrames[0].width * playerScale - arrowOffset;

  const newArrow = {
    x: arrowStartingX,
    y: playerY + playerHeight / 3.8,
    width: arrowFrames[0].width * playerScale,
    height: arrowFrames[0].height * playerScale,
    direction: facingRight ? 1 : -1,
  };

  arrows.push(newArrow);
  currentAnimation = playerAttackFrames;
  isAttacking = true;
}

function moveArrows() {
  arrows.forEach((arrow) => {
    arrow.x += arrow.direction * 10;
  });

  arrows = arrows.filter((arrow) => arrow.x >= 0 && arrow.x <= canvas.width);
}
function drawArrows() {
  arrows.forEach((arrow) => {
    ctx.drawImage(arrowImage, arrow.x, arrow.y, arrow.width, arrow.height);
  });
}

function drawLiveCounter() {
  const heartSize = 80;
  const margin = 10;
  const spacing = 2;

  for (let i = 0; i < playerLives; i++) {
    ctx.drawImage(
      heartImage,
      margin + i * (heartSize + spacing),
      margin,
      heartSize,
      heartSize
    );
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  playerY = canvas.height - playerHeight - playerYOffset;
}
function displayWinMenu() {
  // Create overlay div
  let overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "1000";

  // Create menu container
  let menu = document.createElement("div");
  menu.style.background = "#ffffff";
  menu.style.padding = "20px";
  menu.style.textAlign = "center";
  menu.style.borderRadius = "8px";
  menu.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";

  // Create title
  let title = document.createElement("h1");
  title.textContent = "You Won!";
  title.style.marginBottom = "10px";

  // Create description
  let description = document.createElement("p");
  description.textContent = "Please click the button below to reload.";

  // Create reload button
  let reloadButton = document.createElement("button");
  reloadButton.textContent = "Reload";
  reloadButton.style.backgroundColor = "#4CAF50";
  reloadButton.style.color = "white";
  reloadButton.style.border = "none";
  reloadButton.style.padding = "10px";
  reloadButton.style.cursor = "pointer";
  reloadButton.style.marginTop = "10px";
  reloadButton.addEventListener("click", function () {
    window.location.reload();
  });

  let homebutton = document.createElement("button");
  homebutton.textContent = "Home";
  homebutton.style.backgroundColor = "#4CAF50";
  homebutton.style.color = "white";
  homebutton.style.border = "none";
  homebutton.style.padding = "10px";
  homebutton.style.cursor = "pointer";
  homebutton.style.marginTop = "10px";
  homebutton.style.marginLeft = "10px";
  homebutton.addEventListener("click", function () {
    window.location.href = "index.html";
  });

  menu.appendChild(title);
  menu.appendChild(description);
  menu.appendChild(reloadButton);
  menu.appendChild(homebutton);
  overlay.appendChild(menu);
  document.body.appendChild(overlay);
}

function displayGameOverMenu() {
  // Create overlay div
  let overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "1000";

  let menu = document.createElement("div");
  menu.style.background = "#ffffff";
  menu.style.padding = "20px";
  menu.style.textAlign = "center";
  menu.style.borderRadius = "8px";
  menu.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";

  let title = document.createElement("h1");
  title.textContent = "Game Over";
  title.style.marginBottom = "10px";

  let description = document.createElement("p");
  description.textContent =
    "You lost all your lives. Click the button below to try again.";

  let reloadButton = document.createElement("button");
  reloadButton.textContent = "Reload";
  reloadButton.style.backgroundColor = "#f44336";
  reloadButton.style.color = "white";
  reloadButton.style.border = "none";
  reloadButton.style.padding = "10px";
  reloadButton.style.cursor = "pointer";
  reloadButton.style.marginTop = "10px";
  reloadButton.addEventListener("click", function () {
    window.location.reload();
  });

  let homebutton = document.createElement("button");
  homebutton.textContent = "Home";
  homebutton.style.backgroundColor = "#4CAF50";
  homebutton.style.color = "white";
  homebutton.style.border = "none";
  homebutton.style.padding = "10px";
  homebutton.style.cursor = "pointer";
  homebutton.style.marginTop = "10px";
  homebutton.style.marginLeft = "10px";
  homebutton.addEventListener("click", function () {
    window.location.href = "index.html";
  });

  menu.appendChild(title);
  menu.appendChild(description);
  menu.appendChild(reloadButton);
  menu.appendChild(homebutton);
  overlay.appendChild(menu);
  document.body.appendChild(overlay);
}

function draw() {
  if (
    !playerIdleFrames.length ||
    !playerRunFrames.length ||
    !playerJumpFrames.length ||
    !playerSlideFrames.length ||
    !playerDeadFrames.length ||
    !playerAttackFrames.length ||
    !arrowFrames.length
  ) {
    requestAnimationFrame(draw);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  if (!gameOver) {
    const playerRect = createPlayerRect();
    handlePlayerMovement(playerRect);
    drawPlayer(playerRect);
    moveArrows();
    drawArrows();

    if (keys.right) {
      score += 10;
      updateScore();

      if (score == 10010) {
        gameOver = true;
        displayWinMenu();
        wonMusic.play();
      }
    }
    updateFrameIndex();
    requestAnimationFrame(draw);
  } else {
    displayGameOverMenu();
  }

  if (playerY + playerHeight < canvas.height - playerYOffset) {
    const playerRect = createPlayerRect();
    drawPlayer(playerRect);
  }

  drawLiveCounter();
}

function drawBackground() {
  const bgWidth = background.width;
  const bgHeight = canvas.height;
  for (let i = -1; i <= Math.ceil(canvas.width / bgWidth); i++) {
    ctx.drawImage(
      background,
      i * bgWidth - (cameraX % bgWidth),
      0,
      bgWidth,
      bgHeight
    );
  }
}

function createPlayerRect() {
  if (playerWidth && playerHeight) {
    return {
      x: playerX,
      y: playerY,
      width: playerWidth,
      height: playerHeight,
    };
  }
  return null;
}
window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") {
    canMoveLeft = false;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") {
    canMoveLeft = true;
  }
});

let playerJumps = 0;
let jumpInterval = null;
function handlePlayerMovement(playerRect) {
  if (keys.left && canMoveLeft) {
    if (playerX > 0) {
      playerX -= playerSpeed;
    }
    facingRight = false;
  } else if (keys.right) {
    playerX += playerSpeed;
    facingRight = true;
  }

  if (keys.space && !isJumping) {
    isJumping = true;
    jumpVelocity = -jumpHeight;
    currentAnimation = playerJumpFrames;

    if (!jumpInterval) {
      let jumpInterval = setInterval(() => {
        playerJumps = +1;
        console.log(`Player has jumped ${playerJumps} times.`);
        jumpMusic.play();
        clearInterval(jumpInterval);
      }, 100);
    }
  }

  if (isJumping) {
    playerY += jumpVelocity;
    jumpVelocity += gravity;

    if (playerY >= canvas.height - playerHeight - playerYOffset) {
      playerY = canvas.height - playerHeight - playerYOffset;
      isJumping = false;
      currentAnimation =
        keys.left || keys.right ? playerRunFrames : playerIdleFrames;
    }
  }

  // Handle sliding
  if (keys.shift) {
    currentAnimation = playerSlideFrames;
    slidingMusic.play();
  }

  // Handle attacking
  if (isAttacking) {
    currentAnimation = playerAttackFrames;
    if (frameIndex === playerAttackFrames.length - 1) {
      isAttacking = false;
    }
  }

  // no update then idle again
  if (!isJumping && !keys.shift && !isAttacking) {
    currentAnimation =
      keys.left || keys.right ? playerRunFrames : playerIdleFrames;
  }
}

var enemyLocations = [2000, 3000, 4000];

enemyLocations.forEach(generateEnemy);

function generateEnemy(x) {
  let enemy = document.createElement("img");
  enemy.src = "assets/enemy.gif";
  enemy.className = "enemy";
  enemy.style.position = "absolute";
  enemy.style.left = x + "px";
  enemy.style.bottom = "0";
  enemy.style.border = "2px solid red";

  document.body.appendChild(enemy);

  let hasInteracted = false;

  let enemyInterval = setInterval(() => {
    if (playerLives <= 0) {
      clearInterval(enemyInterval);
      enemy.remove();
      gameOver = true;
      displayGameOverMenu();
    } else {
      x -= 10;
      enemy.style.left = x + "px";
      if (x <= 500 && x >= 100 && !hasInteracted) {
        const playerHeightThreshold =
          canvas.height - playerHeight - playerYOffset;
        if (
          playerY <= playerHeightThreshold + 10 &&
          playerY >= playerHeightThreshold - 10
        ) {
          playerLives--;
          drawLiveCounter();
          hitMusic.play();
          hasInteracted = true;
        }
      }
      if (x <= 0 || playerLives <= 0) {
        clearInterval(enemyInterval);
        enemy.remove();
        if (playerLives <= 0) {
          gameOver = true;
          displayGameOverMenu();
          backgroundMusic.pause();
          deadMusic.play();
        }
      }
    }
  }, 50);
}

function drawPlayer(playerRect) {
  const playerFrame = currentAnimation[frameIndex];
  if (playerFrame && playerFrame.complete) {
    const originalWidth = playerFrame.width;
    const originalHeight = playerFrame.height;
    const cropWidth = 198;
    const cropHeight = 128;
    const cropX = (originalWidth - cropWidth) / 2;
    const cropY = (originalHeight - cropHeight) / 2;
    const cropFromCorners = 10;

    playerWidth = cropWidth * playerScale;
    playerHeight = cropHeight * playerScale;
    cameraX = playerX - canvas.width / 2 + playerWidth / 2;
    ctx.save();
    ctx.translate(facingRight ? 0 : canvas.width, 0);
    ctx.scale(facingRight ? 1 : -1, 1);
    ctx.drawImage(
      playerFrame,
      cropX + cropFromCorners,
      cropY,
      cropWidth - cropFromCorners * 2,
      cropHeight,
      facingRight ? playerX - cameraX : canvas.width - (playerX - cameraX),
      playerY,
      playerWidth,
      playerHeight
    );

    ctx.restore();
  } else if (playerFrame) {
    playerFrame.onload = () => {
      requestAnimationFrame(draw);
    };
  }
}

function updateFrameIndex() {
  frameCount++;
  if (frameCount >= frameSpeed) {
    frameIndex = (frameIndex + 1) % currentAnimation.length;
    frameCount = 0;
  }
}

initialize();
