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

// Custom Ball Configuration (Premium 500 credits)
const CUSTOM_BALL_COLORS: { [key: string]: { name: string; hex: number } } = {
  green: { name: "Green", hex: 0x2ecc71 },
  cyan: { name: "Cyan", hex: 0x00d2d3 },
  red: { name: "Red", hex: 0xff2222 },
  orange: { name: "Orange", hex: 0xff6b35 },
  yellow: { name: "Yellow", hex: 0xffd93d },
  pink: { name: "Pink", hex: 0xe91e8c },
  purple: { name: "Purple", hex: 0x9b59b6 },
  white: { name: "White", hex: 0xffffff },
  neon: { name: "Neon", hex: 0xb7ff00 },
  black: { name: "Void", hex: 0x1a1a1a },
};

const CUSTOM_BALL_TRAILS: { [key: string]: { name: string; color: number } } = {
  none: { name: "None", color: 0x000000 },
  fire: { name: "Fire", color: 0xff4500 },
  ice: { name: "Ice", color: 0x00bfff },
  rainbow: { name: "Rainbow", color: 0xff00ff },
  electric: { name: "Electric", color: 0xffff00 },
  neon: { name: "Neon", color: 0xb7ff00 },
};

const CUSTOM_BALL_PATTERNS: { [key: string]: { name: string } } = {
  solid: { name: "Solid" },
  dots: { name: "Dots" },
  stripes: { name: "Stripes" },
  gradient: { name: "Gradient" },
  glow: { name: "Glow" },
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

  // Custom Ball Creator (Premium 500 credits)
  private isCustomBallUnlocked: boolean = false;
  private customBallBtnContainer!: Phaser.GameObjects.Container;
  private customBallBtnBg!: Phaser.GameObjects.Graphics;
  private customBallBtnText!: Phaser.GameObjects.Text;
  private customBallBadgeBg!: Phaser.GameObjects.Graphics;
  private customBallBadgeText!: Phaser.GameObjects.Text;
  private customBallModalContainer!: Phaser.GameObjects.Container;
  private customBallConfig: { color: string; trail: string; pattern: string } = {
    color: "green",
    trail: "none",
    pattern: "solid",
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
      } else {
        console.log("📊 SDK not available or timed out, using defaults");
      }

      // Check if user has purchased Chaos Mode
      if (sdk?.hasItem) {
        this.isChaosUnlocked = sdk.hasItem("chaos-mode-new-style-music");
        console.log("🎮 Chaos Mode unlocked:", this.isChaosUnlocked);

        this.isBallsUnlocked = sdk.hasItem("exclusive-balls");
        console.log("⚽ Balls unlocked:", this.isBallsUnlocked);

        this.isCustomBallUnlocked = sdk.hasItem("custom-ball-creator");
        console.log("🎨 Custom Ball unlocked:", this.isCustomBallUnlocked);
      }

      // Load custom ball config from game state
      if (gameInfo?.initialGameState?.gameState?.customBallConfig) {
        this.customBallConfig = gameInfo.initialGameState.gameState.customBallConfig;
        console.log("🎨 Custom Ball config loaded:", this.customBallConfig);
      }

      // Listen for purchase completions
      if (sdk?.onPurchaseComplete) {
        sdk.onPurchaseComplete(() => {
          this.checkChaosPurchase();
          this.checkBallsPurchase();
          this.checkCustomBallPurchase();
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

    // Create custom ball button (Premium)
    this.createCustomBallButton(width, height);

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
      const badgeWidth = 120;
      const badgeHeight = 36;
      const badgeX = 0; // Centered
      const badgeY = btnHeight / 2 + 6; // Overlapping bottom edge of button
      this.ballsBadgeBg.clear();
      this.ballsBadgeBg.fillStyle(0xffd93d, 1); // Gold
      this.ballsBadgeBg.fillRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        10
      );
      this.ballsBadgeBg.lineStyle(3, 0x000000, 1);
      this.ballsBadgeBg.strokeRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        10
      );
      this.ballsBadgeText.setText("10 CREDITS");
      this.ballsBadgeText.setPosition(badgeX, badgeY);
      this.ballsBadgeText.setFontSize(20);
    }
  }

  async purchaseBalls() {
    try {
      const sdk = window.FarcadeSDK;
      if (sdk?.purchase) {
        console.log("🛒 Initiating Balls purchase...");
        const result = await sdk.purchase({ item: "exclusive-balls" });

        if (result.success) {
          console.log("✅ Balls purchased successfully!");
          this.isBallsUnlocked = true;
          this.updateBallsButtonAppearance(
            Math.min(340, this.scale.width * 0.72),
            70,
            20
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
    const sdk = window.FarcadeSDK;
    if (sdk?.hasItem && sdk.hasItem("exclusive-balls")) {
      this.isBallsUnlocked = true;
      this.updateBallsButtonAppearance(
        Math.min(340, this.scale.width * 0.72),
        70,
        20
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

      // 100 credits badge - gold/yellow, OVERLAPPING bottom of button
      const badgeWidth = 140;
      const badgeHeight = 36;
      const badgeX = 0; // Centered
      const badgeY = btnHeight / 2 + 6; // Overlapping bottom edge of button
      this.chaosBadgeBg.clear();
      this.chaosBadgeBg.fillStyle(0xffd93d, 1); // Gold
      this.chaosBadgeBg.fillRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        10
      );
      this.chaosBadgeBg.lineStyle(3, 0x000000, 1);
      this.chaosBadgeBg.strokeRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        10
      );
      this.chaosBadgeText.setText("100 CREDITS");
      this.chaosBadgeText.setPosition(badgeX, badgeY);
      this.chaosBadgeText.setFontSize(20);
    }
  }

  async purchaseChaosMode() {
    try {
      const sdk = window.FarcadeSDK;
      if (sdk?.purchase) {
        console.log("🛒 Initiating Chaos Mode purchase...");
        const result = await sdk.purchase({
          item: "chaos-mode-new-style-music",
        });

        if (result.success) {
          console.log("✅ Chaos Mode purchased successfully!");
          this.isChaosUnlocked = true;
          this.updateChaosButtonAppearance(
            Math.min(340, this.scale.width * 0.72),
            70,
            20
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
    const sdk = window.FarcadeSDK;
    if (sdk?.hasItem && sdk.hasItem("chaos-mode-new-style-music")) {
      this.isChaosUnlocked = true;
      this.updateChaosButtonAppearance(
        Math.min(340, this.scale.width * 0.72),
        70,
        20
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

  // ============ CUSTOM BALL CREATOR (PREMIUM 500 CREDITS) ============

  createCustomBallButton(width: number, height: number) {
    const btnWidth = Math.min(340, width * 0.72);
    const btnHeight = 70;
    const cornerRadius = 20;

    this.customBallBtnContainer = this.add.container(width / 2, height * 0.78);
    this.customBallBtnContainer.setAlpha(0);

    // Button background
    this.customBallBtnBg = this.add.graphics();
    this.customBallBtnContainer.add(this.customBallBtnBg);

    // Button text
    this.customBallBtnText = this.add
      .text(0, 0, "CUSTOM", {
        fontSize: "42px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.customBallBtnContainer.add(this.customBallBtnText);

    // Badge (VIP or 500 credits)
    this.customBallBadgeBg = this.add.graphics();
    this.customBallBtnContainer.add(this.customBallBadgeBg);

    this.customBallBadgeText = this.add
      .text(0, 0, "", {
        fontSize: "20px",
        color: "#000000",
        fontFamily: "Fredoka",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.customBallBtnContainer.add(this.customBallBadgeText);

    // Update button appearance based on unlock status
    this.updateCustomBallButtonAppearance(btnWidth, btnHeight, cornerRadius);

    // Interactive zone
    const zone = this.add
      .zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tweens.add({
          targets: this.customBallBtnContainer,
          scale: 1.08,
          duration: 100,
        });
      })
      .on("pointerout", () => {
        this.tweens.add({
          targets: this.customBallBtnContainer,
          scale: 1,
          duration: 100,
        });
      })
      .on("pointerdown", () => {
        if (this.isCustomBallUnlocked) {
          this.showCustomBallModal();
        } else {
          this.purchaseCustomBall();
        }
      });
    this.customBallBtnContainer.add(zone);

    // Fade in with delay
    this.tweens.add({
      targets: this.customBallBtnContainer,
      alpha: 1,
      duration: 400,
      delay: 1200,
    });
  }

  updateCustomBallButtonAppearance(
    btnWidth: number,
    btnHeight: number,
    cornerRadius: number
  ) {
    this.customBallBtnBg.clear();

    if (this.isCustomBallUnlocked) {
      // UNLOCKED - Rainbow/gradient effect (purple/cyan)
      this.customBallBtnBg.fillStyle(0x000000, 1);
      this.customBallBtnBg.fillRoundedRect(
        -btnWidth / 2 - 5,
        -btnHeight / 2 - 5,
        btnWidth + 10,
        btnHeight + 10,
        cornerRadius + 2
      );
      this.customBallBtnBg.fillStyle(0x9b59b6, 1); // Purple
      this.customBallBtnBg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        cornerRadius
      );

      // VIP badge - gold, top right corner
      const badgeWidth = 50;
      const badgeHeight = 22;
      const badgeX = btnWidth / 2 - 10;
      const badgeY = -btnHeight / 2 - 5;
      this.customBallBadgeBg.clear();
      this.customBallBadgeBg.fillStyle(0xffd700, 1); // Gold
      this.customBallBadgeBg.fillRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        8
      );
      this.customBallBadgeBg.lineStyle(2, 0x000000, 1);
      this.customBallBadgeBg.strokeRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        8
      );
      this.customBallBadgeText.setText("VIP");
      this.customBallBadgeText.setPosition(badgeX, badgeY);
      this.customBallBadgeText.setFontSize(14);
    } else {
      // LOCKED - Gray background
      this.customBallBtnBg.fillStyle(0x000000, 1);
      this.customBallBtnBg.fillRoundedRect(
        -btnWidth / 2 - 5,
        -btnHeight / 2 - 5,
        btnWidth + 10,
        btnHeight + 10,
        cornerRadius + 2
      );
      this.customBallBtnBg.fillStyle(0x555555, 1);
      this.customBallBtnBg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        cornerRadius
      );

      // 500 credits badge - gold, OVERLAPPING bottom
      const badgeWidth = 140;
      const badgeHeight = 36;
      const badgeX = 0;
      const badgeY = btnHeight / 2 + 6;
      this.customBallBadgeBg.clear();
      this.customBallBadgeBg.fillStyle(0xffd93d, 1);
      this.customBallBadgeBg.fillRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        10
      );
      this.customBallBadgeBg.lineStyle(3, 0x000000, 1);
      this.customBallBadgeBg.strokeRoundedRect(
        badgeX - badgeWidth / 2,
        badgeY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        10
      );
      this.customBallBadgeText.setText("500 CREDITS");
      this.customBallBadgeText.setPosition(badgeX, badgeY);
      this.customBallBadgeText.setFontSize(20);
    }
  }

  async purchaseCustomBall() {
    try {
      const sdk = window.FarcadeSDK;
      if (sdk?.purchase) {
        console.log("🛒 Initiating Custom Ball purchase...");
        const result = await sdk.purchase({ item: "custom-ball-creator" });

        if (result.success) {
          console.log("✅ Custom Ball purchased successfully!");
          this.isCustomBallUnlocked = true;
          this.updateCustomBallButtonAppearance(
            Math.min(340, this.scale.width * 0.72),
            70,
            20
          );
        } else {
          console.log("❌ Custom Ball purchase failed or cancelled");
        }
      } else {
        console.log("⚠️ SDK purchase not available");
      }
    } catch (error) {
      console.error("Purchase error:", error);
    }
  }

  checkCustomBallPurchase() {
    const sdk = window.FarcadeSDK;
    if (sdk?.hasItem && sdk.hasItem("custom-ball-creator")) {
      this.isCustomBallUnlocked = true;
      this.updateCustomBallButtonAppearance(
        Math.min(340, this.scale.width * 0.72),
        70,
        20
      );
      console.log("🎉 Custom Ball now unlocked!");
    }
  }

  showCustomBallModal() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.customBallModalContainer = this.add.container(0, 0);
    this.customBallModalContainer.setAlpha(0);
    this.customBallModalContainer.setDepth(100);

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.95);
    overlay.fillRect(0, 0, width, height);
    overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    this.customBallModalContainer.add(overlay);

    // Modal title
    const titleFontSize = Math.min(36, width * 0.08);
    const title = this.add
      .text(width / 2, height * 0.06, "CUSTOM BALL", {
        fontSize: `${titleFontSize}px`,
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.customBallModalContainer.add(title);

    // Preview ball in center-top
    const previewY = height * 0.18;
    const previewBall = this.createCustomBallPreview(width / 2, previewY);
    this.customBallModalContainer.add(previewBall);

    // Section 1: COLOR SELECTOR
    const colorSectionY = height * 0.32;
    this.createColorSelector(width, colorSectionY, previewBall);

    // Section 2: TRAIL SELECTOR
    const trailSectionY = height * 0.50;
    this.createTrailSelector(width, trailSectionY, previewBall);

    // Section 3: PATTERN SELECTOR
    const patternSectionY = height * 0.68;
    this.createPatternSelector(width, patternSectionY, previewBall);

    // SAVE & CLOSE Buttons
    const btnY = height * 0.88;
    this.createCustomBallModalButtons(width, btnY);

    // Fade in
    this.tweens.add({
      targets: this.customBallModalContainer,
      alpha: 1,
      duration: 300,
      ease: "Power2",
    });
  }

  createCustomBallPreview(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const ballSize = 60;

    // Ball preview graphics
    const ballBorder = this.add.graphics();
    ballBorder.fillStyle(0x000000, 1);
    ballBorder.fillCircle(0, 0, ballSize / 2 + 4);
    container.add(ballBorder);

    const ballFill = this.add.graphics();
    container.add(ballFill);
    (container as any).ballFill = ballFill;

    // Trail indicator (line below ball)
    const trailIndicator = this.add.graphics();
    container.add(trailIndicator);
    (container as any).trailIndicator = trailIndicator;

    // Initial draw
    this.updateCustomBallPreview(container);

    return container;
  }

  updateCustomBallPreview(container: Phaser.GameObjects.Container) {
    const ballFill = (container as any).ballFill as Phaser.GameObjects.Graphics;
    const trailIndicator = (container as any).trailIndicator as Phaser.GameObjects.Graphics;
    const ballSize = 60;
    const colorConfig = CUSTOM_BALL_COLORS[this.customBallConfig.color];
    const trailConfig = CUSTOM_BALL_TRAILS[this.customBallConfig.trail];
    const pattern = this.customBallConfig.pattern;

    // Clear previous
    ballFill.clear();
    trailIndicator.clear();

    // Draw ball based on pattern
    switch (pattern) {
      case "solid":
        ballFill.fillStyle(colorConfig.hex, 1);
        ballFill.fillCircle(0, 0, ballSize / 2);
        break;

      case "dots":
        ballFill.fillStyle(colorConfig.hex, 1);
        ballFill.fillCircle(0, 0, ballSize / 2);
        // Add dots
        ballFill.fillStyle(0x000000, 0.4);
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const dx = Math.cos(angle) * (ballSize / 4);
          const dy = Math.sin(angle) * (ballSize / 4);
          ballFill.fillCircle(dx, dy, 4);
        }
        break;

      case "stripes":
        ballFill.fillStyle(colorConfig.hex, 1);
        ballFill.fillCircle(0, 0, ballSize / 2);
        // Add horizontal stripes
        ballFill.fillStyle(0x000000, 0.3);
        ballFill.fillRect(-ballSize / 2, -5, ballSize, 4);
        ballFill.fillRect(-ballSize / 2, 8, ballSize, 4);
        break;

      case "gradient":
        // Simulate gradient with lighter center
        ballFill.fillStyle(colorConfig.hex, 1);
        ballFill.fillCircle(0, 0, ballSize / 2);
        ballFill.fillStyle(0xffffff, 0.4);
        ballFill.fillCircle(-ballSize / 6, -ballSize / 6, ballSize / 4);
        break;

      case "glow":
        // Aura effect
        ballFill.fillStyle(colorConfig.hex, 0.3);
        ballFill.fillCircle(0, 0, ballSize / 2 + 10);
        ballFill.fillStyle(colorConfig.hex, 1);
        ballFill.fillCircle(0, 0, ballSize / 2);
        break;
    }

    // Draw trail indicator
    if (this.customBallConfig.trail !== "none") {
      trailIndicator.fillStyle(trailConfig.color, 0.7);
      // Trail effect below ball
      for (let i = 0; i < 5; i++) {
        const alpha = 0.7 - i * 0.12;
        const size = 8 - i * 1.2;
        trailIndicator.fillStyle(trailConfig.color, alpha);
        trailIndicator.fillCircle(0, ballSize / 2 + 12 + i * 8, size);
      }
    }
  }

  createColorSelector(width: number, y: number, previewBall: Phaser.GameObjects.Container) {
    // Section label
    const label = this.add
      .text(width / 2, y - 30, "COLOR", {
        fontSize: "20px",
        color: "#ffd93d",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.customBallModalContainer.add(label);

    // Color swatches
    const colors = Object.keys(CUSTOM_BALL_COLORS);
    const swatchSize = 36;
    const spacing = 42;
    const startX = width / 2 - ((colors.length - 1) * spacing) / 2;

    colors.forEach((colorKey, index) => {
      const colorData = CUSTOM_BALL_COLORS[colorKey];
      const x = startX + index * spacing;

      const swatch = this.add.graphics();
      // Border
      swatch.lineStyle(3, this.customBallConfig.color === colorKey ? 0xffd93d : 0x000000, 1);
      swatch.strokeCircle(x, y, swatchSize / 2 + 2);
      // Fill
      swatch.fillStyle(colorData.hex, 1);
      swatch.fillCircle(x, y, swatchSize / 2);
      this.customBallModalContainer.add(swatch);

      // Interactive zone
      const zone = this.add
        .zone(x, y, swatchSize + 4, swatchSize + 4)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          this.customBallConfig.color = colorKey;
          this.updateCustomBallPreview(previewBall);
          // Refresh selectors to update selection indicators
          this.refreshCustomBallModal();
        });
      this.customBallModalContainer.add(zone);
    });
  }

  createTrailSelector(width: number, y: number, previewBall: Phaser.GameObjects.Container) {
    // Section label
    const label = this.add
      .text(width / 2, y - 30, "TRAIL", {
        fontSize: "20px",
        color: "#ffd93d",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.customBallModalContainer.add(label);

    // Trail options
    const trails = Object.keys(CUSTOM_BALL_TRAILS);
    const btnWidth = 55;
    const btnHeight = 32;
    const spacing = 60;
    const startX = width / 2 - ((trails.length - 1) * spacing) / 2;

    trails.forEach((trailKey, index) => {
      const trailData = CUSTOM_BALL_TRAILS[trailKey];
      const x = startX + index * spacing;
      const isSelected = this.customBallConfig.trail === trailKey;

      const btn = this.add.graphics();
      // Background
      btn.fillStyle(isSelected ? 0xffd93d : 0x333333, 1);
      btn.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 8);
      btn.lineStyle(2, 0x000000, 1);
      btn.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 8);
      this.customBallModalContainer.add(btn);

      // Trail color indicator (small dot)
      if (trailKey !== "none") {
        btn.fillStyle(trailData.color, 1);
        btn.fillCircle(x, y, 8);
      }

      // Label
      const trailLabel = this.add
        .text(x, y + btnHeight / 2 + 12, trailData.name, {
          fontSize: "12px",
          color: isSelected ? "#ffd93d" : "#FFFFFF",
          fontFamily: "Fredoka",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.customBallModalContainer.add(trailLabel);

      // Interactive zone
      const zone = this.add
        .zone(x, y, btnWidth, btnHeight + 20)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          this.customBallConfig.trail = trailKey;
          this.updateCustomBallPreview(previewBall);
          this.refreshCustomBallModal();
        });
      this.customBallModalContainer.add(zone);
    });
  }

  createPatternSelector(width: number, y: number, previewBall: Phaser.GameObjects.Container) {
    // Section label
    const label = this.add
      .text(width / 2, y - 30, "PATTERN", {
        fontSize: "20px",
        color: "#ffd93d",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.customBallModalContainer.add(label);

    // Pattern options
    const patterns = Object.keys(CUSTOM_BALL_PATTERNS);
    const btnWidth = 60;
    const btnHeight = 32;
    const spacing = 68;
    const startX = width / 2 - ((patterns.length - 1) * spacing) / 2;

    patterns.forEach((patternKey, index) => {
      const patternData = CUSTOM_BALL_PATTERNS[patternKey];
      const x = startX + index * spacing;
      const isSelected = this.customBallConfig.pattern === patternKey;

      const btn = this.add.graphics();
      // Background
      btn.fillStyle(isSelected ? 0xffd93d : 0x333333, 1);
      btn.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 8);
      btn.lineStyle(2, 0x000000, 1);
      btn.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 8);
      this.customBallModalContainer.add(btn);

      // Label
      const patternLabel = this.add
        .text(x, y, patternData.name, {
          fontSize: "12px",
          color: isSelected ? "#000000" : "#FFFFFF",
          fontFamily: "Fredoka",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.customBallModalContainer.add(patternLabel);

      // Interactive zone
      const zone = this.add
        .zone(x, y, btnWidth, btnHeight)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          this.customBallConfig.pattern = patternKey;
          this.updateCustomBallPreview(previewBall);
          this.refreshCustomBallModal();
        });
      this.customBallModalContainer.add(zone);
    });
  }

  createCustomBallModalButtons(width: number, y: number) {
    const btnWidth = 120;
    const btnHeight = 44;
    const spacing = 140;

    // SAVE button
    const saveBg = this.add.graphics();
    saveBg.fillStyle(0x000000, 1);
    saveBg.fillRoundedRect(
      width / 2 - spacing / 2 - btnWidth / 2 - 3,
      y - btnHeight / 2 - 3,
      btnWidth + 6,
      btnHeight + 6,
      12
    );
    saveBg.fillStyle(0x2ecc71, 1);
    saveBg.fillRoundedRect(
      width / 2 - spacing / 2 - btnWidth / 2,
      y - btnHeight / 2,
      btnWidth,
      btnHeight,
      10
    );
    this.customBallModalContainer.add(saveBg);

    const saveText = this.add
      .text(width / 2 - spacing / 2, y, "SAVE", {
        fontSize: "22px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.customBallModalContainer.add(saveText);

    const saveZone = this.add
      .zone(width / 2 - spacing / 2, y, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", async () => {
        await this.saveCustomBallConfig();
        this.closeCustomBallModal();
      });
    this.customBallModalContainer.add(saveZone);

    // CLOSE button
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x000000, 1);
    closeBg.fillRoundedRect(
      width / 2 + spacing / 2 - btnWidth / 2 - 3,
      y - btnHeight / 2 - 3,
      btnWidth + 6,
      btnHeight + 6,
      12
    );
    closeBg.fillStyle(0x7f8c8d, 1);
    closeBg.fillRoundedRect(
      width / 2 + spacing / 2 - btnWidth / 2,
      y - btnHeight / 2,
      btnWidth,
      btnHeight,
      10
    );
    this.customBallModalContainer.add(closeBg);

    const closeText = this.add
      .text(width / 2 + spacing / 2, y, "CLOSE", {
        fontSize: "22px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.customBallModalContainer.add(closeText);

    const closeZone = this.add
      .zone(width / 2 + spacing / 2, y, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.closeCustomBallModal();
      });
    this.customBallModalContainer.add(closeZone);
  }

  refreshCustomBallModal() {
    // Destroy and recreate modal to update selection states
    if (this.customBallModalContainer) {
      this.customBallModalContainer.destroy();
      this.showCustomBallModal();
      this.customBallModalContainer.setAlpha(1);
    }
  }

  async saveCustomBallConfig() {
    try {
      const sdk = window.FarcadeSDK;
      if (sdk?.singlePlayer?.actions?.saveGameState) {
        await sdk.singlePlayer.actions.saveGameState({
          gameState: {
            hasSeenTutorial: this.hasSeenTutorial,
            highScore: this.highScore,
            selectedBallStyle: this.selectedBallStyle,
            customBallConfig: this.customBallConfig,
          },
        });
        console.log("🎨 Custom Ball config saved:", this.customBallConfig);
      }
    } catch (error) {
      console.log("Could not save custom ball config:", error);
    }
  }

  closeCustomBallModal() {
    if (this.customBallModalContainer) {
      this.tweens.add({
        targets: this.customBallModalContainer,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.customBallModalContainer.destroy();
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
    const btnY = height * 0.42;
    const btnHeight = 70;
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
      this.scene.start("HelixScene", {
        testRank: this.testRank,
        ballStyle: this.selectedBallStyle,
        highScore: this.highScore,
        chaosMode: false,
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
