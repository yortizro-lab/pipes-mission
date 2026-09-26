// ======================================================
// 💧 PIPES MISSION - REPAIR THE BROKEN PIPES
// ======================================================

const board = document.getElementById("pipeBoard");
const startButton = document.getElementById("startButton");
const message = document.getElementById("message");

const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");

let score = 1000;
let level = 1;
let moves = 0;
let timeLeft = 30;
let timer = null;
let gameStarted = false;
let gameOver = false;

// ------------------------------------------------------
// BOARD SETTINGS
// ------------------------------------------------------

const SIZE = 3;

let pipes = [];

// The correct path:
// 🚰 START → pipe → pipe
//                  ↓
//              pipe → pipe
//                       ↓
//              pipe → pipe → EXIT
const solutionPath = [
  [0, 0],
  [0, 0],
  [1, 0],
  [1, 1],
  [1, 2],
  [2, 2],
  [2, 2],
];

// ------------------------------------------------------
// CONNECTIONS
// ------------------------------------------------------

function getSolutionConnections(index) {
    const current = solutionPath[index];
    const connections = [];

    // Connection to the previous pipe
    if (index > 0) {
        const previous = solutionPath[index - 1];

        if (previous[0] < current[0]) connections.push("top");
        if (previous[0] > current[0]) connections.push("bottom");
        if (previous[1] < current[1]) connections.push("left");
        if (previous[1] > current[1]) connections.push("right");
    }

    // Connection to the next pipe
    if (index < solutionPath.length - 1) {
        const next = solutionPath[index + 1];

        if (next[0] < current[0]) connections.push("top");
        if (next[0] > current[0]) connections.push("bottom");
        if (next[1] < current[1]) connections.push("left");
        if (next[1] > current[1]) connections.push("right");
    }

    // Faucet connects to the first pipe
    if (index === 0) {
        connections.push("top");
    }

    // Last pipe connects to the water exit
    if (index === solutionPath.length - 1) {
        connections.push("bottom");
    }

    return connections;
}

  return connections;
}

// ------------------------------------------------------
// PIPE TYPE
// ------------------------------------------------------

function getPipeType(connections) {
  if (
    connections.includes("top") &&
    connections.includes("bottom")
  ) {
    return "straight-vertical";
  }

  if (
    connections.includes("left") &&
    connections.includes("right")
  ) {
    return "straight-horizontal";
  }

  return "corner";
}

// ------------------------------------------------------
// CREATE BOARD
// ------------------------------------------------------

function createBoard() {
  board.innerHTML = "";
  pipes = [];

  board.style.display = "grid";
  board.style.gridTemplateColumns = "repeat(3, 80px)";
  board.style.gridTemplateRows = "repeat(3, 80px)";
  board.style.gap = "8px";
  board.style.justifyContent = "center";
  board.style.alignItems = "center";
  board.style.padding = "20px";

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {

      const pathIndex = solutionPath.findIndex(
        position => position[0] === row && position[1] === col
      );

      let connections;

      if (pathIndex !== -1) {
        connections = getSolutionConnections(pathIndex);
      } else {
        connections = ["top", "bottom"];
      }

      const type = getPipeType(connections);

      const pipe = {
        row: row,
        col: col,
        correctConnections: connections,
        rotation: Math.floor(Math.random() * 4),
        fixed: false
      };

      pipes.push(pipe);

      const tile = document.createElement("button");

      tile.className = "pipe-tile broken";
      tile.dataset.index = pipes.length - 1;

      tile.style.width = "80px";
      tile.style.height = "80px";
      tile.style.position = "relative";
      tile.style.border = "3px solid #36d1ff";
      tile.style.borderRadius = "12px";
      tile.style.background = "#075ca8";
      tile.style.cursor = "pointer";

      tile.innerHTML = `
        <span class="broken-mark">🔧</span>
        <span class="pipe-shape ${type}"></span>
      `;

      tile.addEventListener("click", function () {
        const index = Number(tile.dataset.index); 
        rotatePipe(index);
      });

      board.appendChild(tile);

      updatePipeVisual(tile, pipe);
      }
    }
  }

  addWaterMarkers();


// ------------------------------------------------------
// FAUCET AND EXIT
// ------------------------------------------------------

