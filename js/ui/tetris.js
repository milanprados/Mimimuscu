/**
 * Mini-jeu de blocs autonome, pensé pour le tactile.
 * Son état n'interfère jamais avec les données d'entraînement.
 */
import { $, $$, on } from "../utils/dom.js";

const COLS = 10;
const ROWS = 20;
const BEST_SCORE_KEY = "mimi-tetris-best";
const COLORS = [
  "transparent",
  "#6fa7c3",
  "#eb812e",
  "#d6b967",
  "#789b8f",
  "#8d7ea8",
  "#c9685e",
  "#315f7d",
];

const SHAPES = {
  I: [[1, 1, 1, 1]],
  J: [
    [2, 0, 0],
    [2, 2, 2],
  ],
  O: [
    [3, 3],
    [3, 3],
  ],
  S: [
    [0, 4, 4],
    [4, 4, 0],
  ],
  T: [
    [0, 5, 0],
    [5, 5, 5],
  ],
  Z: [
    [6, 6, 0],
    [0, 6, 6],
  ],
  L: [
    [0, 0, 7],
    [7, 7, 7],
  ],
};

const TYPES = Object.keys(SHAPES);

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function cloneShape(shape) {
  return shape.map((row) => [...row]);
}

function rotate(shape) {
  return shape[0].map((_, column) => shape.map((row) => row[column]).reverse());
}

function safeBestScore() {
  try {
    return Math.max(0, Number(localStorage.getItem(BEST_SCORE_KEY)) || 0);
  } catch {
    return 0;
  }
}

