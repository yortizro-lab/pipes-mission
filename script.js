/**
 * Pipes Mission - Core Game Logic with Bucket Progress & Pipe Repair
 */

// --- Game Configuration & State ---
const BOARD_ROWS = 3;
const BOARD_COLS = 4;
let moves = 0;
let targetPercent = 0;
let timeLeft = 102; // 1 min 42 sec
let timerInterval = null;

// Definition of Pipe Types & Open Directions (N, E, S, W)
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

// Initial Level Layout matching Level 3 design
let gridState = [
  { row: 0, col: 0, type: 'corner', rot: 90, broken: false },
  { row: 0, col: 1, type: 'straight', rot: 0, broken: false }, // Faucet Connection Point
  { row: 0, col: 2, type: 'straight', rot: 0, broken: true },
  { row: 0, col: 3, type: 'corner', rot: 180, broken: true },

  { row: 1, col: 0, type: 'corner', rot: 0, broken: true },
  { row: 1, col: 1, type: 'straight', rot: 90, broken: true },
  { row: 1, col: 2, type: 'cross', rot: 0, broken: false },
  { row: 1, col: 3, type: 'corner', rot: 270, broken: false },

  { row: 2, col: 0, type: 'corner', rot: 270, broken: false },
  { row: 2, col: 1, type: 'straight', rot: 90, broken: false },
  { row: 2, col: 2, type: 'bucket', rot: 0, broken: false }, // Target Bucket
  { row: 2, col: 3, type: 'corner', rot: 180, broken: false }
];

// --- Core Helper Functions ---

/** Calculates rotated direction openings based on angle (0, 90, 180, 270) */
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

/** Checks if two adjacent tiles have matching open ends */
function canConnect(tileA, tileB, directionKey) {
  const openingsA = getTileOpenings(tileA);
  const openingsB = getTileOpenings(tileB);
  const oppDir = DIRECTIONS[directionKey].opposite;

  return openingsA.includes(directionKey) && openingsB.includes(oppDir);
}

/** Breadth-First Search (BFS) Pathfinding from Faucet to Bucket */
function evaluateWaterFlow() {
  const sourceTile = gridState.find(t => t.row === 0 && t.col === 1);
  const targetBucket = gridState.find(t => t.type === 'bucket');
 
  // Clear connected/leaking flags across board
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
          // Check if current tile points down into the bucket
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
            // Unconnected open end causes water leakage
            const openings = getTileOpenings(current);
            if (openings.includes(dir) && neighbor.broken) {
              current.leaking = true;
            }
          }
        }
      }
    }
  }

  // Update Progress Fill
  targetPercent = reachesBucket ? 100 : Math.min(75, visited.size * 15);
  updateProgressUI(targetPercent);
}

// --- Interaction & Rendering ---

function handleTileClick(index) {
  const tile = gridState[index];
  if (tile.type === 'bucket') return;

  // Repair broken pipe first; rotate normally if fixed
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
      alert("Time's up! Try fixing the pipes faster next time.");
    }
  }, 1000);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  renderGrid();
  evaluateWaterFlow();
  startTimer();
});