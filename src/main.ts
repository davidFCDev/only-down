import { initRemix } from "@insidethesim/remix-dev";
import GameSettings from "./config/GameSettings";
import HelixScene from "./scenes/HelixScene";
import { PreloadScene } from "./scenes/PreloadScene";

// Use global Phaser loaded via CDN
const Phaser = (window as any).Phaser;

// SDK mock is automatically initialized by the framework (dev-init.ts)

// Game configuration

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: GameSettings.canvas.width,
  height: GameSettings.canvas.height,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: document.body,
    width: GameSettings.canvas.width,
    height: GameSettings.canvas.height,
  },
  transparent: true, // Make Phaser canvas transparent
  scene: [PreloadScene, HelixScene],
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

// Initialize Remix framework after game is created
game.events.once("ready", () => {
  initRemix(game, {
    multiplayer: false,
  });
});
