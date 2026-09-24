const board = document.getElementById("gameArea");
const message = document.getElementById("message");
const startButton = document.getElementById("startButton");

const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");

let score = 1000;
let level = 1;
let moves = 0;
let time = 30;
let timer;

const puzzle = [
  ["horizontal", "corner", "horizontal"],
  ["vertical", "corner", "vertical"],
  ["horizontal", "corner", "horizontal"]
];

function createBoard() {
  board.innerHTML = "";

  puzzle.forEach((type, row) => {
    type.forEach((pipeType, col) => {

      const tile = document.createElement("button");

      tile.className = "pipe-tile";

      const pipe = document.createElement("div");
      pipe.className = "pipe " + pipeType;

      tile.appendChild(pipe);

      tile.addEventListener("click", () => rotatePipe(tile));

      board.appendChild(tile);
    });
  });
}

function rotatePipe(tile) {
  const pipe = tile.querySelector(".pipe");

  let rotation = Number(tile.dataset.rotation || 0);

  rotation += 90;

  tile.dataset.rotation = rotation;

  pipe.style.transform =
    `translate(-50%, -50%) rotate(${rotation}deg)`;

  moves++;

  movesDisplay.textContent = moves;

  checkWin();
}

function checkWin() {

  if (moves >= 5) {

    clearInterval(timer);

    score += Math.max(100, 500 - moves * 20);

    scoreDisplay.textContent = score;

    message.textContent = "💧 Mission complete! Water reached the EXIT! 🚰";

    message.classList.add("success");

    animateWater();
  }
}

function animateWater() {

  const tiles = document.querySelectorAll(".pipe-tile");

  tiles.forEach((tile, index) => {

    setTimeout(() => {

      tile.classList.add("flowing");

    }, index * 250);

  });
}
function startGame() {
  clearInterval(timer);

  score = 1000;
  level = 1;
  moves = 0;
  time = 30;

  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
  movesDisplay.textContent = moves;
  timerDisplay.textContent = time;

  message.textContent = "💧 Mission started! Connect the pipes!";
  message.classList.remove("success");

  createBoard();

  timer = setInterval(() => {
    time--;
    timerDisplay.textContent = time;

    if (time <= 0) {
      clearInterval(timer);
      message.textContent = "⏰ Time's up! Try again!";
    }
  }, 1000);
}

startButton.addEventListener("click", startGame);