export function createTetrisGame() {
  const canvas = $("#tetrisBoard");
  const nextCanvas = $("#tetrisNext");
  if (!canvas || !nextCanvas) return { setActive() {} };

  const context = canvas.getContext("2d");
  const nextContext = nextCanvas.getContext("2d");

  let board = emptyBoard();
  let piece = null;
  let nextType = null;
  let bag = [];
  let score = 0;
  let lines = 0;
  let level = 1;
  let best = safeBestScore();
  let running = false;
  let paused = false;
  let active = false;
  let animationFrame = 0;
  let lastTime = 0;
  let dropCounter = 0;
  let touchStart = null;
  let repeatTimer = null;

  function shuffledBag() {
    const values = [...TYPES];
    for (let index = values.length - 1; index > 0; index--) {
      const target = Math.floor(Math.random() * (index + 1));
      [values[index], values[target]] = [values[target], values[index]];
    }
    return values;
  }

  function takeType() {
    if (!bag.length) bag = shuffledBag();
    return bag.pop();
  }

  function createPiece(type) {
    const shape = cloneShape(SHAPES[type]);
    return {
      type,
      shape,
      x: Math.floor((COLS - shape[0].length) / 2),
      y: -1,
    };
  }

  function collision(candidate = piece, offsetX = 0, offsetY = 0) {
    if (!candidate) return true;
    return candidate.shape.some((row, y) =>
      row.some((value, x) => {
        if (!value) return false;
        const boardX = candidate.x + x + offsetX;
        const boardY = candidate.y + y + offsetY;
        return (
          boardX < 0 ||
          boardX >= COLS ||
          boardY >= ROWS ||
          (boardY >= 0 && board[boardY][boardX])
        );
      }),
    );
  }

  function spawn() {
    const type = nextType || takeType();
    nextType = takeType();
    piece = createPiece(type);
    drawNext();
    if (collision(piece)) finishGame();
  }

  function merge() {
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value && piece.y + y >= 0) board[piece.y + y][piece.x + x] = value;
      });
    });
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (!board[y].every(Boolean)) continue;
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      cleared++;
      y++;
    }

    if (!cleared) return;
    const rewards = [0, 100, 300, 500, 800];
    score += rewards[cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    updateHud();
  }

  function lockPiece() {
    merge();
    clearLines();
    spawn();
    dropCounter = 0;
  }

  function move(offset) {
    if (!canControl() || collision(piece, offset, 0)) return;
    piece.x += offset;
    draw();
  }

  function softDrop({ reward = false } = {}) {
    if (!canControl()) return;
    if (!collision(piece, 0, 1)) {
      piece.y++;
      if (reward) score++;
      dropCounter = 0;
      updateHud();
    } else {
      lockPiece();
    }
    draw();
  }

  function hardDrop() {
    if (!canControl()) return;
    let distance = 0;
    while (!collision(piece, 0, 1)) {
      piece.y++;
      distance++;
    }
    score += distance * 2;
    updateHud();
    lockPiece();
    draw();
  }

  function rotatePiece() {
    if (!canControl()) return;
    const originalShape = piece.shape;
    const originalX = piece.x;
    piece.shape = rotate(piece.shape);

    for (const kick of [0, -1, 1, -2, 2]) {
      piece.x = originalX + kick;
      if (!collision(piece)) {
        draw();
        return;
      }
    }

    piece.x = originalX;
    piece.shape = originalShape;
  }

  function ghostY() {
    let offset = 0;
    while (!collision(piece, 0, offset + 1)) offset++;
    return piece.y + offset;
  }

  function drawCell(target, x, y, value, size, alpha = 1) {
    if (!value || y < 0) return;
    const gap = Math.max(1, size * 0.07);
    target.globalAlpha = alpha;
    target.fillStyle = COLORS[value];
    target.fillRect(
      x * size + gap,
      y * size + gap,
      size - gap * 2,
      size - gap * 2,
    );
    target.strokeStyle = "rgba(255,255,255,.36)";
    target.lineWidth = Math.max(1, size * 0.035);
    target.strokeRect(
      x * size + gap + 0.5,
      y * size + gap + 0.5,
      size - gap * 2 - 1,
      size - gap * 2 - 1,
    );
    target.globalAlpha = 1;
  }

  function drawShape(target, shape, originX, originY, size, alpha = 1) {
    shape.forEach((row, y) =>
      row.forEach((value, x) =>
        drawCell(target, originX + x, originY + y, value, size, alpha),
      ),
    );
  }

  function drawGrid() {
    const cell = canvas.width / COLS;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#12385f";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(255,255,255,.055)";
    context.lineWidth = 1;
    for (let x = 1; x < COLS; x++) {
      context.beginPath();
      context.moveTo(x * cell, 0);
      context.lineTo(x * cell, canvas.height);
      context.stroke();
    }
    for (let y = 1; y < ROWS; y++) {
      context.beginPath();
      context.moveTo(0, y * cell);
      context.lineTo(canvas.width, y * cell);
      context.stroke();
    }
  }

  function draw() {
    drawGrid();
    const cell = canvas.width / COLS;
    board.forEach((row, y) =>
      row.forEach((value, x) => drawCell(context, x, y, value, cell)),
    );
    if (!piece) return;
    drawShape(context, piece.shape, piece.x, ghostY(), cell, 0.2);
    drawShape(context, piece.shape, piece.x, piece.y, cell);
  }

  function drawNext() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextType) return;
    const shape = SHAPES[nextType];
    const size = 20;
    const width = shape[0].length * size;
    const height = shape.length * size;
    drawShape(
      nextContext,
      shape,
      (nextCanvas.width - width) / size / 2,
      (nextCanvas.height - height) / size / 2,
      size,
    );
  }

  function updateHud() {
    $("#tetrisScore").textContent = score.toLocaleString("fr-FR");
    $("#tetrisLines").textContent = lines;
    $("#tetrisLevel").textContent = level;
    $("#tetrisBest").textContent = best.toLocaleString("fr-FR");
  }

  function showOverlay(label, title, action) {
    $("#tetrisOverlayLabel").textContent = label;
    $("#tetrisOverlayTitle").textContent = title;
    $("#tetrisStart").textContent = action;
    $("#tetrisOverlay").classList.remove("hidden");
  }

  function hideOverlay() {
    $("#tetrisOverlay").classList.add("hidden");
  }

  function canControl() {
    return active && running && !paused && piece;
  }

  function startGame() {
    board = emptyBoard();
    bag = [];
    nextType = takeType();
    score = 0;
    lines = 0;
    level = 1;
    running = true;
    paused = false;
    lastTime = performance.now();
    dropCounter = 0;
    $("#tetrisPause").textContent = "Pause";
    hideOverlay();
    updateHud();
    spawn();
    draw();
    startLoop();
  }

  function finishGame() {
    running = false;
    paused = false;
    if (score > best) {
      best = score;
      try {
        localStorage.setItem(BEST_SCORE_KEY, String(best));
      } catch {}
    }
    updateHud();
    showOverlay(
      "PARTIE TERMINÉE",
      `${score.toLocaleString("fr-FR")} points`,
      "Rejouer",
    );
  }

  function togglePause(forcePause = false) {
    if (!running) return;
    paused = forcePause || !paused;
    $("#tetrisPause").textContent = paused ? "Reprendre" : "Pause";
    if (paused) {
      cancelAnimationFrame(animationFrame);
      showOverlay("EN PAUSE", "À ton rythme", "Reprendre");
    } else {
      hideOverlay();
      lastTime = performance.now();
      startLoop();
    }
  }

  function update(time = 0) {
    if (!canControl()) return;
    const elapsed = Math.min(100, time - lastTime);
    lastTime = time;
    dropCounter += elapsed;
    const interval = Math.max(95, 820 - (level - 1) * 65);
    if (dropCounter >= interval) softDrop();
    draw();
    animationFrame = requestAnimationFrame(update);
  }

  function startLoop() {
    cancelAnimationFrame(animationFrame);
    if (canControl()) animationFrame = requestAnimationFrame(update);
  }

  function perform(action) {
    if (action === "left") move(-1);
    if (action === "right") move(1);
    if (action === "down") softDrop({ reward: true });
    if (action === "rotate") rotatePiece();
    if (action === "drop") hardDrop();
  }

  function stopRepeat() {
    clearTimeout(repeatTimer);
    repeatTimer = null;
  }

  function bindControls() {
    $$("[data-tetris-action]").forEach((button) => {
      const action = button.dataset.tetrisAction;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        perform(action);
        if (!["left", "right", "down"].includes(action)) return;
        stopRepeat();
        repeatTimer = setTimeout(function repeat() {
          perform(action);
          repeatTimer = setTimeout(repeat, 82);
        }, 230);
      });
      button.addEventListener("pointerup", stopRepeat);
      button.addEventListener("pointercancel", stopRepeat);
      button.addEventListener("pointerleave", stopRepeat);
    });

    canvas.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      touchStart = {
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
      };
    });
    canvas.addEventListener("pointerup", (event) => {
      if (!touchStart) return;
      const deltaX = event.clientX - touchStart.x;
      const deltaY = event.clientY - touchStart.y;
      const duration = performance.now() - touchStart.time;
      touchStart = null;

      if (Math.abs(deltaX) < 18 && Math.abs(deltaY) < 18) rotatePiece();
      else if (Math.abs(deltaX) > Math.abs(deltaY)) move(deltaX > 0 ? 1 : -1);
      else if (deltaY > 75 || (deltaY > 40 && duration < 220)) hardDrop();
      else if (deltaY > 18) softDrop({ reward: true });
    });

    window.addEventListener("keydown", (event) => {
      if (!active) return;
      const actions = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowDown: "down",
        ArrowUp: "rotate",
        " ": "drop",
      };
      if (actions[event.key]) {
        event.preventDefault();
        perform(actions[event.key]);
      }
      if (event.key.toLowerCase() === "p") togglePause();
    });

    on("#tetrisStart", "click", () => (paused ? togglePause() : startGame()));
    on("#tetrisPause", "click", () => togglePause());
    on("#tetrisNew", "click", startGame);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && active && running && !paused) togglePause(true);
    });
  }

  function setActive(value) {
    active = value;
    if (!active) {
      stopRepeat();
      if (running && !paused) togglePause(true);
      return;
    }
    draw();
    if (running && !paused) startLoop();
  }

  bindControls();
  updateHud();
  draw();
  drawNext();

  return { setActive };
}
