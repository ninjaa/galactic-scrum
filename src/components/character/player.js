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
      hasBall: true, // Start with a ball
      lastJumpTime: 0,
      lastGroundedTime: 0,
      jumpCooldown: 0.3, // seconds
      lastGroundedState: false
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
      // For this check, we'll determine if the contact normal is pointing roughly upwards
      const contact = event.contact;
      
      // The contact normal points from body1 to body2
      const normalWorldOnA = new CANNON.Vec3();
      contact.ni.copy(normalWorldOnA);
      
      // If this body is the first one in the collision
      if (this.body.id === contact.bi.id) {
        // The normal is already pointing from this body, so a positive y means "ground"
        if (normalWorldOnA.y > 0.5) {
          this.state.isGrounded = true;
          this.state.lastGroundedTime = performance.now() / 1000;
        }
      } else {
        // Otherwise, the normal is pointing toward this body, so negate it
        normalWorldOnA.negate(normalWorldOnA);
        if (normalWorldOnA.y > 0.5) {
          this.state.isGrounded = true;
          this.state.lastGroundedTime = performance.now() / 1000;
        }
      }
    });
  }
  
  update(deltaTime) {
    // Reset grounded state each frame - will be set to true by collision callbacks if needed
    // Set a small grace period so jumping feels more responsive
    const now = performance.now() / 1000;
    if (now - this.state.lastGroundedTime > 0.1) {
      this.state.isGrounded = false;
    }
    
    // Handle player input
    this.handleInput(deltaTime);
    
    // Check abilities cooldowns
    this.updateAbilities(deltaTime);
    
    // Update mesh position to match physics body
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
    
    // Update third-person camera position
    this.updateCamera();
    
    // Debug output
    if (this.state.isGrounded !== this.state.lastGroundedState) {
      this.state.lastGroundedState = this.state.isGrounded;
      console.log('Player grounded state:', this.state.isGrounded);
    }
  }
  
  handleInput(deltaTime) {
    // Get movement direction from input manager
    const direction = this.input.getMovementDirection();
    
    // Apply movement force based on direction
    if (direction.x !== 0 || direction.z !== 0) {
      // Determine movement speed (sprinting or normal)
      this.state.isSprinting = this.input.isActionActive('sprint');
      const speed = this.stats.moveSpeed * (this.state.isSprinting ? this.stats.sprintMultiplier : 1);
      
      // Debug sprint status
      if (this.state.isSprinting) {
        console.log('Player is sprinting at speed:', speed);
      }
      
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
      moveVector.addScaledVector(rightVector, -direction.x); // Left/right (inverted X to fix direction)
      moveVector.normalize().multiplyScalar(speed);
      
      // Apply the movement force to the physics body
      this.body.velocity.x = moveVector.x;
      this.body.velocity.z = moveVector.z;
      
      // Visual effect for sprint - add blur lines behind player
      if (this.state.isSprinting && Math.random() > 0.7) { // Only add particles occasionally
        const lineGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.5);
        const lineMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x3333ff,
          transparent: true,
          opacity: 0.3
        });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        
        // Position slightly behind player in movement direction
        const linePos = this.mesh.position.clone();
        linePos.y += Math.random() * 1.5; // Random height
        
        // Position based on movement direction
        linePos.x -= moveVector.x * (Math.random() * 0.5 + 0.5);
        linePos.z -= moveVector.z * (Math.random() * 0.5 + 0.5);
        
        line.position.copy(linePos);
        
        // Add to scene
        this.engine.scene.add(line);
        
        // Remove after short time
        setTimeout(() => {
          this.engine.scene.remove(line);
        }, 300);
      }
      
      // Rotate player to face movement direction
      if (moveVector.length() > 0.1) {
        const targetRotation = Math.atan2(moveVector.x, moveVector.z);
        
        // Get current rotation using a temporary Euler vector
        const euler = new CANNON.Vec3();
        this.body.quaternion.toEuler(euler);
        const currentRotation = euler.y;
        
        // Smoothly rotate towards the target direction
        const rotationSpeed = 10;
        let newRotation = currentRotation + (targetRotation - currentRotation) * Math.min(rotationSpeed * deltaTime, 1);
        
        // Apply rotation to the physics body
        euler.set(0, newRotation, 0);
        this.body.quaternion.setFromEuler(euler.x, euler.y, euler.z);
      }
    } else {
      // If no movement input, keep vertical velocity but stop horizontal movement
      this.body.velocity.x = 0;
      this.body.velocity.z = 0;
    }
    
    // Check if we're grounded manually (as a fallback)
    // If player is not moving vertically (or very slightly), consider them grounded
    if (Math.abs(this.body.velocity.y) < 0.1) {
      this.state.isGrounded = true;
      this.state.lastGroundedTime = performance.now() / 1000;
    }
    
    // Handle jump
    if (this.input.isActionActive('jump')) {
      console.log('Jump action detected, grounded state:', this.state.isGrounded);
      if (this.state.isGrounded) {
        const now = performance.now() / 1000;
        if (now - this.state.lastJumpTime > this.state.jumpCooldown) {
          this.jump();
          this.state.lastJumpTime = now;
        }
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
    console.log('Jump method called. isGrounded:', this.state.isGrounded);
    
    if (this.state.isGrounded) {
      // Apply upward impulse for jumping
      this.body.velocity.y = this.stats.jumpForce;
      this.state.isGrounded = false;
      this.state.isJumping = true;
      
      console.log('Player jumped with force:', this.stats.jumpForce);
    } else {
      console.log('Jump failed - not grounded');
    }
  }
  
  pass() {
    if (this.state.hasBall) {
      // Create and throw the rugby ball
      this.createAndThrowBall();
      console.log('Player passed the ball');
      this.state.hasBall = false;
    } else {
      console.log('Player tried to pass but has no ball');
    }
  }
  
  createAndThrowBall() {
    // Create a rugby ball mesh (simplified as ellipsoid)
    const ballGeometry = new THREE.SphereGeometry(0.3, 16, 12);
    ballGeometry.scale(1, 0.7, 0.7); // Make it oval-shaped
    const ballMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    
    // Position the ball in front of the player
    const playerDirection = new THREE.Vector3(0, 0, -1);
    playerDirection.applyQuaternion(this.mesh.quaternion);
    playerDirection.normalize();
    
    const ballPosition = this.mesh.position.clone();
    ballPosition.add(playerDirection.multiplyScalar(1.5)); // 1.5 units in front
    ballPosition.y += 1.0; // Slightly above player's "hands"
    ballMesh.position.copy(ballPosition);
    
    // Add to scene
    this.engine.scene.add(ballMesh);
    
    // Create physics body for the ball
    const ballShape = new CANNON.Sphere(0.3);
    const ballBody = new CANNON.Body({
      mass: 0.5, // kg
      material: this.engine.defaultMaterial,
      shape: ballShape,
      position: new CANNON.Vec3(ballPosition.x, ballPosition.y, ballPosition.z)
    });
    
    // Apply impulse in the direction the player is facing
    const throwStrength = 12;
    const impulse = playerDirection.multiplyScalar(throwStrength);
    impulse.y = 3; // Add some upward force for a nice arc
    ballBody.applyImpulse(
      new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
      new CANNON.Vec3(0, 0, 0)
    );
    
    console.log('Ball thrown with strength:', throwStrength);
    
    // Add body to world
    this.engine.world.addBody(ballBody);
    
    // Link the mesh to the body for updates
    ballBody.userData = { mesh: ballMesh };
    
    // Add to engine's update list
    const updateFunction = () => {
      ballMesh.position.copy(ballBody.position);
      ballMesh.quaternion.copy(ballBody.quaternion);
    };
    
    // Add to update list
    this.engine.addToUpdateList(updateFunction);
    
    // Return after 5 seconds
    setTimeout(() => {
      this.engine.removeFromUpdateList(updateFunction);
      this.engine.scene.remove(ballMesh);
      this.engine.world.removeBody(ballBody);
      this.state.hasBall = true; // Get ball back after a while
      console.log('Ball returned to player');
    }, 5000);
  }
  
  usePhotonBlaster() {
    const now = performance.now() / 1000;
    if (now - this.abilities.photonBlaster.lastUsed > this.abilities.photonBlaster.cooldown) {
      // Get player's forward direction
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(this.mesh.quaternion);
      direction.normalize();
      
      // Create visual effect - a blue beam shooting forward
      const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, 15, 8);
      beamGeometry.rotateX(Math.PI / 2); // Rotate to point forward
      const beamMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7 
      });
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      
      // Position beam in front of player
      const beamPos = this.mesh.position.clone();
      beamPos.y += 1; // Eye level
      beam.position.copy(beamPos);
      beam.quaternion.copy(this.mesh.quaternion);
      
      // Add to scene
      this.engine.scene.add(beam);
      
      // Create physics ray to detect hits
      const start = new CANNON.Vec3(beamPos.x, beamPos.y, beamPos.z);
      const end = new CANNON.Vec3(
        beamPos.x + direction.x * 15,
        beamPos.y + direction.y * 15,
        beamPos.z + direction.z * 15
      );
      
      // Perform raycast manually instead of using callback
      const result = new CANNON.RaycastResult();
      this.engine.world.rayTest(start, end, result);
      
      if (result.hasHit) {
        console.log('Photon Blaster hit something!');
        
        // If we hit a body that isn't the player's, "freeze" it
        if (result.body !== this.body) {
          // Keep the original velocity to restore later
          const originalVel = result.body.velocity.clone();
          const originalAngVel = result.body.angularVelocity.clone();
          
          // "Freeze" the body by setting its velocity to zero
          result.body.velocity.set(0, 0, 0);
          result.body.angularVelocity.set(0, 0, 0);
          
          // Change material to a "frozen" look
          if (result.body.userData && result.body.userData.mesh) {
            const mesh = result.body.userData.mesh;
            const originalMaterial = mesh.material;
            mesh.material = new THREE.MeshBasicMaterial({
              color: 0x00ffff,
              transparent: true,
              opacity: 0.8
            });
            
            // Unfreeze after 3 seconds
            setTimeout(() => {
              result.body.velocity.copy(originalVel);
              result.body.angularVelocity.copy(originalAngVel);
              
              // Restore original material
              mesh.material = originalMaterial;
              
              console.log('Target unfrozen');
            }, 3000);
          }
        }
      }
      
      // Remove beam after 0.5 seconds
      setTimeout(() => {
        this.engine.scene.remove(beam);
      }, 500);
      
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
