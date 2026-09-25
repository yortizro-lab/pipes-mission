/ ==========================================
// PIPES MISSION - BROKEN PIPES GAME
// ==========================================

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
let gameOver = false;

// The correct path goes through all 9 spaces.
// START: top-left
// EXIT: bottom-right
const solutionPath = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 1],
  [1, 0],
  [2, 0],
  [2, 1],
  [2, 2]
];

let pipes = [];

// ==========================================
// CREATE BOARD
// ==========================================

function createBoard() {
  board.innerHTML = "";
  pipes = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {

      const pathIndex = solutionPath.findIndex(
        position => position[0] === row && position[1] === col
      );

      let connections;

      if (pathIndex !== -1) {
        connections = getSolutionConnections(pathIndex);
      } else {
        connections = ["top", "bottom"];
      }

      const type =
        connections.length === 2 &&
        (
          (connections.includes("top") && connections.includes("bottom")) ||
          (connections.includes("left") && connections.includes("right"))
        )
          ? "straight"
          : "corner";

      const pipe = {
        row: row,
        col: col,
        type: type,
        correctConnections: connections,
        rotation: Math.floor(Math.random() * 4),
        fixed: false
      };

      pipes.push(pipe);

      const tile = document.createElement("button");
      tile.className = "pipe-tile broken";
      tile.dataset.index = pipes.length - 1;

      tile.innerHTML = `
        <span class="broken-mark">⚡</span>
        <span class="pipe-shape ${type}"></span>
      `;

      tile.addEventListener("click", () => rotatePipe(pipes.length - 1));

      board.appendChild(tile);

      updatePipeVisual(tile, pipe);
    }
  }
}

// ==========================================
// GET CORRECT CONNECTIONS
// ==========================================

function getSolutionConnections(index) {

  const current = solutionPath[index];

  const connections = [];

  if (index > 0) {
    const previous = solutionPath[index - 1];

    if (previous[0] < current[0]) connections.push("top");
    if (previous[0] > current[0]) connections.push("bottom");
    if (previous[1] < current[1]) connections.push("left");
    if (previous[1] > current[1]) connections.push("right");
  }

  if (index < solutionPath.length - 1) {
    const next = solutionPath[index + 1];

    if (next[0] < current[0]) connections.push("top");
    if (next[0] > current[0]) connections.push("bottom");
    if (next[1] < current[1]) connections.push("left");
    if (next[1] > current[1]) connections.push("right");
  }

  return connections;
}

// ==========================================
// ROTATE PIPE
// ==========================================

function rotatePipe(index) {

  if (gameOver) return;

  const pipe = pipes[index];

  pipe.rotation = (pipe.rotation + 1) % 4;

  moves++;

  updateDisplays();

  const tile = board.children[index];

  tile.classList.add("repairing");

  setTimeout(() => {
    tile.classList.remove("repairing");
  }, 200);

  updatePipeVisual(tile, pipe);

  checkConnections();
}

// ==========================================
// UPDATE PIPE VISUAL
// ==========================================

function updatePipeVisual(tile, pipe) {

  const shape = tile.querySelector(".pipe-shape");

  shape.className = `pipe-shape ${pipe.type}`;

  shape.style.transform =
    `rotate(${pipe.rotation * 90}deg)`;

  if (pipe.rotation === 0) {
    tile.dataset.rotation = "0";
  }

  if (pipe.rotation === 1) {
    tile.dataset.rotation = "90";
  }

  if (pipe.rotation === 2) {
    tile.dataset.rotation = "180";
  }

  if (pipe.rotation === 3) {
    tile.dataset.rotation = "270";
  }

  tile.classList.add("broken");
}

// ==========================================
// GET CURRENT CONNECTIONS
// ==========================================

function getCurrentConnections(pipe) {

  let connections = [...pipe.correctConnections];

  for (let i = 0; i < pipe.rotation; i++) {
    connections = connections.map(direction => {

      if (direction === "top") return "right";
      if (direction === "right") return "bottom";
      if (direction === "bottom") return "left";
      if (direction === "left") return "top";

      return direction;
    });
  }

  return connections;
}

// ==========================================
// CHECK IF PIPES ARE CONNECTED
// ==========================================

