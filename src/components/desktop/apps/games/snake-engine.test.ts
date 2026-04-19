import { describe, expect, it } from 'vitest';
import {
  changeDirection,
  createGame,
  type Direction,
  type GameState,
  isGameOver,
  tick,
} from './snake-engine';

function getHead(state: GameState): { x: number; y: number } {
  const head = state.snake[0];
  if (!head) throw new Error('Snake has no head');
  return head;
}

describe('snake-engine', () => {
  describe('createGame', () => {
    it('creates initial game state with correct dimensions', () => {
      const state = createGame(20, 20);
      expect(state.cols).toBe(20);
      expect(state.rows).toBe(20);
      expect(state.snake.length).toBeGreaterThan(0);
      expect(state.food).toBeDefined();
      expect(state.direction).toBe('right');
      expect(state.score).toBe(0);
      expect(state.gameOver).toBe(false);
      expect(state.paused).toBe(false);
    });

    it('places snake in the center of the grid', () => {
      const state = createGame(20, 20);
      const head = getHead(state);
      expect(head.x).toBe(10);
      expect(head.y).toBe(10);
    });

    it('places food within the grid bounds', () => {
      const state = createGame(20, 20);
      expect(state.food.x).toBeGreaterThanOrEqual(0);
      expect(state.food.x).toBeLessThan(20);
      expect(state.food.y).toBeGreaterThanOrEqual(0);
      expect(state.food.y).toBeLessThan(20);
    });
  });

  describe('tick', () => {
    it('moves snake in the current direction', () => {
      const state = createGame(20, 20);
      const head = getHead(state);
      const next = tick(state);
      const newHead = getHead(next);
      expect(newHead.x).toBe(head.x + 1);
      expect(newHead.y).toBe(head.y);
    });

    it('moves snake up', () => {
      let state = createGame(20, 20);
      state = changeDirection(state, 'up');
      const head = getHead(state);
      const next = tick(state);
      const newHead = getHead(next);
      expect(newHead.x).toBe(head.x);
      expect(newHead.y).toBe(head.y - 1);
    });

    it('moves snake down', () => {
      let state = createGame(20, 20);
      state = changeDirection(state, 'down');
      const head = getHead(state);
      const next = tick(state);
      const newHead = getHead(next);
      expect(newHead.x).toBe(head.x);
      expect(newHead.y).toBe(head.y + 1);
    });

    it('moves snake left', () => {
      let state = createGame(20, 20);
      // Default direction is right, we need to go up first then left
      state = changeDirection(state, 'up');
      state = tick(state);
      state = changeDirection(state, 'left');
      const head = getHead(state);
      const next = tick(state);
      const newHead = getHead(next);
      expect(newHead.x).toBe(head.x - 1);
      expect(newHead.y).toBe(head.y);
    });

    it('grows snake when eating food', () => {
      let state = createGame(20, 20);
      // Place food directly in front of the snake
      const head = getHead(state);
      state = { ...state, food: { x: head.x + 1, y: head.y } };
      const lengthBefore = state.snake.length;
      const next = tick(state);
      expect(next.snake.length).toBe(lengthBefore + 1);
      expect(next.score).toBe(state.score + 10);
    });

    it('does not move when paused', () => {
      let state = createGame(20, 20);
      state = { ...state, paused: true };
      const next = tick(state);
      expect(next).toEqual(state);
    });

    it('does not move when game is over', () => {
      let state = createGame(20, 20);
      state = { ...state, gameOver: true };
      const next = tick(state);
      expect(next).toEqual(state);
    });
  });

  describe('changeDirection', () => {
    it('changes to a valid direction', () => {
      const state = createGame(20, 20);
      const result = changeDirection(state, 'up');
      expect(result.direction).toBe('up');
    });

    it('does not allow 180° reversal (right to left)', () => {
      const state = createGame(20, 20); // default direction is 'right'
      const result = changeDirection(state, 'left');
      expect(result.direction).toBe('right');
    });

    it('does not allow 180° reversal (up to down)', () => {
      let state = createGame(20, 20);
      state = changeDirection(state, 'up');
      state = tick(state);
      const result = changeDirection(state, 'down');
      expect(result.direction).toBe('up');
    });

    it('does not allow 180° reversal (down to up)', () => {
      let state = createGame(20, 20);
      state = changeDirection(state, 'down');
      state = tick(state);
      const result = changeDirection(state, 'up');
      expect(result.direction).toBe('down');
    });

    it('does not allow 180° reversal (left to right)', () => {
      let state = createGame(20, 20);
      state = changeDirection(state, 'up');
      state = tick(state);
      state = changeDirection(state, 'left');
      state = tick(state);
      const result = changeDirection(state, 'right');
      expect(result.direction).toBe('left');
    });
  });

  describe('isGameOver', () => {
    it('returns false for a valid game', () => {
      const state = createGame(20, 20);
      expect(isGameOver(state)).toBe(false);
    });

    it('detects wall collision (right)', () => {
      let state = createGame(20, 20);
      state = {
        ...state,
        snake: [{ x: 19, y: 10 }, ...state.snake.slice(1)],
      };
      const next = tick(state);
      expect(next.gameOver).toBe(true);
    });

    it('detects wall collision (left)', () => {
      let state = createGame(20, 20);
      state = changeDirection(state, 'up');
      state = tick(state);
      state = changeDirection(state, 'left');
      state = {
        ...state,
        snake: [{ x: 0, y: 10 }, ...state.snake.slice(1)],
      };
      const next = tick(state);
      expect(next.gameOver).toBe(true);
    });

    it('detects wall collision (top)', () => {
      let state = createGame(20, 20);
      state = changeDirection(state, 'up');
      state = {
        ...state,
        snake: [{ x: 10, y: 0 }, ...state.snake.slice(1)],
      };
      const next = tick(state);
      expect(next.gameOver).toBe(true);
    });

    it('detects wall collision (bottom)', () => {
      let state = createGame(20, 20);
      state = changeDirection(state, 'down');
      state = {
        ...state,
        snake: [{ x: 10, y: 19 }, ...state.snake.slice(1)],
      };
      const next = tick(state);
      expect(next.gameOver).toBe(true);
    });

    it('detects self collision', () => {
      let state = createGame(20, 20);
      state = {
        ...state,
        snake: [
          { x: 5, y: 5 },
          { x: 6, y: 5 },
          { x: 6, y: 6 },
          { x: 5, y: 6 },
          { x: 4, y: 6 },
          { x: 4, y: 5 },
        ],
        direction: 'left' as Direction,
      };
      const next = tick(state);
      expect(next.gameOver).toBe(true);
    });
  });

  describe('speed progression', () => {
    it('returns faster tick interval as score increases', () => {
      const state = createGame(20, 20);
      const initialSpeed = state.tickInterval;

      const head = getHead(state);
      const scoredState = tick({
        ...state,
        score: 100,
        food: { x: head.x + 1, y: head.y },
      });
      expect(scoredState.tickInterval).toBeLessThan(initialSpeed);
    });
  });
});
