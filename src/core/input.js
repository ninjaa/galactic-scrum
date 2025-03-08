export class InputManager {
  constructor() {
    // Keyboard state
    this.keys = {};
    
    // Mouse state
    this.mousePosition = { x: 0, y: 0 };
    this.mouseButtons = { left: false, middle: false, right: false };
    
    // Game actions
    this.actions = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      jump: false,
      sprint: false,
      pass: false,
      tackle: false,
      interact: false
    };
  }
  
  init() {
    // Keyboard event listeners
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.onKeyUp(event));
    
    console.log('Input manager initialized with keyboard-only controls');
    console.log('Movement: WASD or Arrow Keys');
    console.log('Jump: Space');
    console.log('Sprint: Shift');
    console.log('Pass/Throw: E');
    console.log('Photon Blaster: Q');
    console.log('Interact: F');
  }
  
  onKeyDown(event) {
    this.keys[event.code] = true;
    
    // Map keys to actions
    this.mapKeysToActions();
    
    // Debug key press
    console.log('Key pressed:', event.code, 'Key Name:', event.key);
    
    // Additional spacebar debugging
    if (event.code === 'Space') {
      console.log('Space key pressed!');
      this.actions.jump = true;
    }
  }
  
  onKeyUp(event) {
    this.keys[event.code] = false;
    
    // Map keys to actions
    this.mapKeysToActions();
    
    // Additional spacebar debugging
    if (event.code === 'Space') {
      console.log('Space key released!');
      this.actions.jump = false;
    }
  }
  
  // We've removed mouse handling as we're using keyboard-only controls
  
  mapKeysToActions() {
    // WASD movement
    this.actions.moveForward = this.keys['KeyW'] || this.keys['ArrowUp'] || false;
    this.actions.moveBackward = this.keys['KeyS'] || this.keys['ArrowDown'] || false;
    this.actions.moveLeft = this.keys['KeyA'] || this.keys['ArrowLeft'] || false;
    this.actions.moveRight = this.keys['KeyD'] || this.keys['ArrowRight'] || false;
    
    // Other actions - keyboard only controls
    this.actions.jump = this.keys['Space'] || false;
    this.actions.sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || false;
    this.actions.pass = this.keys['KeyE'] || false; // Pass/throw with E
    this.actions.tackle = this.keys['KeyQ'] || false; // Photon blaster with Q
    this.actions.interact = this.keys['KeyF'] || false; // Interact with F
    
    // Debug action states
    if (this.actions.jump) {
      console.log('Jump action is active');
    }
    
    if (this.actions.sprint) {
      console.log('Sprint action is active');
    }
  }
  
  update() {
    // Called every frame to check for held keys and update continuous actions
  }
  
  // Helper methods to check input states
  isKeyPressed(keyCode) {
    return this.keys[keyCode] === true;
  }
  
  isActionActive(actionName) {
    return this.actions[actionName] === true;
  }
  
  getMovementDirection() {
    // Return a normalized direction vector based on currently pressed keys
    const direction = { x: 0, z: 0 };
    
    if (this.actions.moveForward) direction.z -= 1;
    if (this.actions.moveBackward) direction.z += 1;
    if (this.actions.moveLeft) direction.x -= 1;
    if (this.actions.moveRight) direction.x += 1;
    
    // Normalize for diagonal movement
    const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    if (length > 0) {
      direction.x /= length;
      direction.z /= length;
    }
    
    return direction;
  }
}
