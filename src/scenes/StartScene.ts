// Use global Phaser loaded via CDN
const Phaser = (window as any).Phaser;

// Ball styles configuration
const BALL_STYLES: {
  [key: string]: {
    name: string;
    requiredRank: string;
    colors: { base: number; dots?: number[]; aura?: number };
  };
} = {
  unranked: {
    name: "Basic",
    requiredRank: "Unranked",
    colors: { base: 0x2ecc71 }, // Green like the game
  },
  noob: {
    name: "Noob",
    requiredRank: "Noob",
    colors: { base: 0x00d2d3, aura: 0x00d2d3 }, // Cyan
  },
  pro: {
    name: "Pro",
    requiredRank: "Pro",
    colors: { base: 0xffffff, dots: [0xff2222], aura: 0xff2222 },
  },
  master: {
    name: "Master",
    requiredRank: "Gravity Master",
    colors: { base: 0xff6b35, dots: [0xffd93d], aura: 0xff6b35 },
  },
  legend: {
    name: "Legend",
    requiredRank: "Legend",
    colors: {
      base: 0xff9f43,
      dots: [0xe91e8c, 0x00d2d3, 0xfeca57],
      aura: 0xff9f43,
    },
  },
  remixer: {
    name: "Remixer",
    requiredRank: "Remixer",
    colors: { base: 0xb7ff00, aura: 0xb7ff00 },
  },
};

const RANK_ORDER = [
  "Unranked",
  "Noob",
  "Pro",
  "Gravity Master",
  "Legend",
  "Remixer",
];

// Custom Level Configuration (Premium 500 credits)
const LEVEL_PALETTES: {
  [key: string]: {
    name: string;
    platform: number; // Normal platform color
    danger: number; // Danger zone color
    moving: number; // Moving platform color
    blinking: number; // Blinking platform color
  };
} = {
  classic: {
    name: "Classic",
    platform: 0x2ecc71, // Green
    danger: 0xe74c3c, // Red
    moving: 0x3498db, // Blue
    blinking: 0x9b59b6, // Purple
  },
  cyberpunk: {
    name: "Cyberpunk",
    platform: 0x00ff00, // Verde neón (igual que Chaos)
    danger: 0xff0044, // Rojo neón
    moving: 0xff00ff, // Púrpura/Magenta (igual que Chaos)
    blinking: 0xffff00, // Amarillo (igual que Chaos)
  },
  ocean: {
    name: "Ocean",
    platform: 0x0077be, // Ocean blue
    danger: 0xff6b6b, // Coral red
    moving: 0x00cec9, // Teal
    blinking: 0x74b9ff, // Light blue
  },
  sunset: {
    name: "Sunset",
    platform: 0xff7675, // Salmon
    danger: 0xd63031, // Dark red
    moving: 0xfdcb6e, // Golden
    blinking: 0xe17055, // Orange
  },
};

const LEVEL_BACKGROUNDS: {
  [key: string]: {
    name: string;
    color: number;
  };
} = {
  classic: { name: "Classic", color: 0xf5d89a }, // Warm yellow/cream
  cyberpunk: { name: "Cyberpunk", color: 0x0a0a0a }, // Near black
  ocean: { name: "Ocean", color: 0x1a1a2e }, // Dark blue
  sunset: { name: "Sunset", color: 0x2d1b69 }, // Deep purple
};

const LEVEL_TRAILS: {
  [key: string]: {
    name: string;
    color: number;
    enabled: boolean;
  };
} = {
  none: { name: "None", color: 0x000000, enabled: false },
  fire: { name: "Fire", color: 0xff4500, enabled: true },
  neon: { name: "Neon", color: 0xb7ff00, enabled: true },
  electric: { name: "Electric", color: 0x00ffff, enabled: true },
  rainbow: { name: "Rainbow", color: 0xff00ff, enabled: true },
};

// Default custom level config
const DEFAULT_CUSTOM_LEVEL = {
  palette: "classic",
  background: "classic",
  trail: "none",
};

export default class StartScene extends Phaser.Scene {
  private titleContainer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;
  private startBtnContainer!: Phaser.GameObjects.Container;
  private ballSelectBtnContainer!: Phaser.GameObjects.Container;
  private ballSelectModalContainer!: Phaser.GameObjects.Container;
  private tutorialContainer!: Phaser.GameObjects.Container;
  private bouncingBall!: Phaser.GameObjects.Container;
  private bouncingBallGraphics!: Phaser.GameObjects.Graphics;
  private bouncingBallImage: Phaser.GameObjects.Image | null = null;
  private hasSeenTutorial: boolean = false;
  private highScore: number = 0;
  private selectedBallStyle: string = "unranked";
  private isChaosMode: boolean = false;
  private chaosBtnContainer!: Phaser.GameObjects.Container;
  private isChaosUnlocked: boolean = false; // Whether user has purchased Chaos Mode
  private chaosBtnBg!: Phaser.GameObjects.Graphics;
  private chaosBtnText!: Phaser.GameObjects.Text;
  private chaosBadgeBg!: Phaser.GameObjects.Graphics;
  private chaosBadgeText!: Phaser.GameObjects.Text;
  private isBallsUnlocked: boolean = false; // Whether user has purchased Ball Select
  private ballsBtnBg!: Phaser.GameObjects.Graphics;
  private ballsBtnText!: Phaser.GameObjects.Text;
  private ballsBadgeBg!: Phaser.GameObjects.Graphics;
  private ballsBadgeText!: Phaser.GameObjects.Text;

  // Custom Level (Premium 500 credits)
  private isCustomLevelUnlocked: boolean = true; // DEV MODE: Set to true for testing
  private customLevelBtnContainer!: Phaser.GameObjects.Container;
  private customLevelBtnBg!: Phaser.GameObjects.Graphics;
  private customLevelBtnText!: Phaser.GameObjects.Text;
  private customLevelBadgeBg!: Phaser.GameObjects.Graphics;
  private customLevelBadgeText!: Phaser.GameObjects.Text;
  private customLevelModalContainer!: Phaser.GameObjects.Container;
  private customLevelConfig: {
    palette: string;
    background: string;
    trail: string;
  } = {
    ...DEFAULT_CUSTOM_LEVEL,
  };

  // Development controls
  private testRank: string = "Remixer";
  private ranks: string[] = [
    "Unranked",
    "Noob",
    "Pro",
    "Gravity Master",
    "Legend",
    "Remixer",
  ];
  private devControlsContainer!: Phaser.GameObjects.Container;
  private rankDisplayText!: Phaser.GameObjects.Text;

  constructor() {
    super("StartScene");
  }

  async create() {
    console.log("🚀 StartScene create() iniciado");
    const width = this.scale.width;
    const height = this.scale.height;

    // Check if user has seen tutorial before
    await this.checkTutorialState();
    console.log("✅ checkTutorialState completado");

    // Background image - colorful waves (reduced intensity)
    const bg = this.add.image(width / 2, height / 2, "startBg");
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.6); // Reduce intensity so it doesn't stand out too much

    // Title with cartoon style
    this.createTitle(width, height);
    console.log("✅ createTitle completado");

    // Show rank below title
    this.createRankDisplay(width, height);
    console.log("✅ createRankDisplay completado");

    // Start button directly
    this.createMainStartButton(width, height);
    console.log("✅ createMainStartButton completado");

