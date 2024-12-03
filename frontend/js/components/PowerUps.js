export class PowerUpManager {
  constructor(gameBoard, mapStructure) {
    this.gameBoard = gameBoard;
    this.mapStructure = mapStructure;
    this.powerUpOptions = ["faster", "extraBomb", "bigFlames"];
    this.previousTwoPowerUps = [];
    this.activePowerUpTiles = [];
  }

  selectPowerUpType() {
    let filteredPowerUps;

    if (this.previousTwoPowerUps.length === 0) {
      // If no previous powerup, all have equal chance to be chosen
      filteredPowerUps = this.powerUpOptions;
    } else if (this.previousTwoPowerUps.length === 1) {
      // If one previous power up, lower it's chance to be chosen
      if (Math.random() < 0.5) {
        filteredPowerUps = this.powerUpOptions.filter(
          (p) => p !== this.previousTwoPowerUps[0]
        );
      } else {
        filteredPowerUps = this.powerUpOptions;
      }
    } else {
      // If there has been at least two previous power ups
      if (this.previousTwoPowerUps[0] === this.previousTwoPowerUps[1]) {
        // If last two power ups has been the same, lower its chance a lot
        if (Math.random() < 0.75) {
          filteredPowerUps = this.powerUpOptions.filter(
            (p) => p !== this.previousTwoPowerUps[0]
          );
        } else {
          filteredPowerUps = this.powerUpOptions;
        }
      } else {
        // If last two power ups were not the same one
        if (Math.random() < 0.5) {
          // 50% chance that the most previous power up is removed from selection
          filteredPowerUps = this.powerUpOptions.filter(
            (p) => p !== this.previousTwoPowerUps[1]
          );
        } else {
          filteredPowerUps = this.powerUpOptions;
        }
        if (Math.random() < 0.3) {
          // 30% chance that the second previous power up is removed from selection
          filteredPowerUps = filteredPowerUps.filter(
            (p) => p !== this.previousTwoPowerUps[0]
          );
        }
      }
    }

    // Actual random selection from the power ups which have remained in selection
    const randomIndex = Math.floor(Math.random() * filteredPowerUps.length);
    // Change selectedPowerUp to test powerups
    // filteredPowerUps[randomIndex] | "faster" | "extraBomb" | "bigFlames"
    const selectedPowerUp = filteredPowerUps[randomIndex];

    // Store chosen power up
    this.previousTwoPowerUps.push(selectedPowerUp);
    if (this.previousTwoPowerUps.length > 2) {
      this.previousTwoPowerUps.shift();
    }
    return selectedPowerUp;
  }

  maybeCreatePowerUpTile(location) {
    // Comment this if to spawn powerup on every block
    if (Math.random() > 0.4) {
      // 40% chance that power up is created
      return null;
    }

    const powerUpType = this.selectPowerUpType();
    const powerUp = {
      powerUpType: powerUpType,
      location: location,
    };
    return powerUp;
  }

  createChosenPowerup(args, player) {
    const duplicateTile = this.activePowerUpTiles.filter(
      (powerUp) =>
        powerUp.location.tileX === location.tileX &&
        powerUp.location.tileY === location.tileY
    );
    if (duplicateTile.length !== 0) {
      return null;
    }
    const powerUp = new PowerUpTile(
      args.powerUpType,
      args.location,
      this.gameBoard,
      player.mapStructure
    );
    if (
      player.mapStructure[args.location.tileY][args.location.tileX] === 0 ||
      player.mapStructure[args.location.tileY][args.location.tileX] === 2
    ) {
      this.activePowerUpTiles.push(powerUp);
      powerUp.createPowerUp();
    }
  }

  removePowerUpTile(location) {
    const powerUpIndex = this.activePowerUpTiles.findIndex(
      (powerUp) =>
        powerUp.location.tileX === location.tileX &&
        powerUp.location.tileY === location.tileY
    );

    if (powerUpIndex > -1) {
      this.activePowerUpTiles[powerUpIndex].removePowerUp();
      this.activePowerUpTiles.splice(powerUpIndex, 1);
    }
  }
}

class PowerUpTile {
  constructor(type, location, gameBoard, mapStructure) {
    this.type = type;
    this.location = location; // { tileX, tileY }
    this.gameBoard = gameBoard;
    this.mapStructure = mapStructure;
    // this.createPowerUp();
  }

  createPowerUp() {
    // console.log("powerup: ", this);
    const { tileX, tileY } = this.location;
    this.element = document.createElement("div");
    this.element.style.top = `${tileY * 36}px`;
    this.element.style.left = `${tileX * 36}px`;
    switch (this.type) {
      case "faster":
        this.mapStructure[tileY][tileX] = 4;
        this.element.classList.add("powerup_faster");
        break;
      case "extraBomb":
        this.mapStructure[tileY][tileX] = 5;
        this.element.classList.add("powerup_extra_bomb");
        break;
      case "bigFlames":
        this.mapStructure[tileY][tileX] = 6;
        this.element.classList.add("powerup_big_flames");
        break;
    }
    this.gameBoard.appendChild(this.element);
  }

  removePowerUp() {
    const { tileX, tileY } = this.location;
    this.mapStructure[tileY][tileX] = 0;
    this.element.remove();
  }
}
