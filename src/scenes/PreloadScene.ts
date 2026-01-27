// Use global Phaser loaded via CDN
const Phaser = (window as any).Phaser;

export class PreloadScene extends Phaser.Scene {
  private assetsLoaded: boolean = false;
  private animationComplete: boolean = false;
  private bootSprite!: Phaser.GameObjects.Sprite;

  constructor() {
    super({ key: "PreloadScene" });
  }

  init(): void {
    this.cameras.main.setBackgroundColor("#000000");
  }

  preload(): void {
    // ONLY load the boot sprite here (75KB - loads fast)
    this.load.spritesheet(
      "bootSprite",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/sprite-start-oVCq0bchsVLwbLqAPbLgVOrQqxcVh5.webp?Cbzd",
      { frameWidth: 241, frameHeight: 345 }
    );
  }

  create(): void {
    // Create the boot animation - plays ONCE, stops on last frame
    this.anims.create({
      key: "boot",
      frames: this.anims.generateFrameNumbers("bootSprite", {
        start: 0,
        end: 17,
      }),
      frameRate: 12,
      repeat: 0, // Play once only
    });

    const width = this.scale.width;
    const height = this.scale.height;

    this.bootSprite = this.add.sprite(width / 2, height / 2, "bootSprite");
    const scale = Math.min(width / 300, height / 400, 1.5);
    this.bootSprite.setScale(scale);
    this.bootSprite.play("boot");

    // When animation finishes, it stays on last frame
    this.bootSprite.on("animationcomplete", () => {
      console.log("✅ Animación de boot completada - esperando assets...");
      this.animationComplete = true;
      this.checkTransition();
    });

    // NOW load all other assets in background
    this.loadRemainingAssets();
  }

  private loadRemainingAssets(): void {
    // WebFont loader
    this.load.script(
      "webfont",
      "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
    );

    // --- ESSENTIAL AUDIO ONLY (for fast startup) ---
    this.load.audio(
      "beep",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/beep-aZS0fjcqYMF02tbEaXNicU1ZINgbFv.mp3?mLta"
    );
    this.load.audio(
      "jump",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/jump-dl6fQQe9R850MJre81hlFTMQeSeEdt.mp3?x2xm"
    );
    // First track for each mode (guaranteed to be available)
    this.load.audio(
      "music1",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/Music1-ICgwk3vrOSfdkNNkxMGUUDAecJqSms.mp3?OQ9S"
    );
    this.load.audio(
      "chaos1",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/chaos1-XUTPuodX90SvcqBFbUEoVmRPrnvekZ.mp3?SItV"
    );
    // NOTE: music2, chaos2, chaos3 are loaded in HelixScene after game starts

    // --- IMAGES ---
    this.load.image(
      "startBg",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/menu-K8YWWxHNtcoroaE0PEU6xyuiSyKAiu.webp?jQaX"
    );

    // Listen for completion
    this.load.on("complete", () => {
      console.log("✅ Todos los assets cargados");
      this.assetsLoaded = true;
      this.checkTransition();
    });

    this.load.on("loaderror", (file: any) => {
      console.warn("⚠️ Error cargando:", file.key);
    });

    // Start loading!
    this.load.start();

    // Load font in parallel
    this.loadFont();
  }

  private loadFont(): void {
    const checkWf = setInterval(() => {
      const wf = (window as any).WebFont;
      if (wf?.load) {
        clearInterval(checkWf);
        wf.load({
          google: { families: ["Fredoka:700"] },
          active: () => console.log("✅ Fuente Fredoka cargada"),
          inactive: () => console.warn("⚠️ Fredoka no cargó"),
          timeout: 2000,
        });
      }
    }, 50);

    setTimeout(() => clearInterval(checkWf), 3000);
  }

  private checkTransition(): void {
    // Transition when BOTH animation finished AND assets loaded
    if (this.animationComplete && this.assetsLoaded) {
      console.log("✅ Todo listo - transición directa a HelixScene (modo CHAOS)");
      // Go directly to HelixScene in chaos mode, skipping StartScene
      this.scene.start("HelixScene", {
        chaosMode: true,
      });
    }
  }
}