    // Development controls for rank testing - HIDDEN
    // this.createDevControls(width, height);
  }

  async checkTutorialState() {
    try {
      const sdk = window.FarcadeSDK;

      // Try to get game state without blocking - SDK now auto-calls ready()
      // Use getGameState if available, otherwise try ready() with short timeout
      let gameInfo: any = null;

      if (sdk?.singlePlayer?.actions) {
        // Try the new way first (getGameState or similar)
        if ((sdk.singlePlayer.actions as any).getGameState) {
          gameInfo = await (sdk.singlePlayer.actions as any).getGameState();
        } else if (sdk.singlePlayer.actions.ready) {
          // Fallback to ready() with a very short timeout (500ms)
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve(null), 500)
          );

          gameInfo = await Promise.race([
            sdk.singlePlayer.actions.ready(),
            timeoutPromise,
          ]);
        }
      }

      if (gameInfo) {
        console.log("📊 SDK gameInfo:", JSON.stringify(gameInfo, null, 2));

        if (gameInfo?.initialGameState?.gameState?.hasSeenTutorial) {
          this.hasSeenTutorial = true;
        }

        // Get selected ball style
        if (gameInfo?.initialGameState?.gameState?.selectedBallStyle) {
          this.selectedBallStyle =
            gameInfo.initialGameState.gameState.selectedBallStyle;
        }

        // Get high score for rank system
        let sdkHighScore = 0;
        let gameStateHighScore = 0;

        if (typeof gameInfo?.highScore === "number") {
          sdkHighScore = gameInfo.highScore;
        } else if (typeof gameInfo?.initialGameState?.highScore === "number") {
          sdkHighScore = gameInfo.initialGameState.highScore;
        }

        if (
          typeof gameInfo?.initialGameState?.gameState?.highScore === "number"
        ) {
          gameStateHighScore = gameInfo.initialGameState.gameState.highScore;
        }

        this.highScore = Math.max(sdkHighScore, gameStateHighScore);
        console.log(
          "🏆 High Score loaded - SDK:",
          sdkHighScore,
          "GameState:",
          gameStateHighScore,
          "Using:",
          this.highScore
        );
        console.log("⚽ Selected Ball Style:", this.selectedBallStyle);

        // Get custom level config
        if (gameInfo?.initialGameState?.gameState?.customLevelConfig) {
          this.customLevelConfig = {
            ...DEFAULT_CUSTOM_LEVEL,
            ...gameInfo.initialGameState.gameState.customLevelConfig,
          };
          console.log("🎨 Custom Level Config loaded:", this.customLevelConfig);
        }
      } else {
        console.log("📊 SDK not available or timed out, using defaults");
      }

      // Check if user has purchased Chaos Mode
      if ((sdk as any)?.hasItem) {
        this.isChaosUnlocked = (sdk as any).hasItem(
          "chaos-mode-new-style-music"
        );
        console.log("🎮 Chaos Mode unlocked:", this.isChaosUnlocked);

        this.isBallsUnlocked = (sdk as any).hasItem("exclusive-balls");
        console.log("⚽ Balls unlocked:", this.isBallsUnlocked);

        // Custom Level check (will be false in dev mode override)
        // this.isCustomLevelUnlocked = (sdk as any).hasItem("custom-level");
        console.log("🎨 Custom Level unlocked:", this.isCustomLevelUnlocked);
      }

      // Listen for purchase completions
      if ((sdk as any)?.onPurchaseComplete) {
        (sdk as any).onPurchaseComplete(() => {
          this.checkChaosPurchase();
          this.checkBallsPurchase();
          this.checkCustomLevelPurchase();
        });
      }
    } catch (error) {
      console.log("Could not load game state:", error);
    }
  }

  async saveTutorialSeen() {
    try {
      const sdk = window.FarcadeSDK;
      if (sdk?.singlePlayer?.actions?.saveGameState) {
        // Preserve high score and ball style when saving tutorial state
        await sdk.singlePlayer.actions.saveGameState({
          gameState: {
            hasSeenTutorial: true,
            highScore: this.highScore,
            selectedBallStyle: this.selectedBallStyle,
          },
        });
      }
    } catch (error) {
      console.log("Could not save game state:", error);
    }
  }

  async saveBallStyle(style: string) {
    this.selectedBallStyle = style;
    try {
      const sdk = window.FarcadeSDK;
      if (sdk?.singlePlayer?.actions?.saveGameState) {
        await sdk.singlePlayer.actions.saveGameState({
          gameState: {
            hasSeenTutorial: this.hasSeenTutorial,
            highScore: this.highScore,
            selectedBallStyle: style,
          },
        });
        console.log("⚽ Ball style saved:", style);
      }
    } catch (error) {
      console.log("Could not save ball style:", error);
    }
  }

  getUnlockedBallStyles(): string[] {
    // DEV MODE: Unlock all ball styles for testing
    const devMode = false;
    if (devMode) {
      return Object.keys(BALL_STYLES);
    }

    const playerRank = this.getRank(this.highScore).name;
    const playerRankIndex = RANK_ORDER.indexOf(playerRank);

    const unlockedStyles: string[] = [];
    for (const [styleKey, style] of Object.entries(BALL_STYLES)) {
      const requiredRankIndex = RANK_ORDER.indexOf(style.requiredRank);
      if (requiredRankIndex <= playerRankIndex) {
        unlockedStyles.push(styleKey);
      }
    }
    return unlockedStyles;
  }

  createTitle(width: number, height: number) {
    const titleFontSize = Math.min(90, width * 0.18);

    this.titleContainer = this.add.container(width / 2, height * 0.15);
    this.titleContainer.setAlpha(0);

    // Main title - ONLY DOWN with cartoon font
    this.titleText = this.add
      .text(0, 0, "ONLY DOWN", {
        fontSize: `${titleFontSize}px`,
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 12,
      })
      .setOrigin(0.5);
    this.titleContainer.add(this.titleText);

    // Fade in and slide
    this.tweens.add({
      targets: this.titleContainer,
      alpha: 1,
      y: height * 0.18,
      duration: 1200,
      ease: "Back.out",
    });
  }

  getRank(score: number): { name: string; color: string } {
    // Rank thresholds and names
    // All ranks yellow except Remixer which is neon green
    if (score >= 1000) return { name: "Remixer", color: "#b7ff00" }; // Neon Green
    if (score >= 750) return { name: "Legend", color: "#ffd93d" }; // Yellow
    if (score >= 500) return { name: "Gravity Master", color: "#ffd93d" }; // Yellow
    if (score >= 250) return { name: "Pro", color: "#ffd93d" }; // Yellow
    if (score >= 50) return { name: "Noob", color: "#ffd93d" }; // Yellow
    return { name: "Unranked", color: "#ffd93d" }; // Yellow
  }

  getScoreForRank(rankName: string): number {
    // Returns the minimum score required for each rank
    switch (rankName) {
      case "Remixer":
        return 1000;
      case "Legend":
        return 750;
      case "Gravity Master":
        return 500;
      case "Pro":
        return 250;
      case "Noob":
        return 50;
      default:
        return 0;
    }
  }

  createRankDisplay(width: number, height: number) {
    const rank = this.getRank(this.highScore);
    const rankFontSize = Math.min(32, width * 0.07);

    this.rankText = this.add
      .text(width / 2, height * 0.26, `Rank: ${rank.name}`, {
        fontSize: `${rankFontSize}px`,
        color: rank.color,
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Fade in with delay
    this.tweens.add({
      targets: this.rankText,
      alpha: 1,
      duration: 800,
      delay: 800,
      ease: "Power2",
    });
  }

  createMainStartButton(width: number, height: number) {
    const btnWidth = Math.min(340, width * 0.72);
    const btnHeight = 70;
    const cornerRadius = 20;

    this.startBtnContainer = this.add.container(width / 2, height * 0.42);
    this.startBtnContainer.setAlpha(0);

    // Button background - green with black border
    const btnBg = this.add.graphics();
    // Black border (slightly larger)
    btnBg.fillStyle(0x000000, 1);
    btnBg.fillRoundedRect(
      -btnWidth / 2 - 5,
      -btnHeight / 2 - 5,
      btnWidth + 10,
      btnHeight + 10,
      cornerRadius + 2
    );
    // Green fill
    btnBg.fillStyle(0x2ecc71, 1);
    btnBg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      cornerRadius
    );
    this.startBtnContainer.add(btnBg);

    // Button text
    const btnText = this.add
      .text(0, 0, "PLAY", {
        fontSize: "42px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.startBtnContainer.add(btnText);

    // Interactive zone
    const zone = this.add
      .zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tweens.add({
          targets: this.startBtnContainer,
          scale: 1.08,
          duration: 100,
        });
      })
      .on("pointerout", () => {
        this.tweens.add({
          targets: this.startBtnContainer,
          scale: 1,
          duration: 100,
        });
      })
      .on("pointerdown", () => {
        this.startGame();
      });
    this.startBtnContainer.add(zone);

    // Simple fade in (no animation)
    this.tweens.add({
      targets: this.startBtnContainer,
      alpha: 1,
      duration: 400,
      delay: 600,
    });

    // Create ball select button
    this.createBallSelectButton(width, height);

    // Create chaos mode button
    this.createChaosModeButton(width, height);

    // Create custom level button (Premium)
    this.createCustomLevelButton(width, height);

    // Create bouncing ball animation after button appears
    this.time.delayedCall(1000, () => {
      this.createBouncingBall(width, height);
    });
  }

  createBallSelectButton(width: number, height: number) {
    const btnWidth = Math.min(340, width * 0.72);
    const btnHeight = 70;
    const cornerRadius = 20;

    this.ballSelectBtnContainer = this.add.container(width / 2, height * 0.54);
    this.ballSelectBtnContainer.setAlpha(0);

    // Button background
    this.ballsBtnBg = this.add.graphics();
    this.ballSelectBtnContainer.add(this.ballsBtnBg);

    // Button text
    this.ballsBtnText = this.add
      .text(0, 0, "BALLS", {
        fontSize: "42px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.ballSelectBtnContainer.add(this.ballsBtnText);

    // Badge (empty or 10 credits)
    this.ballsBadgeBg = this.add.graphics();
    this.ballSelectBtnContainer.add(this.ballsBadgeBg);

    this.ballsBadgeText = this.add
      .text(0, 0, "", {
        fontSize: "24px",
        color: "#000000",
        fontFamily: "Fredoka",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.ballSelectBtnContainer.add(this.ballsBadgeText);

    // Update button appearance based on unlock status
    this.updateBallsButtonAppearance(btnWidth, btnHeight, cornerRadius);

    // Interactive zone
    const zone = this.add
      .zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tweens.add({
          targets: this.ballSelectBtnContainer,
          scale: 1.08,
          duration: 100,
        });
      })
      .on("pointerout", () => {
        this.tweens.add({
          targets: this.ballSelectBtnContainer,
          scale: 1,
          duration: 100,
        });
      })
      .on("pointerdown", () => {
        if (this.isBallsUnlocked) {
          this.showBallSelectModal();
        } else {
          this.purchaseBalls();
        }
      });
    this.ballSelectBtnContainer.add(zone);

    // Fade in with delay
    this.tweens.add({
      targets: this.ballSelectBtnContainer,
      alpha: 1,
      duration: 400,
      delay: 800,
    });
  }

  updateBallsButtonAppearance(
    btnWidth: number,
    btnHeight: number,
    cornerRadius: number
  ) {
    // Clear and redraw button background
    this.ballsBtnBg.clear();

    if (this.isBallsUnlocked) {
      // UNLOCKED - Magenta with black border
      this.ballsBtnBg.fillStyle(0x000000, 1);
      this.ballsBtnBg.fillRoundedRect(
        -btnWidth / 2 - 5,
        -btnHeight / 2 - 5,
        btnWidth + 10,
        btnHeight + 10,
        cornerRadius + 2
      );
      this.ballsBtnBg.fillStyle(0xe91e8c, 1);
      this.ballsBtnBg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        cornerRadius
      );

      // Hide badge when unlocked
      this.ballsBadgeBg.clear();
      this.ballsBadgeText.setText("");
    } else {
      // LOCKED - Gray background
      this.ballsBtnBg.fillStyle(0x000000, 1);
      this.ballsBtnBg.fillRoundedRect(
        -btnWidth / 2 - 5,
        -btnHeight / 2 - 5,
        btnWidth + 10,
        btnHeight + 10,
        cornerRadius + 2
      );
      this.ballsBtnBg.fillStyle(0x555555, 1); // Gray background
      this.ballsBtnBg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        cornerRadius
      );

      // 10 credits badge - gold/yellow, OVERLAPPING bottom of button
      const badgeWidth = 140;
      const badgeHeight = 44;
      const badgeX = 0; // Centered
      const badgeY = btnHeight / 2 + 8; // Overlapping bottom edge of button
      this.ballsBadgeBg.clear();
      this.ballsBadgeBg.fillStyle(0xffd93d, 1); // Gold
      this.ballsBadgeBg.fillRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        12
      );
      this.ballsBadgeBg.lineStyle(4, 0x000000, 1);
      this.ballsBadgeBg.strokeRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        12
      );
      this.ballsBadgeText.setText("10 CREDITS");
      this.ballsBadgeText.setPosition(badgeX, badgeY);
      this.ballsBadgeText.setFontSize(24);
    }
  }

  async purchaseBalls() {
    try {
      const sdk = window.FarcadeSDK as any;
      if (sdk?.purchase) {
        console.log("🛒 Initiating Balls purchase...");
        const result = await sdk.purchase({ item: "exclusive-balls" });

        if (result.success) {
          console.log("✅ Balls purchased successfully!");
          this.isBallsUnlocked = true;
          this.updateBallsButtonAppearance(
            Math.min(340, this.scale.width * 0.72),
            90,
            24
          );
        } else {
          console.log("❌ Balls purchase failed or cancelled");
        }
      } else {
        console.log("⚠️ SDK purchase not available");
      }
    } catch (error) {
      console.error("Purchase error:", error);
    }
  }

  checkBallsPurchase() {
    const sdk = window.FarcadeSDK as any;
    if (sdk?.hasItem && sdk.hasItem("exclusive-balls")) {
      this.isBallsUnlocked = true;
      this.updateBallsButtonAppearance(
        Math.min(340, this.scale.width * 0.72),
        90,
        24
      );
      console.log("🎉 Balls now unlocked!");
    }
  }

  createChaosModeButton(width: number, height: number) {
    const btnWidth = Math.min(340, width * 0.72);
    const btnHeight = 70;
    const cornerRadius = 20;

    this.chaosBtnContainer = this.add.container(width / 2, height * 0.66);
    this.chaosBtnContainer.setAlpha(0);

    // Button background
    this.chaosBtnBg = this.add.graphics();
    this.chaosBtnContainer.add(this.chaosBtnBg);

    // Button text
    this.chaosBtnText = this.add
      .text(0, 0, "CHAOS", {
        fontSize: "42px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.chaosBtnContainer.add(this.chaosBtnText);

    // Badge (NEW or 100 credits)
    const badgeWidth = this.isChaosUnlocked ? 55 : 80;
    const badgeHeight = 24;
    const badgeX = btnWidth / 2 - 10;
    const badgeY = -btnHeight / 2 - 5;

    this.chaosBadgeBg = this.add.graphics();
    this.chaosBtnContainer.add(this.chaosBadgeBg);

    this.chaosBadgeText = this.add
      .text(badgeX, badgeY, "", {
        fontSize: "16px",
        color: "#000000",
        fontFamily: "Fredoka",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.chaosBtnContainer.add(this.chaosBadgeText);

    // Update button appearance based on unlock status
    this.updateChaosButtonAppearance(btnWidth, btnHeight, cornerRadius);

    // Interactive zone
    const zone = this.add
      .zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tweens.add({
          targets: this.chaosBtnContainer,
          scale: 1.08,
          duration: 100,
        });
      })
      .on("pointerout", () => {
        this.tweens.add({
          targets: this.chaosBtnContainer,
          scale: 1,
          duration: 100,
        });
      })
      .on("pointerdown", () => {
        if (this.isChaosUnlocked) {
          this.startChaosMode();
        } else {
          this.purchaseChaosMode();
        }
      });
    this.chaosBtnContainer.add(zone);

    // Fade in with delay
    this.tweens.add({
      targets: this.chaosBtnContainer,
      alpha: 1,
      duration: 400,
      delay: 1000,
    });
  }

  updateChaosButtonAppearance(
    btnWidth: number,
    btnHeight: number,
    cornerRadius: number
  ) {
    // Clear and redraw button background
    this.chaosBtnBg.clear();

    if (this.isChaosUnlocked) {
      // UNLOCKED - Orange/fire with black border
      this.chaosBtnBg.fillStyle(0x000000, 1);
      this.chaosBtnBg.fillRoundedRect(
        -btnWidth / 2 - 5,
        -btnHeight / 2 - 5,
        btnWidth + 10,
        btnHeight + 10,
        cornerRadius + 2
      );
      this.chaosBtnBg.fillStyle(0xff6b35, 1);
      this.chaosBtnBg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        cornerRadius
      );

      this.chaosBtnText.setX(0);

      // NEW badge - green, top right corner
      const badgeWidth = 55;
      const badgeHeight = 24;
      const badgeX = btnWidth / 2 - 10;
      const badgeY = -btnHeight / 2 - 5;
      this.chaosBadgeBg.clear();
      this.chaosBadgeBg.fillStyle(0x00ff88, 1);
      this.chaosBadgeBg.fillRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        8
      );
      this.chaosBadgeBg.lineStyle(2, 0x000000, 1);
      this.chaosBadgeBg.strokeRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        8
      );
      this.chaosBadgeText.setText("NEW");
      this.chaosBadgeText.setPosition(badgeX, badgeY);
      this.chaosBadgeText.setFontSize(16);
    } else {
      // LOCKED - Gray background
      this.chaosBtnBg.fillStyle(0x000000, 1);
      this.chaosBtnBg.fillRoundedRect(
        -btnWidth / 2 - 5,
        -btnHeight / 2 - 5,
        btnWidth + 10,
        btnHeight + 10,
        cornerRadius + 2
      );
      this.chaosBtnBg.fillStyle(0x555555, 1); // Gray background
      this.chaosBtnBg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        cornerRadius
      );

      this.chaosBtnText.setX(0);

      // 100 credits badge - gold/yellow, OVERLAPPING bottom of button, much bigger
      const badgeWidth = 160;
      const badgeHeight = 44;
      const badgeX = 0; // Centered
      const badgeY = btnHeight / 2 + 8; // Overlapping bottom edge of button
      this.chaosBadgeBg.clear();
      this.chaosBadgeBg.fillStyle(0xffd93d, 1); // Gold
      this.chaosBadgeBg.fillRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        12
      );
      this.chaosBadgeBg.lineStyle(4, 0x000000, 1);
      this.chaosBadgeBg.strokeRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        12
      );
      this.chaosBadgeText.setText("100 CREDITS");
      this.chaosBadgeText.setPosition(badgeX, badgeY);
      this.chaosBadgeText.setFontSize(24);
    }
  }

  async purchaseChaosMode() {
    try {
      const sdk = window.FarcadeSDK as any;
      if (sdk?.purchase) {
        console.log("🛒 Initiating Chaos Mode purchase...");
        const result = await sdk.purchase({
          item: "chaos-mode-new-style-music",
        });

        if (result.success) {
          console.log("✅ Chaos Mode purchased successfully!");
          this.isChaosUnlocked = true;
          this.updateChaosButtonAppearance(
            Math.min(320, this.scale.width * 0.65),
            80,
            22
          );
        } else {
          console.log("❌ Chaos Mode purchase failed or cancelled");
        }
      } else {
        console.log("⚠️ SDK purchase not available");
      }
    } catch (error) {
      console.error("Purchase error:", error);
    }
  }

  checkChaosPurchase() {
    const sdk = window.FarcadeSDK as any;
    if (sdk?.hasItem && sdk.hasItem("chaos-mode-new-style-music")) {
      this.isChaosUnlocked = true;
      this.updateChaosButtonAppearance(
        Math.min(320, this.scale.width * 0.65),
        80,
        22
      );
      console.log("🎉 Chaos Mode now unlocked!");
    }
  }

  startChaosMode() {
    this.isChaosMode = true;
    // Chaos mode skips tutorial - go directly to game
    this.scene.start("HelixScene", {
      testRank: this.testRank,
      ballStyle: this.selectedBallStyle,
      highScore: this.highScore,
      chaosMode: true,
    });
  }

  // ============ CUSTOM LEVEL (PREMIUM 500 CREDITS) ============

  createCustomLevelButton(width: number, height: number) {
    const btnWidth = Math.min(340, width * 0.72);
    const btnHeight = 70;
    const cornerRadius = 20;

    this.customLevelBtnContainer = this.add.container(width / 2, height * 0.78);
    this.customLevelBtnContainer.setAlpha(0);

    // Button background
    this.customLevelBtnBg = this.add.graphics();
    this.customLevelBtnContainer.add(this.customLevelBtnBg);

    // Button text
    this.customLevelBtnText = this.add
      .text(0, 0, "CUSTOM", {
        fontSize: "42px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.customLevelBtnContainer.add(this.customLevelBtnText);

    // Badge
    this.customLevelBadgeBg = this.add.graphics();
    this.customLevelBtnContainer.add(this.customLevelBadgeBg);

    this.customLevelBadgeText = this.add
      .text(0, 0, "", {
        fontSize: "20px",
        color: "#000000",
        fontFamily: "Fredoka",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.customLevelBtnContainer.add(this.customLevelBadgeText);

    // Update button appearance
    this.updateCustomLevelButtonAppearance(btnWidth, btnHeight, cornerRadius);

    // Interactive zone
    const zone = this.add
      .zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tweens.add({
          targets: this.customLevelBtnContainer,
          scale: 1.08,
          duration: 100,
        });
      })
      .on("pointerout", () => {
        this.tweens.add({
          targets: this.customLevelBtnContainer,
          scale: 1,
          duration: 100,
        });
      })
      .on("pointerdown", () => {
        if (this.isCustomLevelUnlocked) {
          this.showCustomLevelModal();
        } else {
          this.purchaseCustomLevel();
        }
      });
    this.customLevelBtnContainer.add(zone);

    // Fade in with delay
    this.tweens.add({
      targets: this.customLevelBtnContainer,
      alpha: 1,
      duration: 400,
      delay: 1200,
    });
  }

  updateCustomLevelButtonAppearance(
    btnWidth: number,
    btnHeight: number,
    cornerRadius: number
  ) {
    this.customLevelBtnBg.clear();

    if (this.isCustomLevelUnlocked) {
      // UNLOCKED - Purple/gradient
      this.customLevelBtnBg.fillStyle(0x000000, 1);
      this.customLevelBtnBg.fillRoundedRect(
        -btnWidth / 2 - 5,
        -btnHeight / 2 - 5,
        btnWidth + 10,
        btnHeight + 10,
        cornerRadius + 2
      );
      this.customLevelBtnBg.fillStyle(0x9b59b6, 1); // Purple
      this.customLevelBtnBg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        cornerRadius
      );

      // VIP badge - gold, top right
      const badgeWidth = 50;
      const badgeHeight = 22;
      const badgeX = btnWidth / 2 - 10;
      const badgeY = -btnHeight / 2 - 5;
      this.customLevelBadgeBg.clear();
      this.customLevelBadgeBg.fillStyle(0xffd700, 1);
      this.customLevelBadgeBg.fillRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        8
      );
      this.customLevelBadgeBg.lineStyle(2, 0x000000, 1);
      this.customLevelBadgeBg.strokeRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        8
      );
      this.customLevelBadgeText.setText("VIP");
      this.customLevelBadgeText.setPosition(badgeX, badgeY);
      this.customLevelBadgeText.setFontSize(14);
    } else {
      // LOCKED - Gray
      this.customLevelBtnBg.fillStyle(0x000000, 1);
      this.customLevelBtnBg.fillRoundedRect(
        -btnWidth / 2 - 5,
        -btnHeight / 2 - 5,
        btnWidth + 10,
        btnHeight + 10,
        cornerRadius + 2
      );
      this.customLevelBtnBg.fillStyle(0x555555, 1);
      this.customLevelBtnBg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        cornerRadius
      );

      // 500 credits badge
      const badgeWidth = 140;
      const badgeHeight = 36;
      const badgeX = 0;
      const badgeY = btnHeight / 2 + 6;
      this.customLevelBadgeBg.clear();
      this.customLevelBadgeBg.fillStyle(0xffd93d, 1);
      this.customLevelBadgeBg.fillRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        10
      );
      this.customLevelBadgeBg.lineStyle(3, 0x000000, 1);
      this.customLevelBadgeBg.strokeRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        10
      );
      this.customLevelBadgeText.setText("500 CREDITS");
      this.customLevelBadgeText.setPosition(badgeX, badgeY);
      this.customLevelBadgeText.setFontSize(20);
    }
  }

  async purchaseCustomLevel() {
    try {
      const sdk = window.FarcadeSDK as any;
      if (sdk?.purchase) {
        console.log("🛒 Initiating Custom Level purchase...");
        const result = await sdk.purchase({ item: "custom-level" });

        if (result.success) {
          console.log("✅ Custom Level purchased successfully!");
          this.isCustomLevelUnlocked = true;
          this.updateCustomLevelButtonAppearance(
            Math.min(340, this.scale.width * 0.72),
            70,
            20
          );
        } else {
          console.log("❌ Custom Level purchase failed or cancelled");
        }
      } else {
        console.log("⚠️ SDK purchase not available");
      }
    } catch (error) {
      console.error("Purchase error:", error);
    }
  }

  checkCustomLevelPurchase() {
    const sdk = window.FarcadeSDK as any;
    if (sdk?.hasItem && sdk.hasItem("custom-level")) {
      this.isCustomLevelUnlocked = true;
      this.updateCustomLevelButtonAppearance(
        Math.min(340, this.scale.width * 0.72),
        70,
        20
      );
      console.log("🎉 Custom Level now unlocked!");
    }
  }

  showCustomLevelModal() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.customLevelModalContainer = this.add.container(0, 0);
    this.customLevelModalContainer.setAlpha(0);
    this.customLevelModalContainer.setDepth(100);

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.95);
    overlay.fillRect(0, 0, width, height);
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    this.customLevelModalContainer.add(overlay);

    // Modal title
    const titleFontSize = Math.min(32, width * 0.07);
    const title = this.add
      .text(width / 2, height * 0.05, "CUSTOM LEVEL", {
        fontSize: `${titleFontSize}px`,
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.customLevelModalContainer.add(title);

    // Section 1: PALETTE SELECTOR
    const paletteSectionY = height * 0.16;
    this.createPaletteSelector(width, paletteSectionY);

    // Section 2: BACKGROUND SELECTOR
    const bgSectionY = height * 0.38;
    this.createBackgroundSelector(width, bgSectionY);

    // Section 3: TRAIL SELECTOR
    const trailSectionY = height * 0.6;
    this.createTrailSelector(width, trailSectionY);

    // Buttons: SAVE, RESET, CLOSE
    const btnY = height * 0.82;
    this.createCustomLevelModalButtons(width, btnY);

    // Fade in
    this.tweens.add({
      targets: this.customLevelModalContainer,
      alpha: 1,
      duration: 300,
      ease: "Power2",
    });
  }

  createPaletteSelector(width: number, y: number) {
    // Section label
    const label = this.add
      .text(width / 2, y - 35, "PALETTE", {
        fontSize: "18px",
        color: "#ffd93d",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.customLevelModalContainer.add(label);

    // Palette options
    const palettes = Object.keys(LEVEL_PALETTES);
    const btnWidth = 75;
    const btnHeight = 50;
    const spacing = 82;
    const startX = width / 2 - ((palettes.length - 1) * spacing) / 2;

    palettes.forEach((paletteKey, index) => {
      const paletteData = LEVEL_PALETTES[paletteKey];
      const x = startX + index * spacing;
      const isSelected = this.customLevelConfig.palette === paletteKey;

      // Button background
      const btn = this.add.graphics();
      btn.fillStyle(isSelected ? 0xffd93d : 0x333333, 1);
      btn.fillRoundedRect(
        x - btnWidth / 2,
        y - btnHeight / 2,
        btnWidth,
        btnHeight,
        8
      );
      btn.lineStyle(2, 0x000000, 1);
      btn.strokeRoundedRect(
        x - btnWidth / 2,
        y - btnHeight / 2,
        btnWidth,
        btnHeight,
        8
      );
      this.customLevelModalContainer.add(btn);

      // Color preview (4 small squares)
      const previewSize = 12;
      const previewSpacing = 14;
      const previewStartX = x - previewSpacing * 1.5;
      const colors = [
        paletteData.platform,
        paletteData.danger,
        paletteData.moving,
        paletteData.blinking,
      ];
      colors.forEach((color, ci) => {
        const px = previewStartX + ci * previewSpacing;
        btn.fillStyle(color, 1);
        btn.fillRect(px, y - previewSize / 2, previewSize, previewSize);
      });

      // Label
      const paletteLabel = this.add
        .text(x, y + btnHeight / 2 + 12, paletteData.name, {
          fontSize: "12px",
          color: isSelected ? "#ffd93d" : "#FFFFFF",
          fontFamily: "Fredoka",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.customLevelModalContainer.add(paletteLabel);

      // Interactive zone
      const zone = this.add
        .zone(x, y, btnWidth, btnHeight + 20)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          this.customLevelConfig.palette = paletteKey;
          this.refreshCustomLevelModal();
        });
      this.customLevelModalContainer.add(zone);
    });
  }

  createBackgroundSelector(width: number, y: number) {
    // Section label
    const label = this.add
      .text(width / 2, y - 35, "BACKGROUND", {
        fontSize: "18px",
        color: "#ffd93d",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.customLevelModalContainer.add(label);

    // Background options
    const backgrounds = Object.keys(LEVEL_BACKGROUNDS);
    const btnWidth = 75;
    const btnHeight = 50;
    const spacing = 82;
    const startX = width / 2 - ((backgrounds.length - 1) * spacing) / 2;

    backgrounds.forEach((bgKey, index) => {
      const bgData = LEVEL_BACKGROUNDS[bgKey];
      const x = startX + index * spacing;
      const isSelected = this.customLevelConfig.background === bgKey;

      // Button background
      const btn = this.add.graphics();
      btn.fillStyle(isSelected ? 0xffd93d : 0x333333, 1);
      btn.fillRoundedRect(
        x - btnWidth / 2,
        y - btnHeight / 2,
        btnWidth,
        btnHeight,
        8
      );
      btn.lineStyle(2, 0x000000, 1);
      btn.strokeRoundedRect(
        x - btnWidth / 2,
        y - btnHeight / 2,
        btnWidth,
        btnHeight,
        8
      );
      this.customLevelModalContainer.add(btn);

      // Color preview (big square) with border for dark colors
      btn.fillStyle(bgData.color, 1);
      btn.fillRect(x - 20, y - 15, 40, 30);
      btn.lineStyle(2, 0xffffff, 0.5);
      btn.strokeRect(x - 20, y - 15, 40, 30);

      // Label
      const bgLabel = this.add
        .text(x, y + btnHeight / 2 + 12, bgData.name, {
          fontSize: "12px",
          color: isSelected ? "#ffd93d" : "#FFFFFF",
          fontFamily: "Fredoka",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.customLevelModalContainer.add(bgLabel);

      // Interactive zone
      const zone = this.add
        .zone(x, y, btnWidth, btnHeight + 20)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          this.customLevelConfig.background = bgKey;
          this.refreshCustomLevelModal();
        });
      this.customLevelModalContainer.add(zone);
    });
  }

  createTrailSelector(width: number, y: number) {
    // Section label
    const label = this.add
      .text(width / 2, y - 35, "BALL TRAIL", {
        fontSize: "18px",
        color: "#ffd93d",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.customLevelModalContainer.add(label);

    // Trail options
    const trails = Object.keys(LEVEL_TRAILS);
    const btnWidth = 60;
    const btnHeight = 40;
    const spacing = 68;
    const startX = width / 2 - ((trails.length - 1) * spacing) / 2;

    trails.forEach((trailKey, index) => {
      const trailData = LEVEL_TRAILS[trailKey];
      const x = startX + index * spacing;
      const isSelected = this.customLevelConfig.trail === trailKey;

      // Button background
      const btn = this.add.graphics();
      btn.fillStyle(isSelected ? 0xffd93d : 0x333333, 1);
      btn.fillRoundedRect(
        x - btnWidth / 2,
        y - btnHeight / 2,
        btnWidth,
        btnHeight,
        8
      );
      btn.lineStyle(2, 0x000000, 1);
      btn.strokeRoundedRect(
        x - btnWidth / 2,
        y - btnHeight / 2,
        btnWidth,
        btnHeight,
        8
      );
      this.customLevelModalContainer.add(btn);

      // Trail color indicator
      if (trailData.enabled) {
        btn.fillStyle(trailData.color, 1);
        btn.fillCircle(x, y, 10);
      } else {
        // X for none
        const noneText = this.add
          .text(x, y, "✕", {
            fontSize: "16px",
            color: "#666666",
            fontFamily: "Fredoka",
          })
          .setOrigin(0.5);
        this.customLevelModalContainer.add(noneText);
      }

      // Label
      const trailLabel = this.add
        .text(x, y + btnHeight / 2 + 12, trailData.name, {
          fontSize: "11px",
          color: isSelected ? "#ffd93d" : "#FFFFFF",
          fontFamily: "Fredoka",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.customLevelModalContainer.add(trailLabel);

      // Interactive zone
      const zone = this.add
        .zone(x, y, btnWidth, btnHeight + 20)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          this.customLevelConfig.trail = trailKey;
          this.refreshCustomLevelModal();
        });
      this.customLevelModalContainer.add(zone);
    });
  }

  createCustomLevelModalButtons(width: number, y: number) {
    const btnWidth = 100;
    const btnHeight = 40;
    const spacing = 110;

    // SAVE button
    const saveBg = this.add.graphics();
    saveBg.fillStyle(0x000000, 1);
    saveBg.fillRoundedRect(
      width / 2 - spacing - btnWidth / 2 - 3,
      y - btnHeight / 2 - 3,
      btnWidth + 6,
      btnHeight + 6,
      10
    );
    saveBg.fillStyle(0x2ecc71, 1);
    saveBg.fillRoundedRect(
      width / 2 - spacing - btnWidth / 2,
      y - btnHeight / 2,
      btnWidth,
      btnHeight,
      8
    );
    this.customLevelModalContainer.add(saveBg);

    const saveText = this.add
      .text(width / 2 - spacing, y, "SAVE", {
        fontSize: "20px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.customLevelModalContainer.add(saveText);

    const saveZone = this.add
      .zone(width / 2 - spacing, y, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", async () => {
        await this.saveCustomLevelConfig();
        this.closeCustomLevelModal();
      });
    this.customLevelModalContainer.add(saveZone);

    // RESET button
    const resetBg = this.add.graphics();
    resetBg.fillStyle(0x000000, 1);
    resetBg.fillRoundedRect(
      width / 2 - btnWidth / 2 - 3,
      y - btnHeight / 2 - 3,
      btnWidth + 6,
      btnHeight + 6,
      10
    );
    resetBg.fillStyle(0xe74c3c, 1);
    resetBg.fillRoundedRect(
      width / 2 - btnWidth / 2,
      y - btnHeight / 2,
      btnWidth,
      btnHeight,
      8
    );
    this.customLevelModalContainer.add(resetBg);

    const resetText = this.add
      .text(width / 2, y, "RESET", {
        fontSize: "20px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.customLevelModalContainer.add(resetText);

    const resetZone = this.add
      .zone(width / 2, y, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.customLevelConfig = { ...DEFAULT_CUSTOM_LEVEL };
        this.refreshCustomLevelModal();
      });
    this.customLevelModalContainer.add(resetZone);

    // CLOSE button
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x000000, 1);
    closeBg.fillRoundedRect(
      width / 2 + spacing - btnWidth / 2 - 3,
      y - btnHeight / 2 - 3,
      btnWidth + 6,
      btnHeight + 6,
      10
    );
    closeBg.fillStyle(0x7f8c8d, 1);
    closeBg.fillRoundedRect(
      width / 2 + spacing - btnWidth / 2,
      y - btnHeight / 2,
      btnWidth,
      btnHeight,
      8
    );
    this.customLevelModalContainer.add(closeBg);

    const closeText = this.add
      .text(width / 2 + spacing, y, "CLOSE", {
        fontSize: "20px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.customLevelModalContainer.add(closeText);

    const closeZone = this.add
      .zone(width / 2 + spacing, y, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.closeCustomLevelModal();
      });
    this.customLevelModalContainer.add(closeZone);
  }

  refreshCustomLevelModal() {
    if (this.customLevelModalContainer) {
      this.customLevelModalContainer.destroy();
      this.showCustomLevelModal();
      this.customLevelModalContainer.setAlpha(1);
    }
  }

  async saveCustomLevelConfig() {
    try {
      const sdk = window.FarcadeSDK;
      if (sdk?.singlePlayer?.actions?.saveGameState) {
        await sdk.singlePlayer.actions.saveGameState({
          gameState: {
            hasSeenTutorial: this.hasSeenTutorial,
            highScore: this.highScore,
            selectedBallStyle: this.selectedBallStyle,
            customLevelConfig: this.customLevelConfig,
          },
        });
        console.log("🎨 Custom Level config saved:", this.customLevelConfig);
      }
    } catch (error) {
      console.log("Could not save custom level config:", error);
    }
  }

  closeCustomLevelModal() {
    if (this.customLevelModalContainer) {
      this.tweens.add({
        targets: this.customLevelModalContainer,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.customLevelModalContainer.destroy();
        },
      });
    }
  }

  showBallSelectModal() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.ballSelectModalContainer = this.add.container(0, 0);
    this.ballSelectModalContainer.setAlpha(0);
    this.ballSelectModalContainer.setDepth(100);

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.95);
    overlay.fillRect(0, 0, width, height);
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    this.ballSelectModalContainer.add(overlay);

    // Modal title
    const titleFontSize = Math.min(42, width * 0.09);
    const title = this.add
      .text(width / 2, height * 0.12, "SELECT BALL", {
        fontSize: `${titleFontSize}px`,
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.ballSelectModalContainer.add(title);

    // Get unlocked styles
    const unlockedStyles = this.getUnlockedBallStyles();
    const allStyles = Object.keys(BALL_STYLES);

    // Ball grid - better spacing
    const gridCols = 3;
    const ballSize = Math.min(75, width * 0.18);
    const spacingX = Math.min(145, width * 0.36);
    const spacingY = Math.min(175, height * 0.27);
    const startX = width / 2 - spacingX;
    const startY = height * 0.3;

    allStyles.forEach((styleKey, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      const isUnlocked = unlockedStyles.includes(styleKey);
      const isSelected = this.selectedBallStyle === styleKey;
      const style = BALL_STYLES[styleKey];

      // Ball container for this option
      const ballContainer = this.add.container(x, y);
      this.ballSelectModalContainer.add(ballContainer);

      if (isUnlocked) {
        // Selection highlight (if selected)
        if (isSelected) {
          const selectHighlight = this.add.graphics();
          selectHighlight.lineStyle(4, 0xffd93d, 1);
          selectHighlight.strokeCircle(0, 0, ballSize / 2 + 10);
          ballContainer.add(selectHighlight);
        }

        // Ball background (black border)
        const ballBorder = this.add.graphics();
        ballBorder.fillStyle(0x000000, 1);
        ballBorder.fillCircle(0, 0, ballSize / 2 + 4);
        ballContainer.add(ballBorder);

        // Ball fill - replicate exact game ball styles
        const ballFill = this.add.graphics();
        this.drawBallStyle(ballFill, styleKey, ballSize / 2, ballContainer);

        // Add aura glow if present
        if (style.colors.aura) {
          const aura = this.add.graphics();
          aura.fillStyle(style.colors.aura, 0.3);
          aura.fillCircle(0, 0, ballSize / 2 + 12);
          ballContainer.addAt(aura, 0);
        }
        ballContainer.add(ballFill);

        // Ball name below
        const nameText = this.add
          .text(0, ballSize / 2 + 28, style.name, {
            fontSize: "20px",
            color: "#FFFFFF",
            fontFamily: "Fredoka",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
          })
          .setOrigin(0.5);
        ballContainer.add(nameText);

        // Interactive zone
        const zone = this.add
          .zone(0, 0, ballSize + 20, ballSize + 40)
          .setInteractive({ useHandCursor: true })
          .on("pointerover", () => {
            this.tweens.add({
              targets: ballContainer,
              scale: 1.1,
              duration: 100,
            });
          })
          .on("pointerout", () => {
            this.tweens.add({
              targets: ballContainer,
              scale: 1,
              duration: 100,
            });
          })
          .on("pointerdown", async () => {
            await this.saveBallStyle(styleKey);
            this.closeBallSelectModal();
            // Recreate button to update icon
            this.ballSelectBtnContainer.destroy();
            this.createBallSelectButton(width, height);
            this.ballSelectBtnContainer.setAlpha(1);
            // Update bouncing ball style
            this.updateBouncingBallStyle();
          });
        ballContainer.add(zone);
      } else {
        // Locked - show placeholder ball with score requirement
        // Get score requirement based on rank
        const scoreRequired = this.getScoreForRank(style.requiredRank);

        // Gray placeholder ball (no style, just silhouette)
        const placeholderBorder = this.add.graphics();
        placeholderBorder.fillStyle(0x000000, 1);
        placeholderBorder.fillCircle(0, 0, ballSize / 2 + 4);
        ballContainer.add(placeholderBorder);

        const placeholderBall = this.add.graphics();
        placeholderBall.fillStyle(0x444444, 1);
        placeholderBall.fillCircle(0, 0, ballSize / 2);
        ballContainer.add(placeholderBall);

        // Question mark or lock on the ball
        const lockIcon = this.add
          .text(0, 0, "?", {
            fontSize: "32px",
            color: "#666666",
            fontFamily: "Fredoka",
            fontStyle: "bold",
          })
          .setOrigin(0.5);
        ballContainer.add(lockIcon);

        // Score requirement text (above ball)
        const scoreText = this.add
          .text(0, -ballSize / 2 - 18, `${scoreRequired} pts`, {
            fontSize: "16px",
            color: "#ffd93d",
            fontFamily: "Fredoka",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 3,
          })
          .setOrigin(0.5);
        ballContainer.add(scoreText);

        // Ball name below
        const nameText = this.add
          .text(0, ballSize / 2 + 28, style.name, {
            fontSize: "20px",
            color: "#888888",
            fontFamily: "Fredoka",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
          })
          .setOrigin(0.5);
        ballContainer.add(nameText);
      }
    });

    // Close button
    const closeBtnY = height * 0.88;
    const closeBtnWidth = Math.min(180, width * 0.4);
    const closeBtnHeight = 50;
    const closeCornerRadius = 14;

    const closeContainer = this.add.container(width / 2, closeBtnY);
    this.ballSelectModalContainer.add(closeContainer);

    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x000000, 1);
    closeBg.fillRoundedRect(
      -closeBtnWidth / 2 - 3,
      -closeBtnHeight / 2 - 3,
      closeBtnWidth + 6,
      closeBtnHeight + 6,
      closeCornerRadius + 2
    );
    closeBg.fillStyle(0x7f8c8d, 1);
    closeBg.fillRoundedRect(
      -closeBtnWidth / 2,
      -closeBtnHeight / 2,
      closeBtnWidth,
      closeBtnHeight,
      closeCornerRadius
    );
    closeContainer.add(closeBg);

    const closeText = this.add
      .text(0, 0, "CLOSE", {
        fontSize: "26px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    closeContainer.add(closeText);

    const closeZone = this.add
      .zone(0, 0, closeBtnWidth, closeBtnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tweens.add({
          targets: closeContainer,
          scale: 1.08,
          duration: 100,
        });
      })
      .on("pointerout", () => {
        this.tweens.add({
          targets: closeContainer,
          scale: 1,
          duration: 100,
        });
      })
      .on("pointerdown", () => {
        this.closeBallSelectModal();
      });
    closeContainer.add(closeZone);

    // Fade in
    this.tweens.add({
      targets: this.ballSelectModalContainer,
      alpha: 1,
      duration: 300,
      ease: "Power2",
    });
  }

  drawBallStyle(
    graphics: Phaser.GameObjects.Graphics,
    styleKey: string,
    radius: number,
    container?: Phaser.GameObjects.Container
  ) {
    // Draw ball styles to match the game exactly
    switch (styleKey) {
      case "unranked":
        // Green ball (same as game Basic/Unranked)
        graphics.fillStyle(0x2ecc71, 1);
        graphics.fillCircle(0, 0, radius);
        break;

      case "noob":
        // Cyan solid ball
        graphics.fillStyle(0x00d2d3, 1);
        graphics.fillCircle(0, 0, radius);
        // Small highlight
        graphics.fillStyle(0xffffff, 0.4);
        graphics.fillCircle(-radius * 0.3, -radius * 0.3, radius * 0.25);
        break;

      case "pro":
        // White with red polka dots - using canvas texture like the 3D game
        // Create a temporary canvas to generate the polka dot pattern
        const proCanvas = document.createElement("canvas");
        const proSize = radius * 4; // Higher resolution
        proCanvas.width = proSize;
        proCanvas.height = proSize;
        const proCtx = proCanvas.getContext("2d")!;

        // White background
        proCtx.fillStyle = "#ffffff";
        proCtx.beginPath();
        proCtx.arc(proSize / 2, proSize / 2, proSize / 2, 0, Math.PI * 2);
        proCtx.fill();

        // Clip to circle
        proCtx.save();
        proCtx.beginPath();
        proCtx.arc(proSize / 2, proSize / 2, proSize / 2, 0, Math.PI * 2);
        proCtx.clip();

        // Red polka dots in grid pattern with offset (same as game texture)
        const proDotColor = "#ff2222";
        const proDotRadius = proSize * 0.08;
        const proSpacing = proSize * 0.25;

        for (let row = -1; row < 6; row++) {
          for (let col = -1; col < 6; col++) {
            const x = col * proSpacing + (row % 2) * (proSpacing / 2);
            const y = row * proSpacing + proSpacing * 0.3;

            proCtx.beginPath();
            proCtx.fillStyle = proDotColor;
            proCtx.arc(x, y, proDotRadius, 0, Math.PI * 2);
            proCtx.fill();
          }
        }

        proCtx.restore();

        // Add subtle 3D shading
        const proGradient = proCtx.createRadialGradient(
          proSize * 0.35,
          proSize * 0.35,
          0,
          proSize / 2,
          proSize / 2,
          proSize / 2
        );
        proGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
        proGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
        proGradient.addColorStop(1, "rgba(0, 0, 0, 0.15)");

        proCtx.beginPath();
        proCtx.arc(proSize / 2, proSize / 2, proSize / 2, 0, Math.PI * 2);
        proCtx.fillStyle = proGradient;
        proCtx.fill();

        // Create Phaser texture from canvas and draw it
        const proTextureKey = "proBall_" + Date.now();
        this.textures.addCanvas(proTextureKey, proCanvas);

        // Draw the texture as an image centered at 0,0
        const proImage = this.add.image(0, 0, proTextureKey);
        proImage.setDisplaySize(radius * 2, radius * 2);
        // Add to container (passed as param or parent)
        const targetContainer = container || graphics.parentContainer;
        if (targetContainer) {
          targetContainer.add(proImage);
          // Store reference if this is the bouncing ball
          if (targetContainer === this.bouncingBall) {
            this.bouncingBallImage = proImage;
          }
        }
        break;

      case "master":
        // Two-tone: top half orange, bottom half yellow (Gravity Master)
        // Top half - orange
        graphics.fillStyle(0xff6b35, 1);
        graphics.slice(
          0,
          0,
          radius,
          Phaser.Math.DegToRad(180),
          Phaser.Math.DegToRad(360),
          false
        );
        graphics.fillPath();
        // Bottom half - yellow
        graphics.fillStyle(0xffd93d, 1);
        graphics.slice(
          0,
          0,
          radius,
          Phaser.Math.DegToRad(0),
          Phaser.Math.DegToRad(180),
          false
        );
        graphics.fillPath();
        break;

      case "legend":
        // Horizontal color bands (multicolor waves)
        const legendColors = [0xff9f43, 0xe91e8c, 0x00d2d3, 0xfeca57];
        const numBands = 6;
        const bandHeight = (radius * 2) / numBands;
        for (let i = 0; i < numBands; i++) {
          const color = legendColors[i % legendColors.length];
          graphics.fillStyle(color, 1);
          const y = -radius + i * bandHeight;
          graphics.fillRect(-radius, y, radius * 2, bandHeight);
        }
        // Clip to circle shape by drawing circle on top with mask effect
        // Since Phaser doesn't have easy masking, we'll use a different approach
        // Draw colored circle segments instead
        graphics.clear();
        const segments = 8;
        const segmentAngle = (Math.PI * 2) / segments;
        for (let i = 0; i < segments; i++) {
          const color = legendColors[i % legendColors.length];
          graphics.fillStyle(color, 1);
          graphics.slice(
            0,
            0,
            radius,
            i * segmentAngle,
            (i + 1) * segmentAngle,
            false
          );
          graphics.fillPath();
        }
        break;

      case "remixer":
        // Neon green solid ball
        graphics.fillStyle(0xb7ff00, 1);
        graphics.fillCircle(0, 0, radius);
        // Bright highlight
        graphics.fillStyle(0xffffff, 0.5);
        graphics.fillCircle(-radius * 0.3, -radius * 0.3, radius * 0.25);
        break;

      default:
        // Fallback green
        graphics.fillStyle(0x2ecc71, 1);
        graphics.fillCircle(0, 0, radius);
        break;
    }
  }

  closeBallSelectModal() {
    this.tweens.add({
      targets: this.ballSelectModalContainer,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.ballSelectModalContainer.destroy();
      },
    });
  }

  createBouncingBall(width: number, height: number) {
    console.log(
      "🎱 Creating bouncing ball with style:",
      this.selectedBallStyle
    );

    // Get the position of the "O" in "DOWN" from title
    const titleY = height * 0.18;
    const titleFontSize = Math.min(90, width * 0.18);

    // Calculate approximate position of the "O" in "ONLY DOWN"
    // "ONLY DOWN" has 9 characters. The O in DOWN is at position 6 (0-indexed: 5)
    // Need to offset to the CENTER of the O letter, not its left edge
    // Each character is roughly 0.55 of fontSize for Fredoka bold
    const charWidth = titleFontSize * 0.55;
    // O in DOWN is about 1.62 character widths to the right of center (to hit center of O)
    const oLetterX = width / 2 + charWidth * 1.62;
    const oLetterY = titleY;

    // Button top position - must match createMainStartButton
    const btnY = height * 0.56;
    const btnHeight = 90;
    const buttonTopY = btnY - btnHeight / 2;

    // Ball properties
    const ballRadius = 22;

    // Create ball container
    this.bouncingBall = this.add.container(oLetterX, oLetterY);
    this.bouncingBall.setAlpha(0);
    this.bouncingBall.setScale(0.3);

    // Ball border (black outline)
    const ballBorder = this.add.graphics();
    ballBorder.fillStyle(0x000000, 1);
    ballBorder.fillCircle(0, 0, ballRadius + 4);
    this.bouncingBall.add(ballBorder);

    // Draw the selected ball style using the same method as the selector
    this.bouncingBallGraphics = this.add.graphics();
    this.bouncingBall.add(this.bouncingBallGraphics);
    // Pass container to ensure Pro ball image is added correctly
    this.drawBallStyle(
      this.bouncingBallGraphics,
      this.selectedBallStyle,
      ballRadius,
      this.bouncingBall
    );

    // Animation sequence
    // 1. Appear from inside the O letter
    this.tweens.add({
      targets: this.bouncingBall,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: "Back.out",
      onComplete: () => {
        // 2. Fall down to the button top
        const bounceY = buttonTopY - ballRadius - 5;

        this.tweens.add({
          targets: this.bouncingBall,
          y: bounceY,
          duration: 600,
          ease: "Bounce.out",
          onComplete: () => {
            // 3. Start continuous bouncing
            this.startContinuousBounce(bounceY);
          },
        });
      },
    });
  }

  updateBouncingBallStyle() {
    // Update the bouncing ball graphics to match the selected style
    if (this.bouncingBallGraphics) {
      this.bouncingBallGraphics.clear();

      // Remove previous Pro image if exists
      if (this.bouncingBallImage) {
        this.bouncingBallImage.destroy();
        this.bouncingBallImage = null;
      }

      this.drawBallStyle(
        this.bouncingBallGraphics,
        this.selectedBallStyle,
        22,
        this.bouncingBall
      );
    }
  }

  startContinuousBounce(baseY: number) {
    // Continuous bounce animation
    this.tweens.add({
      targets: this.bouncingBall,
      y: baseY - 35,
      duration: 400,
      ease: "Sine.easeOut",
      yoyo: true,
      repeat: -1,
      onYoyo: () => {
        // Small squash effect when landing
        this.tweens.add({
          targets: this.bouncingBall,
          scaleX: 1.15,
          scaleY: 0.85,
          duration: 80,
          yoyo: true,
          ease: "Sine.easeOut",
        });
      },
    });
  }

  startGame() {
    this.isChaosMode = false;
    // If first time, show tutorial modal
    if (!this.hasSeenTutorial) {
      this.showTutorialModal();
    } else {
      console.log("🚀 Starting HelixScene with customLevelConfig:", {
        isCustomLevelUnlocked: this.isCustomLevelUnlocked,
        customLevelConfig: this.customLevelConfig,
      });
      this.scene.start("HelixScene", {
        testRank: this.testRank,
        ballStyle: this.selectedBallStyle,
        highScore: this.highScore,
        chaosMode: false,
        customLevelConfig: this.isCustomLevelUnlocked
          ? this.customLevelConfig
          : undefined,
      });
    }
  }

  showTutorialModal() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Disable background buttons
    this.startBtnContainer.disableInteractive();
    this.ballSelectBtnContainer.disableInteractive();
    this.chaosBtnContainer.disableInteractive();
    this.startBtnContainer.each((child: any) => {
      if (child.disableInteractive) child.disableInteractive();
    });
    this.ballSelectBtnContainer.each((child: any) => {
      if (child.disableInteractive) child.disableInteractive();
    });
    this.chaosBtnContainer.each((child: any) => {
      if (child.disableInteractive) child.disableInteractive();
    });

    this.tutorialContainer = this.add.container(0, 0);
    this.tutorialContainer.setAlpha(0);
    this.tutorialContainer.setDepth(100);

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.95);
    overlay.fillRect(0, 0, width, height);
    this.tutorialContainer.add(overlay);

    // Tutorial points with arrows
    const tutorialPoints = [
      "Tap left or right to rotate",
      "Fall through the gaps",
      "Avoid the striped zones!",
      "Collect power-ups",
    ];

    const centerX = width / 2;
    const startY = height * 0.28;
    const lineHeight = 75;
    const fontSize = 32;

    tutorialPoints.forEach((text, index) => {
      const yPos = startY + index * lineHeight;

      const pointText = this.add
        .text(centerX, yPos, `>  ${text}`, {
          fontSize: `${fontSize}px`,
          color: "#FFFFFF",
          fontFamily: "Fredoka",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      this.tutorialContainer.add(pointText);
    });

    // GO button - same style as PLAY button
    const btnY = startY + tutorialPoints.length * lineHeight + 70;
    const btnWidth = 220;
    const btnHeight = 80;
    const cornerRadius = 22;

    const btnContainer = this.add.container(centerX, btnY);
    this.tutorialContainer.add(btnContainer);

    const btnBg = this.add.graphics();
    // Black border (slightly larger)
    btnBg.fillStyle(0x000000, 1);
    btnBg.fillRoundedRect(
      -btnWidth / 2 - 5,
      -btnHeight / 2 - 5,
      btnWidth + 10,
      btnHeight + 10,
      cornerRadius + 2
    );
    // Green fill
    btnBg.fillStyle(0x2ecc71, 1);
    btnBg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      cornerRadius
    );
    btnContainer.add(btnBg);

    const btnText = this.add
      .text(0, 0, "GO!", {
        fontSize: "52px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 7,
      })
      .setOrigin(0.5);
    btnContainer.add(btnText);

    const btnZone = this.add
      .zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tweens.add({ targets: btnContainer, scale: 1.05, duration: 100 });
      })
      .on("pointerout", () => {
        this.tweens.add({ targets: btnContainer, scale: 1, duration: 100 });
      })
      .on("pointerdown", async () => {
        await this.saveTutorialSeen();
        this.hasSeenTutorial = true;

        this.tweens.add({
          targets: this.tutorialContainer,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            this.scene.start("HelixScene", {
              testRank: this.testRank,
              ballStyle: this.selectedBallStyle,
              highScore: this.highScore,
              chaosMode: this.isChaosMode,
              // Only pass custom level config for normal mode (not chaos)
              customLevelConfig:
                !this.isChaosMode && this.isCustomLevelUnlocked
                  ? this.customLevelConfig
                  : undefined,
            });
          },
        });
      });
    btnContainer.add(btnZone);

    // Fade in
    this.tweens.add({
      targets: this.tutorialContainer,
      alpha: 1,
      duration: 400,
      ease: "Power2",
    });
  }

  createDevControls(width: number, height: number) {
    this.devControlsContainer = this.add.container(width / 2, height - 60);
    this.devControlsContainer.setDepth(200);

    // Background panel
    const panelWidth = Math.min(400, width * 0.9);
    const panelHeight = 50;
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.8);
    panel.fillRoundedRect(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth,
      panelHeight,
      10
    );
    this.devControlsContainer.add(panel);

    // Rank display text
    this.rankDisplayText = this.add
      .text(0, 0, `Test Rank: ${this.testRank}`, {
        fontSize: "20px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.devControlsContainer.add(this.rankDisplayText);

    // Previous button
    const prevBtn = this.add
      .text(-panelWidth / 2 + 40, 0, "◀", {
        fontSize: "24px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        const currentIndex = this.ranks.indexOf(this.testRank);
        const newIndex =
          (currentIndex - 1 + this.ranks.length) % this.ranks.length;
        this.testRank = this.ranks[newIndex];
        this.rankDisplayText.setText(`Test Rank: ${this.testRank}`);
      });
    this.devControlsContainer.add(prevBtn);

    // Next button
    const nextBtn = this.add
      .text(panelWidth / 2 - 40, 0, "▶", {
        fontSize: "24px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        const currentIndex = this.ranks.indexOf(this.testRank);
        const newIndex = (currentIndex + 1) % this.ranks.length;
        this.testRank = this.ranks[newIndex];
        this.rankDisplayText.setText(`Test Rank: ${this.testRank}`);
      });
    this.devControlsContainer.add(nextBtn);
  }
}
