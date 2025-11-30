import * as THREE from "three";

// Use global Phaser loaded via CDN
const Phaser = (window as any).Phaser;

export default class HelixScene extends Phaser.Scene {
  private threeScene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private threeRenderer!: THREE.WebGLRenderer;
  private tower!: THREE.Group;
  private ball!: THREE.Mesh;
  private ballAura!: THREE.Sprite;

  // Power Ups
  private powerUps: THREE.Object3D[] = [];
  private isSuperSmash: boolean = false;
  private platformsToSmash: number = 0;
  private normalMaterial!: THREE.MeshBasicMaterial;
  private superMaterial!: THREE.MeshBasicMaterial;
  private remixerMaterial!: THREE.MeshBasicMaterial;
  private legendMaterial!: THREE.MeshBasicMaterial;
  private masterMaterial!: THREE.MeshBasicMaterial;
  private proMaterial!: THREE.MeshBasicMaterial; // New Pro Material
  private noobMaterial!: THREE.MeshBasicMaterial; // New Noob Material
  private stripedMaterial!: THREE.MeshBasicMaterial;
  private blinkingMaterial!: THREE.MeshBasicMaterial;
  private originalMaterial!: THREE.Material; // Store material before power-up

  // Game State & Physics
  private platforms: THREE.Mesh[] = [];
  private ballVelocity: number = 0;
  private gravity: number = -0.015;
  private jumpStrength: number = 0.35;
  private isGameActive: boolean = true;
  private isGameStarting: boolean = true;
  private startTimer: number = 0;
  private startText!: Phaser.GameObjects.Text;
  private startOverlay!: Phaser.GameObjects.Graphics;
  private score: number = 0;
  private comboCount: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // Particles
  private particles: {
    mesh: THREE.Object3D;
    velocity: THREE.Vector3;
    life: number;
  }[] = [];
  private electricSparks: THREE.Line[] = []; // Electric sparks for Remixer
  private platformThickness: number = 0.8;
  private lowestPlatformY: number = 0;
  private platformIdCounter: number = 0;

  private keys!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  private scoreContainer!: Phaser.GameObjects.Container;
  private gameOverContainer!: Phaser.GameObjects.Container;

  // Audio
  private beepSound!: Phaser.Sound.BaseSound;
  private jumpSound!: Phaser.Sound.BaseSound;
  private currentMusic!: Phaser.Sound.BaseSound;
  private musicTracks: string[] = ["music1", "music2", "music3"];
  private threeCanvas!: HTMLCanvasElement;
  private isMuted: boolean = false;
  private audioContext: AudioContext | null = null;
  private testRank: string = "Remixer"; // For development testing

  constructor() {
    super("HelixScene");
  }

  init(data?: { testRank?: string }) {
    if (data?.testRank) {
      this.testRank = data.testRank;
    }
    // Get the Phaser canvas position and size
    const phaserCanvas = this.game.canvas;
    const rect = phaserCanvas.getBoundingClientRect();

    // Setup ThreeJS Layer - match Phaser canvas exactly
    this.threeCanvas = document.createElement("canvas");
    this.threeCanvas.style.zIndex = "0";
    this.threeCanvas.style.position = "absolute";
    this.threeCanvas.style.top = `${rect.top}px`;
    this.threeCanvas.style.left = `${rect.left}px`;
    this.threeCanvas.style.width = `${rect.width}px`;
    this.threeCanvas.style.height = `${rect.height}px`;
    this.threeCanvas.style.pointerEvents = "none";
    document.body.appendChild(this.threeCanvas);

    phaserCanvas.style.position = "relative";
    phaserCanvas.style.zIndex = "1";
    phaserCanvas.style.background = "transparent";

    this.threeScene = new THREE.Scene();
    // Warm yellow/cream background
    this.threeScene.background = new THREE.Color(0xf5d89a);

    const width = rect.width;
    const height = rect.height;
    // Balanced FOV (68) for visibility and mobile performance
    this.camera = new THREE.PerspectiveCamera(68, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, 11);
    this.camera.lookAt(0, -1, 0);

    this.threeRenderer = new THREE.WebGLRenderer({
      canvas: this.threeCanvas,
      antialias: false, // Disabled for mobile performance
    });
    this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio
    this.threeRenderer.setSize(rect.width, rect.height);
  }

