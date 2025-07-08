const crashSound= new Audio("assets/crash.mp3");
const levelUpSound= new Audio("assets/level-up.mp3");

let lastMilestone = 0;
const startBtn= document.getElementById("startButton");
const startScreen= document.getElementById("startScreen");
const topButtons= document.getElementById("topButtons");
 let playerName="";
 let leaderboard=JSON.parse(localStorage.getItem("leaderboard")) || [];

 const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreText = document.getElementById("finalScore");
const highestScoreText = document.getElementById("highestScore");
const playAgainBtn = document.getElementById("playAgainButton");
const overlayDim= document.getElementById("overlayDim");

let score= 0;
let gameTicks=0;
const SCORE_RATE=1;
let lastSpawnDecreaseScore = 0;
let enemySpeed = 4;             // initial speed of enemy cars
const SPEED_INCREMENT = 0.2;    // how much to increase
const SPEED_INTERVAL = 500;     // how many frames before increasing speed


const playerCarImg= new Image();
playerCarImg.src="assets/playerCar.png"
const enemyCarImg = new Image();
enemyCarImg.src = "assets/enemyCar.png";

const enemyCars = [];
let gameOver = false;
let enemySpawnTimer = 0;
let ENEMY_SPAWN_INTERVAL = 90; // Adjust to control frequency of enemy car spawning


const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");

let paused= false;
const pauseBtn= document.getElementById("pauseButton");
const restartBtn= document.getElementById("restartButton");

startBtn.addEventListener("click", () => {
 const input=document.getElementById("playerNameInput");
 const name=input.value.trim();
 if(name === ""){
        alert("Please enter your name to start the game.");
        return;
 }  
    playerName = formatName(name);
    startScreen.style.display = "none"; // Hide the start screen
    topButtons.style.display = "flex"; // Show the top buttons
      //  Wait for both images before starting the game loop
  if (playerCarImg.complete && enemyCarImg.complete) {
    requestAnimationFrame(gameLoop);
  } else {
    // Load only once
    playerCarImg.onload = () => {
      if (enemyCarImg.complete) {
        requestAnimationFrame(gameLoop);
      }
    };
    enemyCarImg.onload = () => {
      if (playerCarImg.complete) {
        requestAnimationFrame(gameLoop);
      }
    };
  }
});

function formatName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}


playAgainBtn.addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  startScreen.style.display = "block";
  pauseBtn.innerText = "Pause";
  score = 0;
  enemySpeed=4;
  lastSpawnDecreaseScore=0;
  enemyCars.length = 0;
  ENEMY_SPAWN_INTERVAL=90;
  gameOver = false;
  paused = false;
  enemySpawnTimer = 0;
  playerCar.x = canvas.width / 2 - playerCar.width / 2;
  playerCar.y = canvas.height - 100;
  overlayDim.style.display = "none";

});


function updateLeaderboardDisplay(){
  const list = document.getElementById("leaderboardList");
  list.innerHTML = "";

  leaderboard
    .sort((a, b) => b.score - a.score)  // Sort from high to low
    .slice(0, 5)                        // ✅ Show only top 5
    .forEach((entry, index) => {
      const li = document.createElement("li");
      li.innerText = `${index + 1}. ${" "+ entry.name}: ${" "+entry.score}`;
      list.appendChild(li);
    });
}

 updateLeaderboardDisplay(); // Initial display of leaderboard

pauseBtn.addEventListener("click", () => {
  paused = !paused;
  pauseBtn.innerText = paused ? "Play" : "Pause";

  if (!paused && !gameOver) {
    requestAnimationFrame(gameLoop);
  }
});


restartBtn.addEventListener("click", () => {
    // Reset game state
    score = 0;
    enemySpeed=4;
    gameTicks=0;
    lastSpawnDecreaseScore=0;
    enemyCars.length = 0; // Clear enemy cars
    gameOver = false;
    paused = false;
    ENEMY_SPAWN_INTERVAL=90;
    pauseBtn.innerText = "Pause"; // Reset pause button text
    enemySpawnTimer = 0;
    playerCar.x = canvas.width / 2 - playerCar.width / 2; // Reset player car position
    playerCar.y = canvas.height - 70; // Reset player car position
    updateLeaderboardDisplay();

    // Restart the game loop
    requestAnimationFrame(gameLoop);
});

// define player car properties
const playerCar={
    width:42,
    height:90,
    x:canvas.width/2-21,  // Center the car horizontally
    y:canvas.height-100,    // Position the car above the bottom of the canvas
    color: 'red',
    speed: 15
};

// Road line settings
const lineWidth = 4;
const lineLength = 60;
const lineGap = 100; // Gap between lines
let lineOffset = 0; // Used to animate downward scrolling

