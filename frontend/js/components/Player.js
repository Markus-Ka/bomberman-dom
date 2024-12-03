import Bomb from "./Bomb.js";
import { insertPlayer } from "../utils/AnimationFrame.js";

export default class Player {
  constructor(gameBoard, mapStructure, conn, id, MyPlayer = false) {
    this.id = id; // needs ID or doesnt spawn, fix tmrw
    this.gameBoard = gameBoard;
    this.mapStructure = mapStructure;
    this.width = 27;
    this.height = 36;
    this.tileSize = 36;
    this.dyingSpritePositions = [
      "-535px 0",
      "-583px 0",
      "-631px 0",
      "-679px 0",
      "-727px 0",
      "-775px 0",
    ];

    // Player movement
    this.position = { x: 1, y: 1 };
    this.lastKeyPressedOrder = [];
    this.movementStep = 0.25; // Distance of the fraction of tile which player moves on one step
    this.moveCooldown = 150; // Milliseconds between each update/render
    this.lastMoveTime = 0; // To keep track if moveCooldown is passed
    this.movingDirection; // For movement animation, when not moving = undefined
    this.alternateAnimationFrame = false; // For movement animation to alternate btw to images
    this.speedPowerUpPositionAdjusted = false; // After gaining speed power up, the position may have to be adjusted from 0.25/0.75 tiles to 0.5/1

    // Player other attributes
    this.powUpBigFlame = 1;
    this.powUpExtraBomb = 1;
    this.activeBombs = 0;
    this.livesLeft = 3;
    this.isFlashing = false;
    this.isDying = false;
    this.isDead = false;
    this.currentDyingFrame = 0;

    // Initialization
    this.playerElement = document.createElement("div");
    this.playerElement.classList.add("player");
    this.initPlayer();
    this.conn = conn;

    this.initPlayer();
    if (!MyPlayer) return;
    this.bindKeyboardEvents();
  }

  initPlayer() {
    this.playerElement.style.width = `${this.width}px`;
    this.playerElement.style.height = `${this.height}px`;
    this.playerElement.style.position = "absolute";
    this.playerElement.style.zIndex = "4"; // 1 = map, 2 = fire, 3 = bomb, 4 = player
    this.playerElement.setAttribute("ID", this.id);

    // Workaround for different root directories
    const imgSrc = `../../assets/images/player_${this.id}.png`;
    const fallbackImgSrc = `../../../bomberman-dom/frontend/assets/images/player_${this.id}.png`;
    const testerImg = new Image();
    testerImg.onerror = () => {
      // Use fallback, full url if short one doesn't work
      console.log("Using fallback image path");
      this.playerElement.style.backgroundImage = `url("${fallbackImgSrc}")`;
    };
    testerImg.onload = () => {
      this.playerElement.style.backgroundImage = `url("${imgSrc}")`;
    };
    testerImg.src = imgSrc;

    // Set start position based on id
    switch (this.id) {
      case 1: {
        this.position = { x: 1, y: 1 };
        break;
      }
      case 2: {
        this.position = { x: 13, y: 1 };
        break;
      }
      case 3: {
        this.position = { x: 1, y: 11 };
        break;
      }
      case 4: {
        this.position = { x: 13, y: 11 };
      }
    }

    this.playerElement.style.backgroundPosition = "-10px 0px";
    this.playerElement.style.left = `${
      this.position.x * this.tileSize + (this.tileSize - this.width) / 2
    }px`;
    this.playerElement.style.top = `${this.position.y * this.tileSize}px`;
    this.gameBoard.appendChild(this.playerElement);

    insertPlayer.call(this);
  }

