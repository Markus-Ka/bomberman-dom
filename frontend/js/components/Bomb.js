import { insert } from "../utils/AnimationFrame.js";
import CrumblingBlock from "./Block.js";

export default class Bomb {
  constructor(Player, explosionSize, explosionTime, explosionDuration) {
    this.Player = Player;
    // Animation Instructions:
    this.animationDuration = 3; //explosionDuration
    this.StartingFrame = 1;
    this.Frame = this.StartingFrame;
    this.PixelsPerFrame = 46;
    this.TotalFrames = 3; // How many frames before looping to start
    this.TotalSize = 138; // TotalSize / TotalFrames = pixelsPerFrame
    this.HowOften = 15; // Change frame in how many frames (60FPS)
    this.CurrentFrameCount = 0; // keep at 0
    this.XOffset = -6; // to center the image
  }

  placeBomb(Player, x, y, initial = false) {
    if (
      this.Player.activeBombs >= this.Player.powUpExtraBomb ||
      this.Player.mapStructure[y / 36][x / 36] !== 0
    ) {
      return; // on cd
    }
    this.x = x;
    this.y = y;
    const BombElement = document.createElement("div");
    BombElement.style.top = `${y}px`;
    BombElement.style.left = `${x}px`;
    BombElement.style.zIndex = "3"; // 1 = map, 2 = fire, 3 = bomb, 4 = player
    BombElement.classList.add("bomb");
    Player.gameBoard.appendChild(BombElement);
    this.Element = BombElement;
    //add bomb to tilemap
    this.Player.mapStructure[this.y / 36][this.x / 36] = 3;
    // insert.call(this);

    const event = new CustomEvent("bombPlaced", {
      detail: {
        bombObject: this,
      },
    });
    document.dispatchEvent(event);

    this.Player.activeBombs += 1;
  }

  onRemove(BombsOnBoard) {
    this.Player.mapStructure[this.y / 36][this.x / 36] = 0;
    this.floorTilesAffected = [];
    this.adjacentBombsAffected = [];
    directionMultipliers.forEach((direction) => {
      let hitObstacle = false;
      //BFIndex = big flame index. If anyone has a better name idea pls help
      for (let BFIndex = 1; BFIndex <= this.Player.powUpBigFlame; BFIndex++) {
        const yTarget = (this.y + direction.dy * BFIndex) / 36;
        const xTarget = (this.x + direction.dx * BFIndex) / 36;
        const targetTile = this.Player.mapStructure[yTarget][xTarget];

        switch (targetTile) {
          case 0:
            this.floorTilesAffected.push({ x: xTarget, y: yTarget });
            this.newExplosionTile(direction, BFIndex);
            break;
          case 1:
            hitObstacle = true;
            break;
          case 2:
            this.crumbleWall(yTarget, xTarget);
            hitObstacle = true;
            break;
          case 3:
            if (BombsOnBoard !== null) {
              const bombToExplode = BombsOnBoard.find((element) => {
                return (
                  element.x === this.x + direction.dx * BFIndex &&
                  element.y === this.y + direction.dy * BFIndex
                );
              });
              if (bombToExplode) {
                this.adjacentBombsAffected.push(bombToExplode);
              } else {
                console.log(
                  "No matching bomb found to chain, check bomb logic"
                );
              }
            }
            hitObstacle = true;
            break;
          case 4:
          case 5:
          case 6:
            const event = new CustomEvent("removePowerUp", {
              detail: {
                location: {
                  tileX: xTarget,
                  tileY: yTarget,
                },
              },
            });
            document.dispatchEvent(event);
            this.newExplosionTile(direction, BFIndex);
            break;
          default:
            break;
        }

        if (hitObstacle) {
          break;
        }
      }
    });
    this.reportBombExploded(
      this.floorTilesAffected,
      this.adjacentBombsAffected
    );
    this.Player.activeBombs -= 1;
    this.Element.remove();
  }

  newExplosionTile(direction, BFIndex) {
    let explosion = new BombExplosion(
      this,
      this.x + direction.dx * BFIndex,
      this.y + direction.dy * BFIndex,
      direction.name,
      BFIndex
    );
    explosion.explode();
  }

  crumbleWall(y, x) {
    const blockToBreak = document.querySelector(
      `.block:is([style*="top: ${y * 36}"]):is([style*="left: ${x * 36}"])`
    );
    let crumblingBlock = new CrumblingBlock(this.Player, blockToBreak);
    crumblingBlock.crumble();
  }

  reportBombExploded(affectedFloorTiles, adjacentBombs) {
    const event = new CustomEvent("bombExploded", {
      detail: {
        affectedFloorTiles: affectedFloorTiles,
        bombObjects: adjacentBombs,
      },
    });
    document.dispatchEvent(event);
  }
}
const directionMultipliers = [
  { name: "center", dx: 0, dy: 0 },
  { name: "up", dx: 0, dy: -36 },
  { name: "down", dx: 0, dy: 36 },
  { name: "left", dx: -36, dy: 0 },
  { name: "right", dx: 36, dy: 0 },
];
class BombExplosion {
  constructor(info, x, y, direction, BFIndex) {
    this.Player = info.Player;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.BFIndex = BFIndex;
    // Animation Instructions:
    this.animationDuration = 0.5;
    this.StartingFrame = 1;
    this.Frame = this.StartingFrame;
    this.PixelsPerFrame = 36;
    this.TotalFrames = 4; // How many frames before looping to start
    this.TotalSize = 144; // TotalSize / TotalFrames = pixelsPerFrame
    this.HowOften = 7.5; // Change frame in how many frames (60FPS)
    this.CurrentFrameCount = 0; // keep at 0
    this.XOffset = 0; // to center the image
  }
  explode() {
    const ExplosionElement = document.createElement("div");
    ExplosionElement.style.top = `${this.y}px`;
    ExplosionElement.style.left = `${this.x}px`;
    ExplosionElement.style.zIndex = "2"; // 1 = map, 2 = fire, 3 = bomb, 4 = player
    // Check if this explosion tile is not the end nor the center of it
    // replace the direction with long_...
    if (
      this.direction !== "center" &&
      this.BFIndex !== this.Player.powUpBigFlame
    ) {
      if (this.direction === "right" || this.direction === "left") {
        this.direction = "long_horizontal";
      } else {
        this.direction = "long_vertical";
      }
    }
    // Check for existing explosions
    const explosionsOnBoard = document.querySelectorAll(
      '[class*="explosion_"]'
    );
    // For each existing explosion, check if they overlap
    // then check for the explosion type and change it to look nicer
    if (explosionsOnBoard) {
      explosionsOnBoard.forEach((element) => {
        if (
          element.style.top === ExplosionElement.style.top &&
          element.style.left === ExplosionElement.style.left
        ) {
          switch (element.className) {
            case "explosion_center":
              this.direction = "center";
              break;
            case "explosion_long_horizontal":
              if (this.direction === "long_vertical") {
                this.direction = "center";
              } else {
                this.direction = "long_horizontal";
              }

              break;
            case "explosion_long_vertical":
              if (this.direction === "long_horizontal") {
                this.direction = "center";
              } else {
                this.direction = "long_vertical";
              }
              break;
            default:
              break;
          }
        }
      });
    }
    ExplosionElement.classList.add(`explosion_${this.direction}`);
    this.Player.gameBoard.appendChild(ExplosionElement);
    this.Element = ExplosionElement;
    insert.call(this);
  }
  onRemove() {
    this.Element.remove();
  }
}
