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
      { row: 0, col: 1, type: 'straight', rot: 0, broken: false },
      { row: 0, col: 2, type: 'corner', rot: 180, broken: false },

      { row: 1, col: 0, type: 'straight', rot: 90, broken: false },
      { row: 1, col: 1, type: 'corner', rot: 270, broken: false },
      { row: 1, col: 2, type: 'straight', rot: 0, broken: false },

      { row: 2, col: 0, type: 'corner', rot: 0, broken: false },
      { row: 2, col: 1, type: 'straight', rot: 90, broken: false },
      { row: 2, col: 2, type: 'bucket', rot: 0, broken: false }
    ]
  },
  
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
let levelComplete = false;

const PIPE_TYPES = {
  straight: ['N', 'S'],
  corner: ['S', 'E'],
  cross: ['N', 'E', 'S', 'W'],
  bucket: ['N']
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
  levelComplete = false;

  const titleEl = document.getElementById('level-title');
  if (titleEl) titleEl.textContent = `LEVEL ${currentLevel.levelNumber} — PIPE REPAIR`;
  
  document.getElementById('moves').textContent = moves;

  const gridContainer = document.getElementById('grid');
  if (gridContainer) {
    gridContainer.style.gridTemplateColumns = `repeat(${currentLevel.cols}, 1fr)`;
  }

  clearInterval(timerInterval);
  updateTimerUI();
  startTimer();
  evaluateWaterFlow();
}

function getTileOpenings(tile) {
  if (tile.broken) return [];
  const base = PIPE_TYPES[tile.type] || [];
  const shift = (tile.rot / 90) % 4;
  const dirOrder = ['N', 'E', 'S', 'W'];

  return base.map(dir => {
    let index = (dirOrder.indexOf(dir) + shift) % 4;
    return dirOrder[index];
  });
}

function getTileKey(tile) {
  return `${tile.row},${tile.col}`;
}

function getTileAt(row, col) {
  return gridState.find(tile => tile.row === row && tile.col === col);
}

function rotatePipe(tile) {
  if (!tile || tile.type === 'bucket') return;

  if (tile.broken) tile.broken = false;
  tile.rot = (tile.rot + 90) % 360;
}

function isValidConnection(tileA, tileB, directionKey) {
  if (!tileA || !tileB) return false;

  const oppositeDirection = DIRECTIONS[directionKey].opposite;
  return (
    getTileOpenings(tileA).includes(directionKey) &&
    getTileOpenings(tileB).includes(oppositeDirection)
  );
}

function findWaterPath() {
  const level = LEVELS[currentLevelIdx];
  const sourceTile = getTileAt(level.sourcePos.row, level.sourcePos.col);
  const path = new Set();
  const queue = [];

  if (!sourceTile || sourceTile.broken || !getTileOpenings(sourceTile).includes('N')) {
    return { path, reachesBucket: false };
  }

  path.add(getTileKey(sourceTile));
  queue.push(sourceTile);

  while (queue.length > 0) {
    const current = queue.shift();

    for (const directionKey of Object.keys(DIRECTIONS)) {
      const direction = DIRECTIONS[directionKey];
      const neighbor = getTileAt(current.row + direction.row, current.col + direction.col);

      if (!neighbor) continue;

      const neighborKey = getTileKey(neighbor);
      if (path.has(neighborKey)) continue;

      if (isValidConnection(current, neighbor, directionKey)) {
        path.add(neighborKey);
        if (neighbor.type !== 'bucket') queue.push(neighbor);
      }
    }
  }

  const bucket = gridState.find(tile => tile.type === 'bucket');
  return {
    path,
    reachesBucket: Boolean(bucket && path.has(getTileKey(bucket)))
  };
}

function updateWaterFlow() {
  const { path, reachesBucket } = findWaterPath();

  gridState.forEach(tile => {
    tile.filled = path.has(getTileKey(tile));
    tile.leaking = false;
  });

  targetPercent = reachesBucket ? 100 : 0;
  updateFaucetUI(path.size > 0);
  updateProgressUI(targetPercent);
  renderGrid();
  checkWin(reachesBucket);
}

function checkWin(reachesBucket) {
  if (reachesBucket && !levelComplete) {
    levelComplete = true;
    setTimeout(() => {
      alert(`Level ${LEVELS[currentLevelIdx].levelNumber} Complete!`);
      loadLevel(currentLevelIdx + 1);
    }, 300);
  }
}

function evaluateWaterFlow() {
  updateWaterFlow();
}

function handleTileClick(index) {
  if (isPaused || levelComplete) return;

  const tile = gridState[index];
  if (!tile || tile.type === 'bucket') return;

  rotatePipe(tile);
  moves++;
  document.getElementById('moves').textContent = moves;

  updateWaterFlow();
}

function updateProgressUI(pct) {
  const fillEl = document.getElementById('progress-fill');
  const pctEl = document.getElementById('target-pct');
  const bucketWater = document.getElementById('bucket-water');

  if (fillEl) fillEl.style.width = `${pct}%`;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (bucketWater) bucketWater.style.height = `${pct}%`;
}

function updateTimerUI() {
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const timerEl = document.getElementById('timer');
  if (timerEl) timerEl.textContent = `${mins}:${secs}`;
}

function updateFaucetUI(isFlowing) {
  const faucetEl = document.querySelector('.faucet');
  if (faucetEl) {
    faucetEl.classList.toggle('flowing', isFlowing);
    faucetEl.setAttribute('aria-label', isFlowing ? 'Water flowing' : 'Faucet');
  }
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
      tileEl.setAttribute('role', 'button');
      tileEl.setAttribute(
        'aria-label',
        `${tile.type} pipe, rotated ${tile.rot} degrees${tile.broken ? ', broken' : ''}`
      );
      tileEl.setAttribute('tabindex', isPaused ? '-1' : '0');

      const pipeEl = document.createElement('div');
      pipeEl.className = `pipe ${tile.filled ? 'active' : ''}`;
      pipeEl.style.transform = `rotate(${tile.rot}deg)`;
      pipeEl.style.setProperty('--flow-delay', `${(tile.row + tile.col) * 80}ms`);

      if (tile.type === 'straight') pipeEl.innerHTML = `<div class="pipe-straight"></div>`;
      if (tile.type === 'corner') pipeEl.innerHTML = `<div class="pipe-corner"></div>`;
      if (tile.type === 'cross') pipeEl.innerHTML = `<div class="pipe-cross"></div>`;

      tileEl.appendChild(pipeEl);
      tileEl.innerHTML += `<div class="leak-effect">💦</div>`;

      tileEl.addEventListener('click', () => handleTileClick(idx));
      tileEl.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleTileClick(idx);
        }
      });
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
  document.getElementById('btn-start')?.addEventListener('click', () => {
    loadLevel(currentLevelIdx);
    isPaused = false;
  });

  document.getElementById('btn-back')?.addEventListener('click', () => {
    loadLevel(currentLevelIdx);
  });

  document.getElementById('btn-pause')?.addEventListener('click', () => {
    isPaused = !isPaused;
    alert(isPaused ? "Game Paused" : "Game Resumed");
  });

  document.getElementById('btn-hint')?.addEventListener('click', () => {
    alert("💡 Hint: Every click rotates a pipe 90°. Start with the pipe under the faucet and match each opening.");
  });

  document.getElementById('btn-settings')?.addEventListener('click', () => {
    alert("⚙ Settings: Turn off audio or restart level from here.");
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupControls();
  loadLevel(0);
});