function drawRoad() {
    ctx.fillStyle = 'white';
    const centerX = canvas.width / 2 - lineWidth / 2;

    for (let y = -lineLength; y < canvas.height; y += lineLength + lineGap) {
        ctx.fillRect(centerX, y + lineOffset, lineWidth, lineLength);
    }

    // Update lineOffset for animation
    lineOffset += 2; // Speed of road scroll
    if (lineOffset >= lineLength + lineGap) {
        lineOffset = 0;
    }
}

//draw player car
function drawPlayerCar() {
   ctx.drawImage(
    playerCarImg,
    playerCar.x,
    playerCar.y,
    playerCar.width,
    playerCar.height
  );
}

document.addEventListener('keydown', (event)=>{
    if(event.key==='ArrowLeft' ){
        playerCar.x=Math.max(0, playerCar.x-playerCar.speed); // Move left but not beyond the left edge
    }
    else if(event.key==='ArrowRight'){
        playerCar.x=Math.min(canvas.width-playerCar.width, playerCar.x+playerCar.speed); // Move right but not beyond the right edge
    }
    
});

document.getElementById("leftButton").addEventListener("click", () => {
  playerCar.x = Math.max(0, playerCar.x - playerCar.speed);
});

document.getElementById("rightButton").addEventListener("click", () => {
  playerCar.x = Math.min(canvas.width - playerCar.width, playerCar.x + playerCar.speed);
});



// Function to create a new enemy car

function createEnemyCar() {
    const carWidth = 38;
    const carHeight = 80;
    const x= Math.random()* (canvas.width - carWidth); // Random x position within canvas width
    const y = -carHeight; // Start above the canvas
    const color = 'blue'; // Color of the enemy car

    enemyCars.push({x,y, width: carWidth, height: carHeight, color});
}

function drawEnemyCars(){
    for(const enemy of enemyCars){
        ctx.drawImage(
      enemyCarImg,
      enemy.x,
      enemy.y,
      enemy.width,
      enemy.height
    );
    }
}

// This function moves the enemy cars
function updateEnemyCars(){
    for(let i=enemyCars.length-1;i>=0;i--){
        enemyCars[i].y+=enemySpeed;

        if(enemyCars[i].y>canvas.height){
            enemyCars.splice(i,1);  // removes the enemy car from the screen if they move outside the road
        }
    }
}



function checkCollisions() {
    for (const enemy of enemyCars) {
        const hit =
            playerCar.x < enemy.x + enemy.width &&
            playerCar.x + playerCar.width > enemy.x &&
            playerCar.y < enemy.y + enemy.height &&
            playerCar.y + playerCar.height > enemy.y;

        if (hit) {
            crashSound.play();
  gameOver = true;

  // Save or update leaderboard
  const existing = leaderboard.find(entry => entry.name.toLowerCase() === playerName.toLocaleLowerCase());
  let highScore = score;
  if (!existing || score > existing.score) {
    if (existing) {
      existing.score = score;
    } else {
      leaderboard.push({ name: playerName, score });
    }
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    updateLeaderboardDisplay();
  } else {
    highScore = existing.score;
  }

  // Show Game Over screen
  overlayDim.style.display="block";
  finalScoreText.textContent = score;
  highestScoreText.textContent = highScore;
  gameOverScreen.style.display = "flex";
  topButtons.style.display = "none";
}

    }
}

function drawScore() {
    const text = "Score: " + score;

    ctx.font = "24px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(text, 10, 30); // Draw score at the top left
    // make its z index higher than the road and player car
}


function gameLoop() {
    if (gameOver) {
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
       // ctx.fillText("Game Over!", canvas.width / 2 - 80, canvas.height / 2);
        return;
    }
    
    if(paused) return; // If the game is paused, skip the rest of the loop

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    score+=SCORE_RATE;
    
    gameTicks++;

    if (gameTicks % SPEED_INTERVAL === 0) {
    enemySpeed += SPEED_INCREMENT;
    }
    if (score - lastMilestone >= 1000) {
    enemySpeed += SPEED_INCREMENT;
    levelUpSound.play();
    lastMilestone = score;
}
   

    drawRoad();
    drawPlayerCar();

    // Enemy logic
    enemySpawnTimer++;
    if (enemySpawnTimer >= ENEMY_SPAWN_INTERVAL) {
        createEnemyCar();
        enemySpawnTimer = 0;
    }

  if (score - lastSpawnDecreaseScore >= 100) {
  if (ENEMY_SPAWN_INTERVAL > 30) {
    ENEMY_SPAWN_INTERVAL -= 3;
    lastSpawnDecreaseScore = score;
  }
}
    updateEnemyCars();
    drawEnemyCars();
    checkCollisions();
    drawScore();
    requestAnimationFrame(gameLoop);
}

