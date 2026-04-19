export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export interface GameState {
  cols: number;
  rows: number;
  snake: Point[];
  food: Point;
  direction: Direction;
  score: number;
  gameOver: boolean;
  paused: boolean;
  tickInterval: number;
}

const INITIAL_TICK_INTERVAL = 150;
const MIN_TICK_INTERVAL = 80;
const SPEED_DECREASE_PER_FOOD = 5;
const SCORE_PER_FOOD = 10;

const OPPOSITES: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

function randomFoodPosition(cols: number, rows: number, snake: Point[]): Point {
  let position: Point;
  do {
    position = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
  } while (snake.some((s) => s.x === position.x && s.y === position.y));
  return position;
}

function calculateTickInterval(score: number): number {
  const reduction = Math.floor(score / SCORE_PER_FOOD) * SPEED_DECREASE_PER_FOOD;
  return Math.max(MIN_TICK_INTERVAL, INITIAL_TICK_INTERVAL - reduction);
}

export function createGame(cols: number, rows: number): GameState {
  const centerX = Math.floor(cols / 2);
  const centerY = Math.floor(rows / 2);

  const snake: Point[] = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];

  return {
    cols,
    rows,
    snake,
    food: randomFoodPosition(cols, rows, snake),
    direction: 'right',
    score: 0,
    gameOver: false,
    paused: false,
    tickInterval: INITIAL_TICK_INTERVAL,
  };
}

function getNextHead(head: Point, direction: Direction): Point {
  switch (direction) {
    case 'up':
      return { x: head.x, y: head.y - 1 };
    case 'down':
      return { x: head.x, y: head.y + 1 };
    case 'left':
      return { x: head.x - 1, y: head.y };
    case 'right':
      return { x: head.x + 1, y: head.y };
    default:
      return head;
  }
}

function collidesWithWall(point: Point, cols: number, rows: number): boolean {
  return point.x < 0 || point.x >= cols || point.y < 0 || point.y >= rows;
}

function collidesWithSnake(point: Point, snake: Point[]): boolean {
  return snake.some((s) => s.x === point.x && s.y === point.y);
}

export function tick(state: GameState): GameState {
  if (state.paused || state.gameOver) {
    return state;
  }

  const head = state.snake[0];
  if (!head) return state;

  const nextHead = getNextHead(head, state.direction);

  // Check wall collision
  if (collidesWithWall(nextHead, state.cols, state.rows)) {
    return { ...state, gameOver: true };
  }

  // Check self collision
  if (collidesWithSnake(nextHead, state.snake)) {
    return { ...state, gameOver: true };
  }

  // Check food
  const ateFood = nextHead.x === state.food.x && nextHead.y === state.food.y;
  const newSnake = ateFood ? [nextHead, ...state.snake] : [nextHead, ...state.snake.slice(0, -1)];

  const newScore = ateFood ? state.score + SCORE_PER_FOOD : state.score;
  const newFood = ateFood ? randomFoodPosition(state.cols, state.rows, newSnake) : state.food;

  return {
    ...state,
    snake: newSnake,
    food: newFood,
    score: newScore,
    tickInterval: calculateTickInterval(newScore),
  };
}

export function changeDirection(state: GameState, direction: Direction): GameState {
  // Prevent 180° reversal
  if (OPPOSITES[direction] === state.direction) {
    return state;
  }
  return { ...state, direction };
}

export function isGameOver(state: GameState): boolean {
  return state.gameOver;
}
