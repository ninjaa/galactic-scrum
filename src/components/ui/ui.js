export class UI {
  constructor(game) {
    this.game = game;
    
    // UI elements
    this.elements = {
      scoreDisplay: document.getElementById('score-display'),
      loadingScreen: document.getElementById('loading-screen'),
      loadingProgress: document.getElementById('loading-progress')
    };
    
    // Initialize UI
    this.init();
  }
  
  init() {
    // Update score display
    this.updateScore(0);
    
    // Add event listeners for UI interactions
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Example: Add keyboard shortcut for showing/hiding UI
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        this.toggleHUD();
      }
    });
  }
  
  update(deltaTime) {
    // Update UI elements that need constant updating
    this.updateAbilityCooldowns();
  }
  
  updateScore(score) {
    if (this.elements.scoreDisplay) {
      this.elements.scoreDisplay.textContent = `Score: ${score}`;
    }
  }
  
  updateLoadingProgress(percent) {
    if (this.elements.loadingProgress) {
      this.elements.loadingProgress.style.width = `${percent}%`;
    }
  }
  
  showMessage(message, duration = 3000) {
    // Create a temporary message element
    const messageElement = document.createElement('div');
    messageElement.className = 'game-message';
    messageElement.textContent = message;
    messageElement.style.position = 'absolute';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    messageElement.style.color = 'white';
    messageElement.style.padding = '15px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.zIndex = '1000';
    
    // Add to the DOM
    document.getElementById('game-ui').appendChild(messageElement);
    
    // Remove after duration
    setTimeout(() => {
      messageElement.remove();
    }, duration);
  }
  
  toggleHUD() {
    // Toggle visibility of HUD elements
    const hudElements = document.getElementById('game-ui').children;
    for (let element of hudElements) {
      if (element.id !== 'loading-screen') {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
      }
    }
  }
  
  updateAbilityCooldowns() {
    // Future implementation: Update visual indicators of ability cooldowns
    // This would show cooldown timers for the Photon Blaster and Gravity Boots
  }
  
  showPauseMenu() {
    // Implement pause menu
    console.log('Pause menu displayed');
  }
  
  hidePauseMenu() {
    // Hide pause menu
    console.log('Pause menu hidden');
  }
  
  showGameOver(win = false) {
    const message = win ? 'Victory! Earth is saved!' : 'Game Over! The Zorgonauts have won!';
    this.showMessage(message, 5000);
    
    // Future implementation: Show more detailed game over screen with stats and replay option
  }
}
