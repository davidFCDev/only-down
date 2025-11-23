import * as Phaser from 'phaser';
import * as THREE from 'three';

export default class HelixScene extends Phaser.Scene {
    private threeScene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private threeRenderer!: THREE.WebGLRenderer;
    private tower!: THREE.Group;
    private ball!: THREE.Mesh;
    
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

    constructor() {
        super('HelixScene');
    }

    init() {
        // Initialize Three.js with its own canvas
        const threeCanvas = document.createElement('canvas');
        threeCanvas.style.zIndex = '0'; // Behind Phaser
        document.body.appendChild(threeCanvas);

        // Ensure Phaser canvas is on top
        this.game.canvas.style.position = 'relative';
        this.game.canvas.style.zIndex = '1';

        this.threeScene = new THREE.Scene();
        this.threeScene.background = new THREE.Color(0x000000); // Black background
        
        // Camera setup
        const width = this.scale.width;
        const height = this.scale.height;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Renderer setup - Use the new canvas
        this.threeRenderer = new THREE.WebGLRenderer({ canvas: threeCanvas, antialias: true });
        this.threeRenderer.setSize(width, height);
    }

    create() {
        // Lighting - Dark Mode / Atmospheric
        // Increased ambient light for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.threeScene.add(ambientLight);

        // Add a dim directional light for depth
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.1);
        dirLight.position.set(5, 10, 7);
        this.threeScene.add(dirLight);

        // Create Tower (Cylinder) - Darker
        const towerGeo = new THREE.CylinderGeometry(2, 2, 1000, 32);
        const towerMat = new THREE.MeshPhongMaterial({ 
            color: 0x111111,
            shininess: 10 
        });
        const cylinder = new THREE.Mesh(towerGeo, towerMat);
        
        this.tower = new THREE.Group();
        this.tower.add(cylinder);
        this.threeScene.add(this.tower);

        // Create Platforms
        this.createPlatforms();

