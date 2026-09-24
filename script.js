const gameArea = document.getElementById("gameArea");
const startButton = document.getElementById("startButton");
const message = document.getElementById("message");

const SIZE = 5;

let board = [];
let moves = 0;

// The solution creates a path that moves across each row.
const solution = [
  ["R", "LR", "LR", "LR", "LDR"],
  ["URD", "LR", "LR", "LR", "LU"],
  ["UR", "LR", "LR", "LR", "LDR"],
  ["URD", "LR", "LR", "LR", "LU"],
  ["UR", "R", "LR", "LR", "L"]
];

// Rotate connections clockwise.
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

// Create the board.
function createBoard() {
  board = [];

  for (let row = 0; row < SIZE; row++) {
    const boardRow = [];

    for (let col = 0; col < SIZE; col++) {
      let connections = solution[row][col];

      // Randomly rotate each pipe.
      const rotations = Math.floor(Math.random() * 4);

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
}

// Draw the board.
function drawBoard() {
  gameArea.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "pipe-grid";

  board.forEach(row => {
    row.forEach(tile => {
      const pipe = document.createElement("button");

      pipe.className = "pipe-tile";
      pipe.type = "button";
      pipe.setAttribute(
        "aria-label",
        `Pipe at row ${tile.row + 1}, column ${tile.col + 1}`
      );

      drawPipe(pipe, tile.connections);

      pipe.addEventListener("click", () => {
        tile.connections = rotateConnections(tile.connections);
        moves++;

        drawBoard();
        checkWin();
      });

      grid.appendChild(pipe);
    });
  });

  gameArea.appendChild(grid);
}

// Draw the pipe shape.
function drawPipe(element, connections) {
  element.innerHTML = "";

  const pipe = document.createElement("div");
  pipe.className = "pipe";

  if (connections.includes("U")) pipe.classList.add("up");
  if (connections.includes("R")) pipe.classList.add("right");
  if (connections.includes("D")) pipe.classList.add("down");
  if (connections.includes("L")) pipe.classList.add("left");

  element.appendChild(pipe);
}

// Check whether two neighboring pipes connect.
function connects(tile, direction) {
  return tile.connections.includes(direction);
}

// Check if the player completed the path.
function checkWin() {
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

    if (visited.has(key)) continue;

    visited.add(key);

    const tile = board[current.row][current.col];

    for (const direction of ["U", "R", "D", "L"]) {
      if (!connects(tile, direction)) continue;

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

      if (connects(nextTile, opposite[direction])) {
        queue.push({
          row: newRow,
          col: newCol
        });
      }
    }
  }

  const targetKey = `${SIZE - 1}-${SIZE - 1}`;

  if (visited.has(targetKey)) {
    message.textContent =
      `🎉 Mission complete! You saved the water in ${moves} moves!`;
    message.classList.add("success");
  }
}

// Start/restart the game.
function startGame() {
  message.classList.remove("success");
  message.textContent = "Mission started! Connect the pipes!";

  createBoard();
  drawBoard();
}

startButton.addEventListener("click", startGame);

// Start automatically.
startGame();   