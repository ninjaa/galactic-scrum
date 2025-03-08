# CLAUDE.md - Galactic Scrum Project Guide

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Game Controls
- **Movement**: WASD or Arrow Keys
- **Camera**: Mouse
- **Jump**: Space bar
- **Sprint**: Shift
- **Pass/Kick Ball**: Left Mouse Button
- **Tackle/Photon Blaster**: Right Mouse Button
- **Interact/Pickup**: E key
- **Pause Game**: Escape key

## Implementation Plan (Current: Phase 2-3)
1. ✓ Project Setup and Basic Environment
2. ⟳ Character and Controls (in progress)
3. ⟳ Rugby Ball Mechanics (starting)
4. □ Enemies and Obstacles
5. □ Special Abilities
6. □ Level Design
7. □ UI and Feedback
8. □ Polish and Optimization

## Game Concept
Galactic Scrum is a single-player casual rugby x space opera game. Ruck Ryder, our 8-year-old protagonist, must defeat the Zorgonauts in an intergalactic rugby showdown to save Earth.

## Core Mechanics To Implement
- Rugby: running with ball, passing/kicking, tackling, scoring tries
- Space elements: gravity manipulation, Photon Punt-Blaster, cosmic environments
- Special abilities: Gravity Boots for super jumps, Photon Blaster to freeze opponents

## Code Style Guidelines
- **Naming**: Classes use PascalCase, methods/variables use camelCase
- **Formatting**: 2-space indentation, semicolons required
- **Modules**: ES modules with explicit imports/exports
- **Architecture**: Object-oriented with classes and inheritance

## Technology Stack
- Vanilla JavaScript with Three.js (3D) and Cannon-es (physics)
- Vite as build tool
- Supporting: TweenJS (animations), Howler.js (audio), Stats.js (monitoring)