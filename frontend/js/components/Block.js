import { insert } from "../utils/AnimationFrame.js";

export function InitialBlockPlacement(mapStructure) {
  // To make sure each player can move at start without dying from their bomb
  function clearStarts(mapStructure) {
    // Top left
    mapStructure[1][1] = 0;
    if (mapStructure[1][2] !== 0) {
      mapStructure[2][1] = 0;
      mapStructure[3][1] = 0;
    } else if (mapStructure[2][1] !== 0) {
      mapStructure[1][2] = 0;
      mapStructure[1][3] = 0;
    }

    // Top right
    mapStructure[1][13] = 0;
    if (mapStructure[1][12] !== 0) {
      mapStructure[2][13] = 0;
      mapStructure[3][13] = 0;
    } else if (mapStructure[2][13] !== 0) {
      mapStructure[1][11] = 0;
      mapStructure[1][12] = 0;
    }

    // Bottom left
    mapStructure[11][1] = 0;
    if (mapStructure[10][1] !== 0) {
      mapStructure[11][2] = 0;
      mapStructure[11][3] = 0;
    } else if (mapStructure[11][2] !== 0) {
      mapStructure[10][1] = 0;
      mapStructure[9][1] = 0;
    }

    // Bottom right
    mapStructure[11][13] = 0;
    if (mapStructure[11][12] !== 0) {
      mapStructure[10][13] = 0;
      mapStructure[9][13] = 0;
    } else if (mapStructure[10][13] !== 0) {
      mapStructure[11][12] = 0;
      mapStructure[11][11] = 0;
    }

    return mapStructure;
  }

  mapStructure.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile === 0 && Math.random() > 0.6) {
        mapStructure[y][x] = 2;
      }
    });
  });

  mapStructure = clearStarts(mapStructure);

  return mapStructure;
}

export default class CrumblingBlock {
  constructor(Player, CrumblingBlock) {
    this.Player = Player; //will probably be needed to link explosion to wall, maybe just bomb?
    this.targetBlock = CrumblingBlock;
    // Animation Instructions:
    this.animationDuration = 0.5;
    this.StartingFrame = 3;
    this.Frame = this.StartingFrame;
    this.PixelsPerFrame = 36;
    this.TotalFrames = 7; // How many frames before looping to start
    this.TotalSize = 144; // TotalSize / TotalFrames = pixelsPerFrame
    this.HowOften = 2.5; // Change frame in how many frames (60FPS)
    this.CurrentFrameCount = 0; // keep at 0
    this.XOffset = 0; // to center the image
  }

  crumble() {
    this.Element = this.targetBlock;
    insert.call(this);
  }

  onRemove() {
    this.Element.classList.replace("block", "floor");
    this.Element.style.backgroundPosition = "";

    // block.style.top / 36 gets correct number to change within the tilemap
    // each number in tilemap is 1 square and 1 square is 36 pixels big
    const tileY = parseInt(this.targetBlock.style.top) / 36;
    const tileX = parseInt(this.targetBlock.style.left) / 36;

    if (this.Player.mapStructure[tileY][tileX] === 2) {
      this.Player.mapStructure[tileY][tileX] = 0;
    }

    const event = new CustomEvent("blockCrumbled", {
      detail: {
        location: {
          tileX: tileX,
          tileY: tileY,
        },
      },
    });
    document.dispatchEvent(event);
  }
}
