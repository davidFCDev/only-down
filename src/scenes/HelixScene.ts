import * as Phaser from 'phaser';
import * as THREE from 'three';

export default class HelixScene extends Phaser.Scene {
    private threeScene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private threeRenderer!: THREE.WebGLRenderer;
    private tower!: THREE.Group;
    private ball!: THREE.Mesh;
    
    // Power Ups
    private powerUps: THREE.Object3D[] = [];
    private isSuperSmash: boolean = false;
    private platformsToSmash: number = 0;
    private normalMaterial!: THREE.MeshStandardMaterial;
    private superMaterial!: THREE.MeshStandardMaterial;
    private stripedMaterial!: THREE.MeshStandardMaterial;
    private blinkingMaterial!: THREE.MeshStandardMaterial;

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
    private scoreText!: Phaser.GameObjects.Text;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    // Particles
    private particles: { mesh: THREE.Object3D, velocity: THREE.Vector3, life: number }[] = [];
    private platformThickness: number = 0.8;

    private keys!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
    private scoreContainer!: Phaser.GameObjects.Container;
    private gameOverContainer!: Phaser.GameObjects.Container;

    constructor() {
        super('HelixScene');
    }

    init() {
        // Inject Cyberpunk Font
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        const threeCanvas = document.createElement('canvas');
        threeCanvas.style.zIndex = '0'; 
        document.body.appendChild(threeCanvas);

        this.game.canvas.style.position = 'relative';
        this.game.canvas.style.zIndex = '1';

        this.threeScene = new THREE.Scene();
        this.threeScene.background = new THREE.Color(0x000000); // Pure black with violet fog 
        
        const width = this.scale.width;
        const height = this.scale.height;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, -2, 0);

