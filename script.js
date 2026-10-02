const LEVELS = [
  {
    levelNumber: 1,
    rows: 2,
    cols: 3,
    time: 120,
    path: [[0, 1], [1, 1], [1, 0]],
    bucket: [2, 0],
    fillers: [
      { row: 0, col: 0, type: 'corner' },
      { row: 0, col: 2, type: 'straight' },
      { row: 1, col: 2, type: 'corner' }
    ]
  },
  {
    levelNumber: 2,
    rows: 4,
    cols: 4,
    time: 150,
    path: [
      [0, 1], [1, 1], [1, 0], [2, 0], [3, 0], [3, 1],
      [2, 1], [2, 2], [1, 2], [0, 2], [0, 3], [1, 3], [2, 3]
    ],
    bucket: [3, 3],
    fillers: [{ row: 0, col: 0, type: 'straight' }, { row: 3, col: 2, type: 'corner' }]
  },
  {
    levelNumber: 3,
    rows: 5,
    cols: 5,
    time: 180,
    path: [
      [0, 1], [1, 1], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1],
      [3, 1], [2, 1], [2, 2], [1, 2], [0, 2], [0, 3], [1, 3],
      [2, 3], [3, 3], [3, 2], [4, 2], [4, 3]
    ],
    bucket: [4, 4],
    fillers: [
      { row: 0, col: 0, type: 'corner' },
      { row: 0, col: 4, type: 'straight' },
      { row: 1, col: 4, type: 'corner' },
      { row: 2, col: 4, type: 'straight' },
      { row: 3, col: 4, type: 'corner' }
    ]
  }
];

let currentLevelIdx = 0;
let moves = 0;
let score = 0;
let targetPercent = 0;
let timeLeft = 0;
let timerInterval = null;
let isPaused = false;
let gridState = [];
let levelComplete = false;
let gameStarted = false;
let completionTimeout = null;

const DIRECTIONS = {
  N: { row: -1, col: 0, opposite: 'S' },
  E: { row: 0, col: 1, opposite: 'W' },
  S: { row: 1, col: 0, opposite: 'N' },
  W: { row: 0, col: -1, opposite: 'E' }
};
const DIRECTION_ORDER = ['N', 'E', 'S', 'W'];
const PIPE_TYPES = {
  straight: ['N', 'S'],
  corner: ['S', 'E'],
  bucket: ['N']
};

function normalizeOpenings(openings) {
  return [...openings].sort((a, b) => DIRECTION_ORDER.indexOf(a) - DIRECTION_ORDER.indexOf(b));
}

function sameOpenings(first, second) {
  return normalizeOpenings(first).join('') === normalizeOpenings(second).join('');
}

function rotationForOpenings(type, openings) {
  const base = PIPE_TYPES[type];
  for (let rotation = 0; rotation < 360; rotation += 90) {
    const rotated = base.map(direction => DIRECTION_ORDER[
      (DIRECTION_ORDER.indexOf(direction) + rotation / 90) % 4
    ]);
    if (sameOpenings(rotated, openings)) return rotation;
  }
  return 0;
}

function directionBetween(from, to) {
  const rowDelta = to[0] - from[0];
  const colDelta = to[1] - from[1];
  return Object.keys(DIRECTIONS).find(direction => (
    DIRECTIONS[direction].row === rowDelta && DIRECTIONS[direction].col === colDelta
  ));
}

function createSolvedGrid(level) {
  const tiles = [];
  const pathSet = new Set(level.path.map(([row, col]) => `${row},${col}`));

  level.path.forEach(([row, col], index) => {
    const previousDirection = index === 0
      ? 'N'
      : directionBetween(level.path[index], level.path[index - 1]);
    const nextDirection = index === level.path.length - 1
      ? directionBetween(level.path[index], level.bucket)
      : directionBetween(level.path[index], level.path[index + 1]);
    const openings = [previousDirection, nextDirection];
    const type = (openings.includes('N') && openings.includes('S'))
      || (openings.includes('E') && openings.includes('W'))
      ? 'straight'
      : 'corner';

    tiles.push({
      row, col, type,
      solvedRot: rotationForOpenings(type, openings),
      rot: rotationForOpenings(type, openings),
      filled: false,
      leaking: false
    });
  });

  level.fillers.forEach(({ row, col, type }) => {
    if (!pathSet.has(`${row},${col}`) && !(row === level.bucket[0] && col === level.bucket[1])) {
      tiles.push({ row, col, type, solvedRot: 0, rot: 0, filled: false, leaking: false });
    }
  });

  tiles.push({
    row: level.bucket[0],
    col: level.bucket[1],
    type: 'bucket',
    rot: rotationForOpenings('bucket', [directionBetween(level.bucket, level.path[level.path.length - 1])]),
    filled: false,
    leaking: false
  });

  return tiles;
}

