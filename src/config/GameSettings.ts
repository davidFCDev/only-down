/**
 * Game Settings for antigravity-test
 * Centralized configuration for all tunable game parameters
 */

export const GameSettings = {
  canvas: {
    width: 720,
    height: 1080,
  },
};

/**
 * Calculate dynamic game dimensions based on viewport aspect ratio.
 * Width is always 720, height adjusts to fill the viewport on tall screens.
 * Minimum height is 1080 (standard 2:3 ratio).
 *
 * A tolerance zone ensures viewports close to 2:3 always return exactly 1080,
 * preventing tiny variations (iframe sizing, browser chrome) from producing
 * unexpected game heights.
 *
 * Examples:
 *   2:3 viewport  → 720×1080
 *   9:16 viewport → 720×1280
 *   9:19.5 viewport → 720×1560
 */
export function getResponsiveDimensions(): { width: number; height: number } {
  const BASE_WIDTH = GameSettings.canvas.width;
  const MIN_HEIGHT = GameSettings.canvas.height;
  const BASE_ASPECT = BASE_WIDTH / MIN_HEIGHT; // 0.6667

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { width: BASE_WIDTH, height: MIN_HEIGHT };
  }

  const viewportAspect = viewportWidth / viewportHeight;

  // Tolerance: if viewport is within ~5% of 2:3 (or wider), use standard 1080.
  // Only expand height for clearly taller screens (9:16 = 0.5625, etc.)
  if (viewportAspect >= BASE_ASPECT - 0.035) {
    return { width: BASE_WIDTH, height: MIN_HEIGHT };
  }

  const gameHeight = Math.round(BASE_WIDTH / viewportAspect);

  return { width: BASE_WIDTH, height: gameHeight };
}

export default GameSettings;