        // Create Ball - White Glowing
        const ballGeo = new THREE.SphereGeometry(0.4, 32, 32);
        const ballMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            emissive: 0xffffff,
            emissiveIntensity: 1,
            roughness: 0.4,
            metalness: 0.8
        }); 
        this.ball = new THREE.Mesh(ballGeo, ballMat);
        
        // Start at Top
        const startY = 0; // Top platform is at 0
        this.ball.position.set(0, startY + 2, 2.5); 
        this.threeScene.add(this.ball);

        // Add PointLight to Ball - White, increased range and intensity
        const ballLight = new THREE.PointLight(0xffffff, 3, 25); 
        this.ball.add(ballLight);

        // Camera Start
        this.camera.position.set(0, startY + 5, 10);
        this.camera.lookAt(0, startY, 0);

        // UI
        this.scoreText = this.add.text(20, 20, 'Score: 0', { 
            fontSize: '32px', 
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        });

        const restartBtn = this.add.text(this.scale.width - 120, 20, 'Restart', { 
            fontSize: '24px', 
            color: '#ffffff', 
            backgroundColor: '#d14b4b',
            padding: { x: 10, y: 5 }
        })
        .setInteractive()
        .on('pointerdown', () => this.restartGame());

        // Input handling
        this.cursors = this.input.keyboard!.createCursorKeys();

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown) {
                const deltaX = pointer.position.x - pointer.prevPosition.x;
                this.tower.rotation.y += deltaX * 0.005;
            }
        });
        
        // Handle window resize
        this.scale.on('resize', this.resize, this);
        
        // Initial resize to align canvases
        this.resize(this.scale.gameSize);
    }
    resize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.threeRenderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        const threeCanvas = this.threeRenderer.domElement;
        const phaserCanvas = this.game.canvas;
        
        // Align using getBoundingClientRect for precision
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
        // Slightly lighter dark colors for better visibility
        const colors = [0x333333, 0x444444, 0x3a3a3a, 0x2a2a2a];

        let lastGapAngle = 0;

        for (let i = 0; i < platformCount; i++) {
            const yPos = -2 - (i * 4); // Vertical spacing downwards
            
            // Enhanced Randomness: Wider gap variation
            // From PI/6 (30 deg) to PI/1.5 (120 deg) - varied difficulty
            const minGap = Math.PI / 6;
            const maxGap = Math.PI / 1.5; 
            const gapSize = minGap + Math.random() * (maxGap - minGap);

            const innerRadius = 2;
            const outerRadius = 4;
            const startAngle = gapSize / 2;
            const endAngle = Math.PI * 2 - gapSize / 2;

            // Main Platform Shape
            const shape = new THREE.Shape();
            shape.moveTo(innerRadius * Math.cos(startAngle), innerRadius * Math.sin(startAngle));
            shape.lineTo(outerRadius * Math.cos(startAngle), outerRadius * Math.sin(startAngle));
            shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
            shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);

            const extrudeSettings = { depth: this.platformThickness, bevelEnabled: false };
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            const material = new THREE.MeshPhongMaterial({ color: colors[i % colors.length] });
            
            const platform = new THREE.Mesh(geometry, material);
            platform.rotation.x = -Math.PI / 2;
            platform.position.y = yPos;
            
            // Smart Gap Placement - Force rotation but keep it playable
            const minSeparation = gapSize / 2 + 0.5; 
            let targetGapAngle;
            let attempts = 0;
            do {
                targetGapAngle = Math.random() * Math.PI * 2;
                let diff = Math.abs(targetGapAngle - lastGapAngle);
                if (diff > Math.PI) diff = 2 * Math.PI - diff;
                
                // Ensure it's not TOO close (boring) but not impossible
                if (diff > 1.5) break; 
                
                attempts++;
                if (attempts > 10) break; 
            } while (true);
            
            lastGapAngle = targetGapAngle;
            platform.rotation.z = targetGapAngle;

            // Danger Zone Generation (30% chance, increasing with depth?)
            let hasDanger = Math.random() > 0.5; // 50% chance
            let dangerStart = 0;
            let dangerSize = 0;

            if (hasDanger) {
                // Create a red segment on the platform
                // It must be within the solid part (startAngle to endAngle)
                // Solid arc length = 2PI - gapSize
                const solidLength = Math.PI * 2 - gapSize;
                dangerSize = Math.PI / 4; // Fixed size for now (45 deg)
                
                // Random position within solid area
                // We need to offset from startAngle
                const maxOffset = solidLength - dangerSize;
                const offset = Math.random() * maxOffset;
                
                dangerStart = startAngle + offset;
                const dangerEnd = dangerStart + dangerSize;

                const dangerShape = new THREE.Shape();
                dangerShape.moveTo(innerRadius * Math.cos(dangerStart), innerRadius * Math.sin(dangerStart));
                dangerShape.lineTo(outerRadius * Math.cos(dangerStart), outerRadius * Math.sin(dangerStart));
                dangerShape.absarc(0, 0, outerRadius, dangerStart, dangerEnd, false);
                dangerShape.absarc(0, 0, innerRadius, dangerEnd, dangerStart, true);

                const dangerGeo = new THREE.ExtrudeGeometry(dangerShape, { depth: this.platformThickness + 0.05, bevelEnabled: false }); // Slightly higher
                const dangerMat = new THREE.MeshStandardMaterial({ 
                    color: 0xff0000,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.5
                });
                const dangerMesh = new THREE.Mesh(dangerGeo, dangerMat);
                // No rotation needed relative to platform, it's built in same space
                platform.add(dangerMesh);
            }

            platform.userData = { 
                isBase: false, 
                gapSize: gapSize, 
                gapCenter: targetGapAngle, 
                id: i, 
                color: colors[i % colors.length],
                hasDanger: hasDanger,
                dangerStart: dangerStart, // In Local Platform Space
                dangerSize: dangerSize
            };

            this.tower.add(platform);
            this.platforms.push(platform);
        }
    }

    restartGame() {
        this.isGameActive = true;
        this.score = 0;
        this.scoreText.setText('Score: 0');
        this.ballVelocity = 0;
        this.ball.position.set(0, 2, 2.5);
        this.ball.scale.set(1, 1, 1); // Reset scale
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Clear particles
        for (const p of this.particles) {
            this.threeScene.remove(p.mesh);
        }
        this.particles = [];

        // Re-create platforms
        // Remove old platforms from tower
        for(const p of this.platforms) {
            this.tower.remove(p);
        }
        this.platforms = [];
        this.createPlatforms();
    }

    update(time: number, delta: number) {
        if (!this.isGameActive) return;

        // Keyboard Rotation
        if (this.cursors.left.isDown) {
            this.tower.rotation.y -= 0.05;
        } else if (this.cursors.right.isDown) {
            this.tower.rotation.y += 0.05;
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= 0.02;
            p.mesh.position.add(p.velocity);
            p.mesh.rotation.x += 0.1;
            p.mesh.rotation.y += 0.1;
            p.mesh.scale.setScalar(p.life); // Shrink
            
            if (p.life <= 0) {
                this.threeScene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }

        // Physics
        this.ballVelocity += this.gravity;
        const nextY = this.ball.position.y + this.ballVelocity;

        // Collision Detection
        let collided = false;

        // Iterate backwards so we can remove platforms safely if needed
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            const platform = this.platforms[i];
            
            // Optimization: Skip far platforms
            if (Math.abs(platform.position.y - this.ball.position.y) > 5) continue;

            const platformY = platform.position.y;
            const topSurfaceY = platformY + this.platformThickness;
            
            // Check Floor Collision (Falling down onto a platform)
            if (this.ballVelocity < 0) {
                // If we were above the platform and now are below/inside it
                if (this.ball.position.y >= topSurfaceY && nextY <= topSurfaceY) {
                    
                    const collisionResult = this.checkCollision(platform);
                    
                    if (collisionResult === 'hit') {
                        // Hit Platform -> Bounce
                        this.ballVelocity = this.jumpStrength;
                        this.ball.position.y = topSurfaceY; // Snap to top
                        collided = true;
                    } else if (collisionResult === 'danger') {
                        // Hit Danger Zone -> Die
                        this.gameOverSplatter(topSurfaceY);
                        return;
                    } else {
                        // Passed through gap!
                        // Destroy platform
                        this.destroyPlatform(platform, i);
                        
                        // Increase Score
                        this.score++;
                        this.scoreText.setText('Score: ' + this.score);
                    }
                }
            }
        }

        if (!collided) {
            this.ball.position.y += this.ballVelocity;
        }

        // Camera follow (Downwards)
        const targetY = this.ball.position.y + 4;
        // Smooth follow
        this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
        this.camera.lookAt(0, this.camera.position.y - 4, 0); // Look slightly down? Or straight.
        
        this.threeRenderer.render(this.threeScene, this.camera);
    }

    gameOverSplatter(yPos: number) {
        this.isGameActive = false;
        this.ball.position.y = yPos + 0.1;
        this.ball.scale.set(1.5, 0.1, 1.5); // Flatten
        this.scoreText.setText('GAME OVER! Score: ' + this.score);
        
        // Red particles
        const debrisCount = 30;
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        for (let i = 0; i < debrisCount; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(this.ball.position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.8,
                Math.random() * 0.5,
                (Math.random() - 0.5) * 0.8
            );
            
            this.threeScene.add(mesh);
            this.particles.push({ mesh, velocity, life: 1.5 });
        }
    }

    destroyPlatform(platform: THREE.Mesh, index: number) {
        // Explosion FX
        const yPos = platform.position.y;
        const color = platform.userData.color;
        
        // Create debris
        const debrisCount = 20;
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const material = new THREE.MeshBasicMaterial({ color: color });
        
        for (let i = 0; i < debrisCount; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            
            // Random position in the ring
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 2; // Between inner 2 and outer 4
            
            // Convert to World Space taking Tower Rotation into account
            const worldAngle = angle + this.tower.rotation.y;
            
            mesh.position.set(
                Math.cos(worldAngle) * radius,
                yPos + this.platformThickness / 2,
                Math.sin(worldAngle) * radius
            );
            
            // Random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            
            this.threeScene.add(mesh);
            this.particles.push({ mesh, velocity, life: 1.0 });
        }

        this.tower.remove(platform);
        this.platforms.splice(index, 1);
    }

    checkCollision(platform: THREE.Mesh): 'hit' | 'gap' | 'danger' {
        if (platform.userData.isBase) return 'hit';

        // Calculate ball angle in Tower Space
        let ballAngleInTower = (Math.PI / 2 - this.tower.rotation.y + Math.PI) % (Math.PI * 2);
        if (ballAngleInTower < 0) ballAngleInTower += Math.PI * 2;
        
        // 1. Check Danger Zone
        if (platform.userData.hasDanger) {
            const dangerStart = platform.userData.dangerStart;
            const dangerSize = platform.userData.dangerSize;
            const gapCenter = platform.userData.gapCenter;
            
            // Danger zone is relative to the platform rotation (gapCenter)
            let dangerCenter = (dangerStart + dangerSize / 2 + gapCenter) % (Math.PI * 2);
            if (dangerCenter < 0) dangerCenter += Math.PI * 2;
            
            let diffDanger = Math.abs(ballAngleInTower - dangerCenter);
            if (diffDanger > Math.PI) diffDanger = 2 * Math.PI - diffDanger;
            
            if (diffDanger < dangerSize / 2) {
                return 'danger';
            }
        }

        // 2. Check Gap
        const gapCenter = platform.userData.gapCenter;
        const gapSize = platform.userData.gapSize;
        
        let diff = Math.abs(ballAngleInTower - gapCenter);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        
        const halfGap = gapSize / 2;
        const ballRadiusAngle = 0.4 / 2; 
        
        if (diff < (halfGap - ballRadiusAngle)) {
            return 'gap'; // In gap
        }
        
        return 'hit'; // Collision with safe platform
    }
}
