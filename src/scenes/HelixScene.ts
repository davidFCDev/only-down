import * as Phaser from 'phaser';
import * as THREE from 'three';

export default class HelixScene extends Phaser.Scene {
    private threeScene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private threeRenderer!: THREE.WebGLRenderer;
    private tower!: THREE.Group;
    private ball!: THREE.Mesh;
    
    // Power Ups
    private powerUps: THREE.Mesh[] = [];
    private isSuperSmash: boolean = false;
    private platformsToSmash: number = 0;
    private normalMaterial!: THREE.MeshStandardMaterial;
    private superMaterial!: THREE.MeshStandardMaterial;

    // Game State & Physics
    private platforms: THREE.Mesh[] = [];
    private ballVelocity: number = 0;
    private gravity: number = -0.015;
    private jumpStrength: number = 0.35;
    private isGameActive: boolean = true;
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    // Particles
    private particles: { mesh: THREE.Mesh, velocity: THREE.Vector3, life: number }[] = [];
    private platformThickness: number = 0.8;

    private keys!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
    private scoreContainer!: Phaser.GameObjects.Container;
    private gameOverContainer!: Phaser.GameObjects.Container;

    constructor() {
        super('HelixScene');
    }

    init() {
        const threeCanvas = document.createElement('canvas');
        threeCanvas.style.zIndex = '0'; 
        document.body.appendChild(threeCanvas);

        this.game.canvas.style.position = 'relative';
        this.game.canvas.style.zIndex = '1';

        this.threeScene = new THREE.Scene();
        this.threeScene.background = new THREE.Color(0x000000); // Solid Black Background
        
        const width = this.scale.width;
        const height = this.scale.height;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, -2, 0);