function scrambleGrid(tiles) {
  let hasRotation = false;
  const source = LEVELS[currentLevelIdx].path[0];
  tiles.forEach(tile => {
    if (tile.type === 'bucket') return;
    if (tile.row === source[0] && tile.col === source[1]) {
      tile.rot = tile.solvedRot;
      return;
    }
    const rotations = [0, 90, 180, 270];
    const choices = rotations.filter(rotation => rotation !== tile.solvedRot);
    tile.rot = choices[Math.floor(Math.random() * choices.length)];
    hasRotation = hasRotation || tile.rot !== tile.solvedRot;
  });
  if (!hasRotation) tiles[0].rot = (tiles[0].rot + 90) % 360;
}

function loadLevel(idx) {
  clearInterval(timerInterval);
  clearTimeout(completionTimeout);
  currentLevelIdx = idx % LEVELS.length;
  const level = LEVELS[currentLevelIdx];

  gridState = createSolvedGrid(level);
  scrambleGrid(gridState);
  moves = 0;
  targetPercent = 0;
  timeLeft = level.time;
  isPaused = false;
  levelComplete = false;

  const titleEl = document.getElementById('level-title');
  if (titleEl) titleEl.textContent = `LEVEL ${level.levelNumber} — PIPE REPAIR`;
  const gridContainer = document.getElementById('grid');
  if (gridContainer) {
    gridContainer.style.gridTemplateColumns = `repeat(${level.cols}, minmax(0, 1fr))`;
    gridContainer.style.gridTemplateRows = `repeat(${level.rows}, minmax(0, 1fr))`;
  }
  const movesEl = document.getElementById('moves');
  if (movesEl) movesEl.textContent = moves;
  updateScoreUI();
  updateTimerUI();
  updateStatus('');
  updateFaucetUI(false);
  if (gameStarted) startTimer();
  updateWaterFlow();
}

function getTileOpenings(tile) {
  const base = PIPE_TYPES[tile.type] || [];
  const shift = ((tile.rot || 0) / 90) % 4;
  return base.map(direction => DIRECTION_ORDER[
    (DIRECTION_ORDER.indexOf(direction) + shift) % 4
  ]);
}

function getTileAt(row, col) {
  return gridState.find(tile => tile.row === row && tile.col === col);
}

function getTileKey(tile) {
  return `${tile.row},${tile.col}`;
}

function isValidConnection(tile, neighbor, direction) {
  return getTileOpenings(tile).includes(direction)
    && getTileOpenings(neighbor).includes(DIRECTIONS[direction].opposite);
}

