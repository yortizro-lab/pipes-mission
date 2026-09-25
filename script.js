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

  // Faucet / water starting point
  const faucet = document.createElement("div");
  faucet.className = "faucet";
  faucet.innerHTML = `
    🚰
    <span>WATER START</span>
  `;
  board.appendChild(faucet);

  const waterFlow = document.createElement("div");
  waterFlow.id = "waterFlow";
  board.appendChild(waterFlow);

  // Create the 3 x 3 pipe puzzle
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
        <span class="broken-mark">✦</span>
        <span class="pipe-shape ${type}"></span>
      `;

      tile.addEventListener("click", () => {
        rotatePipe(pipes.length - 1);
      });

      board.appendChild(tile);

      updatePipeVisual(tile, pipe);
    }
  }
}