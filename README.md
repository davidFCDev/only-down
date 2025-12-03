# 🎱 Only Down

A fast-paced arcade game where you guide a ball through an endless helix tower, smashing platforms and chasing high scores!

> _"The only way is down... but how far can you go?"_

## 🎮 Gameplay

- **Tap/Click** left or right to rotate the helix
- **Smash** through colored platforms to score points
- **Avoid** the striped danger zones or it's game over!
- **Collect power-ups** to activate Super Smash mode
- **Unlock ball styles** as you climb the ranks

## 🏆 Rank System

| Rank           | Score Required | Unlocks                     |
| -------------- | -------------- | --------------------------- |
| Unranked       | 0              | Basic Ball                  |
| Noob           | 50             | Cyan Ball                   |
| Pro            | 250            | Polka Dot Ball              |
| Gravity Master | 500            | Master Ball + Premium Music |
| Legend         | 750            | Rainbow Ball                |
| Remixer        | 1000           | Neon Green Ball             |

## ✨ Features

- 🎵 Dynamic soundtrack with unlockable premium tracks
- 🎨 6 unique ball styles to collect
- ⚡ Power-up system with Super Smash mode
- 📱 Mobile-friendly with touch controls
- 🏅 Persistent progress via Farcade SDK
- 🌟 Particle effects and visual feedback

## 🛠️ Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📁 Project Structure

```
├── src/
│   ├── main.ts              # Game entry point
│   ├── scenes/
│   │   ├── PreloadScene.ts  # Asset loading & branding
│   │   ├── StartScene.ts    # Main menu & ball selector
│   │   └── HelixScene.ts    # Core gameplay
│   └── config/
│       └── GameSettings.ts  # Game configuration
└── dist/
    └── index.html           # Production build
```

## 🎨 Tech Stack

- **Phaser 3** - 2D Game Framework
- **Three.js** - 3D Helix Rendering
- **TypeScript** - Type Safety
- **Farcade SDK** - Leaderboards & Persistence

---

_Made with 💚 by Hellbound Studios™_
