import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Zorgonaut } from '../character/zorgonaut.js';

export class KansasLevel {
  constructor(engine) {
    this.engine = engine;
    this.scene = engine.scene;
    this.world = engine.world;
    
    // Level objects
    this.ground = null;
    this.cropCircles = [];
    this.obstacles = [];
    this.enemies = [];
    this.goalZone = null;
    
    // Player reference
    this.player = null;
    
    // Level parameters
    this.levelSize = 100; // Size of the level square
    this.cropCirclePatterns = [
      { radius: 10, position: { x: -15, y: 0, z: -15 } },
      { radius: 15, position: { x: 20, y: 0, z: 10 } },
      { radius: 8, position: { x: 0, y: 0, z: -30 } },
      { radius: 12, position: { x: -25, y: 0, z: 25 } }
    ];
  }
  
  async load() {
    console.log('Loading Kansas level...');
    
    // Create the ground
    this.createGround();
    
    // Create crop circles
    this.createCropCircles();
    
    // Create obstacles
    this.createObstacles();
    
    // Create goal zone
    this.createGoalZone();
    
    // Enemies will be created after player is added
    
    console.log('Kansas level loaded successfully!');
    return true;
  }
  
  createGround() {
    // Create ground material
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x556b2f // Dark olive green for farmland
    });
    
    // Create ground mesh
    const groundGeometry = new THREE.PlaneGeometry(this.levelSize, this.levelSize, 10, 10);
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    
    // Create ground physics body
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0, // Static body
      material: this.engine.defaultMaterial
    });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Align with mesh
    this.world.addBody(groundBody);
  }
  
  createCropCircles() {
    // Create crop circle pattern in the ground
    const cropCircleMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x90ee90 // Light green for crops
    });
    
    // Create crop circles based on patterns
    this.cropCirclePatterns.forEach(pattern => {
      const { radius, position } = pattern;
      
      // Create crop circle mesh
      const circleGeometry = new THREE.CircleGeometry(radius, 32);
      const circleMesh = new THREE.Mesh(circleGeometry, cropCircleMaterial);
      circleMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
      circleMesh.position.set(position.x, 0.01, position.z); // Slightly above ground to prevent z-fighting
      circleMesh.receiveShadow = true;
      this.scene.add(circleMesh);
      
      this.cropCircles.push(circleMesh);
    });
  }
  
  createObstacles() {
    // Create some obstacles like tractors, scarecrows, etc.
    
    // For now, let's create simple cube obstacles
    const obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0xbA4A00 }); // Brown for wood/metal
    
    // Create a few obstacles
    const obstaclePositions = [
      { x: -10, y: 1, z: -5, size: { x: 2, y: 2, z: 2 } },
      { x: 15, y: 1, z: 15, size: { x: 3, y: 2, z: 1 } },
      { x: -15, y: 1, z: 20, size: { x: 1, y: 3, z: 1 } }
    ];
    
    obstaclePositions.forEach(pos => {
      // Create mesh
      const obstacleGeometry = new THREE.BoxGeometry(pos.size.x, pos.size.y, pos.size.z);
      const obstacleMesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
      obstacleMesh.position.set(pos.x, pos.y, pos.z);
      obstacleMesh.castShadow = true;
      obstacleMesh.receiveShadow = true;
      this.scene.add(obstacleMesh);
      
      // Create physics body
      const obstacleShape = new CANNON.Box(new CANNON.Vec3(pos.size.x/2, pos.size.y/2, pos.size.z/2));
      const obstacleBody = new CANNON.Body({
        mass: 0, // Static body
        material: this.engine.defaultMaterial
      });
      obstacleBody.addShape(obstacleShape);
      obstacleBody.position.set(pos.x, pos.y, pos.z);
      this.world.addBody(obstacleBody);
      
      this.obstacles.push({ mesh: obstacleMesh, body: obstacleBody });
    });
  }
  
  createGoalZone() {
    // Create goal zone at the end of the level
    const goalMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffd700, // Gold color
      transparent: true,
      opacity: 0.5
    });
    
    // Goal zone is a rectangular area
    const goalGeometry = new THREE.BoxGeometry(10, 1, 5);
    this.goalZone = new THREE.Mesh(goalGeometry, goalMaterial);
    this.goalZone.position.set(40, 0.5, 0); // Far end of the level
    this.scene.add(this.goalZone);
    
    // No physics body needed for the goal zone, just use its bounding box for detection
  }
  
  async createEnemies() {
    // Create Zorgonaut defenders
    if (!this.player) {
      console.warn('Cannot create enemies without player reference');
      return;
    }
    
    // Define enemy positions around the level
    const enemyPositions = [
      { x: 10, y: 2, z: 0 },      // First enemy near the beginning
      { x: 20, y: 2, z: -10 },    // Second enemy to the side
      { x: 30, y: 2, z: 5 },      // Third enemy guarding the goal
      { x: 0, y: 2, z: 15 },      // Additional enemy
      { x: -15, y: 2, z: -20 }    // Enemy near crop circles
    ];
    
    // Create Zorgonaut enemies
    for (const pos of enemyPositions) {
      const position = new THREE.Vector3(pos.x, pos.y, pos.z);
      const zorgonaut = new Zorgonaut(this.engine, position, this.player);
      await zorgonaut.init();
      this.enemies.push(zorgonaut);
    }
    
    console.log(`Created ${this.enemies.length} Zorgonaut enemies`);
  }
  
  async addPlayer(player) {
    this.player = player;
    
    // Position player at the start of the level
    player.body.position.set(-40, 2, 0);
    player.mesh.position.copy(player.body.position);
    
    // Now that we have a player reference, create enemies
    await this.createEnemies();
  }
  
  update(deltaTime) {
    // Check if player has reached the goal
    if (this.player && this.goalZone) {
      const playerPos = this.player.mesh.position;
      const goalPos = this.goalZone.position;
      
      // Simple distance check for goal zone
      const distance = playerPos.distanceTo(goalPos);
      if (distance < 7) { // If player is close to the goal
        console.log('Player reached the goal zone!');
        // Here we would typically trigger level completion logic
      }
    }
    
    // Update enemies
    for (const enemy of this.enemies) {
      enemy.update(deltaTime);
    }
    
    // Check for collisions between photon blaster and enemies
    this.checkPhotonBlasterHits();
  }
  
  // Check if the player's photon blaster hit any enemies
  checkPhotonBlasterHits() {
    // If player doesn't have an active photon blast, skip check
    if (!this.player || !this.player.abilities.photonBlaster.isActive) {
      return;
    }
    
    // Get player forward direction for beam
    const playerDirection = new THREE.Vector3(0, 0, -1);
    playerDirection.applyQuaternion(this.player.mesh.quaternion);
    playerDirection.normalize();
    
    // Cast a ray from player position
    const raycaster = new THREE.Raycaster(
      this.player.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)),
      playerDirection,
      0,
      15
    );
    
    // Check for intersections with enemy meshes
    for (const enemy of this.enemies) {
      if (enemy.state.isStunned || enemy.state.isDead) continue;
      
      // Using a simple distance/direction check 
      const toEnemy = new THREE.Vector3();
      toEnemy.subVectors(enemy.mesh.position, this.player.mesh.position);
      
      // Check if enemy is in front of player
      const angleBetween = playerDirection.angleTo(toEnemy.normalize());
      
      // If enemy is roughly in front of player and within range
      if (angleBetween < 0.3 && toEnemy.length() < 15) {
        console.log('Photon Blaster hit Zorgonaut!');
        enemy.getStunned();
      }
    }
  }
}
