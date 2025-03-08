# Galactic Scrum

A single-player casual rugby x space opera game built with Three.js.

## Game Concept

"Galactic Scrum" is a fusion of rugby mechanics and space opera themes. Play as Ruck Ryder, a third-grade rugby enthusiast who must save Earth from the mighty alien empire, The Zorgonauts, in an intergalactic rugby showdown.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Controls

- **WASD/Arrow Keys**: Move Ruck around the field
- **Space**: Jump
- **Left Mouse Button**: Pass/kick the ball
- **Right Mouse Button**: Use Photon Punt-Blaster
- **Shift**: Sprint
- **E**: Interact with objects
- **Escape**: Pause game
- **Tab**: Toggle HUD

## Features

- Kansas crop circles level with maze-like patterns
- Rugby-inspired gameplay mechanics
- Special abilities: Photon Punt-Blaster and Gravity Boots
- Zorgonaut alien defenders
- Physics-based gameplay

## Development

### Project Structure

```
galactic-scrum/
├── assets/         # Game assets (models, textures, audio)
├── src/            # Source code
│   ├── components/ # Game components (characters, levels, etc.)
│   ├── core/       # Core engine functionality
│   ├── utils/      # Utility functions
│   └── main.js     # Main entry point
├── public/         # Static files
└── index.html      # Main HTML file
```

### Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## License

[MIT License](LICENSE)

## Acknowledgments

- Three.js - 3D library
- Cannon.js - Physics engine
- Vite - Build tool
