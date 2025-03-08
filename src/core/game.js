import { Engine } from './engine.js';
import { InputManager } from './input.js';
import { KansasLevel } from '../components/levels/kansas.js';
import { Player } from '../components/character/player.js';
import { UI } from '../components/ui/ui.js';
import Stats from 'stats.js';

export class Game {
  constructor() {
    this.engine = null;
    this.input = null;
    this.currentLevel = null;
    this.player = null;
    this.ui = null;
    this.score = 0;
    this.gameTime = 0;
    this.paused = false;
    
    // Performance stats
    this.stats = null;
    this.showStats = true;
  }
  
  async init() {
    console.log('Initializing Galactic Scrum...');
    
    // Set up performance monitoring
    if (this.showStats) {
      this.stats = new Stats();
      this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
      document.body.appendChild(this.stats.dom);
    }
    
    // Initialize the 3D engine
    this.engine = new Engine();
    await this.engine.init();
    
    // Setup input manager
    this.input = new InputManager();
    this.input.init();
    
    // Create player
    this.player = new Player(this.engine, this.input);
    await this.player.init();
    
    // Load the Kansas level
    this.currentLevel = new KansasLevel(this.engine);
    await this.currentLevel.load();
    
    // Add player to the level
    this.currentLevel.addPlayer(this.player);
    
    // Initialize UI
    this.ui = new UI(this);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Update loading progress
    this.updateLoadingProgress(100);
    
    console.log('Game initialized successfully!');
    return true;
  }
  
  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
    
    // Handle pause/unpause
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.togglePause();
      }
    });
  }
  
  start() {
    console.log('Starting game loop...');
    this.gameLoop();
  }
  
  gameLoop() {
    if (this.stats) this.stats.begin();
    
    // Calculate delta time
    const now = performance.now();
    const deltaTime = (now - (this.lastTime || now)) / 1000;
    this.lastTime = now;
    
    if (!this.paused) {
      // Update game time
      this.gameTime += deltaTime;
      
      // Update game components
      this.update(deltaTime);
      
      // Render the scene
      this.render();
    }
    
    if (this.stats) this.stats.end();
    
    // Continue the game loop
    requestAnimationFrame(() => this.gameLoop());
  }
  
  update(deltaTime) {
    // Update input
    this.input.update();
    
    // Update physics
    this.engine.updatePhysics(deltaTime);
    
    // Update player
    this.player.update(deltaTime);
    
    // Update level
    this.currentLevel.update(deltaTime);
    
    // Update UI
    this.ui.update(deltaTime);
  }
  
  render() {
    // Render the scene
    this.engine.render();
  }
  
  togglePause() {
    this.paused = !this.paused;
    console.log(this.paused ? 'Game paused' : 'Game resumed');
  }
  
  addScore(points) {
    this.score += points;
    document.getElementById('score-display').textContent = `Score: ${this.score}`;
  }
  
  updateLoadingProgress(percent) {
    const progressBar = document.getElementById('loading-progress');
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
  }
}
