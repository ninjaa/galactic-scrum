import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Zorgonaut {
  constructor(engine, position, player) {
    this.engine = engine;
    this.player = player;
    
    // Zorgonaut mesh
    this.mesh = null;
    
    // Physics body
    this.body = null;
    
    // Starting position
    this.startPosition = position || new THREE.Vector3(0, 2, -10);
    
    // Zorgonaut stats
    this.stats = {
      moveSpeed: 3.5,
      chaseSpeed: 5,
      jumpForce: 6,
      attackRange: 2,
      viewDistance: 15,
      health: 50,
      damage: 10,
      stunDuration: 3, // seconds
    };
    
    // Zorgonaut state
    this.state = {
      isGrounded: false,
      isChasing: false,
      isStunned: false,
      isDead: false,
      isAttacking: false,
      lastAttackTime: 0,
      attackCooldown: 1.5, // seconds
      patrolPoint1: new THREE.Vector3(position.x - 5, position.y, position.z),
      patrolPoint2: new THREE.Vector3(position.x + 5, position.y, position.z),
      currentPatrolTarget: 0, // 0: point1, 1: point2
      lastStunnedTime: 0
    };
    
    // For time tracking
    this.clock = new THREE.Clock();
  }
  
  async init() {
    // Create Zorgonaut mesh (alien-like creature)
    this.createZorgonautMesh();
    
    // Create physics body
    this.createPhysicsBody();
    
    // Add to scene
    this.engine.scene.add(this.mesh);
    
    console.log('Zorgonaut initialized at', this.startPosition);
    return true;
  }
  
  createZorgonautMesh() {
    // Create a distinctive alien body - taller and thinner than player
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Create the head - large oval alien head
    const headGeometry = new THREE.SphereGeometry(0.7, 16, 12);
    headGeometry.scale(0.8, 1.2, 0.8); // Make it oval
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x00dd00 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.3;
    this.mesh.add(head);
    
    // Create eyes - large black alien eyes
    const leftEyeGeometry = new THREE.SphereGeometry(0.2, 16, 8);
    leftEyeGeometry.scale(1, 1.5, 0.5);
    const rightEyeGeometry = new THREE.SphereGeometry(0.2, 16, 8);
    rightEyeGeometry.scale(1, 1.5, 0.5);
    
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(leftEyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(rightEyeGeometry, eyeMaterial);
    
    // Position eyes on the head
    leftEye.position.set(0.25, 0.1, 0.5);
    leftEye.rotation.y = Math.PI / 6;
    rightEye.position.set(-0.25, 0.1, 0.5);
    rightEye.rotation.y = -Math.PI / 6;
    
    head.add(leftEye);
    head.add(rightEye);
    
    // Position the mesh
    this.mesh.position.copy(this.startPosition);
    
    // Enable shadow casting and receiving
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }
  
  createPhysicsBody() {
    // Create a physics body for the Zorgonaut
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 1.25, 0.5));
    this.body = new CANNON.Body({
      mass: 60, // kg
      material: this.engine.defaultMaterial
    });
    this.body.addShape(shape);
    this.body.position.copy(this.startPosition);
    
    // Add body to the physics world
    this.engine.world.addBody(this.body);
    
    // Setup contact detection for ground check
    this.body.addEventListener('collide', (event) => {
      // Check if collision is with ground (similar to player ground detection)
      const contact = event.contact;
      
      const normalWorldOnA = new CANNON.Vec3();
      contact.ni.copy(normalWorldOnA);
      
      if (this.body.id === contact.bi.id) {
        if (normalWorldOnA.y > 0.5) {
          this.state.isGrounded = true;
        }
      } else {
        normalWorldOnA.negate(normalWorldOnA);
        if (normalWorldOnA.y > 0.5) {
          this.state.isGrounded = true;
        }
      }
    });
  }
  
  update(deltaTime) {
    if (this.state.isDead) return;
    
    // Reset grounded state
    this.state.isGrounded = false;
    
    // Handle stunned state
    if (this.state.isStunned) {
      const now = performance.now() / 1000;
      if (now - this.state.lastStunnedTime > this.stats.stunDuration) {
        this.state.isStunned = false;
        // Change color back to normal
        this.mesh.material.color.set(0x00ff00);
        this.mesh.children[0].material.color.set(0x00dd00);
      } else {
        // Still stunned, don't move
        return;
      }
    }
    
    // Check if player is in view distance
    const distanceToPlayer = this.mesh.position.distanceTo(this.player.mesh.position);
    const isPlayerInRange = distanceToPlayer < this.stats.viewDistance;
    
    if (isPlayerInRange) {
      // Chase player
      this.state.isChasing = true;
      this.chasePlayer(deltaTime);
    } else {
      // Patrol area
      this.state.isChasing = false;
      this.patrol(deltaTime);
    }
    
    // Check if close enough to attack
    if (distanceToPlayer < this.stats.attackRange) {
      this.tryAttack();
    }
    
    // Update mesh position to match physics body
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
  
  patrol(deltaTime) {
    // Simple patrol between two points
    const targetPoint = this.state.currentPatrolTarget === 0 
      ? this.state.patrolPoint1 
      : this.state.patrolPoint2;
    
    // Calculate direction to target
    const direction = new THREE.Vector3();
    direction.subVectors(targetPoint, this.mesh.position);
    direction.y = 0; // Keep y level
    
    // Check if we've reached the target point
    if (direction.length() < 0.5) {
      // Switch to other patrol point
      this.state.currentPatrolTarget = 1 - this.state.currentPatrolTarget;
      return;
    }
    
    // Normalize and scale by speed
    direction.normalize().multiplyScalar(this.stats.moveSpeed * deltaTime);
    
    // Apply movement to physics body
    this.body.velocity.x = direction.x;
    this.body.velocity.z = direction.z;
    
    // Rotate to face movement direction
    if (direction.length() > 0.1) {
      const targetRotation = Math.atan2(direction.x, direction.z);
      
      // Get current rotation
      const euler = new CANNON.Vec3();
      this.body.quaternion.toEuler(euler);
      const currentRotation = euler.y;
      
      // Smoothly rotate towards the target direction
      const rotationSpeed = 5;
      let newRotation = currentRotation + (targetRotation - currentRotation) * Math.min(rotationSpeed * deltaTime, 1);
      
      // Apply rotation to the physics body
      euler.set(0, newRotation, 0);
      this.body.quaternion.setFromEuler(euler.x, euler.y, euler.z);
    }
  }
  
  chasePlayer(deltaTime) {
    // Calculate direction to player
    const direction = new THREE.Vector3();
    direction.subVectors(this.player.mesh.position, this.mesh.position);
    direction.y = 0; // Keep y level
    
    // Normalize and scale by chase speed
    direction.normalize().multiplyScalar(this.stats.chaseSpeed * deltaTime);
    
    // Apply movement to physics body
    this.body.velocity.x = direction.x;
    this.body.velocity.z = direction.z;
    
    // Rotate to face player
    if (direction.length() > 0.1) {
      const targetRotation = Math.atan2(direction.x, direction.z);
      
      // Get current rotation
      const euler = new CANNON.Vec3();
      this.body.quaternion.toEuler(euler);
      const currentRotation = euler.y;
      
      // Smoothly rotate towards the target direction
      const rotationSpeed = 8; // Faster rotation when chasing
      let newRotation = currentRotation + (targetRotation - currentRotation) * Math.min(rotationSpeed * deltaTime, 1);
      
      // Apply rotation to the physics body
      euler.set(0, newRotation, 0);
      this.body.quaternion.setFromEuler(euler.x, euler.y, euler.z);
    }
    
    // Make Zorgonaut jump if blocked by an obstacle
    if (this.state.isGrounded && Math.random() < 0.01) {
      this.jump();
    }
  }
  
  jump() {
    if (this.state.isGrounded) {
      // Apply upward impulse for jumping
      this.body.velocity.y = this.stats.jumpForce;
      this.state.isGrounded = false;
    }
  }
  
  tryAttack() {
    const now = performance.now() / 1000;
    if (now - this.state.lastAttackTime < this.stats.attackCooldown) {
      return; // Still on cooldown
    }
    
    // Perform attack
    this.state.isAttacking = true;
    this.state.lastAttackTime = now;
    
    // Visual feedback - brief color change
    const originalBodyColor = this.mesh.material.color.clone();
    const originalHeadColor = this.mesh.children[0].material.color.clone();
    
    this.mesh.material.color.set(0xff0000);
    this.mesh.children[0].material.color.set(0xee0000);
    
    // Apply damage to player
    this.player.takeDamage(this.stats.damage);
    
    console.log('Zorgonaut attacked player for', this.stats.damage, 'damage!');
    
    // Reset attack state and color after brief delay
    setTimeout(() => {
      this.state.isAttacking = false;
      this.mesh.material.color.copy(originalBodyColor);
      this.mesh.children[0].material.color.copy(originalHeadColor);
    }, 200);
  }
  
  getStunned() {
    if (this.state.isStunned) return; // Already stunned
    
    // Set stunned state
    this.state.isStunned = true;
    this.state.lastStunnedTime = performance.now() / 1000;
    
    // Visual feedback - freeze color (cyan)
    this.mesh.material.color.set(0x00ffff);
    this.mesh.children[0].material.color.set(0x00ffff);
    
    // Stop movement
    this.body.velocity.set(0, 0, 0);
    
    console.log('Zorgonaut stunned by Photon Blaster!');
  }
  
  takeDamage(amount) {
    this.stats.health -= amount;
    console.log('Zorgonaut took', amount, 'damage! Health:', this.stats.health);
    
    if (this.stats.health <= 0) {
      this.die();
    }
  }
  
  die() {
    // Set dead state
    this.state.isDead = true;
    
    // Visual feedback
    this.mesh.material.color.set(0x333333);
    this.mesh.children[0].material.color.set(0x333333);
    
    // Make the body fall
    this.body.velocity.set(0, 0, 0);
    
    // Rotate to lying position
    const euler = new CANNON.Vec3(Math.PI/2, 0, 0);
    this.body.quaternion.setFromEuler(euler.x, euler.y, euler.z);
    
    console.log('Zorgonaut defeated!');
    
    // Remove after delay
    setTimeout(() => {
      this.engine.scene.remove(this.mesh);
      this.engine.world.removeBody(this.body);
    }, 5000);
  }
}