        this.threeRenderer = new THREE.WebGLRenderer({ canvas: threeCanvas, antialias: true });
        this.threeRenderer.setSize(width, height);
    }

    create() {
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
        this.threeScene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(5, 10, 7);
        this.threeScene.add(dirLight);

        // Create Tower
        const towerGeo = new THREE.CylinderGeometry(2, 2, 1000, 32);
        const towerMat = new THREE.MeshPhongMaterial({ color: 0x050505, shininess: 30 });
        const cylinder = new THREE.Mesh(towerGeo, towerMat);
        
        this.tower = new THREE.Group();
        this.tower.add(cylinder);
        this.threeScene.add(this.tower);

        // Materials
        this.normalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00FF41, // Bright green neon
            emissive: 0x00FF41, 
            emissiveIntensity: 0.8, 
            roughness: 0.2, 
            metalness: 0.5
        });
        
        this.superMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00FF41, // Bright green neon
            emissive: 0x00FF41, 
            emissiveIntensity: 2.0, 
            roughness: 0.1, 
            metalness: 1.0
        });

        // Striped Material for Moving Platforms
        const stripedTexture = this.createStripedTexture();
        this.stripedMaterial = new THREE.MeshStandardMaterial({
            map: stripedTexture,
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.1
        });

        // Grid Material for Blinking Platforms
        const gridTexture = this.createGridTexture();
        this.blinkingMaterial = new THREE.MeshStandardMaterial({
            map: gridTexture,
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            roughness: 0.3,
            metalness: 0.2,
            emissive: 0x00FF41, // Bright green emissive
            emissiveIntensity: 0.5
        });

        // Create Platforms
        this.createPlatforms();

        // Create Ball
        const ballGeo = new THREE.SphereGeometry(0.4, 32, 32);
        this.ball = new THREE.Mesh(ballGeo, this.normalMaterial);
        this.ball.position.set(0, 20, 2.5); // Start high up
        this.ball.scale.set(0.1, 0.1, 0.1); // Start tiny
        this.threeScene.add(this.ball);

        const ballLight = new THREE.PointLight(0x00FF41, 2, 10); // Bright green light
        this.ball.add(ballLight);

        // Camera Start
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, -2, 0);

        // UI Setup
        this.createUI();

        // Input handling
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys({ 
            a: Phaser.Input.Keyboard.KeyCodes.A, 
            d: Phaser.Input.Keyboard.KeyCodes.D 
        }) as any;

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown) {
                const deltaX = pointer.position.x - pointer.prevPosition.x;
                this.tower.rotation.y += deltaX * 0.005;
            }
        });
        
        this.scale.on('resize', this.resize, this);
        this.resize(this.scale.gameSize);
    }

    createStripedTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d')!;
        
        // Background (Black)
        context.fillStyle = '#000000'; 
        context.fillRect(0, 0, 64, 64);
        
        // Stripes (Bright Green) - Thinner and more spaced out
        context.fillStyle = '#00FF41'; 
        context.beginPath();
        for (let i = -64; i < 64; i += 32) { // Increased spacing
            context.moveTo(i, 0);
            context.lineTo(i + 2, 0); // Thinner stripe (2px)
            context.lineTo(i + 66, 64); // Adjusted for slope
            context.lineTo(i + 64, 64);
        }
        context.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 1); 
        return texture;
    }

    createGridTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d')!;
        
        // Background (Black)
        context.fillStyle = '#000000'; 
        context.fillRect(0, 0, 64, 64);
        
        // Grid lines (Bright Green)
        context.strokeStyle = '#00FF41';
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

    createUI() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.scoreContainer = this.add.container(width / 2, 80);
        
        this.scoreText = this.add.text(0, 0, '0', { 
            fontSize: '100px', 
            color: '#00FF41', // Bright green
            fontFamily: 'Orbitron', 
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.scoreContainer.add(this.scoreText);

        this.scoreContainer.add(this.scoreText);

        // Start Overlay
        this.startOverlay = this.add.graphics();
        this.startOverlay.fillStyle(0x000000, 0.8);
        this.startOverlay.fillRect(0, 0, width, height);
        this.startOverlay.setDepth(199);

        this.startText = this.add.text(width / 2, height / 2 - 200, 'READY', {
            fontSize: '80px',
            color: '#00FF41',
            fontFamily: 'Orbitron',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(200);

        this.gameOverContainer = this.add.container(width / 2, height / 2);
        this.gameOverContainer.setVisible(false);
        this.gameOverContainer.setDepth(100);

        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.95); // Black background
        modalBg.fillRoundedRect(-150, -100, 300, 200, 15);
        modalBg.lineStyle(3, 0x00FF41, 1); // Bright green border
        modalBg.strokeRoundedRect(-150, -100, 300, 200, 15);

        const gameOverText = this.add.text(0, -40, 'SYSTEM FAILURE', {
            fontSize: '28px', color: '#FF0000', fontFamily: 'Orbitron', fontStyle: 'bold' // Pure red
        }).setOrigin(0.5);

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x00FF41, 1); // Bright green button
        btnBg.fillRoundedRect(-60, 20, 120, 40, 10);
        
        const btnText = this.add.text(0, 40, 'REBOOT', {
            fontSize: '20px', color: '#000000', fontFamily: 'Orbitron', fontStyle: 'bold' // Black text
        }).setOrigin(0.5);

        const btnZone = this.add.zone(0, 40, 120, 40).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.restartGame());

        this.gameOverContainer.add([modalBg, gameOverText, btnBg, btnText, btnZone]);
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
        
        threeCanvas.style.position = 'absolute';
        threeCanvas.style.left = rect.left + 'px';
        threeCanvas.style.top = rect.top + 'px';
        threeCanvas.style.width = rect.width + 'px';
        threeCanvas.style.height = rect.height + 'px';
        threeCanvas.style.zIndex = '0';
    }

    createPlatforms() {
        const platformCount = 100;
        
        // Dark grey/black platform palette (no color tint)
        const colors = [0x0a0a0a, 0x1a1a1a, 0x0f0f0f, 0x050505];

        this.platforms = [];
        this.powerUps = [];
        this.tower.clear();
        this.tower.add(new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1000, 32), new THREE.MeshPhongMaterial({ color: 0x050505, shininess: 30 })));

        for (let i = 0; i < platformCount; i++) {
            const yPos = -2 - (i * 4);
            
            // 1. Generate Gaps
            const numGaps = (i > 10 && Math.random() > 0.7) ? 2 : 1; 
            const gaps: { start: number, end: number, size: number, center: number }[] = [];
            const solidSegments: { start: number, end: number }[] = [];
            
            const isOverlapping = (start: number, size: number) => {
                for (const g of gaps) {
                    const center = start + size/2;
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
                    const size = (Math.PI / 4) + Math.random() * (Math.PI / 2.5); 
                    const start = Math.random() * Math.PI * 2;
                    if (!isOverlapping(start, size)) {
                        gaps.push({ start, end: start + size, size, center: start + size / 2 });
                        valid = true;
                    }
                    attempts++;
                }
            }
            if (gaps.length === 0) {
                 const size = Math.PI / 4;
                 const start = 0;
                 gaps.push({ start, end: start + size, size, center: start + size/2 });
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
                shape.moveTo(innerRadius * Math.cos(seg.start), innerRadius * Math.sin(seg.start));
                shape.lineTo(outerRadius * Math.cos(seg.start), outerRadius * Math.sin(seg.start));
                shape.absarc(0, 0, outerRadius, seg.start, seg.end, false);
                shape.lineTo(innerRadius * Math.cos(seg.end), innerRadius * Math.sin(seg.end));
                shape.absarc(0, 0, innerRadius, seg.end, seg.start, true);
            }

            const extrudeSettings = { depth: this.platformThickness, bevelEnabled: false };
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
                moveSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.005 + Math.random() * 0.01);
            }

            // Select Material
            let material;
            if (isBlinking) {
                material = this.blinkingMaterial.clone();
            } else if (isMoving) {
                material = this.stripedMaterial.clone();
            } else {
                const color = colors[i % colors.length];
                material = new THREE.MeshStandardMaterial({ 
                    color: color,
                    roughness: 0.5,
                    metalness: 0.5
                });
            }
            
            const platform = new THREE.Mesh(geometry, material);
            platform.rotation.x = -Math.PI / 2;
            platform.position.y = yPos;
            const rotationZ = Math.random() * Math.PI * 2;
            platform.rotation.z = rotationZ;

            // Danger Zones
            const dangerZones: { start: number, size: number }[] = [];
            if (i > 0) {
                let minZones = 0;
                let maxZones = 1;
                if (i > 10) { minZones = 0; maxZones = 2; }
                if (i > 25) { minZones = 1; maxZones = 2; }
                if (i > 50) { minZones = 1; maxZones = 3; }
                if (i > 75) { minZones = 2; maxZones = 3; }
                const numZones = minZones + Math.floor(Math.random() * (maxZones - minZones + 1));
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
                            dangerShape.moveTo(innerRadius * Math.cos(zoneStart), innerRadius * Math.sin(zoneStart));
                            dangerShape.lineTo(outerRadius * Math.cos(zoneStart), outerRadius * Math.sin(zoneStart));
                            dangerShape.absarc(0, 0, outerRadius, zoneStart, dEnd, false);
                            dangerShape.absarc(0, 0, innerRadius, dEnd, zoneStart, true);
                            const dangerGeo = new THREE.ExtrudeGeometry(dangerShape, { depth: this.platformThickness + 0.05, bevelEnabled: false });
                            const dangerMat = new THREE.MeshStandardMaterial({ 
                                color: 0xFF0000, // Pure red
                                emissive: 0xFF0000, 
                                emissiveIntensity: 1.0 
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
                    const seg = solidSegments[Math.floor(Math.random() * solidSegments.length)];
                    const angle = seg.start + Math.random() * (seg.end - seg.start);
                    const radius = 3; 
                    
                    const worldAngle = angle + rotationZ;
                    const betweenY = yPos - 2; 
                    
                    const group = new THREE.Group();
                    const coneGeo = new THREE.ConeGeometry(0.4, 0.8, 16);
                    const mat = new THREE.MeshStandardMaterial({ 
                        color: 0x00FF41, emissive: 0x00FF41, emissiveIntensity: 1 // Bright green power-up
                    });
                    const cone = new THREE.Mesh(coneGeo, mat);
                    cone.rotation.x = Math.PI; 
                    cone.position.y = -0.4;
                    group.add(cone);

                    const cylGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16);
                    const cyl = new THREE.Mesh(cylGeo, mat);
                    cyl.position.y = 0.4;
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
                        baseY: betweenY 
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
                blinkTime: Math.random() * 100 // Random start offset for blink cycle
            };

            this.tower.add(platform);
            this.platforms.push(platform);
        }
    }

    restartGame() {
        this.isGameActive = true;
        this.isGameStarting = true;
        this.startTimer = 0;
        this.startText.setVisible(true);
        this.startText.setText('READY');
        this.startOverlay.setVisible(true);
        this.startOverlay.setAlpha(1);
        
        this.score = 0;
        this.scoreText.setText('0');
        this.gameOverContainer.setVisible(false);
        this.isSuperSmash = false;
        this.platformsToSmash = 0;
        this.ball.material = this.normalMaterial;
        
        this.ballVelocity = 0;
        this.ball.position.set(0, 20, 2.5);
        this.ball.scale.set(0.1, 0.1, 0.1);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, -2, 0);
        
        for (const p of this.particles) {
            this.threeScene.remove(p.mesh);
        }
        this.particles = [];

        this.createPlatforms();
    }

    update(time: number, delta: number) {
        if (!this.isGameActive) return;

        if (this.isGameStarting) {
            this.startTimer += delta / 1000;
            
            if (this.startTimer < 3) {
                const progress = this.startTimer / 3;
                
                // Animate Ball
                this.ball.position.y = 20 - (18 * progress);
                const scale = 0.1 + (0.9 * progress);
                this.ball.scale.set(scale, scale, scale);
                
                // Update Text
                if (this.startTimer < 1) this.startText.setText('READY');
                else if (this.startTimer < 2) this.startText.setText('STEADY');
                else {
                    this.startText.setText('GO!');
                    // Fade out overlay in the last second
                    this.startOverlay.setAlpha(1 - (this.startTimer - 2));
                }
                
                // Camera Follow
                const targetY = this.ball.position.y + 4;
                this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
                this.camera.lookAt(0, this.camera.position.y - 8, 0);
                
                this.threeRenderer.render(this.threeScene, this.camera);
                return;
            } else {
                // End Start Sequence
                this.isGameStarting = false;
                this.startText.setVisible(false);
                this.startOverlay.setVisible(false);
                this.ball.position.y = 2;
                this.ball.scale.set(1, 1, 1);
                this.ballVelocity = 0; // Reset velocity
            }
        }

        // Keyboard Rotation
        if (this.cursors.left.isDown || this.keys.a.isDown) {
            this.tower.rotation.y -= 0.05;
        } else if (this.cursors.right.isDown || this.keys.d.isDown) {
            this.tower.rotation.y += 0.05;
        }

        // Update Platforms (Movement & Blinking)
        for (const platform of this.platforms) {
            if (platform.userData.isMoving) {
                platform.rotation.z += platform.userData.moveSpeed;
                // Keep rotationOffset in sync [0, 2PI]
                let rot = platform.rotation.z % (Math.PI * 2);
                if (rot < 0) rot += Math.PI * 2;
                platform.userData.rotationOffset = rot;
            }
            
            if (platform.userData.isBlinking) {
                // Update blink time
                platform.userData.blinkTime += 0.05;
                
                // Sine wave for smooth fade in/out (period of ~3 seconds)
                const opacity = (Math.sin(platform.userData.blinkTime * 0.5) + 1) / 2;
                
                // Set material opacity (0.1 to 1.0 range, stays invisible longer)
                const material = platform.material as THREE.MeshStandardMaterial;
                material.opacity = 0.1 + (opacity * 0.9);
                
                // Also pulse the emissive intensity
                material.emissiveIntensity = 0.1 + (opacity * 0.4);
            }
        }

        // Update Power Ups
        for (const pu of this.powerUps) {
            pu.rotation.y += 0.05; // Rotate around Y
            pu.userData.time += 0.1;
            pu.position.y = pu.userData.baseY + Math.sin(pu.userData.time) * 0.2;
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i] as any;
            p.life -= 0.02;
            
            if (p.isShockwave) {
                // Expand ring
                p.mesh.scale.multiplyScalar(1.05);
                (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
            } else {
                // Normal particle
                p.mesh.position.add(p.velocity);
                // Fade out
                if (p.mesh.material.opacity !== undefined) {
                    p.mesh.material.opacity = p.life;
                }
                // Shrink slightly
                p.mesh.scale.multiplyScalar(0.98);
            }
            
            if (p.life <= 0) {
                this.threeScene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }

        // Physics
        if (this.isSuperSmash) {
            this.ballVelocity = -0.8; 
            
            // Trail Effect
            if (Math.random() > 0.5) {
                const trailGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                const trailMat = new THREE.MeshBasicMaterial({ color: 0x00FF41 }); // Bright green trail
                const trail = new THREE.Mesh(trailGeo, trailMat);
                trail.position.copy(this.ball.position);
                trail.position.y += 0.5; 
                this.threeScene.add(trail);
                this.particles.push({ mesh: trail, velocity: new THREE.Vector3(0, 0.1, 0), life: 0.5 });
            }
        } else {
            this.ballVelocity += this.gravity;
        }
        
        const nextY = this.ball.position.y + this.ballVelocity;

        // Collision Detection
        let collided = false;

        // Check Power Up Collection
        let ballAngleInTower = (Math.PI / 2 - this.tower.rotation.y + Math.PI) % (Math.PI * 2);
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
                // Add explosion with shockwave for power-up
                this.createExplosion(puWorldPos.y, 0x00FF41, 30, true); // Bright green explosion
            }
        }

        for (let i = this.platforms.length - 1; i >= 0; i--) {
            const platform = this.platforms[i];
            
            if (Math.abs(platform.position.y - this.ball.position.y) > 5) continue;
            
            // Check blinking platforms - destroy if passing through while invisible
            if (platform.userData.isBlinking) {
                const material = platform.material as THREE.MeshStandardMaterial;
                if (material.opacity < 0.6) { // Platform is invisible
                    // Check if ball is passing through
                    const platformY = platform.position.y;
                    const topSurfaceY = platformY + this.platformThickness;
                    
                    if (this.ballVelocity < 0 && this.ball.position.y >= topSurfaceY && nextY <= topSurfaceY) {
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
                        this.scoreText.setText(this.score.toString());
                        this.createExplosion(platform.position.y, 0x00FF41, 40); // Bright green explosion
                        
                        this.platformsToSmash--;
                        if (this.platformsToSmash <= 0) {
                            this.isSuperSmash = false;
                            this.ball.material = this.normalMaterial;
                            this.ballVelocity = this.jumpStrength; 
                        }
                        collided = true; 
                    } else {
                        const collisionResult = this.checkCollision(platform);
                        
                        if (collisionResult === 'hit') {
                            this.ballVelocity = this.jumpStrength;
                            this.ball.position.y = topSurfaceY;
                            collided = true;
                        } else if (collisionResult === 'danger') {
                            this.gameOverSplatter(topSurfaceY);
                            return;
                        } else {
                            this.destroyPlatform(platform, i);
                            this.score++;
                            this.scoreText.setText(this.score.toString());
                        }
                    }
                }
            }
        }

        if (!collided) {
            this.ball.position.y += this.ballVelocity;
        }
        
        const targetY = this.ball.position.y + 4;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
        this.camera.lookAt(0, this.camera.position.y - 8, 0);
        
        this.threeRenderer.render(this.threeScene, this.camera);
    }

    activateSuperSmash() {
        this.isSuperSmash = true;
        this.platformsToSmash = 5;
        this.ball.material = this.superMaterial;
    }

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d')!;
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createExplosion(yPos: number, color: number, count: number, hasShockwave: boolean = true) {
        const texture = this.createGlowTexture();
        const material = new THREE.SpriteMaterial({ 
            map: texture, 
            color: color, 
            transparent: true, 
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        for (let i = 0; i < count; i++) {
            const sprite = new THREE.Sprite(material);
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 2;
            const worldAngle = angle + this.tower.rotation.y;
            
            sprite.position.set(
                Math.cos(worldAngle) * radius, yPos, Math.sin(worldAngle) * radius
            );
            
            const scale = 0.5 + Math.random() * 0.5;
            sprite.scale.set(scale, scale, 1);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5
            );
            
            this.threeScene.add(sprite);
            this.particles.push({ mesh: sprite, velocity, life: 1.0 });
        }

        if (hasShockwave) {
            // Shockwave Ring
            const ringGeo = new THREE.RingGeometry(2, 2.05, 64);
            const ringMat = new THREE.MeshBasicMaterial({ 
                color: color, 
                transparent: true, 
                opacity: 0.4, 
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.y = yPos;
            ring.rotation.x = -Math.PI / 2;
            this.threeScene.add(ring);
            this.particles.push({ mesh: ring, velocity: new THREE.Vector3(0,0,0), life: 1.0, isShockwave: true } as any);
        }
    }

    gameOverSplatter(yPos: number) {
        this.isGameActive = false;
        this.ball.position.y = yPos + 0.1;
        this.ball.scale.set(1.5, 0.1, 1.5);
        
        this.gameOverContainer.setVisible(true);
        this.scoreContainer.setVisible(false);
        
        // Big Explosion
        this.createExplosion(yPos, 0x00FF41, 50, true); // Bright green explosion for game over
    }

    destroyPlatform(platform: THREE.Mesh, index: number) {
        const yPos = platform.position.y;
        
        // Subtle shockwave ring effect
        const ringGeo = new THREE.RingGeometry(2, 2.05, 64);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0x00FF41, // Bright green
            transparent: true, 
            opacity: 0.3, // Lower opacity for subtlety
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = yPos;
        ring.rotation.x = -Math.PI / 2;
        this.threeScene.add(ring);
        this.particles.push({ mesh: ring, velocity: new THREE.Vector3(0,0,0), life: 0.5, isShockwave: true } as any); // Shorter life

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
    }

    checkCollision(platform: THREE.Mesh): 'hit' | 'gap' | 'danger' {
        if (platform.userData.isBase) return 'hit';

        let ballAngleInTower = (Math.PI / 2 - this.tower.rotation.y + Math.PI) % (Math.PI * 2);
        if (ballAngleInTower < 0) ballAngleInTower += Math.PI * 2;
        
        const platformRotation = platform.userData.rotationOffset;
        
        // 1. Check Danger Zones
        const dangerZones = platform.userData.dangerZones;
        if (dangerZones && dangerZones.length > 0) {
            for (const zone of dangerZones) {
                let zoneCenter = (zone.start + zone.size / 2 + platformRotation) % (Math.PI * 2);
                if (zoneCenter < 0) zoneCenter += Math.PI * 2;

                let diff = Math.abs(ballAngleInTower - zoneCenter);
                if (diff > Math.PI) diff = 2 * Math.PI - diff;

                if (diff < zone.size / 2) {
                    return 'danger';
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
                
                if (diff < (halfGap - ballRadiusAngle)) {
                    return 'gap'; 
                }
            }
        }
        
        return 'hit'; 
    }
}
