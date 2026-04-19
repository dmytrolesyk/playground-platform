import { createSignal, type JSX, onCleanup, onMount } from 'solid-js';
import { changeDirection, createGame, type Direction, type GameState, tick } from './snake-engine';

// Win95 16-color palette
const COLORS = {
  black: '#000000',
  green: '#00ff00',
  darkGreen: '#008000',
  red: '#ff0000',
  darkGray: '#808080',
  white: '#ffffff',
} as const;

const CELL_SIZE = 15;
const GRID_COLS = 20;
const GRID_ROWS = 20;

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  const width = GRID_COLS * CELL_SIZE;
  const height = GRID_ROWS * CELL_SIZE;

  ctx.fillStyle = COLORS.black;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = COLORS.darkGray;
  ctx.strokeRect(0, 0, width, height);

  ctx.fillStyle = COLORS.red;
  ctx.fillRect(state.food.x * CELL_SIZE, state.food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  for (let i = 0; i < state.snake.length; i++) {
    const segment = state.snake[i];
    if (!segment) continue;
    ctx.fillStyle = i === 0 ? COLORS.green : COLORS.darkGreen;
    ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }

  if (state.paused) {
    renderPauseOverlay(ctx, width, height);
  }
}

function renderPauseOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', width / 2, height / 2);
}

export function SnakeGame(): JSX.Element {
  const [score, setScore] = createSignal(0);
  const [highScore, setHighScore] = createSignal(0);
  const [gameOver, setGameOver] = createSignal(false);
  const [speed, setSpeed] = createSignal(1);

  let canvasRef: HTMLCanvasElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  let state: GameState = createGame(GRID_COLS, GRID_ROWS);
  let animationId: number | undefined;
  let lastTick = 0;
  let isRunning = true;

  function updateGameState(): void {
    state = tick(state);
    setScore(state.score);
    setSpeed(Math.floor((150 - state.tickInterval) / 5) + 1);

    if (state.gameOver) {
      setGameOver(true);
      if (state.score > highScore()) {
        setHighScore(state.score);
      }
    }
  }

  function gameLoop(timestamp: number): void {
    if (!isRunning) return;

    if (timestamp - lastTick >= state.tickInterval) {
      lastTick = timestamp;
      if (!(state.paused || state.gameOver)) {
        updateGameState();
      }
    }

    const ctx = canvasRef?.getContext('2d');
    if (ctx) {
      renderGame(ctx, state);
    }

    animationId = requestAnimationFrame(gameLoop);
  }

  function handleKeyDown(e: KeyboardEvent): void {
    const direction = KEY_MAP[e.key];
    if (direction) {
      e.preventDefault();
      state = changeDirection(state, direction);
      return;
    }

    if (e.key === 'p' || e.key === 'P' || e.key === ' ') {
      e.preventDefault();
      state = { ...state, paused: !state.paused };
    }
  }

  function resetGame(): void {
    state = createGame(GRID_COLS, GRID_ROWS);
    setScore(0);
    setGameOver(false);
    setSpeed(1);
    lastTick = 0;
    containerRef?.focus();
  }

  onMount(() => {
    if (canvasRef) {
      canvasRef.width = GRID_COLS * CELL_SIZE;
      canvasRef.height = GRID_ROWS * CELL_SIZE;
      const ctx = canvasRef.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
      }
    }
    containerRef?.focus();
    animationId = requestAnimationFrame(gameLoop);
  });

  onCleanup(() => {
    isRunning = false;
    if (animationId !== undefined) {
      cancelAnimationFrame(animationId);
    }
  });

  return (
    <div
      ref={containerRef}
      class="snake-game"
      role="application"
      aria-label="Snake game"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        'flex-direction': 'column',
        height: '100%',
        margin: '-8px',
        outline: 'none',
        background: '#c0c0c0',
      }}
    >
      <div
        style={{
          display: 'flex',
          'justify-content': 'center',
          padding: '4px',
          background: '#c0c0c0',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            border: '2px inset',
            display: 'block',
            'image-rendering': 'pixelated',
          }}
        />
      </div>

      {/* Status bar */}
      <div class="status-bar" style={{ 'margin-top': 'auto' }}>
        <p class="status-bar-field">Score: {score()}</p>
        <p class="status-bar-field">High: {highScore()}</p>
        <p class="status-bar-field">Speed: {speed()}</p>
      </div>

      {/* Game Over dialog */}
      {gameOver() && (
        <div
          style={{
            position: 'absolute',
            inset: '0',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <div class="window" style={{ width: '250px' }}>
            <div class="title-bar">
              <div class="title-bar-text">Game Over</div>
            </div>
            <div class="window-body">
              <p style={{ 'text-align': 'center', margin: '8px 0' }}>Game Over! Score: {score()}</p>
              <p style={{ 'text-align': 'center', margin: '8px 0' }}>Play again?</p>
              <div
                style={{
                  display: 'flex',
                  'justify-content': 'center',
                  gap: '8px',
                  'margin-top': '12px',
                }}
              >
                <button type="button" onClick={resetGame}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
