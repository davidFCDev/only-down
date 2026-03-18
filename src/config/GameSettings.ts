/**
 * Game Settings for antigravity-test
 * Centralized configuration for all tunable game parameters
 */

export const GameSettings = {
  canvas: {
    width: 720,
    height: 1080,
  },
}

/**
 * Calculate dynamic game dimensions based on viewport aspect ratio.
 * Width is always 720, height adjusts to fill the viewport on tall screens.
 * Minimum height is 1080 (standard 2:3 ratio).
 *
 * Examples:
 *   2:3 viewport  → 720×1080
 *   9:16 viewport → 720×1280
 *   9:19.5 viewport → 720×1560
 */
export function getResponsiveDimensions(): { width: number; height: number } {
  const BASE_WIDTH = GameSettings.canvas.width;
  const MIN_HEIGHT = GameSettings.canvas.height;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { width: BASE_WIDTH, height: MIN_HEIGHT };
  }

  const viewportAspect = viewportWidth / viewportHeight;
  const gameHeight = Math.max(
    MIN_HEIGHT,
    Math.round(BASE_WIDTH / viewportAspect),
  );

  return { width: BASE_WIDTH, height: gameHeight };
}

export default GameSettings