  create() {
    // No lights needed - using MeshBasicMaterial for flat shading

    // Create Tower - tall enough to never see the end (10000 units = ~2500 platforms)
    const towerGeo = new THREE.CylinderGeometry(2, 2, 10000, 16);
    const towerMat = new THREE.MeshBasicMaterial({ color: 0x2c3e50 }); // Dark blue-gray
    const cylinder = new THREE.Mesh(towerGeo, towerMat);
    cylinder.position.y = -4500; // Offset down so most of the cylinder is below Y=0

    this.tower = new THREE.Group();
    this.tower.add(cylinder);
    this.threeScene.add(this.tower);

    // No stars - solid background is more performant

    // Materials - Vibrant colors
    this.normalMaterial = new THREE.MeshBasicMaterial({
      color: 0x2ecc71, // Bright green
    });

    this.remixerMaterial = new THREE.MeshBasicMaterial({
      color: 0xb7ff00, // Neon Green (Remixer)
    });

    // Legend Material - Multicolor Waves
    const legendTexture = this.createLegendTexture();
    this.legendMaterial = new THREE.MeshBasicMaterial({
      map: legendTexture,
    });

    // Gravity Master Material - Two-tone fire (red-orange/yellow)
    const masterTexture = this.createGravityMasterTexture();
    this.masterMaterial = new THREE.MeshBasicMaterial({
      map: masterTexture,
    });

    // Pro Material - Polka Dots
    const proTexture = this.createProTexture();
    this.proMaterial = new THREE.MeshBasicMaterial({
      map: proTexture,
    });

    // Noob Material - Same as normal green
    this.noobMaterial = new THREE.MeshBasicMaterial({
      color: 0x2ecc71, // Green (Noob)
    });

    this.superMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd93d, // Golden yellow (stars)
    });

    // Striped Material for Moving Platforms - Flat
    const stripedTexture = this.createStripedTexture();
    this.stripedMaterial = new THREE.MeshBasicMaterial({
      map: stripedTexture,
    });

    // Dots Material for Blinking Platforms - Flat with transparency
    const dotsTexture = this.createDotsTexture();
    this.blinkingMaterial = new THREE.MeshBasicMaterial({
      map: dotsTexture,
      transparent: true,
      opacity: 1.0,
    });

    // Create Platforms
    this.createPlatforms();

    // Create Ball - Reduced segments for mobile
    const ballGeo = new THREE.SphereGeometry(0.4, 16, 16);
    this.ball = new THREE.Mesh(ballGeo, this.remixerMaterial); // Use Remixer material by default for testing
    this.ball.position.set(0, 20, 2.5); // Start high up
    this.ball.scale.set(0.1, 0.1, 0.1); // Start tiny

    // Add black outline to ball
    const ballOutlineGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const ballOutlineMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
    });
    const ballOutline = new THREE.Mesh(ballOutlineGeo, ballOutlineMat);
    ballOutline.scale.set(1.15, 1.15, 1.15);
    this.ball.add(ballOutline);

    // Add Aura (Glow)
    const auraTexture = this.createGlowTexture();
    const auraMaterial = new THREE.SpriteMaterial({
      map: auraTexture,
      color: 0xb7ff00, // Remixer neon green
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ballAura = new THREE.Sprite(auraMaterial);
    this.ballAura.scale.set(2.5, 2.5, 1);
    this.ball.add(this.ballAura);
    this.ballAura.visible = true; // Enable Aura for Remixer testing

    this.threeScene.add(this.ball);

    // Apply ball style based on test rank
    this.applyBallStyle(this.testRank);

    // No point light on ball - flat shading

    // Camera Start - Balanced angle
    this.camera.position.set(0, 5, 11);
    this.camera.lookAt(0, -1, 0);
    this.beepSound = this.sound.add("beep", { volume: 0.3 }); // Low volume for countdown beeps
    this.jumpSound = this.sound.add("jump", { volume: 0.3 }); // Low volume so music predominates

    // UI Setup
    this.createUI();

    // Input handling
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as any;

    // Touch controls: tap left half = rotate left, tap right half = rotate right
    // No drag needed - just hold to rotate continuously
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      (this as any).touchSide =
        pointer.x < this.scale.width / 2 ? "left" : "right";
    });

    this.input.on("pointerup", () => {
      (this as any).touchSide = null;
    });

    this.scale.on("resize", this.resize, this);
    this.resize(this.scale.gameSize);

    // SDK Event Listeners
    this.setupSDKListeners();

    // Start the game logic
    this.restartGame();
  }

  createStripedTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d")!;

    // White background (will be tinted by material color)
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 64, 64);

    // Dark stripes
    context.fillStyle = "rgba(0, 0, 0, 0.3)";
    context.beginPath();
    for (let i = -64; i < 64; i += 16) {
      context.moveTo(i, 0);
      context.lineTo(i + 5, 0);
      context.lineTo(i + 69, 64);
      context.lineTo(i + 64, 64);
    }
    context.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
  }

  createDotsTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d")!;

    // White background (will be tinted by material color)
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 64, 64);

    // Dark dots pattern
    context.fillStyle = "rgba(0, 0, 0, 0.35)";
    const dotRadius = 5;
    const spacing = 14;

    for (let x = spacing / 2; x < 64; x += spacing) {
      for (let y = spacing / 2; y < 64; y += spacing) {
        context.beginPath();
        context.arc(x, y, dotRadius, 0, Math.PI * 2);
        context.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  createGridTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d")!;

    // Background (Black)
    context.fillStyle = "#000000";
    context.fillRect(0, 0, 64, 64);

    // Grid lines (Bright Green)
    context.strokeStyle = "#00FF41";
    context.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < 64; x += 8) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, 64);
      context.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < 64; y += 8) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(64, y);
      context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  createBarberPoleTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d")!;

    // Dark 2-color scheme - dark grays
    const colors = ["#2a2a2a", "#1a1a1a"];
    const stripeWidth = 64;

    // Draw diagonal stripes
    for (let i = -256; i < 256; i += stripeWidth * colors.length) {
      colors.forEach((color, idx) => {
        context.fillStyle = color;
        context.beginPath();
        const offset = i + idx * stripeWidth;
        context.moveTo(offset, 0);
        context.lineTo(offset + stripeWidth, 0);
        context.lineTo(offset + stripeWidth + 128, 128);
        context.lineTo(offset + 128, 128);
        context.closePath();
        context.fill();
      });
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 40); // Repeat along the height of the tower
    return texture;
  }

  createUI() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.scoreContainer = this.add.container(width / 2, 80);

    this.scoreText = this.add
      .text(0, 0, "0", {
        fontSize: "100px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 12,
      })
      .setOrigin(0.5);

    this.scoreContainer.add(this.scoreText);

    this.scoreContainer.add(this.scoreText);
    this.scoreContainer.setVisible(false); // Hide initially

    // Start Overlay
    this.startOverlay = this.add.graphics();
    this.startOverlay.fillStyle(0x000000, 0.8);
    this.startOverlay.fillRect(0, 0, width, height);
    this.startOverlay.setDepth(199);

    this.startText = this.add
      .text(width / 2, height / 2 - 180, "READY", {
        fontSize: "120px",
        color: "#FFFFFF",
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 12,
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.gameOverContainer = this.add.container(width / 2, height / 2);
    this.gameOverContainer.setVisible(false);
    this.gameOverContainer.setDepth(100);

    // Game over container is now empty - SDK handles the game over UI
  }

  resize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width;
    const height = gameSize.height;

    this.threeRenderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const threeCanvas = this.threeRenderer.domElement;
    const phaserCanvas = this.game.canvas;

    const rect = phaserCanvas.getBoundingClientRect();

    threeCanvas.style.position = "absolute";
    threeCanvas.style.left = rect.left + "px";
    threeCanvas.style.top = rect.top + "px";
    threeCanvas.style.width = rect.width + "px";
    threeCanvas.style.height = rect.height + "px";
    threeCanvas.style.zIndex = "0";
  }

  createPlatforms() {
    const platformCount = 80; // Reduced for mobile performance

    // Lucha Libre vibrant palette
    const colors = [0x2ecc71, 0xe91e8c, 0xffd93d, 0x1abc9c];

    this.platforms = [];
    this.powerUps = [];
    this.lowestPlatformY = 0; // Reset lowest platform tracker
    this.platformIdCounter = 0; // Reset ID counter
    this.tower.clear();

    // Barber pole style tower (10000 units tall = ~2500 platforms worth)
    const barberTexture = this.createBarberPoleTexture();
    const towerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 10000, 16),
      new THREE.MeshBasicMaterial({ map: barberTexture })
    );
    towerMesh.position.y = -4500; // Offset down so most is below Y=0
    this.tower.add(towerMesh);

    for (let i = 0; i < platformCount; i++) {
      const yPos = -2 - i * 4;

      // 1. Generate Gaps
      const numGaps = i > 10 && Math.random() > 0.7 ? 2 : 1;
      const gaps: {
        start: number;
        end: number;
        size: number;
        center: number;
      }[] = [];
      const solidSegments: { start: number; end: number }[] = [];

      const isOverlapping = (start: number, size: number) => {
        for (const g of gaps) {
          const center = start + size / 2;
          const dist = Math.abs(g.center - center);
          const minDist = (g.size + size) / 2 + 0.5;
          if (dist < minDist) return true;
          if (Math.abs(dist - Math.PI * 2) < minDist) return true;
        }
        return false;
      };

      for (let g = 0; g < numGaps; g++) {
        let valid = false;
        let attempts = 0;
        while (!valid && attempts < 20) {
          const size = Math.PI / 4 + Math.random() * (Math.PI / 2.5);
          const start = Math.random() * Math.PI * 2;
          if (!isOverlapping(start, size)) {
            gaps.push({
              start,
              end: start + size,
              size,
              center: start + size / 2,
            });
            valid = true;
          }
          attempts++;
        }
      }
      if (gaps.length === 0) {
        const size = Math.PI / 4;
        const start = 0;
        gaps.push({ start, end: start + size, size, center: start + size / 2 });
      }
      gaps.sort((a, b) => a.start - b.start);

      if (gaps.length === 1) {
        const g = gaps[0];
        solidSegments.push({ start: g.end, end: g.start + Math.PI * 2 });
      } else {
        for (let j = 0; j < gaps.length; j++) {
          const currentGap = gaps[j];
          const nextGap = gaps[(j + 1) % gaps.length];
          let start = currentGap.end;
          let end = nextGap.start;
          if (end < start) end += Math.PI * 2;
          solidSegments.push({ start, end });
        }
      }

      // Construct Shape
      const innerRadius = 2;
      const outerRadius = 4;
      const shape = new THREE.Shape();
      for (const seg of solidSegments) {
        shape.moveTo(
          innerRadius * Math.cos(seg.start),
          innerRadius * Math.sin(seg.start)
        );
        shape.lineTo(
          outerRadius * Math.cos(seg.start),
          outerRadius * Math.sin(seg.start)
        );
        shape.absarc(0, 0, outerRadius, seg.start, seg.end, false);
        shape.lineTo(
          innerRadius * Math.cos(seg.end),
          innerRadius * Math.sin(seg.end)
        );
        shape.absarc(0, 0, innerRadius, seg.end, seg.start, true);
      }

      const extrudeSettings = {
        depth: this.platformThickness,
        bevelEnabled: false,
      };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      // Determine Platform Type (mutually exclusive)
      let isMoving = false;
      let isBlinking = false;
      let moveSpeed = 0;

      if (i > 20 && Math.random() < 0.2) {
        // Blinking platforms (20% chance after level 20)
        isBlinking = true;
      } else if (i > 10 && Math.random() < 0.3) {
        // Rotating platforms (30% chance after level 10)
        isMoving = true;
        moveSpeed =
          (Math.random() > 0.5 ? 1 : -1) * (0.005 + Math.random() * 0.01);
      }

      // Select Material - All platforms use same color palette
      const platformColors = [0x48dbfb, 0x1dd1a1, 0x5f27cd, 0xff9ff3];
      const baseColor = platformColors[i % platformColors.length];

      let material;
      if (isBlinking) {
        // Blinking: base color + dots overlay texture
        material = new THREE.MeshBasicMaterial({
          color: baseColor,
          map: this.blinkingMaterial.map,
          transparent: true,
          opacity: 1.0,
        });
      } else if (isMoving) {
        // Moving: base color + stripes overlay texture
        material = new THREE.MeshBasicMaterial({
          color: baseColor,
          map: this.stripedMaterial.map,
        });
      } else {
        // Normal: just base color
        material = new THREE.MeshBasicMaterial({ color: baseColor });
      }

      const platform = new THREE.Mesh(geometry, material);
      platform.rotation.x = -Math.PI / 2;
      platform.position.y = yPos;
      const rotationZ = Math.random() * Math.PI * 2;
      platform.rotation.z = rotationZ;

      // Add black outline using a slightly larger mesh behind
      const outlineGeo = geometry.clone();
      const outlineMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.BackSide,
      });
      const outline = new THREE.Mesh(outlineGeo, outlineMat);
      outline.scale.set(1.03, 1.03, 1.15);
      platform.add(outline);

      // Danger Zones
      const dangerZones: { start: number; size: number }[] = [];
      if (i > 0) {
        let minZones = 0;
        let maxZones = 1;
        if (i > 10) {
          minZones = 0;
          maxZones = 2;
        }
        if (i > 25) {
          minZones = 1;
          maxZones = 2;
        }
        if (i > 50) {
          minZones = 1;
          maxZones = 3;
        }
        if (i > 75) {
          minZones = 2;
          maxZones = 3;
        }
        const numZones =
          minZones + Math.floor(Math.random() * (maxZones - minZones + 1));
        const zoneSize = Math.PI / 5;

        for (let z = 0; z < numZones; z++) {
          if (solidSegments.length === 0) continue;
          const segIndex = Math.floor(Math.random() * solidSegments.length);
          const seg = solidSegments[segIndex];
          const segLength = seg.end - seg.start;
          if (segLength > zoneSize + 0.2) {
            const offset = Math.random() * (segLength - zoneSize);
            const zoneStart = seg.start + offset;
            let overlap = false;
            for (const dz of dangerZones) {
              if (Math.abs(dz.start - zoneStart) < zoneSize + 0.1)
                overlap = true;
            }

            if (!overlap) {
              dangerZones.push({ start: zoneStart, size: zoneSize });
              const dangerShape = new THREE.Shape();
              const dEnd = zoneStart + zoneSize;
              dangerShape.moveTo(
                innerRadius * Math.cos(zoneStart),
                innerRadius * Math.sin(zoneStart)
              );
              dangerShape.lineTo(
                outerRadius * Math.cos(zoneStart),
                outerRadius * Math.sin(zoneStart)
              );
              dangerShape.absarc(0, 0, outerRadius, zoneStart, dEnd, false);
              dangerShape.absarc(0, 0, innerRadius, dEnd, zoneStart, true);
              const dangerGeo = new THREE.ExtrudeGeometry(dangerShape, {
                depth: this.platformThickness + 0.05,
                bevelEnabled: false,
              });
              // Flat red
              const dangerMat = new THREE.MeshBasicMaterial({
                color: 0xe74c3c,
              });
              const dangerMesh = new THREE.Mesh(dangerGeo, dangerMat);
              platform.add(dangerMesh);
            }
          }
        }
      }

      // Power Ups
      if (i > 5 && i < platformCount - 1 && Math.random() < 0.05) {
        if (solidSegments.length > 0) {
          const seg =
            solidSegments[Math.floor(Math.random() * solidSegments.length)];
          const angle = seg.start + Math.random() * (seg.end - seg.start);
          const radius = 3;

          const worldAngle = angle + rotationZ;
          const betweenY = yPos - 2;

          const group = new THREE.Group();
          const coneGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
          // Flat gold/yellow for power-ups
          const mat = new THREE.MeshBasicMaterial({
            color: 0xffd93d, // Yellow gold
          });
          const cone = new THREE.Mesh(coneGeo, mat);
          cone.rotation.x = Math.PI;
          cone.position.y = -0.4;

          // Add black outline to cone
          const coneOutlineGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
          const outlineMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.BackSide,
          });
          const coneOutline = new THREE.Mesh(coneOutlineGeo, outlineMat);
          coneOutline.scale.set(1.15, 1.1, 1.15);
          cone.add(coneOutline);

          group.add(cone);

          const cylGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
          const cyl = new THREE.Mesh(cylGeo, mat);
          cyl.position.y = 0.4;

          // Add black outline to cylinder
          const cylOutlineGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
          const cylOutline = new THREE.Mesh(cylOutlineGeo, outlineMat);
          cylOutline.scale.set(1.2, 1.1, 1.2);
          cyl.add(cylOutline);

          group.add(cyl);

          group.position.set(
            Math.cos(worldAngle) * radius,
            betweenY,
            Math.sin(worldAngle) * radius
          );

          group.scale.set(1.2, 1.2, 1.2); // Smaller power-up

          group.userData = {
            isPowerUp: true,
            rotationSpeed: 0.05,
            bobSpeed: 0.05,
            time: Math.random() * 100,
            baseY: betweenY,
          };

          this.tower.add(group);
          this.powerUps.push(group);
        }
      }

      platform.userData = {
        isBase: false,
        gaps: gaps,
        rotationOffset: rotationZ,
        id: i,
        dangerZones: dangerZones,
        isMoving: isMoving,
        moveSpeed: moveSpeed,
        isBlinking: isBlinking,
        blinkTime: Math.random() * 100, // Random start offset for blink cycle
      };

      this.tower.add(platform);
      this.platforms.push(platform);

      // Track lowest platform position
      if (yPos < this.lowestPlatformY) {
        this.lowestPlatformY = yPos;
      }
    }

    this.platformIdCounter = platformCount;
  }

  // Generate a single new platform at a specific Y position
  spawnNewPlatform(yPos: number) {
    // Platform colors - same as createPlatforms
    const platformColors = [0x48dbfb, 0x1dd1a1, 0x5f27cd, 0xff9ff3];
    const innerRadius = 2;
    const outerRadius = 4;

    // Use a virtual "level" based on platformIdCounter to maintain consistent difficulty
    // This simulates the same i-based difficulty as createPlatforms
    // Cap at level 80 (same as initial platformCount) for consistent max difficulty
    const level = Math.min(this.platformIdCounter, 80);

    // 1. Generate Gaps - same logic as createPlatforms
    const numGaps = level > 10 && Math.random() > 0.7 ? 2 : 1;
    const gaps: { start: number; end: number; size: number; center: number }[] =
      [];

    const isOverlapping = (start: number, size: number) => {
      for (const g of gaps) {
        const center = start + size / 2;
        const dist = Math.abs(g.center - center);
        const minDist = (g.size + size) / 2 + 0.5;
        if (dist < minDist) return true;
        if (Math.abs(dist - Math.PI * 2) < minDist) return true;
      }
      return false;
    };

    for (let g = 0; g < numGaps; g++) {
      let valid = false;
      let attempts = 0;
      while (!valid && attempts < 20) {
        const size = Math.PI / 4 + Math.random() * (Math.PI / 2.5);
        const start = Math.random() * Math.PI * 2;
        if (!isOverlapping(start, size)) {
          gaps.push({
            start,
            end: start + size,
            size,
            center: start + size / 2,
          });
          valid = true;
        }
        attempts++;
      }
    }
    if (gaps.length === 0) {
      const size = Math.PI / 4;
      const start = 0;
      gaps.push({ start, end: start + size, size, center: start + size / 2 });
    }
    gaps.sort((a, b) => a.start - b.start);

    // Build solid segments
    const solidSegments: { start: number; end: number }[] = [];
    if (gaps.length === 1) {
      const g = gaps[0];
      solidSegments.push({ start: g.end, end: g.start + Math.PI * 2 });
    } else {
      for (let j = 0; j < gaps.length; j++) {
        const currentGap = gaps[j];
        const nextGap = gaps[(j + 1) % gaps.length];
        let start = currentGap.end;
        let end = nextGap.start;
        if (end < start) end += Math.PI * 2;
        solidSegments.push({ start, end });
      }
    }

    // Construct Shape
    const shape = new THREE.Shape();
    for (const seg of solidSegments) {
      shape.moveTo(
        innerRadius * Math.cos(seg.start),
        innerRadius * Math.sin(seg.start)
      );
      shape.lineTo(
        outerRadius * Math.cos(seg.start),
        outerRadius * Math.sin(seg.start)
      );
      shape.absarc(0, 0, outerRadius, seg.start, seg.end, false);
      shape.lineTo(
        innerRadius * Math.cos(seg.end),
        innerRadius * Math.sin(seg.end)
      );
      shape.absarc(0, 0, innerRadius, seg.end, seg.start, true);
    }

    const extrudeSettings = {
      depth: this.platformThickness,
      bevelEnabled: false,
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Determine Platform Type (mutually exclusive) - SAME logic as createPlatforms
    let isMoving = false;
    let isBlinking = false;
    let moveSpeed = 0;

    if (level > 20 && Math.random() < 0.2) {
      // Blinking platforms (20% chance after level 20)
      isBlinking = true;
    } else if (level > 10 && Math.random() < 0.3) {
      // Rotating platforms (30% chance after level 10)
      isMoving = true;
      moveSpeed =
        (Math.random() > 0.5 ? 1 : -1) * (0.005 + Math.random() * 0.01);
    }

    // Select Material - All platforms use same color palette
    const baseColor =
      platformColors[this.platformIdCounter % platformColors.length];

    let material;
    if (isBlinking) {
      material = new THREE.MeshBasicMaterial({
        color: baseColor,
        map: this.blinkingMaterial.map,
        transparent: true,
        opacity: 1.0,
      });
    } else if (isMoving) {
      material = new THREE.MeshBasicMaterial({
        color: baseColor,
        map: this.stripedMaterial.map,
      });
    } else {
      material = new THREE.MeshBasicMaterial({ color: baseColor });
    }

    const platform = new THREE.Mesh(geometry, material);
    // Use same rotation system as createPlatforms: rotation.x for laying flat, rotation.z for orientation
    platform.rotation.x = -Math.PI / 2;
    const rotationZ = Math.random() * Math.PI * 2;
    platform.rotation.z = rotationZ;
    platform.position.y = yPos;

    // Add black outline using a slightly larger mesh behind
    const outlineGeo = geometry.clone();
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
    });
    const outline = new THREE.Mesh(outlineGeo, outlineMat);
    outline.scale.set(1.03, 1.03, 1.15);
    platform.add(outline);

    // Danger Zones - SAME logic as createPlatforms
    const dangerZones: { start: number; size: number }[] = [];
    if (level > 0) {
      let minZones = 0;
      let maxZones = 1;
      if (level > 10) {
        minZones = 0;
        maxZones = 2;
      }
      if (level > 25) {
        minZones = 1;
        maxZones = 2;
      }
      if (level > 50) {
        minZones = 1;
        maxZones = 3;
      }
      if (level > 75) {
        minZones = 2;
        maxZones = 3;
      }
      const numZones =
        minZones + Math.floor(Math.random() * (maxZones - minZones + 1));
      const zoneSize = Math.PI / 5;

      for (let z = 0; z < numZones; z++) {
        if (solidSegments.length === 0) continue;
        const segIndex = Math.floor(Math.random() * solidSegments.length);
        const seg = solidSegments[segIndex];
        const segLength = seg.end - seg.start;
        if (segLength > zoneSize + 0.2) {
          const offset = Math.random() * (segLength - zoneSize);
          const zoneStart = seg.start + offset;
          let overlap = false;
          for (const dz of dangerZones) {
            if (Math.abs(dz.start - zoneStart) < zoneSize + 0.1) overlap = true;
          }

          if (!overlap) {
            dangerZones.push({ start: zoneStart, size: zoneSize });
            const dangerShape = new THREE.Shape();
            const dEnd = zoneStart + zoneSize;
            dangerShape.moveTo(
              innerRadius * Math.cos(zoneStart),
              innerRadius * Math.sin(zoneStart)
            );
            dangerShape.lineTo(
              outerRadius * Math.cos(zoneStart),
              outerRadius * Math.sin(zoneStart)
            );
            dangerShape.absarc(0, 0, outerRadius, zoneStart, dEnd, false);
            dangerShape.absarc(0, 0, innerRadius, dEnd, zoneStart, true);
            const dangerGeo = new THREE.ExtrudeGeometry(dangerShape, {
              depth: this.platformThickness + 0.05,
              bevelEnabled: false,
            });
            const dangerMat = new THREE.MeshBasicMaterial({
              color: 0xe74c3c,
            });
            const dangerMesh = new THREE.Mesh(dangerGeo, dangerMat);
            platform.add(dangerMesh);
          }
        }
      }
    }

    // Power Ups - SAME logic as createPlatforms
    if (level > 5 && Math.random() < 0.05) {
      if (solidSegments.length > 0) {
        const seg =
          solidSegments[Math.floor(Math.random() * solidSegments.length)];
        const angle = seg.start + Math.random() * (seg.end - seg.start);
        const radius = 3;

        const worldAngle = angle + rotationZ;
        const betweenY = yPos - 2;

        const group = new THREE.Group();
        const coneGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xffd93d, // Yellow gold
        });
        const cone = new THREE.Mesh(coneGeo, mat);
        cone.rotation.x = Math.PI;
        cone.position.y = -0.4;

        // Add black outline to cone
        const coneOutlineGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
        const outlineMat = new THREE.MeshBasicMaterial({
          color: 0x000000,
          side: THREE.BackSide,
        });
        const coneOutline = new THREE.Mesh(coneOutlineGeo, outlineMat);
        coneOutline.scale.set(1.15, 1.1, 1.15);
        cone.add(coneOutline);

        group.add(cone);

        const cylGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
        const cyl = new THREE.Mesh(cylGeo, mat);
        cyl.position.y = 0.4;

        // Add black outline to cylinder
        const cylOutlineGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
        const cylOutline = new THREE.Mesh(cylOutlineGeo, outlineMat);
        cylOutline.scale.set(1.2, 1.1, 1.2);
        cyl.add(cylOutline);

        group.add(cyl);

        group.position.set(
          Math.cos(worldAngle) * radius,
          betweenY,
          Math.sin(worldAngle) * radius
        );

        group.scale.set(1.2, 1.2, 1.2);

        group.userData = {
          isPowerUp: true,
          rotationSpeed: 0.05,
          bobSpeed: 0.05,
          time: Math.random() * 100,
          baseY: betweenY,
        };

        this.tower.add(group);
        this.powerUps.push(group);
      }
    }

    platform.userData = {
      isBase: false,
      gaps: gaps,
      rotationOffset: rotationZ,
      id: this.platformIdCounter,
      dangerZones: dangerZones,
      isMoving: isMoving,
      moveSpeed: moveSpeed,
      isBlinking: isBlinking,
      blinkTime: Math.random() * 100,
    };

    this.tower.add(platform);
    this.platforms.push(platform);
    this.platformIdCounter++;
    this.lowestPlatformY = yPos;
  }

  restartGame() {
    // Audio Reset
    if (this.currentMusic) {
      this.currentMusic.stop();
    }
    const randomTrack =
      this.musicTracks[Math.floor(Math.random() * this.musicTracks.length)];
    this.currentMusic = this.sound.add(randomTrack, { volume: 0, loop: true });
    this.currentMusic.play();
    // Beep will be played in update loop

    this.isGameActive = true;
    this.isGameStarting = true;
    this.startTimer = 0;
    this.startText.setVisible(true);
    this.startText.setText(""); // Start empty
    this.startOverlay.setVisible(true);
    this.startOverlay.setAlpha(1);

    this.score = 0;
    this.comboCount = 0;
    this.scoreText.setText("0");
    this.scoreContainer.setVisible(false); // Hide during start
    this.gameOverContainer.setVisible(false);
    this.isSuperSmash = false;
    this.platformsToSmash = 0;
    
    // Apply ball style based on test rank
    this.applyBallStyle(this.testRank);

    this.ballVelocity = 0;
    this.ball.position.set(0, 20, 2.5);
    this.ball.scale.set(0.1, 0.1, 0.1);
    this.camera.position.set(0, 5, 11);
    this.camera.lookAt(0, -1, 0);

    for (const p of this.particles) {
      this.threeScene.remove(p.mesh);
    }
    this.particles = [];

    this.createPlatforms();
  }

  update(time: number, delta: number) {
    if (!this.isGameActive) return;

    // Frame-independent delta multiplier (normalized to 60 FPS)
    // At 60 FPS: delta ≈ 16.67ms, so deltaMultiplier ≈ 1.0
    // At 30 FPS: delta ≈ 33.33ms, so deltaMultiplier ≈ 2.0
    const targetDelta = 1000 / 60; // 16.67ms for 60 FPS
    const deltaMultiplier = Math.min(delta / targetDelta, 3); // Cap at 3x to prevent huge jumps

    if (this.isGameStarting) {
      this.startTimer += delta / 1000;

      const initialDelay = 1.0;
      const stepTime = 1.0; // Adjusted time between texts
      const totalTime = initialDelay + stepTime * 3;

      if (this.startTimer < totalTime) {
        const progress = this.startTimer / totalTime;

        // Fade in music volume (0 to 1)
        if (this.currentMusic) {
          (this.currentMusic as any).setVolume(progress);
        }

        // Animate Ball
        this.ball.position.y = 20 - 18 * progress;
        const scale = 0.1 + 0.9 * progress;
        this.ball.scale.set(scale, scale, scale);

        // Update Text & Play Beep
        if (this.startTimer < initialDelay) {
          if (this.startText.text !== "") {
            this.startText.setText("");
          }
        } else if (this.startTimer < initialDelay + stepTime) {
          if (this.startText.text !== "READY") {
            this.startText.setText("READY");
            this.beepSound.play();
          }
        } else if (this.startTimer < initialDelay + stepTime * 2) {
          if (this.startText.text !== "STEADY") {
            this.startText.setText("STEADY");
            this.beepSound.play();
          }
        } else {
          if (this.startText.text !== "GO!") {
            this.startText.setText("GO!");
            this.beepSound.play();
          }
          // Fade out overlay in the last step
          const timeInGo = this.startTimer - (initialDelay + stepTime * 2);
          this.startOverlay.setAlpha(1 - timeInGo / stepTime);
        }

        // Camera Follow - Balanced view
        const targetY = this.ball.position.y + 4;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
        this.camera.lookAt(0, this.camera.position.y - 6, 0);

        this.threeRenderer.render(this.threeScene, this.camera);
        return;
      } else {
        // End Start Sequence
        this.isGameStarting = false;
        this.startText.setVisible(false);
        this.startOverlay.setVisible(false);
        this.scoreContainer.setVisible(true); // Show score
        this.ball.position.y = 2;
        this.ball.scale.set(1, 1, 1);
        this.ballVelocity = 0; // Reset velocity
      }
    }

    // Keyboard Rotation (frame-independent)
    const rotationSpeed = 0.05 * deltaMultiplier;
    if (this.cursors.left.isDown || this.keys.a.isDown) {
      this.tower.rotation.y -= rotationSpeed;
    } else if (this.cursors.right.isDown || this.keys.d.isDown) {
      this.tower.rotation.y += rotationSpeed;
    }

    // Touch Rotation - tap and hold left/right side of screen (frame-independent)
    const touchSide = (this as any).touchSide;
    if (touchSide === "left") {
      this.tower.rotation.y -= rotationSpeed;
    } else if (touchSide === "right") {
      this.tower.rotation.y += rotationSpeed;
    }

    // Update Platforms (Movement & Blinking) - frame-independent
    for (const platform of this.platforms) {
      if (platform.userData.isMoving) {
        platform.rotation.z += platform.userData.moveSpeed * deltaMultiplier;
        // Keep rotationOffset in sync [0, 2PI]
        let rot = platform.rotation.z % (Math.PI * 2);
        if (rot < 0) rot += Math.PI * 2;
        platform.userData.rotationOffset = rot;
      }

      if (platform.userData.isBlinking) {
        // Update blink time (frame-independent)
        platform.userData.blinkTime += 0.03 * deltaMultiplier;

        // Smooth fade in/out using sine wave
        const opacity = (Math.sin(platform.userData.blinkTime * 0.5) + 1) / 2;
        const finalOpacity = 0.1 + opacity * 0.9;

        // Set material opacity for platform and ALL children (danger zones, outlines)
        const material = platform.material as THREE.MeshBasicMaterial;
        material.opacity = finalOpacity;
        material.transparent = true;

        // Apply opacity to all children (danger zones, outline)
        platform.traverse((child) => {
          if (child !== platform && (child as THREE.Mesh).material) {
            const childMat = (child as THREE.Mesh)
              .material as THREE.MeshBasicMaterial;
            if (childMat.opacity !== undefined) {
              childMat.transparent = true;
              childMat.opacity = finalOpacity;
            }
          }
        });

        // Track visibility state for collision
        platform.userData.isCurrentlyVisible = opacity > 0.4;
      }
    }

    // Update Power Ups (frame-independent)
    for (const pu of this.powerUps) {
      pu.rotation.y += 0.05 * deltaMultiplier; // Rotate around Y
      pu.userData.time += 0.1 * deltaMultiplier;
      pu.position.y = pu.userData.baseY + Math.sin(pu.userData.time) * 0.2;
    }

    // Update Particles (frame-independent)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i] as any;
      p.life -= 0.02 * deltaMultiplier;

      if (p.isShockwave) {
        // Expand ring (frame-independent)
        const expandFactor = 1 + 0.05 * deltaMultiplier;
        p.mesh.scale.multiplyScalar(expandFactor);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
      } else {
        // Normal particle (frame-independent)
        const scaledVelocity = p.velocity
          .clone()
          .multiplyScalar(deltaMultiplier);
        p.mesh.position.add(scaledVelocity);
        // Fade out
        if (p.mesh.material.opacity !== undefined) {
          p.mesh.material.opacity = p.life;
        }
        // Shrink slightly (frame-independent)
        const shrinkFactor = Math.pow(0.98, deltaMultiplier);
        p.mesh.scale.multiplyScalar(shrinkFactor);
      }

      if (p.life <= 0) {
        this.threeScene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // Physics (frame-independent)
    if (this.isSuperSmash) {
      this.ballVelocity = -0.8; // Fixed velocity for super smash (not affected by delta)

      // Trail Effect - Reduced frequency for mobile (adjusted for frame rate)
      if (Math.random() > 0.7 / deltaMultiplier) {
        const trailGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        
        // Get color based on original ball material (not super material during power-up)
        const materialToCheck = this.isSuperSmash ? this.originalMaterial : this.ball.material;
        let trailColor = 0x2ecc71; // Default green
        
        if (materialToCheck === this.remixerMaterial) {
          trailColor = 0xb7ff00; // Remixer neon green
        } else if (materialToCheck === this.masterMaterial) {
          // Random color from Gravity Master palette (two-tone)
          const masterColors = [0xff6b35, 0xffd93d]; // Red-Orange, Yellow
          trailColor = masterColors[Math.floor(Math.random() * masterColors.length)];
        } else if (materialToCheck === this.legendMaterial) {
          // Random color from Legend palette
          const legendColors = [0xff9f43, 0xe91e8c, 0x00d2d3, 0xfeca57];
          trailColor = legendColors[Math.floor(Math.random() * legendColors.length)];
        } else if (materialToCheck === this.proMaterial) {
          // Random color from Pro palette
          const proColors = [0xe91e8c, 0xffd93d, 0x00d2d3, 0xff9f43];
          trailColor = proColors[Math.floor(Math.random() * proColors.length)];
        } else if (materialToCheck === this.noobMaterial) {
          trailColor = 0x2ecc71; // Noob green
        }
        
        const trailMat = new THREE.MeshBasicMaterial({ color: trailColor });
        const trail = new THREE.Mesh(trailGeo, trailMat);
        trail.position.copy(this.ball.position);
        trail.position.y += 0.5;
        this.threeScene.add(trail);
        this.particles.push({
          mesh: trail,
          velocity: new THREE.Vector3(0, 0.1, 0),
          life: 0.5,
        });
      }
    } else {
      this.ballVelocity += this.gravity * deltaMultiplier;
    }

    const nextY = this.ball.position.y + this.ballVelocity * deltaMultiplier;

    // Collision Detection
    let collided = false;

    // Check Power Up Collection
    let ballAngleInTower =
      (Math.PI / 2 - this.tower.rotation.y + Math.PI) % (Math.PI * 2);
    if (ballAngleInTower < 0) ballAngleInTower += Math.PI * 2;

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      const puWorldPos = new THREE.Vector3();
      pu.getWorldPosition(puWorldPos);

      const dx = this.ball.position.x - puWorldPos.x;
      const dy = this.ball.position.y - puWorldPos.y;
      const dz = this.ball.position.z - puWorldPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < 1.2) {
        this.activateSuperSmash();
        this.tower.remove(pu);
        this.powerUps.splice(i, 1);
        
        // Add explosion with shockwave for power-up - match ball color
        let explosionColor = 0x2ecc71; // Default green
        
        if (this.ball.material === this.remixerMaterial) {
          explosionColor = 0xb7ff00; // Remixer neon green
        } else if (this.ball.material === this.masterMaterial) {
          // Random color from Gravity Master palette (two-tone)
          const masterColors = [0xff6b35, 0xffd93d]; // Red-Orange, Yellow
          explosionColor = masterColors[Math.floor(Math.random() * masterColors.length)];
        } else if (this.ball.material === this.legendMaterial) {
          // Random color from Legend palette
          const legendColors = [0xff9f43, 0xe91e8c, 0x00d2d3, 0xfeca57];
          explosionColor = legendColors[Math.floor(Math.random() * legendColors.length)];
        } else if (this.ball.material === this.proMaterial) {
          // Random color from Pro palette
          const proColors = [0xe91e8c, 0xffd93d, 0x00d2d3, 0xff9f43];
          explosionColor = proColors[Math.floor(Math.random() * proColors.length)];
        } else if (this.ball.material === this.noobMaterial) {
          explosionColor = 0x2ecc71; // Noob green
        }
        
        this.createExplosion(puWorldPos.y, explosionColor, 15, true);
      }
    }

    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const platform = this.platforms[i];

      if (Math.abs(platform.position.y - this.ball.position.y) > 5) continue;

      // Check blinking platforms - pass through when invisible
      if (platform.userData.isBlinking) {
        if (!platform.userData.isCurrentlyVisible) {
          // Platform is invisible - ball passes through
          const platformY = platform.position.y;
          const topSurfaceY = platformY + this.platformThickness;

          if (
            this.ballVelocity < 0 &&
            this.ball.position.y >= topSurfaceY &&
            nextY <= topSurfaceY
          ) {
            // Ball passed through invisible platform - destroy it
            this.destroyPlatform(platform, i);
            this.score++;
            this.scoreText.setText(this.score.toString());
          }
          continue; // Skip normal collision check
        }
      }

      const platformY = platform.position.y;
      const topSurfaceY = platformY + this.platformThickness;

      if (this.ballVelocity < 0) {
        if (this.ball.position.y >= topSurfaceY && nextY <= topSurfaceY) {
          if (this.isSuperSmash) {
            this.destroyPlatform(platform, i);
            this.score++;
            this.comboCount++;
            this.scoreText.setText(this.score.toString());
            this.createExplosion(platform.position.y, 0xffd93d, 18); // Yellow explosion for smash
            this.playSmashSound(); // Play smash sound

            this.platformsToSmash--;
            if (this.platformsToSmash <= 0) {
              this.isSuperSmash = false;
              // Restore original material instead of hardcoded one
              this.ball.material = this.originalMaterial;
              this.ballVelocity = this.jumpStrength;
              this.resolveCombo();
            }
            collided = true;
          } else {
            const collisionResult = this.checkCollision(platform);

            if (collisionResult === "hit") {
              this.ballVelocity = this.jumpStrength;
              this.ball.position.y = topSurfaceY;
              this.jumpSound.play();
              this.resolveCombo();
              collided = true;
            } else if (collisionResult === "danger") {
              this.gameOverSplatter(topSurfaceY);
              return;
            } else {
              this.destroyPlatform(platform, i);
              this.score++;
              this.comboCount++;
              this.scoreText.setText(this.score.toString());
            }
          }
        }
      }
    }

    if (!collided) {
      this.ball.position.y += this.ballVelocity * deltaMultiplier;
    }

    // Rotate ball to show off texture
    this.ball.rotation.x -= 0.05 * deltaMultiplier;
    this.ball.rotation.y += 0.02 * deltaMultiplier;

    // Camera follow - Balanced view (frame-independent)
    const targetY = this.ball.position.y + 4;
    const cameraLerp = 1 - Math.pow(0.9, deltaMultiplier); // Smooth interpolation
    this.camera.position.y += (targetY - this.camera.position.y) * cameraLerp;
    this.camera.lookAt(0, this.camera.position.y - 6, 0);

    // Aura Pulse Animation
    if (this.ballAura) {
      const scale = 2.5 + Math.sin(time / 200) * 0.3;
      this.ballAura.scale.set(scale, scale, 1);
    }

    // Electric Sparks for Remixer (only when using remixerMaterial)
    if (this.ball.material === this.remixerMaterial && Math.random() > 0.85) {
      this.createElectricSpark();
    }

    // Fire Trail for Gravity Master (only when using masterMaterial)
    if (this.ball.material === this.masterMaterial && Math.random() > 0.7) {
      this.createFireTrail();
    }

    // Update and remove old sparks
    for (let i = this.electricSparks.length - 1; i >= 0; i--) {
      const spark = this.electricSparks[i];
      const material = spark.material as THREE.LineBasicMaterial;
      material.opacity -= 0.05 * deltaMultiplier;
      
      if (material.opacity <= 0) {
        this.threeScene.remove(spark);
        this.electricSparks.splice(i, 1);
      }
    }

    this.threeRenderer.render(this.threeScene, this.camera);
  }

  applyBallStyle(rank: string) {
    // Set material based on rank
    switch (rank) {
      case "Remixer":
        this.ball.material = this.remixerMaterial;
        this.ballAura.visible = true;
        (this.ballAura.material as THREE.SpriteMaterial).color.setHex(0xb7ff00);
        break;
      case "Legend":
        this.ball.material = this.legendMaterial;
        this.ballAura.visible = false;
        break;
      case "Gravity Master":
        this.ball.material = this.masterMaterial;
        this.ballAura.visible = true;
        // Fire-like aura - red-orange
        (this.ballAura.material as THREE.SpriteMaterial).color.setHex(0xff6b35);
        break;
      case "Pro":
        this.ball.material = this.proMaterial;
        this.ballAura.visible = false;
        break;
      case "Noob":
        this.ball.material = this.noobMaterial;
        this.ballAura.visible = true;
        (this.ballAura.material as THREE.SpriteMaterial).color.setHex(0x2ecc71);
        break;
      case "Unranked":
      default:
        this.ball.material = this.normalMaterial;
        this.ballAura.visible = false;
        break;
    }
  }

  activateSuperSmash() {
    this.isSuperSmash = true;
    this.platformsToSmash = 5;
    // Store original material before changing to super
    this.originalMaterial = this.ball.material as THREE.Material;
    this.ball.material = this.superMaterial;

    // Play power-up sound
    this.playPowerUpSound();

    // Haptic feedback on power-up collection
    this.triggerHapticFeedback();
  }

  // Procedural sound for collecting power-up (cyberpunk dimensional portal)
  playPowerUpSound() {
    if (this.isMuted) return;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 1. Dimensional sweep - descending then ascending frequency
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = "sawtooth";
    sweepOsc.frequency.setValueAtTime(2000, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    sweepOsc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
    sweepGain.gain.setValueAtTime(0.12, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    sweepOsc.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweepOsc.start(now);
    sweepOsc.stop(now + 0.4);

    // 2. Sub bass thump (portal opening)
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = "sine";
    bassOsc.frequency.setValueAtTime(80, now);
    bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    bassGain.gain.setValueAtTime(0.25, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + 0.3);

    // 3. High shimmer (dimensional sparkle)
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = "sine";
    shimmerOsc.frequency.setValueAtTime(1200, now + 0.05);
    shimmerOsc.frequency.setValueAtTime(1800, now + 0.1);
    shimmerOsc.frequency.setValueAtTime(2400, now + 0.15);
    shimmerGain.gain.setValueAtTime(0, now);
    shimmerGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmerOsc.start(now);
    shimmerOsc.stop(now + 0.35);

    // 4. Noise burst (dimensional distortion)
    const bufferSize = ctx.sampleRate * 0.15;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noiseSource = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(3000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    noiseFilter.Q.value = 5;
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);
  }

  // Procedural sound for smashing platforms (impact sound)
  playSmashSound() {
    if (this.isMuted) return;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Low frequency impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);

    // Add noise burst for impact texture
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }

    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.1, now);

    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  }

  createGlowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d")!;
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createElectricSpark() {
    // Create a jagged line from ball surface to nearby point
    const points: THREE.Vector3[] = [];
    const numSegments = 3 + Math.floor(Math.random() * 3);
    
    // Random starting point on ball surface
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI;
    const startRadius = 0.5;
    
    const startX = this.ball.position.x + Math.sin(angle2) * Math.cos(angle1) * startRadius;
    const startY = this.ball.position.y + Math.cos(angle2) * startRadius;
    const startZ = this.ball.position.z + Math.sin(angle2) * Math.sin(angle1) * startRadius;
    
    points.push(new THREE.Vector3(startX, startY, startZ));
    
    // Create jagged path
    let currentX = startX;
    let currentY = startY;
    let currentZ = startZ;
    
    for (let i = 0; i < numSegments; i++) {
      currentX += (Math.random() - 0.5) * 0.3;
      currentY += (Math.random() - 0.5) * 0.3;
      currentZ += (Math.random() - 0.5) * 0.3;
      points.push(new THREE.Vector3(currentX, currentY, currentZ));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xb7ff00,
      transparent: true,
      opacity: 0.8,
      linewidth: 2,
    });
    
    const spark = new THREE.Line(geometry, material);
    this.threeScene.add(spark);
    this.electricSparks.push(spark);
  }

  createFireTrail() {
    // Create small fire particles behind the ball
    const texture = this.createGlowTexture();
    const colors = [0xff6b35, 0xffd93d, 0xff4500]; // Red-orange, Yellow, Orange-red
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: color,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.copy(this.ball.position);
    sprite.position.y += (Math.random() - 0.5) * 0.3;
    sprite.position.x += (Math.random() - 0.5) * 0.3;
    sprite.position.z += (Math.random() - 0.5) * 0.3;
    
    const scale = 0.3 + Math.random() * 0.2;
    sprite.scale.set(scale, scale, 1);

    this.threeScene.add(sprite);
    this.particles.push({
      mesh: sprite,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        0.1 + Math.random() * 0.1,
        (Math.random() - 0.5) * 0.05
      ),
      life: 0.6,
    });
  }

  createGravityMasterTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;

    // Split in half - top and bottom
    // Top half - Red-Orange
    context.fillStyle = "#ff6b35";
    context.fillRect(0, 0, 512, 256);

    // Bottom half - Yellow
    context.fillStyle = "#ffd93d";
    context.fillRect(0, 256, 512, 256);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createProTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;

    // Background - Blue
    context.fillStyle = "#3498db";
    context.fillRect(0, 0, 512, 512);

    // Polka dots - various colors
    const dotColors = ["#e91e8c", "#ffd93d", "#00d2d3", "#ff9f43"];
    const dotRadius = 25;
    const spacing = 80;

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const x = col * spacing + (row % 2) * (spacing / 2);
        const y = row * spacing;
        const colorIndex = (row + col) % dotColors.length;
        
        context.beginPath();
        context.fillStyle = dotColors[colorIndex];
        context.arc(x, y, dotRadius, 0, Math.PI * 2);
        context.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createLegendTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;

    // Create horizontal bands (like latitude lines on a globe)
    const baseColors = ["#ff9f43", "#e91e8c", "#00d2d3", "#feca57"];
    const numBands = 12; // More bands = thinner lines
    const bandHeight = 512 / numBands;

    for (let i = 0; i < numBands; i++) {
      const color = baseColors[i % baseColors.length];
      context.fillStyle = color;
      context.fillRect(0, i * bandHeight, 512, bandHeight);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createExplosion(
    yPos: number,
    color: number,
    count: number,
    hasShockwave: boolean = true
  ) {
    const texture = this.createGlowTexture();
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < count; i++) {
      const sprite = new THREE.Sprite(material);
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 2;
      const worldAngle = angle + this.tower.rotation.y;

      sprite.position.set(
        Math.cos(worldAngle) * radius,
        yPos,
        Math.sin(worldAngle) * radius
      );

      const scale = 0.5 + Math.random() * 0.5;
      sprite.scale.set(scale, scale, 1);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );

      this.threeScene.add(sprite);
      this.particles.push({ mesh: sprite, velocity, life: 1.0 });
    }

    if (hasShockwave) {
      // Doodle style ring - thick black outline
      const ringGeo = new THREE.RingGeometry(1.8, 2.2, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = yPos;
      ring.rotation.x = -Math.PI / 2;
      this.threeScene.add(ring);
      this.particles.push({
        mesh: ring,
        velocity: new THREE.Vector3(0, 0, 0),
        life: 1.0,
        isShockwave: true,
      } as any);
    }
  }

  gameOverSplatter(yPos: number) {
    this.isGameActive = false;
    this.ball.position.y = yPos + 0.1;
    this.ball.scale.set(1.5, 0.1, 1.5);

    this.scoreContainer.setVisible(false);

    // Big Explosion - match ball color
    let explosionColor = 0x2ecc71; // Default green
    
    if (this.ball.material === this.remixerMaterial) {
      explosionColor = 0xb7ff00; // Remixer neon green
    } else if (this.ball.material === this.masterMaterial) {
      // Random color from Gravity Master palette (two-tone)
      const masterColors = [0xff6b35, 0xffd93d]; // Red-Orange, Yellow
      explosionColor = masterColors[Math.floor(Math.random() * masterColors.length)];
    } else if (this.ball.material === this.legendMaterial) {
      // Random color from Legend palette
      const legendColors = [0xff9f43, 0xe91e8c, 0x00d2d3, 0xfeca57];
      explosionColor = legendColors[Math.floor(Math.random() * legendColors.length)];
    } else if (this.ball.material === this.proMaterial) {
      // Random color from Pro palette
      const proColors = [0xe91e8c, 0xffd93d, 0x00d2d3, 0xff9f43];
      explosionColor = proColors[Math.floor(Math.random() * proColors.length)];
    } else if (this.ball.material === this.noobMaterial) {
      explosionColor = 0x2ecc71; // Noob green
    }
    
    this.createExplosion(yPos, explosionColor, 12, true);

    // Haptic feedback on death
    this.triggerHapticFeedback();

    // Save high score to game state and call SDK gameOver
    this.saveHighScoreAndGameOver();
  }

  async saveHighScoreAndGameOver() {
    const sdk = window.FarcadeSDK;
    const finalScore = this.score;

    // CRITICAL: Call gameOver FIRST to ensure SDK shows play_again screen
    // This must happen before any async operations that might hang on iOS
    if ((sdk?.singlePlayer?.actions as any)?.gameOver) {
      (sdk.singlePlayer.actions as any).gameOver({ score: finalScore });
      console.log("🎮 GameOver called with score:", finalScore);
    }

    // Now try to save high score in the background (non-blocking)
    try {
      let currentHighScore = 0;
      if (sdk?.singlePlayer?.actions?.ready) {
        const gameInfo = await sdk.singlePlayer.actions.ready();
        const savedHighScore = (gameInfo?.initialGameState?.gameState as any)
          ?.highScore;
        currentHighScore =
          typeof savedHighScore === "number" ? savedHighScore : 0;
      }

      const newHighScore = Math.max(currentHighScore, finalScore);

      if (sdk?.singlePlayer?.actions?.saveGameState) {
        await sdk.singlePlayer.actions.saveGameState({
          gameState: {
            hasSeenTutorial: true,
            highScore: newHighScore,
          },
        });
        console.log("💾 High Score saved:", newHighScore);
      }
    } catch (error) {
      console.log("Could not save high score:", error);
    }
  }

  destroyPlatform(platform: THREE.Mesh, index: number) {
    const yPos = platform.position.y;

    // Doodle style ring - thick black outline
    const ringGeo = new THREE.RingGeometry(1.8, 2.2, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = yPos;
    ring.rotation.x = -Math.PI / 2;
    this.threeScene.add(ring);
    this.particles.push({
      mesh: ring,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0.5,
      isShockwave: true,
    } as any); // Shorter life

    // Remove any power-up on this platform
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      // Check if power-up is roughly at the same height as the platform
      if (Math.abs(pu.userData.baseY - yPos) < 0.5) {
        this.tower.remove(pu);
        this.powerUps.splice(i, 1);
      }
    }

    this.tower.remove(platform);
    this.platforms.splice(index, 1);

    // Spawn a new platform below the lowest one to keep infinite gameplay
    const newY = this.lowestPlatformY - 4;
    this.spawnNewPlatform(newY);
  }

  checkCollision(platform: THREE.Mesh): "hit" | "gap" | "danger" {
    if (platform.userData.isBase) return "hit";

    let ballAngleInTower =
      (Math.PI / 2 - this.tower.rotation.y + Math.PI) % (Math.PI * 2);
    if (ballAngleInTower < 0) ballAngleInTower += Math.PI * 2;

    const platformRotation = platform.userData.rotationOffset;

    // 1. Check Danger Zones
    const dangerZones = platform.userData.dangerZones;
    if (dangerZones && dangerZones.length > 0) {
      for (const zone of dangerZones) {
        let zoneCenter =
          (zone.start + zone.size / 2 + platformRotation) % (Math.PI * 2);
        if (zoneCenter < 0) zoneCenter += Math.PI * 2;

        let diff = Math.abs(ballAngleInTower - zoneCenter);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        if (diff < zone.size / 2) {
          return "danger";
        }
      }
    }

    // 2. Check Gaps (Multiple)
    const gaps = platform.userData.gaps;
    if (gaps) {
      for (const gap of gaps) {
        let gapCenter = (gap.center + platformRotation) % (Math.PI * 2);
        if (gapCenter < 0) gapCenter += Math.PI * 2;

        let diff = Math.abs(ballAngleInTower - gapCenter);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        const halfGap = gap.size / 2;
        const ballRadiusAngle = 0.4 / 2;

        if (diff < halfGap - ballRadiusAngle) {
          return "gap";
        }
      }
    }

    return "hit";
  }

  resolveCombo() {
    if (this.comboCount > 1) {
      const bonus = this.comboCount * 2;
      this.score += bonus;
      this.scoreText.setText(this.score.toString());
      this.showComboText();
    }
    this.comboCount = 0;
  }

  showComboText() {
    const words = ["AWESOME!", "WICKED!", "SAVAGE!", "INSANE!", "LEGENDARY!"];
    const colors = ["#2ecc71", "#e91e8c", "#ffd93d", "#1abc9c", "#e74c3c"];
    const wordIndex = Math.floor(Math.random() * words.length);
    const word = words[wordIndex];
    const color = colors[wordIndex];

    const text = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 100, word, {
        fontSize: "72px",
        color: color,
        fontFamily: "Fredoka",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(150);

    this.tweens.add({
      targets: text,
      y: text.y - 100,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: "Power2",
      onComplete: () => text.destroy(),
    });

    // Haptic feedback on combo
    this.triggerHapticFeedback();
  }

  setupSDKListeners() {
    const sdk = window.FarcadeSDK;
    if (!sdk) return;

    // Handle play again requests from SDK
    sdk.on("play_again", () => {
      this.restartGame();
    });

    // Handle mute/unmute from SDK
    sdk.on("toggle_mute", (data: any) => {
      this.isMuted = data.isMuted;
      this.sound.mute = this.isMuted;
    });
  }

  triggerHapticFeedback() {
    if (window.FarcadeSDK?.singlePlayer?.actions?.hapticFeedback) {
      window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
    }
  }

  createStars() {
    const starCount = 400; // Further reduced for mobile performance
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < starCount; i++) {
      let x, y, z, dist;
      do {
        x = (Math.random() - 0.5) * 400;
        y = (Math.random() - 0.5) * 1000 - 200;
        z = (Math.random() - 0.5) * 400;
        dist = Math.sqrt(x * x + z * z);
      } while (dist < 50); // Keep stars away from the immediate play area
      positions.push(x, y, z);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8, // Slightly larger to compensate for fewer stars
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(geometry, material);
    this.threeScene.add(stars);
  }
}
