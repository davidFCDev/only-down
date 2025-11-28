// Use global Phaser loaded via CDN
const Phaser = (window as any).Phaser;

export default class StartScene extends Phaser.Scene {
  private titleContainer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private startBtnContainer!: Phaser.GameObjects.Container;
  private tutorialContainer!: Phaser.GameObjects.Container;
  private bouncingBall!: Phaser.GameObjects.Container;
  private hasSeenTutorial: boolean = false;

  constructor() {
    super("StartScene");
  }

  async create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Check if user has seen tutorial before
    await this.checkTutorialState();

    // Background image - colorful waves
    const bg = this.add.image(width / 2, height / 2, "startBg");
    bg.setDisplaySize(width, height);

    // Title with cartoon style
    this.createTitle(width, height);

    // Start button directly
    this.createMainStartButton(width, height);
  }

  async checkTutorialState() {
    try {
      const sdk = window.FarcadeSDK;
      if (sdk?.singlePlayer?.actions?.ready) {
        const gameInfo = await sdk.singlePlayer.actions.ready();
        if (gameInfo?.initialGameState?.gameState?.hasSeenTutorial) {
          this.hasSeenTutorial = true;
        }
      }
    } catch (error) {
      console.log("Could not load game state:", error);
    }
  }

  async saveTutorialSeen() {
    try {
      const sdk = window.FarcadeSDK;
      if (sdk?.singlePlayer?.actions?.saveGameState) {
        await sdk.singlePlayer.actions.saveGameState({
          gameState: { hasSeenTutorial: true },
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
    // "ONLY DOWN" - the O in DOWN is roughly at the center + small offset
    const oLetterX = width / 2 + titleFontSize * 0.15;
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
