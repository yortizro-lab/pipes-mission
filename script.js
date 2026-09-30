const LEVELS = [
  // LEVEL 1: Easy 3x3 layout
  {
    levelNumber: 1,
    rows: 3,
    cols: 3,
    time: 120,
    sourcePos: { row: 0, col: 1 },
    grid: [
      { row: 0, col: 0, type: 'corner', rot: 90, broken: false },
      { row: 0, col: 1, type: 'straight', rot: 0, broken: false }, // Direct connection under faucet
      { row: 0, col: 2, type: 'corner', rot: 180, broken: false },

      { row: 1, col: 0, type: 'straight', rot: 90, broken: false },
      { row: 1, col: 1, type: 'corner', rot: 270, broken: false },
      { row: 1, col: 2, type: 'straight', rot: 0, broken: false },

      { row: 2, col: 0, type: 'corner', rot: 0, broken: false },
      { row: 2, col: 1, type: 'straight', rot: 90, broken: false },
      { row: 2, col: 2, type: 'bucket', rot: 0, broken: false }
    ]
  },
 
  // LEVEL 2: 3x3 introducing broken pipes
  {
    levelNumber: 2,
    rows: 3,
    cols: 3,
    time: 110,
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

  // LEVEL 3: 4x3 Grid Challenge
  {
    levelNumber: 3,
    rows: 3,
    cols: 4,
    time: 102,
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

let currentLevelIdx = 0;
let moves = 0;
let targetPercent = 0;
let timeLeft = 0;
let timerInterval = null;
let isPaused = false;
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

function loadLevel(idx) {
  if (idx >= LEVELS.length) {
    alert("🎉 Fantastic! You completed all levels!");
    idx = 0;
  }

  currentLevelIdx = idx;
  const currentLevel = LEVELS[currentLevelIdx];
  gridState = JSON.parse(JSON.stringify(currentLevel.grid));

  moves = 0;
  targetPercent = 0;
  timeLeft = currentLevel.time;
  isPaused = false;

  const titleEl = document.getElementById('level-title');
  if (titleEl) titleEl.textContent = `LEVEL ${currentLevel.levelNumber} — PIPE REPAIR`;
 
  document.getElementById('moves').textContent = moves;

  const gridContainer = document.getElementById('grid');
  if (gridContainer) {
    gridContainer.style.gridTemplateColumns = `repeat(${currentLevel.cols}, 1fr)`;
  }

  clearInterval(timerInterval);
  startTimer();
  evaluateWaterFlow();
  renderGrid();
}

function getTileOpenings(tile) {
  if (tile.broken || tile.type === 'bucket') return [];
  const base = PIPE_TYPES[tile.type] || [];
  const shift = (tile.rot / 90) % 4;
  const dirOrder = ['N', 'E', 'S', 'W'];

  return base.map(dir => {
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

function evaluateWaterFlow() {
  const level = LEVELS[currentLevelIdx];
  const sourceTile = gridState.find(t => t.row === level.sourcePos.row && t.col === level.sourcePos.col);

  gridState.forEach(t => { t.filled = false; t.leaking = false; });

  // If the pipe right under the faucet isn't pointing UP ('N'), no water enters
  const sourceOpenings = getTileOpenings(sourceTile);
  if (!sourceTile || sourceTile.broken || !sourceOpenings.includes('N')) {
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

  // Strictly 100% when full path connects to bucket, 0% when disconnected
  targetPercent = reachesBucket ? 100 : 0;
  updateProgressUI(targetPercent);

  if (reachesBucket && targetPercent === 100) {
    setTimeout(() => {
      alert(`Level ${LEVELS[currentLevelIdx].levelNumber} Complete!`);
      loadLevel(currentLevelIdx + 1);
    }, 300);
  }
}

function handleTileClick(index) {
  if (isPaused) return;

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
        <div class="bucket-label">BUCKET</div>
      `;
    } else {
      tileEl.className = `tile ${tile.broken ? 'broken' : ''} ${tile.leaking ? 'leaking' : ''}`;

      const pipeEl = document.createElement('div');
      pipeEl.className = `pipe ${tile.filled ? 'active' : ''}`;
      pipeEl.style.transform = `rotate(${tile.rot}deg)`;

      if (tile.type === 'straight') pipeEl.innerHTML = `<div class="pipe-straight"></div>`;
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
    if (!isPaused && timeLeft > 0) {
      timeLeft--;
      let mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      let secs = (timeLeft % 60).toString().padStart(2, '0');
      const timerEl = document.getElementById('timer');
      if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    } else if (timeLeft === 0) {
      clearInterval(timerInterval);
      alert("Time's up! Restarting level...");
      loadLevel(currentLevelIdx);
    }
  }, 1000);
}

function setupControls() {
  document.getElementById('btn-back')?.addEventListener('click', () => {
    loadLevel(currentLevelIdx);
  });

  document.getElementById('btn-pause')?.addEventListener('click', () => {
    isPaused = !isPaused;
    alert(isPaused ? "Game Paused" : "Game Resumed");
  });

  document.getElementById('btn-hint')?.addEventListener('click', () => {
    alert("💡 Hint: Click cracked tiles to repair them first, then rotate them from top to bottom.");
  });

  document.getElementById('btn-settings')?.addEventListener('click', () => {
    alert("⚙ Settings: Turn off audio or restart level from here.");
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupControls();
  loadLevel(0);
});