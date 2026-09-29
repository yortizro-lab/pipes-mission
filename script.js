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

let score = 0;
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
  [1, 0],
  [1, 1],
  [1, 2],
  [2, 2],
];

// ------------------------------------------------------
// CONNECTIONS
// ------------------------------------------------------

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
function getRotatedConnections(pipe) {
  let connections = [...pipe.correctConnections];

  const rotationMap = {
    top: "right",
    right: "bottom",
    bottom: "left",
    left: "top"
  };

  for (let i = 0; i < pipe.rotation; i++) {
    connections = connections.map(direction => rotationMap[direction]);
  }

  return connections;
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
  board.style.gap = "0px";
  board.style.justifyContent = "center";
  board.style.alignItems = "center";
  board.style.padding = "0px";

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

      if (pathIndex === -1) {
         continue;
      }

      const type = getPipeType(connections);

      const pipe = {
        row: row,
        col: col,
        correctConnections: connections,
        rotation: (pipes.lenght % 3) + 1,
        fixed: false
      };

      pipes.push(pipe);

      const tile = document.createElement("button");

      tile.className = "pipe-tile broken";
      tile.dataset.index = pipes.length - 1;

      tile.style.width = "80px";
      tile.style.height = "80px";
      tile.style.boxSizing = "border-box";
      tile.style.gridRow = row + 1;
      tile.style.gridColumn = col + 1;
      tile.style.position = "relative";
      tile.style.border = "3px solid #36d1ff";
      tile.style.borderRadius = "12px";
      tile.style.background = "#075ca8";
      tile.style.cursor = "pointer";

      tile.innerHTML = `
        <span class="broken-mark">🔧</span>
        <span class="pipe-shape ${type}"></span>
      `;

      tile.addEventListener("click", () => {
        const index = Number(tile.dataset.index);
       rotatePipe(index);
       });

      board.appendChild(tile);
      updatePipeVisual(tile, pipe);

    }
  }
}
  addWaterMarkers();

function rotatePipe(index) {
    if (!gameStarted || gameOver) return;

    const pipe = pipes[index];

    if (!pipe) return;

    pipe.rotation = (pipe.rotation + 1) % 4;

    moves++;
    score += 10;

    const tile = board.children[index];

    updatePipeVisual(tile, pipe);
    updateDisplays();
    checkWaterFlow();
}
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
  faucet.style.margin = "0px auto";
  faucet.style.color = "white";

  board.parentElement.insertBefore(faucet, board);

  const exit = document.createElement("div");

  exit.className = "game-exit";
  exit.innerHTML = `
    <div style="font-size:40px;">💧</div>
    <strong>WATER EXIT</strong>
  `;

  exit.style.textAlign = "center";
  exit.style.margin = "0px auto";
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

    const connections = pipe.correctConnections;

    shape.style.display = "block";
    shape.style.position = "absolute";
    shape.style.left = "50%";
    shape.style.top = "50%";
    shape.style.width = "80px";
    shape.style.height = "80px";
    shape.style.boxSizing = "border-box";
    shape.style.background = "transparent";
    shape.style.border = "0";
    shape.style.borderRadius = "0";

    shape.style.transform =
        `translate(-50%, -50%) rotate(${pipe.rotation * 90}deg)`;

    let path = "";

    // LEFT + RIGHT
    if (
        connections.includes("left") &&
        connections.includes("right")
    ) {
        path = "M 0 40 L 80 40";
    }

    // TOP + BOTTOM
    else if (
        connections.includes("top") &&
        connections.includes("bottom")
    ) {
        path = "M 40 0 L 40 80";
    }

    // LEFT + BOTTOM
    else if (
        connections.includes("left") &&
        connections.includes("bottom")
    ) {
        path = "M 0 40 Q 40 40 40 80";
    }

    // RIGHT + BOTTOM
    else if (
        connections.includes("right") &&
        connections.includes("bottom")
    ) {
        path = "M 80 40 Q 40 40 40 80";
    }

    // LEFT + TOP
    else if (
        connections.includes("left") &&
        connections.includes("top")
    ) {
        path = "M 0 40 Q 40 40 40 0";
    }

    // RIGHT + TOP
    else if (
        connections.includes("right") &&
        connections.includes("top")
    ) {
        path = "M 80 40 Q 40 40 40 0";
    }

    shape.innerHTML = `
        <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            style="display:block; overflow:visible;"
        >
            <path
                d="${path}"
                fill="none"
                stroke="#61e8ff"
                stroke-width="18"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    `;

    if (broken) {
        broken.style.position = "absolute";
        broken.style.top = "3px";
        broken.style.right = "4px";
        broken.style.fontSize = "16px";
    }

    tile.style.boxShadow =
        "0 0 8px rgba(0, 220, 255, 0.4)";
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


// ------------------------------------------------------
// START GAME
// ------------------------------------------------------

function startGame(){
  score = 0;
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

startButton.addEventListener("click", startGame );
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