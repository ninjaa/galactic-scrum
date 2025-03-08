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
    
    // Mouse event listeners
    window.addEventListener('mousemove', (event) => this.onMouseMove(event));
    window.addEventListener('mousedown', (event) => this.onMouseDown(event));
    window.addEventListener('mouseup', (event) => this.onMouseUp(event));
    
    // Prevent context menu on right click
    window.addEventListener('contextmenu', (event) => event.preventDefault());
    
    console.log('Input manager initialized');
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
  
  onMouseMove(event) {
    this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  onMouseDown(event) {
    switch (event.button) {
      case 0: // Left button
        this.mouseButtons.left = true;
        this.actions.pass = true;
        break;
      case 1: // Middle button
        this.mouseButtons.middle = true;
        break;
      case 2: // Right button
        this.mouseButtons.right = true;
        this.actions.tackle = true;
        break;
    }
  }
  
  onMouseUp(event) {
    switch (event.button) {
      case 0: // Left button
        this.mouseButtons.left = false;
        this.actions.pass = false;
        break;
      case 1: // Middle button
        this.mouseButtons.middle = false;
        break;
      case 2: // Right button
        this.mouseButtons.right = false;
        this.actions.tackle = false;
        break;
    }
  }
  
  mapKeysToActions() {
    // WASD movement
    this.actions.moveForward = this.keys['KeyW'] || this.keys['ArrowUp'] || false;
    this.actions.moveBackward = this.keys['KeyS'] || this.keys['ArrowDown'] || false;
    this.actions.moveLeft = this.keys['KeyA'] || this.keys['ArrowLeft'] || false;
    this.actions.moveRight = this.keys['KeyD'] || this.keys['ArrowRight'] || false;
    
    // Other actions
    this.actions.jump = this.keys['Space'] || this.keys['SpaceBar'] || false;
    this.actions.sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || false;
    this.actions.interact = this.keys['KeyE'] || false;
    
    // Debug action states
    if (this.actions.jump) {
      console.log('Jump action is active');
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
