import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Player {
  constructor(engine, inputManager) {
    this.engine = engine;
    this.input = inputManager;
    
    // Player mesh
    this.mesh = null;
    
    // Physics body
    this.body = null;
    
    // Camera
    this.camera = engine.camera;
    
    // Player stats
    this.stats = {
      moveSpeed: 5,
      sprintMultiplier: 1.5,
      jumpForce: 7,
      maxHealth: 100,
      health: 100
    };
    
    // Player state
    this.state = {
      isGrounded: false,
      isJumping: false,
      isSprinting: false,
      hasBall: false,
      lastJumpTime: 0,
      jumpCooldown: 0.3 // seconds
    };
    
    // Abilities
    this.abilities = {
      photonBlaster: {
        isActive: false,
        cooldown: 2,
        lastUsed: 0
      },
      gravityBoots: {
        isActive: false,
        cooldown: 5,
        lastUsed: 0
      }
    };
  }
  
  async init() {
    // Create player mesh (temporary box for now)
    this.createPlayerMesh();
    
    // Create physics body
    this.createPhysicsBody();
    
    // Add to scene
    this.engine.scene.add(this.mesh);
    
    console.log('Player initialized');
    return true;
  }
  
  createPlayerMesh() {
    // Create a simple box for now (placeholder for character model)
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x3333ff });
    this.mesh = new THREE.Mesh(geometry, material);
    
    // Position the mesh
    this.mesh.position.set(0, 2, 0);
    
    // Enable shadow casting and receiving
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }
  
  createPhysicsBody() {
    // Create a physics body for the player
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5));
    this.body = new CANNON.Body({
      mass: 70, // kg
      material: this.engine.defaultMaterial
    });
    this.body.addShape(shape);
    this.body.position.set(0, 2, 0);
    
    // Add body to the physics world
    this.engine.world.addBody(this.body);
    
    // Setup contact detection for ground check
    this.body.addEventListener('collide', (event) => {
      // Check if collision is with ground or other objects
      // For now, simply set grounded to true on any collision
      this.state.isGrounded = true;
    });
  }
  
  update(deltaTime) {
    // Handle player input
    this.handleInput(deltaTime);
    
    // Check abilities cooldowns
    this.updateAbilities(deltaTime);
    
    // Update mesh position to match physics body
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
    
    // Update third-person camera position
    this.updateCamera();
  }
  
  handleInput(deltaTime) {
    // Get movement direction from input manager
    const direction = this.input.getMovementDirection();
    
    // Apply movement force based on direction
    if (direction.x !== 0 || direction.z !== 0) {
      // Determine movement speed (sprinting or normal)
      this.state.isSprinting = this.input.isActionActive('sprint');
      const speed = this.stats.moveSpeed * (this.state.isSprinting ? this.stats.sprintMultiplier : 1);
      
      // Convert to a world space direction based on camera orientation
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();
      
      // Calculate the right vector relative to the camera
      const rightVector = new THREE.Vector3();
      rightVector.crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection).normalize();
      
      // Calculate the movement vector
      const moveVector = new THREE.Vector3();
      moveVector.addScaledVector(cameraDirection, -direction.z); // Forward/back (inverted Z)
      moveVector.addScaledVector(rightVector, direction.x); // Left/right
      moveVector.normalize().multiplyScalar(speed);
      
      // Apply the movement force to the physics body
      this.body.velocity.x = moveVector.x;
      this.body.velocity.z = moveVector.z;
      
      // Rotate player to face movement direction
      if (moveVector.length() > 0.1) {
        const targetRotation = Math.atan2(moveVector.x, moveVector.z);
        const currentRotation = this.body.quaternion.toEuler().y;
        
        // Smoothly rotate towards the target direction
        const rotationSpeed = 10;
        let newRotation = currentRotation + (targetRotation - currentRotation) * Math.min(rotationSpeed * deltaTime, 1);
        
        // Apply rotation to the physics body
        const euler = new CANNON.Vec3(0, newRotation, 0);
        this.body.quaternion.setFromEuler(euler);
      }
    } else {
      // If no movement input, keep vertical velocity but stop horizontal movement
      this.body.velocity.x = 0;
      this.body.velocity.z = 0;
    }
    
    // Handle jump
    if (this.input.isActionActive('jump') && this.state.isGrounded) {
      const now = performance.now() / 1000;
      if (now - this.state.lastJumpTime > this.state.jumpCooldown) {
        this.jump();
        this.state.lastJumpTime = now;
      }
    }
    
    // Handle pass (primary action)
    if (this.input.isActionActive('pass')) {
      this.pass();
    }
    
    // Handle tackle/punt blast (secondary action)
    if (this.input.isActionActive('tackle')) {
      this.usePhotonBlaster();
    }
    
    // Handle interaction
    if (this.input.isActionActive('interact')) {
      this.interact();
    }
  }
  
  jump() {
    if (this.state.isGrounded) {
      // Apply upward impulse for jumping
      this.body.velocity.y = this.stats.jumpForce;
      this.state.isGrounded = false;
      this.state.isJumping = true;
      
      console.log('Player jumped');
    }
  }
  
  pass() {
    if (this.state.hasBall) {
      // Implement ball passing/kicking logic
      console.log('Player passed the ball');
      this.state.hasBall = false;
    }
  }
  
  usePhotonBlaster() {
    const now = performance.now() / 1000;
    if (now - this.abilities.photonBlaster.lastUsed > this.abilities.photonBlaster.cooldown) {
      // Implement photon blaster logic
      console.log('Player used Photon Blaster');
      this.abilities.photonBlaster.lastUsed = now;
    }
  }
  
  interact() {
    // Implement interaction with objects/pickups
    console.log('Player interacted');
  }
  
  updateCamera() {
    // Get player position
    const playerPos = this.mesh.position.clone();
    
    // Set camera position behind and above player
    const cameraOffset = new THREE.Vector3(0, 3, 7); // Offset from player
    const cameraPos = playerPos.clone().add(cameraOffset);
    
    // Smoothly move camera to new position
    this.camera.position.lerp(cameraPos, 0.1);
    
    // Look at player (slightly above player's head)
    const targetPos = playerPos.clone().add(new THREE.Vector3(0, 1, 0));
    this.camera.lookAt(targetPos);
  }
  
  updateAbilities(deltaTime) {
    // Update cooldowns and status of abilities
    const now = performance.now() / 1000;
    
    this.abilities.photonBlaster.isActive = 
      (now - this.abilities.photonBlaster.lastUsed <= this.abilities.photonBlaster.cooldown);
      
    this.abilities.gravityBoots.isActive = 
      (now - this.abilities.gravityBoots.lastUsed <= this.abilities.gravityBoots.cooldown);
  }
  
  takeDamage(amount) {
    this.stats.health = Math.max(0, this.stats.health - amount);
    console.log(`Player took ${amount} damage, health: ${this.stats.health}`);
    
    if (this.stats.health <= 0) {
      this.die();
    }
  }
  
  heal(amount) {
    this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
    console.log(`Player healed ${amount}, health: ${this.stats.health}`);
  }
  
  die() {
    console.log('Player died');
    // Implement death logic
  }
}
