import { InitialBlockPlacement } from "./Block.js";

export default class Map {
  constructor(gameBoard, mapStructure) {
    this.gameBoard = gameBoard;
    this.mapStructure = mapStructure;
  }
  createMap() {
    this.mapStructure = InitialBlockPlacement(this.mapStructure);
    this.mapStructure.forEach((row, y) => {
      row.forEach((tile, x) => {
        const tileElement = document.createElement("div");
        tileElement.style.top = `${y * 36}px`;
        tileElement.style.left = `${x * 36}px`;
        tileElement.classList.add("tile");

        switch (tile) {
          case 1:
            tileElement.classList.add("wall");
            break;
          case 2:
            tileElement.classList.add("block");
            break;
          default:
            tileElement.classList.add("floor");
            break;
        }

        this.gameBoard.appendChild(tileElement);
      });
    });
  }
}
