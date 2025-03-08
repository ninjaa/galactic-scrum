import { Game } from './core/game.js';

document.addEventListener('DOMContentLoaded', () => {
  // Create and initialize the game
  const game = new Game();
  
  // Start the game when loading is complete
  game.init().then(() => {
    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'none';
    
    // Start game loop
    game.start();
  });
});
