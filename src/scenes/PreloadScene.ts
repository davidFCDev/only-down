export class PreloadScene extends Phaser.Scene {
  private progressBarElement?: HTMLElement;
  private assetsLoaded: boolean = false;

  constructor() {
    super({ key: "PreloadScene" });
  }

  init(): void {
    this.cameras.main.setBackgroundColor("#000000");
    this.createStudioBranding();
  }

  preload(): void {
    // Setup loading progress listeners
    this.load.on("progress", (value: number) => {
      this.updateProgressBar(value);
    });

    this.load.on("complete", () => {
      console.log("✅ Todos los assets cargados al 100%");
      this.assetsLoaded = true;
      this.updateProgressBar(1);
    });

    // Manejo de errores en la carga de archivos
    this.load.on("loaderror", (file: any) => {
      console.warn("⚠️ Error cargando archivo:", file.key, file.url);
    });

    // WebFont loader para fuentes
    this.load.script(
      "webfont",
      "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
    );

    // --- AUDIO ---
    this.load.audio(
      "beep",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/beep-aZS0fjcqYMF02tbEaXNicU1ZINgbFv.mp3?mLta"
    );
    this.load.audio(
      "music1",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/Music1-ICgwk3vrOSfdkNNkxMGUUDAecJqSms.mp3?OQ9S"
    );
    this.load.audio(
      "music2",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/Music2-e5yvNmydcY93DXLREewH08duLtpKHW.mp3?CqEO"
    );
    this.load.audio(
      "music3",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/Music3-j3DjCMhHxGIB59oCtKifBJHGWlAs5V.mp3?4xTa"
    );
    this.load.audio(
      "jump",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/jump-dl6fQQe9R850MJre81hlFTMQeSeEdt.mp3?x2xm"
    );
    // Premium music tracks (unlocked at score >= 500)
    this.load.audio(
      "unlock1",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/unlock1-SEhg5HWmyX7cvHJlY8byomuBZEUqq9.mp3?g4mS"
    );
    this.load.audio(
      "unlock2",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/unlock2-TU5t1uk6rH6C4ryPpLzVrzhhqkzltI.mp3?utUq"
    );

    // --- IMAGES ---
    this.load.image(
      "startBg",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/menu-K8YWWxHNtcoroaE0PEU6xyuiSyKAiu.webp?jQaX"
    );
  }

  create(): void {
    // Assets loaded, wait for minimum display time then transition
  }

  private createStudioBranding(): void {
    const gameCanvas = this.sys.game.canvas;
    const gameContainer = gameCanvas.parentElement;

    const overlay = document.createElement("div");
    overlay.id = "studio-overlay";
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #000000;
      z-index: 9999;
      pointer-events: all;
    `;

    const studioText = document.createElement("div");
    studioText.id = "studio-text";
    studioText.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: "Pixelify Sans", "Press Start 2P", system-ui, monospace;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 3px 3px 0 #000;
      gap: 6px;
      opacity: 0;
      transform: translateY(8px) scale(0.98);
      transition: opacity 700ms ease, transform 500ms cubic-bezier(0.2, 0.6, 0.2, 1);
      min-height: 80px;
      width: 100%;
    `;

    const brandMain = document.createElement("div");
    brandMain.style.cssText = `
      font-size: 24px;
      letter-spacing: 3px;
      line-height: 1;
      color: #ffffff;
      position: relative;
      text-shadow: 2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000,
        2px 2px #000, -2px 2px #000, 2px -2px #000, -2px -2px #000,
        3px 3px 0 #000;
      margin-bottom: 8px;
    `;
    brandMain.textContent = "HELLBOUND";

    const progressContainer = document.createElement("div");
    progressContainer.style.cssText = `
      width: 200px;
      height: 20px;
      border: 3px solid #000000;
      border-radius: 12px;
      margin: 12px auto;
      display: block;
      position: relative;
      box-sizing: border-box;
      background: #1a1a1a;
      overflow: hidden;
      box-shadow: 
        inset 0 2px 4px rgba(0, 0, 0, 0.5),
        0 0 8px rgba(183, 255, 0, 0.3);
    `;

    const greenLine = document.createElement("div");
    greenLine.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(to bottom, 
        #b7ff00 0%, 
        #a0e600 30%,
        #8fcc00 50%,
        #a0e600 70%,
        #b7ff00 100%
      );
      border-radius: 9px;
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      box-shadow: 
        0 0 10px rgba(183, 255, 0, 0.6),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    `;

    progressContainer.appendChild(greenLine);
    this.progressBarElement = greenLine;

    const brandSub = document.createElement("div");
    brandSub.style.cssText = `
      font-size: 14px;
      letter-spacing: 4px;
      color: #b7ff00;
      text-shadow: 3px 3px 0 #000, 0 0 10px rgba(183, 255, 0, 0.3);
      line-height: 1;
    `;
    brandSub.textContent = "STUDIOS";

    const brandTm = document.createElement("span");
    brandTm.style.cssText = `
      position: absolute;
      top: -6px;
      right: -16px;
      font-size: 9px;
      color: #ffffff;
      text-shadow: 2px 2px 0 #000;
      opacity: 0.9;
    `;
    brandTm.textContent = "™";

    brandMain.appendChild(brandTm);
    studioText.appendChild(brandMain);
    studioText.appendChild(progressContainer);
    studioText.appendChild(brandSub);
    overlay.appendChild(studioText);

    if (gameContainer) {
      gameContainer.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }

    (this as any).studioOverlay = overlay;
    (this as any).studioText = studioText;

    this.showStudioText();
  }

  private showStudioText(): void {
    const studioText = (this as any).studioText;

    if (!studioText) {
      this.transitionToGame().catch(console.error);
      return;
    }

    studioText.style.opacity = "1";
    studioText.style.transform = "translateY(0) scale(1)";

    this.waitForAssetsAndTransition();
  }

  private waitForAssetsAndTransition(): void {
    const minDisplayTime = 2000;
    const startTime = Date.now();

    // Esperar a que WebFont esté cargado y luego cargar Fredoka
    const ensureFontsLoaded = (): Promise<void> => {
      return new Promise((resolve) => {
        const onWebFontReady = () => {
          const wf = (window as any).WebFont;
          if (!wf || !wf.load) {
            // Fallback: usar document.fonts API nativa
            if ((document as any).fonts?.ready) {
              (document as any).fonts.ready
                .then(() => {
                  console.log("✅ Fuentes cargadas con document.fonts API");
                  resolve();
                })
                .catch(() => resolve());
            } else {
              resolve();
            }
            return;
          }

          wf.load({
            google: {
              families: ["Fredoka:700"],
            },
            active: () => {
              console.log("✅ Fuente Fredoka cargada correctamente");
              resolve();
            },
            inactive: () => {
              console.warn("⚠️ Fredoka no se pudo cargar con WebFont");
              resolve();
            },
          });
        };

        // Esperar a que el script de WebFont se haya cargado
        const checkInterval = setInterval(() => {
          if ((window as any).WebFont) {
            clearInterval(checkInterval);
            onWebFontReady();
          }
        }, 50);

        // Timeout de seguridad: si WebFont no carga en 3s, continuar
        setTimeout(() => {
          clearInterval(checkInterval);
          if ((document as any).fonts?.ready) {
            (document as any).fonts.ready
              .then(() => resolve())
              .catch(() => resolve());
          } else {
            resolve();
          }
        }, 3000);
      });
    };

    const checkAndTransition = () => {
      const elapsedTime = Date.now() - startTime;

      if (this.assetsLoaded && elapsedTime >= minDisplayTime) {
        ensureFontsLoaded()
          .then(() => {
            console.log("🎮 Transición a StartScene (assets + fuentes listas)");

            const studioText = (this as any).studioText;
            if (studioText) {
              studioText.style.opacity = "0";
              studioText.style.transform = "translateY(8px) scale(0.98)";
            }

            setTimeout(() => {
              this.transitionToGame().catch(console.error);
            }, 600);
          })
          .catch(() => {
            console.warn("⚠️ Error cargando fuentes con WebFont, continuando");
            const studioText = (this as any).studioText;
            if (studioText) {
              studioText.style.opacity = "0";
              studioText.style.transform = "translateY(8px) scale(0.98)";
            }

            setTimeout(() => {
              this.transitionToGame().catch(console.error);
            }, 600);
          });
      } else {
        setTimeout(checkAndTransition, 100);
      }
    };

    checkAndTransition();
  }

  private updateProgressBar(progress: number): void {
    if (this.progressBarElement) {
      const percentage = Math.round(progress * 100);
      this.progressBarElement.style.width = `${percentage}%`;
      console.log(`📦 Loading: ${percentage}%`);
    }
  }

  private async transitionToGame(): Promise<void> {
    const overlay = (this as any).studioOverlay;

    if (overlay && overlay.parentElement) {
      overlay.parentElement.removeChild(overlay);
      (this as any).studioOverlay = null;
      (this as any).studioText = null;
    }

    this.progressBarElement = undefined;
    this.scene.start("StartScene");
  }
}
