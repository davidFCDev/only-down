import * as Phaser from "phaser";

export default class StartScene extends Phaser.Scene {
  private titleContainer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private typewriterText!: Phaser.GameObjects.Text;
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

    // Background image
    const bg = this.add.image(width / 2, height / 2, "startBg");
    bg.setDisplaySize(width, height);

    // Title with black stroke
    this.createTitle(width, height);

    // Typewriter text
    this.createTypewriterBox();
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
    const titleFontSize = Math.min(72, width * 0.14);

    this.titleContainer = this.add.container(width / 2, height * 0.12);
    this.titleContainer.setAlpha(0);

    // Main title with black stroke
    this.titleText = this.add
      .text(0, 0, "ONLY DOWN", {
        fontSize: `${titleFontSize}px`,
        color: "#FFFFFF",
        fontFamily: "Orbitron",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.titleContainer.add(this.titleText);

    // Fade in and slide
    this.tweens.add({
      targets: this.titleContainer,
      alpha: 1,
      y: height * 0.18,
      duration: 1500,
      ease: "Power2",
    });
  }

  createTypewriterBox() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Box dimensions (no background)
    const boxWidth = Math.min(500, width * 0.85);
    const btnBoxHeight = 70;
    const cornerRadius = 14;

    const container = this.add.container(width / 2, height / 2 + 140);

    // Create text (no background box) - bigger font
    const fontSize = Math.min(44, width * 0.09);

    // Static "Welcome " text
    this.typewriterText = this.add
      .text(0, 0, "", {
        fontSize: `${fontSize}px`,
        color: "#FFFFFF",
        fontFamily: "Orbitron",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5);
    container.add(this.typewriterText);

    // Store box dimensions for button
    container.setData("boxWidth", boxWidth);
    container.setData("btnBoxHeight", btnBoxHeight);
    container.setData("cornerRadius", cornerRadius);
    container.setData("fontSize", fontSize);

    // Animation state
    const welcomeText = "Welcome ";
    const remixerText = "Remixer";
    let phase: "typing-welcome" | "typing-remixer" | "done" = "typing-welcome";
    let charIndex = 0;
    let greenText: Phaser.GameObjects.Text | null = null;

    const updateTextPositions = () => {
      if (greenText) {
        const totalWidth = this.typewriterText.width + greenText.width;
        this.typewriterText.setOrigin(1, 0.5);
        greenText.setOrigin(0, 0.5);
        this.typewriterText.setX(-totalWidth / 2 + this.typewriterText.width);
        greenText.setX(-totalWidth / 2 + this.typewriterText.width);
      }
    };

    const typewriterEvent = this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        switch (phase) {
          case "typing-welcome":
            if (charIndex < welcomeText.length) {
              this.typewriterText.setText(
                welcomeText.substring(0, charIndex + 1)
              );
              charIndex++;
            } else {
              // Create green text for Remixer
              greenText = this.add
                .text(0, 0, "", {
                  fontSize: `${fontSize}px`,
                  color: "#00FF41",
                  fontFamily: "Orbitron",
                  align: "center",
                  stroke: "#000000",
                  strokeThickness: 4,
                })
                .setOrigin(0, 0.5);
              container.add(greenText);
              phase = "typing-remixer";
              charIndex = 0;
            }
            break;

          case "typing-remixer":
            if (charIndex < remixerText.length) {
              greenText!.setText(remixerText.substring(0, charIndex + 1));
              updateTextPositions();
              charIndex++;
            } else {
              // Done typing, create button and stop loop
              this.createStartButton(container);
              phase = "done";
              typewriterEvent.remove();
            }
            break;

          case "done":
            // Animation complete
            break;
        }
      },
    });
  }

  createStartButton(parentContainer: Phaser.GameObjects.Container) {
    // Get title width to match button width
    const titleWidth = this.titleText.width;
    const cornerRadius = parentContainer.getData("cornerRadius") as number;

    // Position button below the text - more separation
    const btnY = 100;

    this.startBtnContainer = this.add.container(0, btnY);
    this.startBtnContainer.setAlpha(0);
    parentContainer.add(this.startBtnContainer);

    // Button dimensions - smaller
    const btnWidth = titleWidth - 40;
    const btnHeight = 60;

    const bg = this.add.graphics();
    bg.fillStyle(0x00ff41, 1);
    bg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      cornerRadius
    );

    const text = this.add
      .text(0, 0, "START", {
        fontSize: "32px",
        color: "#000000",
        fontFamily: "Orbitron",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tweens.add({
          targets: this.startBtnContainer,
          scale: 1.03,
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

    this.startBtnContainer.add([bg, text, zone]);

    // Fade in animation
    this.tweens.add({
      targets: this.startBtnContainer,
      alpha: 1,
      y: btnY - 5,
      duration: 500,
      ease: "Back.out",
    });

    // Continuous subtle pulse animation
    this.tweens.add({
      targets: this.startBtnContainer,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
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
    overlay.fillStyle(0x000000, 0.97);
    overlay.fillRect(0, 0, width, height);
    this.tutorialContainer.add(overlay);

    // Tutorial points
    const tutorialPoints = [
      "Move left and right",
      "Avoid the red zones",
      "Put on your headphones",
      "Enjoy the experience",
    ];

    const startY = height * 0.25;
    const lineHeight = 80;
    const fontSize = Math.min(26, width * 0.05);

    tutorialPoints.forEach((text, index) => {
      // Text centered
      const textObj = this.add
        .text(width / 2, startY + index * lineHeight, text, {
          fontSize: `${fontSize}px`,
          color: "#FFFFFF",
          fontFamily: "Orbitron",
          align: "center",
        })
        .setOrigin(0.5);
      this.tutorialContainer.add(textObj);
    });

    // "Let's Go" button
    const btnY = startY + tutorialPoints.length * lineHeight + 80;
    const btnWidth = Math.min(300, width * 0.7);
    const btnHeight = 65;
    const cornerRadius = 14;

    const btnContainer = this.add.container(width / 2, btnY);
    this.tutorialContainer.add(btnContainer);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x00ff41, 1);
    btnBg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      cornerRadius
    );
    btnContainer.add(btnBg);

    const btnText = this.add
      .text(0, 0, "GO", {
        fontSize: "36px",
        color: "#000000",
        fontFamily: "Orbitron",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    btnContainer.add(btnText);

    const btnZone = this.add
      .zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tweens.add({
          targets: btnContainer,
          scale: 1.05,
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

    // Fade in the tutorial
    this.tweens.add({
      targets: this.tutorialContainer,
      alpha: 1,
      duration: 400,
      ease: "Power2",
    });
  }
}