  bindKeyboardEvents() {
    document.addEventListener("keydown", (e) => {
      if (document.activeElement.id === "chat-input") {
        e.stopPropagation();
      } else {
        const keyMap = {
          ArrowUp: "up",
          ArrowDown: "down",
          ArrowLeft: "left",
          ArrowRight: "right",
        };

        // Add pressed key to the end of the lastKeyPressedOrder

        const direction = keyMap[e.key];
        if (direction) {
          const index = this.lastKeyPressedOrder.indexOf(direction);

          if (index > -1) {
            this.lastKeyPressedOrder.splice(index, 1);
          }
          this.lastKeyPressedOrder.push(direction);
          this.conn.SendServer(
            "onMove",
            [this.position.x, this.position.y, direction, true],
            this.id
          );
        } else if (
          e.key === " " &&
          !this.isFlashing &&
          !this.isDying &&
          !this.isDead
        ) {
          // && chatwindow not selected
          let { x, y } = this.TileCenterPos;
          this.placeBomb(x, y, true);
          this.conn.SendServer("placeBomb", [x, y], this.id);
        }
      }
    });

    document.addEventListener("keyup", (e) => {
      const keyMap = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };

      const direction = keyMap[e.key];
      if (direction) {
        const index = this.lastKeyPressedOrder.indexOf(direction);
        if (index > -1) {
          this.lastKeyPressedOrder.splice(index, 1);
        }
        this.conn.SendServer(
          "onMove",
          [this.position.x, this.position.y, direction, false],
          this.id
        );
      }
    });
  }

  canMoveDiagonally(coord) {
    // For odd number ending .25 and even number ending .75 diagonally moving
    // may be possible (have to still check if the diagonal tile is free)
    return (
      (Math.floor(coord) % 2 !== 0 && coord % 1 === 0.25) ||
      (Math.floor(coord) % 2 === 0 && coord % 1 === 0.75)
    );
  }

  obstacleCheck(x, y, direction) {
    // Check if diagonal movement may be possible
    let canMoveDiagonally = false;
    if (direction === "right" || direction === "left") {
      canMoveDiagonally = this.canMoveDiagonally(y);
      if (y % 1 !== 0 && !canMoveDiagonally) {
        // If not moving straight on path and can't move diagonally, then definitely can't move
        return { canMove: false };
      }
    } else if (direction === "up" || direction === "down") {
      canMoveDiagonally = this.canMoveDiagonally(x);
      if (x % 1 !== 0 && !canMoveDiagonally) {
        // If not moving straight on path and can't move diagonally, then definitely can't move
        return { canMove: false };
      }
    }

    // Get next tile coordinates by movement direction
    let tileX;
    let tileY;
    if (direction === "right") {
      if (canMoveDiagonally && y % 1 === 0.25) {
        tileX = Math.ceil(x);
        tileY = Math.floor(y);
      } else {
        tileX = Math.ceil(x);
        tileY = Math.ceil(y);
      }
    } else if (direction === "down") {
      if (canMoveDiagonally && x % 1 === 0.25) {
        tileX = Math.floor(x);
        tileY = Math.ceil(y);
      } else {
        tileX = Math.ceil(x);
        tileY = Math.ceil(y);
      }
    } else if (direction === "left") {
      if (canMoveDiagonally && y % 1 === 0.75) {
        tileX = Math.floor(x);
        tileY = Math.ceil(y);
      } else {
        tileX = Math.floor(x);
        tileY = Math.floor(y);
      }
    } else if (direction === "up") {
      if (canMoveDiagonally && x % 1 === 0.75) {
        tileX = Math.ceil(x);
        tileY = Math.floor(y);
      } else {
        tileX = Math.floor(x);
        tileY = Math.floor(y);
      }
    }

    // Double check if next tile is on the limits of map
    if (
      tileY < 0 ||
      tileY >= this.mapStructure.length ||
      tileX < 0 ||
      tileX >= this.mapStructure[tileY].length
    ) {
      return { canMove: false };
    }

    // Check if next tile is free and if it's a power up or a bomb that the player is currently on
    let canMove;
    const nextTileValue = this.mapStructure[tileY][tileX];
    //console.log("next tile value: ", nextTileValue, this.mapStructure)
    const tolerance = 1;
    if (
      nextTileValue === 0 ||
      nextTileValue > 3 ||
      (nextTileValue === 3 &&
        Math.abs(tileX - this.position.x) < tolerance &&
        Math.abs(tileY - this.position.y) < tolerance)
    ) {
      canMove = true;
      if (nextTileValue > 3) {
        this.handleGotPowerUp(nextTileValue, tileX, tileY);
      }
    }
    return { canMove: canMove, moveDiagonally: canMoveDiagonally };
  }

  attemptToMove() {
    let { newX, newY } = { newX: this.position.x, newY: this.position.y };
    let movingDirection;

    // Direction movement multipliers
    const directionMultipliers = {
      up: { dx: 0, dy: -this.movementStep },
      down: { dx: 0, dy: this.movementStep },
      left: { dx: -this.movementStep, dy: 0 },
      right: { dx: this.movementStep, dy: 0 },
    };

    for (let i = this.lastKeyPressedOrder.length - 1; i >= 0; i--) {
      const direction = this.lastKeyPressedOrder[i];
      const { dx, dy } = directionMultipliers[direction];
      const tentativeX = newX + dx;
      const tentativeY = newY + dy;

      const { canMove, moveDiagonally } = this.obstacleCheck(
        tentativeX,
        tentativeY,
        direction
      );
      if (canMove) {
        newX = tentativeX;
        newY = tentativeY;

        if (moveDiagonally) {
          if (direction === "left" || direction === "right") {
            newY = Math.round(newY);
          } else {
            newX = Math.round(newX);
          }
        }
        if (this.movementStep === 0.5 && !this.speedPowerUpPositionAdjusted) {
          newX = Math.round(newX * 2) / 2;
          newY = Math.round(newY * 2) / 2;
          this.speedPowerUpPositionAdjusted = true;
        }
        movingDirection = direction;
        return { movingDirection, newX, newY };
      }
    }

    return { movingDirection, newX, newY };
  }

  update() {
    const currentTime = performance.now();
    if (currentTime - this.lastMoveTime < this.moveCooldown || this.isDead) {
      return;
    } else if (this.isDying) {
      this.lastMoveTime = currentTime;
      this.showDyingAnimation();
      return;
    } else if (this.lastKeyPressedOrder.length === 0) {
      this.movingDirection = undefined;
      this.applyMovementAnimation();
      return;
    }

    this.alternateAnimationFrame
      ? (this.alternateAnimationFrame = false)
      : (this.alternateAnimationFrame = true);

    let { movingDirection, newX, newY } = this.attemptToMove();

    this.movingDirection = movingDirection;

    if (newX !== this.position.x || newY !== this.position.y) {
      // multiplayer problem here, currently we're setting pos.x, pos.y earlier so newX, newY are always equal to x, y. to test this add || true to the conditions
      this.position.x = newX;
      this.position.y = newY;

      this.playerElement.style.left = `${
        this.position.x * this.tileSize + (this.tileSize - this.width) / 2
      }px`;
      this.playerElement.style.top = `${this.position.y * this.tileSize}px`;

      this.lastMoveTime = currentTime;
      // this.conn.SendServer("onMove", [this.position.x, this.position.y], this.id)
    }

    this.applyMovementAnimation();
  }

  applyMovementAnimation() {
    let spriteOffset = "-10px";

    if (this.movingDirection) {
      switch (this.movingDirection) {
        case "up":
          this.alternateAnimationFrame
            ? (spriteOffset = "-200px")
            : (spriteOffset = "-249px");
          this.playerElement.style.transform = "scaleX(1)";
          break;
        case "down":
          this.alternateAnimationFrame
            ? (spriteOffset = "-58px")
            : (spriteOffset = "-104px");
          this.playerElement.style.transform = "scaleX(1)";
          break;
        case "left":
          this.alternateAnimationFrame
            ? (spriteOffset = "-347px")
            : (spriteOffset = "-396px");
          this.playerElement.style.transform = "scaleX(-1)";
          break;
        case "right":
          this.alternateAnimationFrame
            ? (spriteOffset = "-347px")
            : (spriteOffset = "-396px");
          this.playerElement.style.transform = "scaleX(1)";
          break;
      }
    }

    this.playerElement.style.backgroundPosition = `${spriteOffset} 0px`;
  }

  showDyingAnimation() {
    if (this.currentDyingFrame === 0) {
      // Changing element width as dying sprites are wider
      this.playerElement.style.width = "32px";
      this.playerElement.style.left = `${
        this.position.x * this.tileSize + (this.tileSize - 32) / 2
      }px`;
    }
    if (this.currentDyingFrame <= 5) {
      this.playerElement.style.backgroundPosition =
        this.dyingSpritePositions[this.currentDyingFrame];
      this.currentDyingFrame++;
    }
  }

  placeBomb(x, y, initial) {
    let bomb = new Bomb(this, 3, 3.5, 1);
    bomb.placeBomb(this, x, y, initial);
  }

  get TileCenterPos() {
    let xPos = Math.round(this.position.x) * this.tileSize;
    let yPos = Math.round(this.position.y) * this.tileSize;

    return { x: xPos, y: yPos };
  }

  handleGotPowerUp(powerUpIndex, tileX, tileY) {
    switch (powerUpIndex) {
      case 4:
        this.speedUp();
        break;
      case 5:
        this.powUpExtraBomb += 1;
        break;
      case 6:
        this.powUpBigFlame += 1;
        break;
      default:
        console.log("powUp Index,", powerUpIndex);
        break;
    }
    const event = new CustomEvent("removePowerUp", {
      detail: {
        location: {
          tileX: tileX,
          tileY: tileY,
        },
      },
    });
    document.dispatchEvent(event);
  }

  speedUp() {
    if (this.movementStep === 0.25) {
      this.movementStep = 0.5;
    }
  }

  checkIfDamage(affectedFloorTiles) {
    if (this.isFlashing) {
      return;
    }
    let playerXFloor = Math.floor(this.position.x);
    let playerXCeil = Math.ceil(this.position.x);
    let playerYFloor = Math.floor(this.position.y);
    let playerYCeil = Math.ceil(this.position.y);
    for (let i = 0; i < affectedFloorTiles.length; i++) {
      let tile = affectedFloorTiles[i];
      if (
        (tile.x === playerXFloor || tile.x === playerXCeil) &&
        (tile.y === playerYFloor || tile.y === playerYCeil)
      ) {
        this.handleLostLife();
        break;
      }
    }
  }

  handleLostLife() {
    this.livesLeft -= 1;
    if (this.livesLeft > 0) {
      this.isFlashing = true;
      this.playerElement.classList.add("player-flashing");
    } else {
      this.isDying = true;
    }

    setTimeout(() => {
      if (this.livesLeft > 0) {
        this.playerElement.classList.remove("player-flashing");
        this.isFlashing = false;
      } else {
        this.isDead = true;
        this.playerElement.remove();
      }
    }, 2000);

    const event = new CustomEvent("playerLostLife", {
      detail: {
        playerId: this.id,
        livesLeft: this.livesLeft,
      },
    });
    document.dispatchEvent(event);
  }
}
