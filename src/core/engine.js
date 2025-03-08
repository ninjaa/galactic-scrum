import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Engine {
  constructor() {
    // Three.js properties
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Physics world
    this.world = null;
    
    // Lighting
    this.ambientLight = null;
    this.directionalLight = null;
    
    // Camera settings
    this.cameraSettings = {
      fov: 75,
      near: 0.1,
      far: 1000,
      position: new THREE.Vector3(0, 10, 20),
      lookAt: new THREE.Vector3(0, 0, 0)
    };
    
    // Container element
    this.container = document.getElementById('game-container');
    
    // Update list for objects that need to be updated each frame
    this.updateList = [];
  }
  
  async init() {
    console.log('Initializing 3D engine...');
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue color
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      this.cameraSettings.fov,
      window.innerWidth / window.innerHeight,
      this.cameraSettings.near,
      this.cameraSettings.far
    );
    this.camera.position.copy(this.cameraSettings.position);
    this.camera.lookAt(this.cameraSettings.lookAt);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Add orbit controls (helpful for development)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false; // Disable by default, enable for debugging
    
    // Add lights
    this.setupLights();
    
    // Initialize physics world
    this.setupPhysicsWorld();
    
    // Handle window resize
    window.addEventListener('resize', () => this.resize());
    
    console.log('3D engine initialized successfully!');
    return true;
  }
  
  setupLights() {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(this.ambientLight);
    
    // Directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    
    // Configure shadow properties
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -25;
    this.directionalLight.shadow.camera.right = 25;
    this.directionalLight.shadow.camera.top = 25;
    this.directionalLight.shadow.camera.bottom = -25;
    
    this.scene.add(this.directionalLight);
  }
  
  setupPhysicsWorld() {
    // Create physics world with Earth gravity
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0)
    });
    
    // Set solver iterations
    this.world.solver.iterations = 10;
    
    // Set damping to stabilize the physics simulation
    this.world.defaultContactMaterial.contactEquationStiffness = 1e6;
    this.world.defaultContactMaterial.contactEquationRelaxation = 3;
    
    // Create default material
    this.defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.defaultMaterial,
      {
        friction: 0.3,
        restitution: 0.3
      }
    );
    this.world.addContactMaterial(defaultContactMaterial);
  }
  
  resize() {
    // Update camera aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  updatePhysics(deltaTime) {
    // Update physics world
    // Cap the delta time to prevent huge jumps after pausing/lagging
    const maxDeltaTime = 1/30; // max 30 fps physics
    this.world.step(Math.min(deltaTime, maxDeltaTime));
    
    // Update all objects in the update list
    for (const updateFunc of this.updateList) {
      updateFunc(deltaTime);
    }
  }
  
  // Add a function to the update list
  addToUpdateList(updateFunc) {
    this.updateList.push(updateFunc);
  }
  
  // Remove a function from the update list
  removeFromUpdateList(updateFunc) {
    const index = this.updateList.indexOf(updateFunc);
    if (index !== -1) {
      this.updateList.splice(index, 1);
    }
  }
  
  // Helper function to create a skybox
  createSkybox(texturePath) {
    const geometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const material = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load(texturePath),
      side: THREE.BackSide
    });
    const skybox = new THREE.Mesh(geometry, material);
    this.scene.add(skybox);
    return skybox;
  }
}
