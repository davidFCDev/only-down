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

    constructor() {
        super('HelixScene');
    }

    init() {
        // Initialize Three.js with its own canvas
        const threeCanvas = document.createElement('canvas');
        threeCanvas.id = 'three-canvas';
        threeCanvas.style.position = 'absolute';
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
        // Ball is at World +Z (PI/2).
        // Platform Geometry (rotated X -90) maps its Local +Y to World -Z.
        // So Platform Local +Y (PI/2) is opposite to Ball.
        // Platform Local -Y (3PI/2) is at World +Z (Ball).
        // So there is a PI (180 deg) offset between Standard World Angles and Platform Local Angles.
        // We add PI to the ball's calculated angle to align with Platform space.
        
        let ballAngleInTower = (Math.PI / 2 - this.tower.rotation.y + Math.PI) % (Math.PI * 2);
        if (ballAngleInTower < 0) ballAngleInTower += Math.PI * 2;
        
        const gapCenter = platform.userData.gapCenter;
        const gapSize = platform.userData.gapSize;
        
        let diff = Math.abs(ballAngleInTower - gapCenter);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        
        const halfGap = gapSize / 2;
        const ballRadiusAngle = 0.4 / 2; 
        
        if (diff < (halfGap - ballRadiusAngle)) {
            return false; // In gap
        }
        
        return true; // Collision
    }

    resize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.threeRenderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        const threeCanvas = this.threeRenderer.domElement;
        const phaserCanvas = this.game.canvas;
        
        threeCanvas.style.width = phaserCanvas.style.width;
        threeCanvas.style.height = phaserCanvas.style.height;
        threeCanvas.style.marginLeft = phaserCanvas.style.marginLeft;
        threeCanvas.style.marginTop = phaserCanvas.style.marginTop;
        threeCanvas.style.top = phaserCanvas.style.top;
        threeCanvas.style.left = phaserCanvas.style.left;
    }
}