function addWaterMarkers() {

  const oldMarkers = document.querySelectorAll(
    ".game-faucet, .game-exit"
  );

  oldMarkers.forEach(marker => marker.remove());

  const faucet = document.createElement("div");

  faucet.className = "game-faucet";
  faucet.innerHTML = `
    <div style="font-size:40px;">🚰</div>
    <strong>FAUCET</strong>
  `;

  faucet.style.textAlign = "center";
  faucet.style.margin = "10px auto";
  faucet.style.color = "white";

  board.parentElement.insertBefore(faucet, board);

  const exit = document.createElement("div");

  exit.className = "game-exit";
  exit.innerHTML = `
    <div style="font-size:40px;">💧</div>
    <strong>WATER EXIT</strong>
  `;

  exit.style.textAlign = "center";
  exit.style.margin = "10px auto";
  exit.style.color = "white";

  board.parentElement.appendChild(exit);
}

// ------------------------------------------------------
// PIPE VISUAL
// ------------------------------------------------------

function updatePipeVisual(tile, pipe) {

  const shape = tile.querySelector(".pipe-shape");
  const broken = tile.querySelector(".broken-mark");

  if (!shape) return;

  shape.style.display = "block";
  shape.style.position = "absolute";
  shape.style.left = "50%";
  shape.style.top = "50%";
  shape.style.transform = `translate(-50%, -50%) rotate(${pipe.rotation * 90}deg)`;

  shape.style.width = "18px";
  shape.style.height = "60px";
  shape.style.background = "#61e8ff";
  shape.style.borderRadius = "10px";

  if (pipe.correctConnections.length === 2) {

    if (
      pipe.correctConnections.includes("left") &&
      pipe.correctConnections.includes("right")
    ) {
      shape.style.width = "60px";
      shape.style.height = "18px";
    }
  }

  if (pipe.correctConnections.includes("left") &&
      pipe.correctConnections.includes("bottom")) {

    shape.style.width = "55px";
    shape.style.height = "55px";
    shape.style.borderRadius = "0 0 0 30px";
    shape.style.background = "transparent";
    shape.style.borderLeft = "18px solid #61e8ff";
    shape.style.borderBottom = "18px solid #61e8ff";
  }

  if (pipe.correctConnections.includes("right") &&
      pipe.correctConnections.includes("bottom")) {

    shape.style.width = "55px";
    shape.style.height = "55px";
    shape.style.borderRadius = "0 0 30px 0";
    shape.style.background = "transparent";
    shape.style.borderRight = "18px solid #61e8ff";
    shape.style.borderBottom = "18px solid #61e8ff";
  }

  if (pipe.correctConnections.includes("left") &&
      pipe.correctConnections.includes("top")) {

    shape.style.width = "55px";
    shape.style.height = "55px";
    shape.style.borderRadius = "30px 0 0 0";
    shape.style.background = "transparent";
    shape.style.borderLeft = "18px solid #61e8ff";
    shape.style.borderTop = "18px solid #61e8ff";
  }

  if (pipe.correctConnections.includes("right") &&
      pipe.correctConnections.includes("top")) {

    shape.style.width = "55px";
    shape.style.height = "55px";
    shape.style.borderRadius = "0 30px 0 0";
    shape.style.background = "transparent";
    shape.style.borderRight = "18px solid #61e8ff";
    shape.style.borderTop = "18px solid #61e8ff";
  }

  if (broken) {
    broken.style.position = "absolute";
    broken.style.top = "3px";
    broken.style.right = "4px";
    broken.style.fontSize = "16px";
  }

  tile.style.boxShadow = "0 0 8px rgba(0,200,255,0.4)";
}

// ------------------------------------------------------
// ROTATE PIPE
// ------------------------------------------------------

function rotatePipe(index) {
  if (!gameStarted || gameOver) return;

  const pipe = pipes[index];

  pipe.rotation = (pipe.rotation + 1) % 4;

  moves++;
  score += 10;

  const tile = board.children[index];

  // Rotate the actual pipe
  updatePipeVisual(tile, pipe);

  updateDisplays();
  checkWaterFlow();
}

  

// ------------------------------------------------------
// CHECK WATER FLOW
// ------------------------------------------------------

