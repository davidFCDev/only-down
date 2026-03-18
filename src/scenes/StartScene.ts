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

export default class StartScene extends Phaser.Scene {
  private titleContainer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;
  private startBtnContainer!: Phaser.GameObjects.Container;
  private bouncingBall!: Phaser.GameObjects.Container;
  private bouncingBallGraphics!: Phaser.GameObjects.Graphics;
  private bouncingBallImage: Phaser.GameObjects.Image | null = null;
  private highScore: number = 0;
  private selectedBallStyle: string = "unranked";
  private isChaosMode: boolean = false;
  private chaosBtnContainer!: Phaser.GameObjects.Container;
  private isChaosUnlocked: boolean = false;
  private chaosBtnBg!: Phaser.GameObjects.Graphics;
  private chaosBtnText!: Phaser.GameObjects.Text;
  private chaosBadgeBg!: Phaser.GameObjects.Graphics;
  private chaosBadgeText!: Phaser.GameObjects.Text;

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

    // Load saved game state
    await this.loadGameState();
    console.log("✅ loadGameState completado");

    // Background image - colorful waves (reduced intensity)
    const bg = this.add.image(width / 2, height / 2, "startBg");
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.6); // Reduce intensity so it doesn't stand out too much

    // Title with cartoon style
    this.createTitle(width, height);
    console.log("✅ createTitle completado");

    // Start button directly (no rank display)
    this.createMainStartButton(width, height);
    console.log("✅ createMainStartButton completado");

    // Development controls for rank testing - HIDDEN
    // this.createDevControls(width, height);
  }

  async loadGameState() {
    // State kept in memory only — no persistence
    this.isChaosUnlocked = true;
  }

  async saveBallStyle(style: string) {
    this.selectedBallStyle = style;
  }

  getUnlockedBallStyles(): string[] {
    // All ball styles are always unlocked
    return Object.keys(BALL_STYLES);
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

  createMainStartButton(width: number, height: number) {
    const btnWidth = Math.min(340, width * 0.72);
    const btnHeight = 70;
    const cornerRadius = 20;

    this.startBtnContainer = this.add.container(width / 2, height * 0.44);
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
      cornerRadius + 2,
    );
    // Green fill
    btnBg.fillStyle(0x2ecc71, 1);
    btnBg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      cornerRadius,
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

    // Create chaos mode button
    this.createChaosModeButton(width, height);

    // Create bouncing ball animation after button appears
    this.time.delayedCall(1000, () => {
      this.createBouncingBall(width, height);
    });
  }

  createChaosModeButton(width: number, height: number) {
    const btnWidth = Math.min(340, width * 0.72);
    const btnHeight = 70;
    const cornerRadius = 20;

    this.chaosBtnContainer = this.add.container(width / 2, height * 0.56);
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
        // Always unlocked, just start chaos mode
        this.startChaosMode();
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
    cornerRadius: number,
  ) {
    // Clear and redraw button background
    this.chaosBtnBg.clear();

    // Always unlocked - Fuchsia with black border (no badges)
    this.chaosBtnBg.fillStyle(0x000000, 1);
    this.chaosBtnBg.fillRoundedRect(
      -btnWidth / 2 - 5,
      -btnHeight / 2 - 5,
      btnWidth + 10,
      btnHeight + 10,
      cornerRadius + 2,
    );
    this.chaosBtnBg.fillStyle(0xe91e8c, 1);
    this.chaosBtnBg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      cornerRadius,
    );

    this.chaosBtnText.setX(0);

    // No badge
    this.chaosBadgeBg.clear();
    this.chaosBadgeText.setText("");
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

  drawBallStyle(
    graphics: Phaser.GameObjects.Graphics,
    styleKey: string,
    radius: number,
    container?: Phaser.GameObjects.Container,
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
          proSize / 2,
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
          false,
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
          false,
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
            false,
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

  createBouncingBall(width: number, height: number) {
    console.log(
      "🎱 Creating bouncing ball with style:",
      this.selectedBallStyle,
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
    const btnY = height * 0.44;
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
      this.bouncingBall,
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
        this.bouncingBall,
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
    this.scene.start("HelixScene", {
      testRank: this.testRank,
      ballStyle: this.selectedBallStyle,
      highScore: this.highScore,
      chaosMode: false,
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
      10,
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