        this.threeRenderer = new THREE.WebGLRenderer({ canvas: threeCanvas, antialias: true });
        this.threeRenderer.setSize(width, height);
    }

    create() {
        // Lighting - Neutral/Dim
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); 
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
        // Neon Green Ball
        this.normalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xB7FF00, 
            emissive: 0xB7FF00, 
            emissiveIntensity: 0.8, 
            roughness: 0.2, 
            metalness: 0.5
        });
        // Super Mode (Bright White/Blue)
        this.superMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            emissive: 0x00ffff, 
            emissiveIntensity: 2, 
            roughness: 0.1, 
            metalness: 1.0
        });

        // Create Platforms
        this.createPlatforms();

        // Create Ball
        const ballGeo = new THREE.SphereGeometry(0.4, 32, 32);
        this.ball = new THREE.Mesh(ballGeo, this.normalMaterial);
        this.ball.position.set(0, 2, 2.5); 
        this.threeScene.add(this.ball);

        const ballLight = new THREE.PointLight(0xB7FF00, 2, 10); 
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

    createUI() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.scoreContainer = this.add.container(width / 2, 80);
        
        this.scoreText = this.add.text(0, 0, '0', { 
            fontSize: '80px', 
            color: '#B7FF00', // Neon Green
            fontFamily: 'Courier New', 
            fontStyle: 'bold',
            stroke: '#003300',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.scoreContainer.add(this.scoreText);

        this.gameOverContainer = this.add.container(width / 2, height / 2);
        this.gameOverContainer.setVisible(false);
        this.gameOverContainer.setDepth(100);

        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.9);
        modalBg.fillRoundedRect(-150, -100, 300, 200, 15);
        modalBg.lineStyle(2, 0xB7FF00, 1);
        modalBg.strokeRoundedRect(-150, -100, 300, 200, 15);

        const gameOverText = this.add.text(0, -40, 'SYSTEM FAILURE', {
            fontSize: '28px', color: '#B7FF00', fontFamily: 'Courier New', fontStyle: 'bold'
        }).setOrigin(0.5);

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xB7FF00, 1);
        btnBg.fillRoundedRect(-60, 20, 120, 40, 10);
        
        const btnText = this.add.text(0, 40, 'REBOOT', {
            fontSize: '20px', color: '#000000', fontFamily: 'Courier New', fontStyle: 'bold'
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
        
        // Dark Platform Palette
        const colors = [0x111111, 0x222222, 0x1a1a1a, 0x0a0a0a];

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
            
            // Dark Material
            const color = colors[i % colors.length];
            const material = new THREE.MeshStandardMaterial({ 
                color: color,
                roughness: 0.5,
                metalness: 0.5
            });
            
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
                                color: 0xcc0000, // Darker Red Danger
                                emissive: 0xcc0000, 
                                emissiveIntensity: 0.3 
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
                    
                    const puGeo = new THREE.OctahedronGeometry(0.3, 0);
                    const puMat = new THREE.MeshStandardMaterial({ 
                        color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 
                    });
                    const powerUp = new THREE.Mesh(puGeo, puMat);
                    
                    powerUp.position.set(
                        Math.cos(worldAngle) * radius,
                        betweenY,
                        Math.sin(worldAngle) * radius
                    );
                    
                    powerUp.userData = { 
                        isPowerUp: true, 
                        rotationSpeed: 0.05, 
                        bobSpeed: 0.05, 
                        time: Math.random() * 100,
                        baseY: betweenY 
                    };
                    
                    this.tower.add(powerUp);
                    this.powerUps.push(powerUp);
                }
            }

            platform.userData = { 
                isBase: false, 
                gaps: gaps, 
                rotationOffset: rotationZ, 
                id: i, 
                color: color,
                dangerZones: dangerZones
            };

            this.tower.add(platform);
            this.platforms.push(platform);
        }
    }

    restartGame() {
        this.isGameActive = true;
        this.score = 0;
        this.scoreText.setText('0');
        this.gameOverContainer.setVisible(false);
        this.isSuperSmash = false;
        this.platformsToSmash = 0;
        this.ball.material = this.normalMaterial;
        
        this.ballVelocity = 0;
        this.ball.position.set(0, 2, 2.5);
        this.ball.scale.set(1, 1, 1);
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

        // Keyboard Rotation
        if (this.cursors.left.isDown || this.keys.a.isDown) {
            this.tower.rotation.y -= 0.05;
        } else if (this.cursors.right.isDown || this.keys.d.isDown) {
            this.tower.rotation.y += 0.05;
        }

        // Update Power Ups
        for (const pu of this.powerUps) {
            pu.rotation.z += 0.05;
            pu.rotation.x += 0.05;
            pu.userData.time += 0.1;
            pu.position.y = pu.userData.baseY + Math.sin(pu.userData.time) * 0.2;
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= 0.02;
            p.mesh.position.add(p.velocity);
            p.mesh.rotation.x += 0.1;
            p.mesh.rotation.y += 0.1;
            p.mesh.scale.setScalar(p.life);
            
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
                const trailMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
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
            }
        }

        for (let i = this.platforms.length - 1; i >= 0; i--) {
            const platform = this.platforms[i];
            
            if (Math.abs(platform.position.y - this.ball.position.y) > 5) continue;
            
            const platformY = platform.position.y;
            const topSurfaceY = platformY + this.platformThickness;
            
            if (this.ballVelocity < 0) {
                if (this.ball.position.y >= topSurfaceY && nextY <= topSurfaceY) {
                    
                    if (this.isSuperSmash) {
                        this.destroyPlatform(platform, i);
                        this.score++;
                        this.scoreText.setText(this.score.toString());
                        this.createExplosion(platform.position.y, 0xB7FF00, 40);
                        
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

    createExplosion(yPos: number, color: number, count: number) {
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const material = new THREE.MeshBasicMaterial({ color: color });
        
        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 2;
            const worldAngle = angle + this.tower.rotation.y;
            mesh.position.set(
                Math.cos(worldAngle) * radius, yPos, Math.sin(worldAngle) * radius
            );
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8
            );
            this.threeScene.add(mesh);
            this.particles.push({ mesh, velocity, life: 1.0 });
        }
    }

    gameOverSplatter(yPos: number) {
        this.isGameActive = false;
        this.ball.position.y = yPos + 0.1;
        this.ball.scale.set(1.5, 0.1, 1.5);
        
        this.gameOverContainer.setVisible(true);
        this.scoreContainer.setVisible(false);
        
        const debrisCount = 30;
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshBasicMaterial({ color: 0xB7FF00 }); // Neon Green Splatter
        
        for (let i = 0; i < debrisCount; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(this.ball.position);
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.8, Math.random() * 0.5, (Math.random() - 0.5) * 0.8
            );
            this.threeScene.add(mesh);
            this.particles.push({ mesh, velocity, life: 1.5 });
        }
    }

    destroyPlatform(platform: THREE.Mesh, index: number) {
        const yPos = platform.position.y;
        const color = platform.userData.color;
        const debrisCount = 20;
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const material = new THREE.MeshBasicMaterial({ color: color });
        
        for (let i = 0; i < debrisCount; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 2;
            const worldAngle = angle + this.tower.rotation.y;
            mesh.position.set(
                Math.cos(worldAngle) * radius, yPos + this.platformThickness / 2, Math.sin(worldAngle) * radius
            );
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5
            );
            this.threeScene.add(mesh);
            this.particles.push({ mesh, velocity, life: 1.0 });
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
