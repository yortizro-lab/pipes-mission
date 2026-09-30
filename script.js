/**
 * Pipes Mission - Multi-Level Game Logic with Bucket Progress & Pipe Repair
 */

// --- Game Levels Definition ---
const LEVELS = [
  // LEVEL 1: Simple 3x3 layout, no broken pipes, easy intro
  {
    levelNumber: 1,
    rows: 3,
    cols: 3,
    time: 120,
    movesAllowed: 10,
    targetBucketPos: { row: 2, col: 2 },
    sourcePos: { row: 0, col: 1 },
    grid: [
      { row: 0, col: 0, type: 'corner', rot: 90, broken: false },
      { row: 0, col: 1, type: 'straight', rot: 90, broken: false }, // Faucet input
      { row: 0, col: 2, type: 'corner', rot: 180, broken: false },

      { row: 1, col: 0, type: 'straight', rot: 0, broken: false },
      { row: 1, col: 1, type: 'corner', rot: 270, broken: false },
      { row: 1, col: 2, type: 'straight', rot: 0, broken: false },

      { row: 2, col: 0, type: 'corner', rot: 0, broken: false },
      { row: 2, col: 1, type: 'straight', rot: 90, broken: false },
      { row: 2, col: 2, type: 'bucket', rot: 0, broken: false } // Target Bucket
    ]
  },
 
  // LEVEL 2: 3x3 layout introducing broken pipes
  {
    levelNumber: 2,
    rows: 3,
    cols: 3,
    time: 110,
    movesAllowed: 12,
    targetBucketPos: { row: 2, col: 2 },
    sourcePos: { row: 0, col: 1 },
    grid: [
      { row: 0, col: 0, type: 'corner', rot: 0, broken: false },
      { row: 0, col: 1, type: 'straight', rot: 0, broken: true },
      { row: 0, col: 2, type: 'corner', rot: 90, broken: false },

      { row: 1, col: 0, type: 'straight', rot: 90, broken: true },
      { row: 1, col: 1, type: 'cross', rot: 0, broken: false },
      { row: 1, col: 2, type: 'straight', rot: 0, broken: false },

      { row: 2, col: 0, type: 'corner', rot: 180, broken: false },
      { row: 2, col: 1, type: 'straight', rot: 90, broken: false },
      { row: 2, col: 2, type: 'bucket', rot: 0, broken: false }
    ]
  },

  // LEVEL 3: Full 4x3 layout (The original challenge)
  {
    levelNumber: 3,
    rows: 3,
    cols: 4,
    time: 102,
    movesAllowed: 15,
    targetBucketPos: { row: 2, col: 2 },
    sourcePos: { row: 0, col: 1 },
    grid: [
      { row: 0, col: 0, type: 'corner', rot: 90, broken: false },
      { row: 0, col: 1, type: 'straight', rot: 0, broken: false },
      { row: 0, col: 2, type: 'straight', rot: 0, broken: true },
      { row: 0, col: 3, type: 'corner', rot: 180, broken: true },

      { row: 1, col: 0, type: 'corner', rot: 0, broken: true },
      { row: 1, col: 1, type: 'straight', rot: 90, broken: true },
      { row: 1, col: 2, type: 'cross', rot: 0, broken: false },
      { row: 1, col: 3, type: 'corner', rot: 270, broken: false },

      { row: 2, col: 0, type: 'corner', rot: 270, broken: false },
      { row: 2, col: 1, type: 'straight', rot: 90, broken: false },
      { row: 2, col: 2, type: 'bucket', rot: 0, broken: false },
      { row: 2, col: 3, type: 'corner', rot: 180, broken: false }
    ]
  }
];

// --- Global State ---
let currentLevelIndex = 0;
let moves = 0;
let targetPercent = 0;
let timeLeft = 0;
let timerInterval = null;
let gridState = [];

const PIPE_TYPES = {
  straight: ['N', 'S'],
  corner: ['S', 'E'],
  cross: ['N', 'E', 'S', 'W'],
  bucket: []
};

const DIRECTIONS = {
  N: { row: -1, col: 0, opposite: 'S' },
  E: { row: 0, col: 1, opposite: 'W' },
  S: { row: 1, col: 0, opposite: 'N' },
  W: { row: 0, col: -1, opposite: 'E' }
};

// --- Level Controls ---

function loadLevel(levelIdx) {
  if (levelIdx >= LEVELS.length) {
    alert("🎉 Congratulations! You have completed all levels!");
    levelIdx = 0; // Restart from Level 1
  }

  currentLevelIndex = levelIdx;
  const currentLevel = LEVELS[currentLevelIndex];

  // Deep clone level grid to prevent mutating template data
  gridState = JSON.parse(JSON.stringify(currentLevel.grid));
  moves = 0;
  targetPercent = 0;
  timeLeft = currentLevel.time;

  // Update UI Elements
  const titleEl = document.querySelector('.level-title');
  if (titleEl) titleEl.textContent = `LEVEL ${currentLevel.levelNumber} — PIPE REPAIR`;

  document.getElementById('moves').textContent = moves;

  // Set CSS grid dynamic column count for varying layout sizes
  const gridContainer = document.getElementById('grid');
  if (gridContainer) {
    gridContainer.style.gridTemplateColumns = `repeat(${currentLevel.cols}, 1fr)`;
  }

  clearInterval(timerInterval);
  startTimer();
  evaluateWaterFlow();
  renderGrid();
}

