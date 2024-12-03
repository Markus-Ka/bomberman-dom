# Bomberman Multiplayer Game

## Overview

Welcome to the Bomberman Multiplayer Game! This game allows up to four players to engage in a classic Bomberman experience. Players navigate a grid-based arena, strategically placing bombs to eliminate opponents while avoiding explosions.

## Features

- **Backend in Go**: The server-side of the game is implemented in the Go programming language, ensuring robust and efficient performance.

- **Frontend in JavaScript**: The user interface is built using JavaScript, providing a dynamic and interactive gaming experience.

- **Multiplayer Support with WebSockets**: The game leverages WebSockets to enable real-time communication between players and the server, creating a seamless multiplayer experience.

- **Power-ups**:
  - _Speed Up_: Enhance your character's speed. Can be picked up only once.
  - _Longer Flame_: Extend the distance of bomb explosions. Can be picked up multiple times.
  - _Extra Bombs_: Increase the maximum number of bombs a player can place. Can be picked up multiple times.

## Getting Started

To run the Bomberman game, follow these steps:

### Prerequisites

- Go installed on the server for running the backend.
- A modern web browser for the frontend.

### Installation

1. Clone the repository:

   ```bash
   git clone https://01.kood.tech/git/ehspp/bomberman-dom.git
   cd bomberman
   ```

2. Start the server

   Navigate to the backend directory and start the server.

   ```bash
   cd backend/
    go run .
   ```

   Open a web browser and go to

   ```
    localhost:8080
   ```

Enjoy the Bomberman game with friends!

## How to Play

**Joining the Game:**

- Access the game via the provided URL.
- Enter a unique player name.
- Click "Join Game" to enter the waiting room.
- When enough players have joined a countdown timer will start.
- Play!

**Controls:**

- Use arrow keys to move your character.
- Place bombs strategically with "space".

**Objective:**

- Eliminate opponents by trapping them with bomb explosions.

**Power-ups:**

- Collect power-ups strategically to gain advantages in the game.

**Winning the Game:**

- Be the last player standing to claim victory!

## Potential Hardware Issue: Key Ghosting

Experiencing key combinations not registering correctly? Your keyboard may be affected by key ghosting. Test it using the [Microsoft Anti-Ghosting Demo](https://www.microsoft.com/applied-sciences/projects/anti-ghosting-demo).

## Authors

[ehspp](https://01.kood.tech/git/ehspp)

[Grex](https://01.kood.tech/git/Grex)

[MarkusKa](https://github.com/Markus-Ka)
