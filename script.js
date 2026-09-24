const gameArea = document.getElementById("gameArea");
const startButton = document.getElementById("startButton");
const message = document.getElementById("message");

const scoreDisplay = document.getElementById("score");
const movesDisplay = document.getElementById("moves");
const bestScoreDisplay = document.getElementById("bestScore");

const SIZE = 5;

let board = [];
let moves = 0;
let score = 1000;
let bestScore = 0;

const solution = [
  ["R", "LR", "LR", "LR", "LDR"],
  ["URD", "LR", "LR", "LR", "LU"],
  ["UR", "LR", "LR", "LR", "LDR"],
  ["URD", "LR", "LR", "LR", "LU"],
  ["UR", "R", "LR", "LR", "L"]
];

function rotateConnections(connections) {
  return connections
    .split("")
    .map(direction => {
      const rotations = {
        U: "R",
        R: "D",
        D: "L",
        L: "U"
      };

      return rotations[direction];
    })
    .sort()
    .join("");
}

function createBoard() {
  board = [];

  for (let row = 0; row < SIZE; row++) {
    const boardRow = [];

    for (let col = 0; col < SIZE; col++) {
      let connections = solution[row][col];

      // Easier puzzle: only 0 or 1 random rotations.
      const rotations = Math.floor(Math.random() * 2);

      for (let i = 0; i < rotations; i++) {
        connections = rotateConnections(connections);
      }

      boardRow.push({
        solution: solution[row][col],
        connections: connections,
        row: row,
        col: col
      });
    }

    board.push(boardRow);
  }

  moves = 0;
  score = 1000;

  updateScoreboard();
}

function updateScoreboard() {
  scoreDisplay.textContent = score;
  movesDisplay.textContent = moves;
  bestScoreDisplay.textContent = bestScore;
}

function drawBoard() {
  gameArea.innerHTML = "";

  const flowingTiles = getConnectedTiles();

  const grid = document.createElement("div");
  grid.className = "pipe-grid";

  board.forEach(row => {
    row.forEach(tile => {
      const pipeButton = document.createElement("button");

      pipeButton.className = "pipe-tile";
      pipeButton.type = "button";

      const key = `${tile.row}-${tile.col}`;

      if (flowingTiles.has(key)) {
        pipeButton.classList.add("flowing");
      }

      pipeButton.setAttribute(
        "aria-label",
        `Pipe at row ${tile.row + 1}, column ${tile.col + 1}`
      );

      drawPipe(pipeButton, tile.connections);

      pipeButton.addEventListener("click", () => {
        tile.connections = rotateConnections(tile.connections);

        moves++;
        score = Math.max(0, score - 10);

        updateScoreboard();
        drawBoard();
        checkWin();
      });

      grid.appendChild(pipeButton);
    });
  });

  gameArea.appendChild(grid);
}

function drawPipe(element, connections) {
  element.innerHTML = "";

  const pipe = document.createElement("div");
  pipe.className = "pipe";

  if (connections.includes("U")) {
    pipe.classList.add("up");
  }

  if (connections.includes("R")) {
    pipe.classList.add("right");
  }

  if (connections.includes("D")) {
    pipe.classList.add("down");
  }

  if (connections.includes("L")) {
    pipe.classList.add("left");
  }

  element.appendChild(pipe);
}

function getConnectedTiles() {
  const visited = new Set();
  const queue = [{ row: 0, col: 0 }];

  const opposite = {
    U: "D",
    R: "L",
    D: "U",
    L: "R"
  };

  const movement = {
    U: [-1, 0],
    R: [0, 1],
    D: [1, 0],
    L: [0, -1]
  };

  while (queue.length > 0) {
    const current = queue.shift();
    const key = `${current.row}-${current.col}`;

    if (visited.has(key)) {
      continue;
    }

    visited.add(key);

    const tile = board[current.row][current.col];

    for (const direction of ["U", "R", "D", "L"]) {
      if (!tile.connections.includes(direction)) {
        continue;
      }

      const [dr, dc] = movement[direction];

      const newRow = current.row + dr;
      const newCol = current.col + dc;

      if (
        newRow < 0 ||
        newRow >= SIZE ||
        newCol < 0 ||
        newCol >= SIZE
      ) {
        continue;
      }

      const nextTile = board[newRow][newCol];

      if (nextTile.connections.includes(opposite[direction])) {
        queue.push({
          row: newRow,
          col: newCol
        });
      }
    }
  }

  return visited;
}

function checkWin() {
  const connectedTiles = getConnectedTiles();
  const targetKey = `${SIZE - 1}-${SIZE - 1}`;

  if (connectedTiles.has(targetKey)) {
    score += 500;

    if (score > bestScore) {
      bestScore = score;
    }

    updateScoreboard();

    message.textContent =
      `🎉 Mission complete! You saved the water with ${moves} moves!`;

    message.classList.add("success");
  }
}

function startGame() {
  message.classList.remove("success");
  message.textContent = "Mission started! Connect the pipes!";

  createBoard();
  drawBoard();
}

startButton.addEventListener("click", startGame);

startGame();