function findWaterPath() {
  const level = LEVELS[currentLevelIdx];
  const sourceTile = getTileAt(level.path[0][0], level.path[0][1]);
  const path = new Set();
  const queue = [];
  if (!sourceTile || !getTileOpenings(sourceTile).includes('N')) {
    return { path, reachesBucket: false };
  }

  path.add(getTileKey(sourceTile));
  queue.push(sourceTile);
  while (queue.length) {
    const tile = queue.shift();
    Object.entries(DIRECTIONS).forEach(([direction, offset]) => {
      const neighbor = getTileAt(tile.row + offset.row, tile.col + offset.col);
      if (!neighbor || path.has(getTileKey(neighbor))) return;
      if (isValidConnection(tile, neighbor, direction)) {
        path.add(getTileKey(neighbor));
        if (neighbor.type !== 'bucket') queue.push(neighbor);
      }
    });
  }

  const bucket = gridState.find(tile => tile.type === 'bucket');
  return { path, reachesBucket: Boolean(bucket && path.has(getTileKey(bucket))) };
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

function rotatePipe(tile) {
  if (!tile || tile.type === 'bucket') return;
  tile.rot = (tile.rot + 90) % 360;
}

function handleTileClick(index) {
  if (isPaused || levelComplete || !gameStarted) return;
  const tile = gridState[index];
  if (!tile || tile.type === 'bucket') return;
  rotatePipe(tile);
  moves += 1;
  score += 10;
  const movesEl = document.getElementById('moves');
  if (movesEl) movesEl.textContent = moves;
  updateScoreUI();
  updateWaterFlow();
}

function checkWin(reachesBucket) {
  if (!reachesBucket || levelComplete) return;
  levelComplete = true;
  clearInterval(timerInterval);
  score += 100 + Math.max(0, timeLeft);
  updateScoreUI();
  updateStatus('💧 Water reached the bucket!');
  document.querySelector('.board-container')?.classList.add('level-success');
  completionTimeout = setTimeout(() => {
    document.querySelector('.board-container')?.classList.remove('level-success');
    if (currentLevelIdx < LEVELS.length - 1) {
      loadLevel(currentLevelIdx + 1);
    } else {
      gameStarted = false;
      updateStatus('🎉 Mission complete! Press START to play again.');
      const winBanner = document.getElementById('win-banner');
      if (winBanner) winBanner.hidden = false;
    }
  }, 1400);
}

function updateProgressUI(percent) {
  document.getElementById('progress-fill')?.style.setProperty('width', `${percent}%`);
  const percentEl = document.getElementById('target-pct');
  if (percentEl) percentEl.textContent = `${percent}%`;
  const bucketWater = document.getElementById('bucket-water');
  if (bucketWater) bucketWater.style.height = `${percent}%`;
}

function updateScoreUI() {
  const scoreEl = document.getElementById('score');
  if (scoreEl) scoreEl.textContent = score;
}

function updateStatus(message) {
  const statusEl = document.getElementById('game-status');
  if (statusEl) statusEl.textContent = message;
}

function updateTimerUI() {
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const timerEl = document.getElementById('timer');
  if (timerEl) timerEl.textContent = `${mins}:${secs}`;
}

function updateFaucetUI(isFlowing) {
  const faucetEl = document.querySelector('.faucet');
  if (faucetEl) faucetEl.classList.toggle('flowing', isFlowing);
}

function positionFaucet() {
  const faucetEl = document.querySelector('.faucet');
  const boardEl = document.querySelector('.board-container');
  const sourceTile = document.querySelector('.tile[data-source="faucet"]');
  if (!faucetEl || !boardEl || !sourceTile) return;

  const boardRect = boardEl.getBoundingClientRect();
  const sourceRect = sourceTile.getBoundingClientRect();
  faucetEl.style.left = `${sourceRect.left + sourceRect.width / 2 - boardRect.left}px`;
  faucetEl.style.top = `${sourceRect.top - boardRect.top - 8}px`;
}

function renderGrid() {
  const gridContainer = document.getElementById('grid');
  if (!gridContainer) return;
  gridContainer.innerHTML = '';
  gridState.sort((first, second) => first.row - second.row || first.col - second.col);

  gridState.forEach((tile, index) => {
    const tileEl = document.createElement('div');
    if (tile.type === 'bucket') {
      tileEl.className = 'bucket';
      tileEl.innerHTML = `<div class="bucket-water" id="bucket-water" style="height:${targetPercent}%"></div><div class="bucket-label">BUCKET</div>`;
      gridContainer.appendChild(tileEl);
      return;
    }

    tileEl.className = `tile ${tile.filled ? 'filled' : ''}`;
    tileEl.dataset.row = tile.row;
    tileEl.dataset.col = tile.col;
    if (tile.row === LEVELS[currentLevelIdx].path[0][0]
      && tile.col === LEVELS[currentLevelIdx].path[0][1]) {
      tileEl.dataset.source = 'faucet';
    }
    tileEl.setAttribute('role', 'button');
    tileEl.setAttribute('aria-label', `${tile.type} pipe, rotated ${tile.rot} degrees`);
    tileEl.setAttribute('tabindex', isPaused || !gameStarted ? '-1' : '0');
    const pipeEl = document.createElement('div');
    pipeEl.className = `pipe ${tile.filled ? 'active' : ''} ${tile.type === 'straight' ? `straight-rot-${tile.rot}` : ''}`;
    pipeEl.dataset.openings = getTileOpenings(tile).join('');
    pipeEl.style.transform = tile.type === 'straight' ? 'none' : `rotate(${tile.rot}deg)`;
    pipeEl.style.setProperty('--flow-delay', `${(tile.row + tile.col) * 80}ms`);
    pipeEl.innerHTML = tile.type === 'straight'
      ? '<div class="pipe-straight"></div>'
      : '<div class="pipe-corner"></div>';
    tileEl.appendChild(pipeEl);
    tileEl.addEventListener('click', () => handleTileClick(index));
    tileEl.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleTileClick(index);
      }
    });
    gridContainer.appendChild(tileEl);
  });
  positionFaucet();
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isPaused || levelComplete) return;
    if (timeLeft > 0) {
      timeLeft -= 1;
      updateTimerUI();
      return;
    }
    clearInterval(timerInterval);
    gameStarted = false;
    const startButton = document.getElementById('btn-start');
    if (startButton) startButton.textContent = 'RETRY LEVEL';
    updateStatus("Time's up! Press RETRY LEVEL to try again.");
  }, 1000);
}

function setupControls() {
  document.getElementById('btn-start')?.addEventListener('click', () => {
    if (!gameStarted && currentLevelIdx === LEVELS.length - 1 && levelComplete) {
      score = 0;
      currentLevelIdx = 0;
    }
    const winBanner = document.getElementById('win-banner');
    if (winBanner) winBanner.hidden = true;
    gameStarted = true;
    const startButton = document.getElementById('btn-start');
    if (startButton) startButton.textContent = 'START';
    loadLevel(currentLevelIdx);
  });
  document.getElementById('btn-back')?.addEventListener('click', () => loadLevel(currentLevelIdx));
  document.getElementById('btn-pause')?.addEventListener('click', () => {
    if (!gameStarted || levelComplete) return;
    isPaused = !isPaused;
    updateStatus(isPaused ? 'Game paused' : '');
  });
  document.getElementById('btn-hint')?.addEventListener('click', () => {
    updateStatus('💡 Hint: Start under the faucet and match every touching pipe end.');
  });
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    updateStatus('⚙ Use the arrow to restart this level.');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupControls();
  loadLevel(0);
});
