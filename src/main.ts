import { initRemix } from "@insidethesim/remix-dev";
import { getResponsiveDimensions } from "./config/GameSettings";
import HelixScene from "./scenes/HelixScene";
import { PreloadScene } from "./scenes/PreloadScene";
import StartScene from "./scenes/StartScene";

// Use global Phaser loaded via CDN
const Phaser = (window as any).Phaser;

// SDK mock is automatically initialized by the framework (dev-init.ts)

// Calculate responsive dimensions based on viewport aspect ratio
// Width stays at 720, height adjusts for tall screens (9:16, 9:19.5, etc.)
const dimensions = getResponsiveDimensions();

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: dimensions.width,
  height: dimensions.height,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: document.body,
    width: dimensions.width,
    height: dimensions.height,
  },
  transparent: true, // Make Phaser canvas transparent
  scene: [PreloadScene, StartScene, HelixScene],
  physics: {
    default: "arcade",
  },
  fps: {
    target: 60,
  },
  pixelArt: false,
  antialias: true,
};

// Create the game instance
const game = new Phaser.Game(config);

// Store globally for performance monitoring and HMR cleanup
(window as any).game = game;

// Handle viewport resize — recalculate game dimensions for new aspect ratio
window.addEventListener("resize", () => {
  const newDimensions = getResponsiveDimensions();
  game.scale.resize(newDimensions.width, newDimensions.height);
});

// Initialize Remix framework after game is created
game.events.once("ready", () => {
  initRemix(game, {
    multiplayer: false,
  });
});
