// Use global Phaser loaded via CDN
const Phaser = (window as any).Phaser;

export default class StartScene extends Phaser.Scene {
  private titleContainer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private startBtnContainer!: Phaser.GameObjects.Container;
  private tutorialContainer!: Phaser.GameObjects.Container;
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
    const btnWidth = Math.min(280, width * 0.6);
    const btnHeight = 70;
    const cornerRadius = 20;

    this.startBtnContainer = this.add.container(width / 2, height * 0.55);
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
        fontSize: "44px",
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

    // Fade in animation with delay
    this.tweens.add({
      targets: this.startBtnContainer,
      alpha: 1,
      y: height * 0.5,
      duration: 800,
      delay: 600,
      ease: "Back.out",
    });

    // Continuous pulse animation
    this.tweens.add({
      targets: this.startBtnContainer,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      delay: 1400,
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

    // Tutorial title
    const tutorialTitle = this.add
      .text(width / 2, height * 0.15, "HOW TO PLAY", {
        fontSize: "48px",
        color: "#ffd93d",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.tutorialContainer.add(tutorialTitle);

    // Tutorial points in white
    const tutorialPoints = [
      "Tap left or right to move",
      "Fall through the gaps",
      "Avoid the red zones!",
      "Collect power-ups",
    ];

    const startY = height * 0.3;
    const lineHeight = 70;
    const fontSize = Math.min(24, width * 0.05);

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
