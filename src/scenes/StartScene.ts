// Use global Phaser loaded via CDN
const Phaser = (window as any).Phaser;

export default class StartScene extends Phaser.Scene {
  private titleContainer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;
  private startBtnContainer!: Phaser.GameObjects.Container;
  private tutorialContainer!: Phaser.GameObjects.Container;
  private bouncingBall!: Phaser.GameObjects.Container;
  private hasSeenTutorial: boolean = false;
  private highScore: number = 0;

  constructor() {
    super("StartScene");
  }

  async create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Check if user has seen tutorial before
    await this.checkTutorialState();

    // Background image - colorful waves (reduced intensity)
    const bg = this.add.image(width / 2, height / 2, "startBg");
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.6); // Reduce intensity so it doesn't stand out too much

    // Title with cartoon style
    this.createTitle(width, height);

    // Show rank below title
    this.createRankDisplay(width, height);

    // Start button directly
    this.createMainStartButton(width, height);
  }

  async checkTutorialState() {
    try {
      const sdk = window.FarcadeSDK;
      if (sdk?.singlePlayer?.actions?.ready) {
        const gameInfo = await sdk.singlePlayer.actions.ready();
        console.log("📊 SDK gameInfo:", JSON.stringify(gameInfo, null, 2));

        if (gameInfo?.initialGameState?.gameState?.hasSeenTutorial) {
          this.hasSeenTutorial = true;
        }

        // Get high score for rank system - check multiple possible locations
        if (typeof gameInfo?.highScore === "number") {
          this.highScore = gameInfo.highScore;
        } else if (typeof gameInfo?.initialGameState?.highScore === "number") {
          this.highScore = gameInfo.initialGameState.highScore;
        } else if (
          typeof gameInfo?.initialGameState?.gameState?.highScore === "number"
        ) {
          this.highScore = gameInfo.initialGameState.gameState.highScore;
        }
        console.log("🏆 High Score loaded:", this.highScore);
      }
    } catch (error) {
      console.log("Could not load game state:", error);
    }
  }

  async saveTutorialSeen() {
    try {
      const sdk = window.FarcadeSDK;
      if (sdk?.singlePlayer?.actions?.saveGameState) {
        // Preserve high score when saving tutorial state
        await sdk.singlePlayer.actions.saveGameState({
          gameState: {
            hasSeenTutorial: true,
            highScore: this.highScore,
          },
        });
      }
    } catch (error) {
      console.log("Could not save game state:", error);
    }
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
    if (score >= 1000) return { name: "Remixer", color: "#ffd93d" }; // Gold
    if (score >= 500) return { name: "Gravity Master", color: "#e91e8c" }; // Magenta
    if (score >= 300) return { name: "Free Faller", color: "#1abc9c" }; // Teal
    if (score >= 150) return { name: "Platform Breaker", color: "#2ecc71" }; // Green
    if (score >= 100) return { name: "Descender", color: "#3498db" }; // Blue
    if (score >= 50) return { name: "Noob", color: "#95a5a6" }; // Gray
    return { name: "Unranked", color: "#7f8c8d" }; // Dark gray
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
    const btnWidth = Math.min(320, width * 0.65);
    const btnHeight = 80;
    const cornerRadius = 22;

    this.startBtnContainer = this.add.container(width / 2, height * 0.58);
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
        fontSize: "52px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 7,
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

    // Create bouncing ball animation after button appears
    this.time.delayedCall(1000, () => {
      this.createBouncingBall(width, height);
    });
  }

  createBouncingBall(width: number, height: number) {
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

    // Button top position
    const btnY = height * 0.58;
    const btnHeight = 80;
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

    // Ball fill (green like the game ball)
    const ballFill = this.add.graphics();
    ballFill.fillStyle(0x2ecc71, 1);
    ballFill.fillCircle(0, 0, ballRadius);
    this.bouncingBall.add(ballFill);

    // Highlight
    const highlight = this.add.graphics();
    highlight.fillStyle(0xffffff, 0.4);
    highlight.fillCircle(-8, -8, 8);
    this.bouncingBall.add(highlight);

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
    // If first time, show tutorial modal
    if (!this.hasSeenTutorial) {
      this.showTutorialModal();
    } else {
      this.scene.start("HelixScene");
    }
  }

  showTutorialModal() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.tutorialContainer = this.add.container(0, 0);
    this.tutorialContainer.setAlpha(0);
    this.tutorialContainer.setDepth(100);

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.95);
    overlay.fillRect(0, 0, width, height);
    this.tutorialContainer.add(overlay);

    // Tutorial points in white - larger text, no title
    const tutorialPoints = [
      "Tap left or right to move",
      "Fall through the gaps",
      "Avoid the red zones!",
      "Collect power-ups",
    ];

    const startY = height * 0.22;
    const lineHeight = 100;
    const fontSize = Math.min(38, width * 0.08);

    tutorialPoints.forEach((text, index) => {
      const textObj = this.add
        .text(width / 2, startY + index * lineHeight, text, {
          fontSize: `${fontSize}px`,
          color: "#FFFFFF",
          fontFamily: "Fredoka",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 5,
          align: "center",
        })
        .setOrigin(0.5);
      this.tutorialContainer.add(textObj);
    });

    // "GO!" button
    const btnY = startY + tutorialPoints.length * lineHeight + 60;
    const btnWidth = Math.min(240, width * 0.5);
    const btnHeight = 65;
    const cornerRadius = 18;

    const btnContainer = this.add.container(width / 2, btnY);
    this.tutorialContainer.add(btnContainer);

    const btnBg = this.add.graphics();
    // Black border
    btnBg.fillStyle(0x000000, 1);
    btnBg.fillRoundedRect(
      -btnWidth / 2 - 4,
      -btnHeight / 2 - 4,
      btnWidth + 8,
      btnHeight + 8,
      cornerRadius + 2
    );
    // Magenta fill
    btnBg.fillStyle(0xe91e8c, 1);
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
        fontSize: "40px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    btnContainer.add(btnText);

    const btnZone = this.add
      .zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tweens.add({
          targets: btnContainer,
          scale: 1.08,
          duration: 100,
        });
      })
      .on("pointerout", () => {
        this.tweens.add({
          targets: btnContainer,
          scale: 1,
          duration: 100,
        });
      })
      .on("pointerdown", async () => {
        // Save that user has seen tutorial
        await this.saveTutorialSeen();
        this.hasSeenTutorial = true;

        // Fade out and start game
        this.tweens.add({
          targets: this.tutorialContainer,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            this.scene.start("HelixScene");
          },
        });
      });
    btnContainer.add(btnZone);

    // Pulse animation for GO button
    this.tweens.add({
      targets: btnContainer,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Fade in the tutorial
    this.tweens.add({
      targets: this.tutorialContainer,
      alpha: 1,
      duration: 400,
      ease: "Power2",
    });
  }
}