function checkConnections() {

  const connected = [];

  let currentRow = 0;
  let currentCol = 0;

  connected.push([currentRow, currentCol]);

  for (let i = 0; i < solutionPath.length - 1; i++) {

    const currentPipe = getPipe(currentRow, currentCol);

    const nextPosition = solutionPath[i + 1];

    const nextRow = nextPosition[0];
    const nextCol = nextPosition[1];

    const nextPipe = getPipe(nextRow, nextCol);

    const currentConnections =
      getCurrentConnections(currentPipe);

    const nextConnections =
      getCurrentConnections(nextPipe);

    let direction;

    if (nextRow < currentRow) direction = "top";
    if (nextRow > currentRow) direction = "bottom";
    if (nextCol < currentCol) direction = "left";
    if (nextCol > currentCol) direction = "right";

    const opposite = {
      top: "bottom",
      bottom: "top",
      left: "right",
      right: "left"
    };

    if (
      currentConnections.includes(direction) &&
      nextConnections.includes(opposite[direction])
    ) {
      connected.push([nextRow, nextCol]);

      currentRow = nextRow;
      currentCol = nextCol;
    } else {
      break;
    }
  }

  markConnectedPipes(connected);

  if (connected.length === solutionPath.length) {
    completeMission();
  }
}

// ==========================================
// GET PIPE
// ==========================================

function getPipe(row, col) {

  return pipes.find(
    pipe => pipe.row === row && pipe.col === col
  );
}

// ==========================================
// SHOW CONNECTED / WATER PIPES
// ==========================================

function markConnectedPipes(connected) {

  pipes.forEach((pipe, index) => {

    const tile = board.children[index];

    const isConnected = connected.some(
      position =>
        position[0] === pipe.row &&
        position[1] === pipe.col
    );

    if (isConnected) {
      tile.classList.add("connected");
      tile.classList.remove("broken");

      pipe.fixed = true;

      const brokenMark =
        tile.querySelector(".broken-mark");

      if (brokenMark) {
        brokenMark.textContent = "💧";
      }
    }
  });
}

// ==========================================
// COMPLETE MISSION
// ==========================================

function completeMission() {

  if (gameOver) return;

  gameOver = true;

  clearInterval(timer);

  score += Math.max(100, timeLeft * 40);

  updateDisplays();

  message.textContent =
    "💧 Mission complete! Water is flowing to the faucet! 🚰";

  message.classList.add("success");

  board.classList.add("water-flowing");

  animateWater();

  setTimeout(() => {
    message.textContent =
      "🚰 Water reached the faucet! Great job!";
  }, 1800);
}

// ==========================================
// WATER ANIMATION
// ==========================================

function animateWater() {

  const tiles =
    document.querySelectorAll(".pipe-tile.connected");

  tiles.forEach((tile, index) => {

    setTimeout(() => {

      tile.classList.add("flowing");

    }, index * 180);
  });
}

// ==========================================
// START GAME
// ==========================================

function startGame() {

  clearInterval(timer);

  score = 1000;
  moves = 0;
  timeLeft = 30;
  gameOver = false;

  message.classList.remove("success");

  message.textContent =
    "🔧 Fix the broken pipes and connect the water!";

  board.classList.remove("water-flowing");

  createBoard();

  updateDisplays();

  startTimer();
}

// ==========================================
// TIMER
// ==========================================

function startTimer() {

  timer = setInterval(() => {

    if (gameOver) {
      clearInterval(timer);
      return;
    }

    timeLeft--;

    updateDisplays();

    if (timeLeft <= 0) {

      clearInterval(timer);

      gameOver = true;

      message.textContent =
        "⏰ Time's up! The pipes need more repairs.";

      message.classList.remove("success");
    }

  }, 1000);
}

// ==========================================
// UPDATE SCORE / LEVEL / MOVES / TIMER
// ==========================================

function updateDisplays() {

  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
  movesDisplay.textContent = moves;
  timerDisplay.textContent = timeLeft;
}

// ==========================================
// BUTTON
// ==========================================

startButton.addEventListener("click", startGame);

// Create first board
createBoard();

updateDisplays();