/** Calculates pipe direction openings based on angle */
function getTileOpenings(tile) {
  if (tile.broken || tile.type === 'bucket') return [];
 
  const baseOpenings = PIPE_TYPES[tile.type] || [];
  const shift = (tile.rot / 90) % 4;
  const dirOrder = ['N', 'E', 'S', 'W'];

  return baseOpenings.map(dir => {
    let index = (dirOrder.indexOf(dir) + shift) % 4;
    return dirOrder[index];
  });
}

function canConnect(tileA, tileB, directionKey) {
  const openingsA = getTileOpenings(tileA);
  const openingsB = getTileOpenings(tileB);
  const oppDir = DIRECTIONS[directionKey].opposite;

  return openingsA.includes(directionKey) && openingsB.includes(oppDir);
}

/** Pathfinding to check water path */
function evaluateWaterFlow() {
  const currentLevel = LEVELS[currentLevelIndex];
  const sourceTile = gridState.find(t => t.row === currentLevel.sourcePos.row && t.col === currentLevel.sourcePos.col);
 
  gridState.forEach(t => { t.filled = false; t.leaking = false; });

  if (!sourceTile || sourceTile.broken) {
    updateProgressUI(0);
    return;
  }

  let queue = [sourceTile];
  let visited = new Set([`${sourceTile.row},${sourceTile.col}`]);
  sourceTile.filled = true;
  let reachesBucket = false;

  while (queue.length > 0) {
    let current = queue.shift();

    for (let dir in DIRECTIONS) {
      let nextRow = current.row + DIRECTIONS[dir].row;
      let nextCol = current.col + DIRECTIONS[dir].col;
      let neighbor = gridState.find(t => t.row === nextRow && t.col === nextCol);

      if (neighbor) {
        if (neighbor.type === 'bucket') {
          const openings = getTileOpenings(current);
          if (dir === 'S' && openings.includes('S')) {
            reachesBucket = true;
          }
        } else if (!visited.has(`${nextRow},${nextCol}`)) {
          if (canConnect(current, neighbor, dir)) {
            visited.add(`${nextRow},${nextCol}`);
            neighbor.filled = true;
            queue.push(neighbor);
          } else {
            const openings = getTileOpenings(current);
            if (openings.includes(dir) && neighbor.broken) {
              current.leaking = true;
            }
          }
        }
      }
    }
  }

  targetPercent = reachesBucket ? 100 : Math.min(75, visited.size * 20);
  updateProgressUI(targetPercent);

  // Check level completion
  if (reachesBucket && targetPercent === 100) {
    setTimeout(() => {
      alert(`Level ${LEVELS[currentLevelIndex].levelNumber} Complete! Moving to next level...`);
      loadLevel(currentLevelIndex + 1);
    }, 400);
  }
}

function handleTileClick(index) {
  const tile = gridState[index];
  if (tile.type === 'bucket') return;

  if (tile.broken) {
    tile.broken = false;
  } else {
    tile.rot = (tile.rot + 90) % 360;
  }

  moves++;
  document.getElementById('moves').textContent = moves;

  evaluateWaterFlow();
  renderGrid();
}

function updateProgressUI(pct) {
  const fillEl = document.getElementById('progress-fill');
  const pctEl = document.getElementById('target-pct');
  const bucketWater = document.getElementById('bucket-water');

  if (fillEl) fillEl.style.width = `${pct}%`;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (bucketWater) bucketWater.style.height = `${pct}%`;
}

function renderGrid() {
  const gridContainer = document.getElementById('grid');
  if (!gridContainer) return;
 
  gridContainer.innerHTML = '';

  gridState.forEach((tile, idx) => {
    const tileEl = document.createElement('div');
   
    if (tile.type === 'bucket') {
      tileEl.className = 'bucket';
      tileEl.innerHTML = `
        <div class="bucket-water" id="bucket-water" style="height:${targetPercent}%"></div>
        <div class="bucket-label">COLLECTION BUCKET</div>
      `;
    } else {
      tileEl.className = `tile ${tile.broken ? 'broken' : ''} ${tile.leaking ? 'leaking' : ''}`;
     
      const pipeEl = document.createElement('div');
      pipeEl.className = `pipe ${tile.filled ? 'active' : ''}`;
      pipeEl.style.transform = `rotate(${tile.rot}deg)`;

      if (tile.type === 'straight') pipeEl.innerHTML = `<div class="pipe-inner pipe-straight"></div>`;
      if (tile.type === 'corner') pipeEl.innerHTML = `<div class="pipe-corner"></div>`;
      if (tile.type === 'cross') pipeEl.innerHTML = `<div class="pipe-cross"></div>`;

      tileEl.appendChild(pipeEl);
      tileEl.innerHTML += `<div class="leak-effect">💦</div>`;

      tileEl.addEventListener('click', () => handleTileClick(idx));
    }

    gridContainer.appendChild(tileEl);
  });
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      let mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      let secs = (timeLeft % 60).toString().padStart(2, '0');
      const timerEl = document.getElementById('timer');
      if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    } else {
      clearInterval(timerInterval);
      alert("Time's up! Reloading level...");
      loadLevel(currentLevelIndex);
    }
  }, 1000);
}

// --- Init Game on Level 1 ---
document.addEventListener('DOMContentLoaded', () => {
  loadLevel(0); // Starts game on Level 1
});