function checkWaterFlow() {
 let connected = new Set();
  let queue = [0];

  while (queue.length > 0) {
    const index = queue.shift();

    if (connected.has(index)) continue;
    connected.add(index);

    const pipe = pipes[index];
    const connections = getRotatedConnections(pipe);

    const directions = {
      top: [-1, 0],
      right: [0, 1],
      bottom: [1, 0],
      left: [0, -1]
    };

    for (const direction of connections) {
      const [dr, dc] = directions[direction];

      const newRow = pipe.row + dr;
      const newCol = pipe.col + dc;

      if (
        newRow < 0 ||
        newRow >= SIZE ||
        newCol < 0 ||
        newCol >= SIZE
      ) {
        continue;
      }

      const nextIndex = newRow * SIZE + newCol;
      const nextPipe = pipes[nextIndex];

      if (!nextPipe) continue;

      const opposite = {
        top: "bottom",
        right: "left",
        bottom: "top",
        left: "right"
      };

      const nextConnections =
        getRotatedConnections(nextPipe);

      if (nextConnections.includes(opposite[direction])) {
        queue.push(nextIndex);
      }
    }
  }

  if (connected.has(8)) {
    startWaterAnimation();
  } else {
    message.textContent =
      "🔧 Keep fixing the broken pipes!";
  }
}




  // All pipes are repaired
 

// ------------------------------------------------------
// RUNNING WATER
// ------------------------------------------------------

function startWaterAnimation() {
  if (gameOver) return;

  message.textContent = "💧 Water is flowing through the repaired pipes!";

  const water = document.createElement("div");

  water.id = "runningWater";
  water.innerHTML = "💧";

  water.style.position = "fixed";
  water.style.fontSize = "28px";
  water.style.zIndex = "9999";
  water.style.pointerEvents = "none";
  water.style.transition = "all 0.45s linear";

  document.body.appendChild(water);

  const path = solutionPath.map(([row, col]) => {
    return row * SIZE + col;
  });

  let step = 0;

  function moveWater() {
    const tile = board.children[path[step]];

    if (!tile) return;

    const rect = tile.getBoundingClientRect();

    water.style.left =
      `${rect.left + rect.width / 2 - 14}px`;

    water.style.top =
      `${rect.top + rect.height / 2 - 14}px`;

    step++;

    if (step < path.length) {
      setTimeout(moveWater, 500);
    } else {
      setTimeout(() => {
        water.remove();

        score += 500;
        updateDisplays();

        message.textContent =
          "🎉 Mission complete! The water reached the exit!";

        gameOver = true;

        if (timer) {
          clearInterval(timer);
        }
      }, 600);
    }
  }

  moveWater();
}
// ------------------------------------------------------
// TIMER
// ------------------------------------------------------

function startTimer() {

  if (timer) {
    clearInterval(timer);
  }

  timer = setInterval(() => {

    if (!gameStarted || gameOver) return;

    timeLeft--;


    updateDisplays();

    if (timeLeft <= 0) {

      clearInterval(timer);

      gameOver = true;

      message.textContent =
        "⏰ Time is up! Try again!";
    }

  }, 1000);
}

// ------------------------------------------------------
// START GAME
// ------------------------------------------------------

function startGame() {

  score = 1000;
  level = 1;
  moves = 0;
  timeLeft = 30;
  gameOver = false;
  gameStarted = true;

  createBoard();

  message.textContent =
    "🚰 Water is ready! Repair the pipes!";

  updateDisplays();

  startTimer();
}

// ------------------------------------------------------
// UPDATE DISPLAY
// ------------------------------------------------------

function updateDisplays() {

  if (scoreDisplay) {
    scoreDisplay.textContent = score;
  }

  if (levelDisplay) {
    levelDisplay.textContent = level;
  }

  if (movesDisplay) {
    movesDisplay.textContent = moves;
  }

  if (timerDisplay) {
    timerDisplay.textContent = timeLeft;
  }
}

// ------------------------------------------------------
// START BUTTON
// ------------------------------------------------------

startButton.addEventListener("click", startGame);

// ------------------------------------------------------
// INITIAL GAME
// ------------------------------------------------------

createBoard();
updateDisplays();

message.textContent =
  "🚰 Turn on the faucet and repair the broken pipes!";