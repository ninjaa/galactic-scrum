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
    
    // Create dynamic sky based on time of day
    this.createDynamicSky();
    
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
  
  // Create a dynamic sky based on current time of day
  createDynamicSky() {
    // Create a large sphere for the sky dome
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    
    // Get current time to determine sky color
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Colors for different times of day
    let topColor, bottomColor, horizonColor;
    
    // Early morning (5-7 AM): Dawn colors
    if (hours >= 5 && hours < 7) {
      topColor = new THREE.Color(0x0a1a40); // Deep blue
      horizonColor = new THREE.Color(0xf08c78); // Orange-pink
      bottomColor = new THREE.Color(0x6a041d); // Deep red-purple
    }
    // Morning (7-10 AM): Bright morning
    else if (hours >= 7 && hours < 10) {
      topColor = new THREE.Color(0x5d9fe3); // Light blue
      horizonColor = new THREE.Color(0xf9e0c0); // Light peach
      bottomColor = new THREE.Color(0x87ceeb); // Sky blue
    }
    // Midday (10 AM-4 PM): Bright blue
    else if (hours >= 10 && hours < 16) {
      topColor = new THREE.Color(0x0051a8); // Deep blue
      horizonColor = new THREE.Color(0x87ceeb); // Sky blue
      bottomColor = new THREE.Color(0xd5e8f7); // Light blue-white
    }
    // Afternoon (4-7 PM): Golden hour
    else if (hours >= 16 && hours < 19) {
      topColor = new THREE.Color(0x0066b3); // Medium blue
      horizonColor = new THREE.Color(0xffa756); // Golden-orange
      bottomColor = new THREE.Color(0xe8e8e8); // Light white-blue
    }
    // Evening (7-9 PM): Sunset
    else if (hours >= 19 && hours < 21) {
      topColor = new THREE.Color(0x0a2351); // Deep blue
      horizonColor = new THREE.Color(0xff6b35); // Orange-red
      bottomColor = new THREE.Color(0x7b4d7b); // Purple
    }
    // Night (9 PM-5 AM): Night sky with stars
    else {
      topColor = new THREE.Color(0x0a0e29); // Very dark blue
      horizonColor = new THREE.Color(0x21294d); // Dark blue-purple
      bottomColor = new THREE.Color(0x0a0e29); // Very dark blue
    }
    
    // Create custom shader material for gradient sky
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: topColor },
        bottomColor: { value: bottomColor },
        horizonColor: { value: horizonColor },
        offset: { value: 50 },
        exponent: { value: 0.8 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 horizonColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          float blend1 = max(0.0, min(1.0, (h * 5.0) + 0.5));
          float blend2 = max(0.0, min(1.0, (h * 5.0) - 2.0));
          vec3 col;
          if (h < 0.0) {
            col = mix(bottomColor, horizonColor, blend1);
          } else {
            col = mix(horizonColor, topColor, blend2);
          }
          
          // Add stars at night
          if (topColor.r < 0.1 && topColor.g < 0.1 && topColor.b < 0.3) {
            float starIntensity = 0.0;
            if (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) > 0.997) {
              starIntensity = 1.0 * max(0.0, h); // Only stars in upper part of sky
            }
            col = mix(col, vec3(1.0, 1.0, 1.0), starIntensity);
          }
          
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    // Create and add the sky dome
    this.skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skyDome);
    
    // Position the sun/moon based on time of day
    this.updateCelestialLightPosition(hours, minutes);
    
    console.log(`Dynamic sky created for current time: ${hours}:${minutes < 10 ? '0' + minutes : minutes}`);
  }
  
  // Position the main directional light as sun/moon based on time
  updateCelestialLightPosition(hours, minutes) {
    // Full day cycle is mapped to a circular path
    // Morning starts with sun in the east (90 degrees)
    // Noon has sun directly overhead (180 degrees)
    // Evening has sun in the west (270 degrees)
    // Night has moon following similar path
    
    const totalMinutes = hours * 60 + minutes;
    const dayMinutes = 24 * 60;
    const angle = (totalMinutes / dayMinutes) * Math.PI * 2 - Math.PI/2;
    
    const radius = 40;
    const height = Math.sin(angle) * radius;
    const horizontal = Math.cos(angle) * radius;
    
    // Position the directional light
    if (this.directionalLight) {
      this.directionalLight.position.set(horizontal, Math.max(1, height), 0);
      
      // Adjust light color and intensity based on time of day
      if (hours >= 7 && hours < 19) {
        // Daytime: bright white-yellow
        const intensity = Math.min(1.0, Math.sin((hours - 6) / 12 * Math.PI));
        this.directionalLight.color.setHSL(0.1, 0.2, 0.5 + intensity * 0.5);
        this.directionalLight.intensity = 0.5 + intensity * 0.5;
      } else {
        // Nighttime: dim blue moonlight
        this.directionalLight.color.setHSL(0.6, 0.2, 0.5);
        this.directionalLight.intensity = 0.3;
        this.ambientLight.intensity = 0.2;
      }
    }
  }
}
