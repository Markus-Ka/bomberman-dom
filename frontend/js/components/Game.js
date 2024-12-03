import Map from "./Map.js";
import Player from "./Player.js";
import { PowerUpManager } from "./PowerUps.js";
import startAnimating from "../utils/AnimationFrame.js";
import { insert } from "../utils/AnimationFrame.js";
import ClientConnection from "../network/WebSocket.js";

export default class Game {
  constructor(UIcontroller) {
    this.UIcontroller = UIcontroller;
    this.gameBoard = UIcontroller.gameBoard;
    this.mapStructure = [
      // Height with border: 13 tiles, width with border: 15 tiles
      // 0: floor, 1: wall, 2: block, 3: bomb,
      // Powerups: 4: faster, 5: extra bomb, 6: bigger flames
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    //potentially this.UIcontroller.Players
    this.Players = [];
    this.PlayersAlive = this.UIcontroller.players.length;
    this.BombsOnBoard = [];
    this.conn = UIcontroller.conn;
    this.setupActiveBombListener();
    this.setupBombExplodedListener();
    this.setupBlockCrumbledListener();
    this.setupRemovePowerUpListener();

    this.initCallbacks();
    this.createPlayers();
  }

  createPlayers() {
    this.UIcontroller.players.forEach((value) => {
      if (value.myPlayer) {
        this.setYourID(undefined, value.id);
        return;
      }

      this.playerAdded(undefined, value.id);
    });
  }
  initCallbacks() {
    let callbacks = {
      placeBomb: this.placeBombClient.bind(this),
      onMove: this.moveCharacterClient.bind(this),
      setMapStructure: this.setMapStructure.bind(this),
      createPowerUp: this.createPowerUpTest.bind(this),
    };
    this.conn.callbacks = callbacks; // overwrite lobby callbacks with the game callbacks
    this.UIcontroller.Chat.setupChatConn();
  }

  placeBombClient(args, id) {
    if (this.player.id == id) return; // same player who placed bomb
    const x = args[0];
    const y = args[1];

    const Player = this.playerFromID(id); // player who sent the request
    if (!Player)
      return console.log(`did not find player with ID ${id} ${Player}`);
    console.log("got player!", Player);
    Player.placeBomb(x, y, false);
  }

  moveCharacterClient(args, id) {
    if (this.player.id == id) return; // same player who moved

    const Player = this.playerFromID(id); // player who sent the request
    if (!Player)
      return console.log(`did not find player with ID ${id} ${Player}`);
    Player.position.x = args[0];
    Player.position.y = args[1];
    const direction = args[2];
    const pressed = args[3];

    const index = Player.lastKeyPressedOrder.indexOf(direction);

    if (index > -1) {
      Player.lastKeyPressedOrder.splice(index, 1);
    }

    if (pressed) {
      Player.lastKeyPressedOrder.push(direction);
    }
  }

  setYourID(args, id) {
    // letting the client know which player they are controlling.
    this.id = id;

    this.player = new Player(
      this.gameBoard,
      this.mapStructure,
      this.conn,
      id,
      true
    );

    this.player.update();
    this.Players.push(this.player);
    this.setupPlayerDied();
  }

  setupActiveBombListener() {
    document.addEventListener("bombPlaced", this.handleBombPlaced.bind(this));
  }

  handleBombPlaced(event) {
    this.addBomb(event.detail.bombObject);
    insert.call(event.detail.bombObject);
  }

  addBomb(bomb) {
    this.BombsOnBoard.push(bomb);
  }

  setupBombExplodedListener() {
    document.addEventListener(
      "bombExploded",
      this.handleBombExploded.bind(this)
    );
  }

  handleBombExploded(event) {
    if (event.detail.affectedFloorTiles) {
      this.updatePlayersDamage(event.detail.affectedFloorTiles);
    }
    if (event.detail.bombObjects) {
      event.detail.bombObjects.forEach((bomb) => this.removeBomb(bomb));
    }
  }

  removeBomb(bomb) {
    const index = this.BombsOnBoard.indexOf(bomb);
    if (index !== -1) {
      this.BombsOnBoard.splice(index, 1);
      bomb.onRemove(this.BombsOnBoard);
    }
  }

  updatePlayersDamage(affectedFloorTiles) {
    this.Players.forEach((player) => player.checkIfDamage(affectedFloorTiles));
  }

  setupBlockCrumbledListener() {
    document.addEventListener(
      "blockCrumbled",
      this.handleBlockCrumbled.bind(this)
    );
  }

  handleBlockCrumbled(event) {
    // Keeping the same logic, that first player in players arr decides if a powerup is created ect
    if (this.id === this.Players[0].id) {
      const powerUp = this.powerUpManager.maybeCreatePowerUpTile(
        event.detail.location
      );
      if (powerUp !== null)
        this.conn.SendServer("createPowerUp", powerUp, this.id);
    }
  }

  createPowerUpTest(args, id) {
    this.powerUpManager.createChosenPowerup(args, this.player);
  }

  setupRemovePowerUpListener() {
    document.addEventListener(
      "removePowerUp",
      this.handleRemovePowerUp.bind(this)
    );
  }

  handleRemovePowerUp(event) {
    this.powerUpManager.removePowerUpTile(event.detail.location);
  }

  setupPlayerDied() {
    document.addEventListener("playerDied", this.handlePlayerDied.bind(this));
  }
  //Could modify the custom events to send the specific player who died, to see who wins
  handlePlayerDied(event) {
    this.PlayersAlive -= 1;
    if (this.PlayersAlive <= 1) {
      let alivePlayer = this.Players.filter((value) => {
        return (!value.isDead && !value.isDying);
      });

      const event = new CustomEvent("gameEnded", {
        detail: {
          lastPlayer: alivePlayer,
        },
      });
      document.dispatchEvent(event);
    }
  }

  setMapStructure(args, id) {
    if (this.id === this.Players[0].id) {
      return;
    }
    this.mapStructure = args; // should probably check if the args is valid here

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

    this.Players.forEach((player) => {
      // updates the map structure for every player.
      player.map = new Map(this.gameBoard, this.mapStructure);
      player.mapStructure = this.mapStructure;
    });
  }

  buildMap() {
    if (this.id !== this.Players[0].id) {
      // currently logic is that first player in players arr sends the map instructions to every other player
      return;
    }
    this.map = new Map(this.gameBoard, this.mapStructure);

    this.map.createMap();
    this.conn.SendServer("setMapStructure", this.mapStructure, this.id);
  }

  playerAdded(args, id) {
    let player = this.playerFromID(id);

    if (player) return; // player already exists!
    console.log("GOT PLAYER ADDED!", id);

    const OtherPlayer = new Player(
      this.gameBoard,
      this.mapStructure,
      this.conn,
      id,
      false
    );

    OtherPlayer.update();
    this.Players.push(OtherPlayer);
  }

  playerLeft(args, id) {
    // can handle this differently instead of just deleting the character (for example turns into a ghost and gets lives lowered to 0)
    let player = this.playerFromID(id);
    if (!player) return;

    // might need to disconnect any events (not sure if javascript automatically does this)
    player.playerElement.remove();
    const index = this.Players.indexOf(player);
    if (index > -1) {
      this.Players.splice(index, 1);
    }
  }

  playerFromID(id) {
    let Player;
    this.Players.forEach((player) => {
      if (player.id == id) {
        Player = player;
        return;
      }
    });
    return Player;
  }

  createGameContainer() {
    this.gameContainer = document.createElement("div");
    this.gameContainer.id = "game-container";
    this.gameBoard = document.createElement("div");
    this.gameBoard.id = "game-board";
    this.playerStats = document.createElement("div");
    this.playerStats.id = "player-stats";
    this.gameContainer.appendChild(this.gameBoard);
    this.gameContainer.appendChild(this.playerStats);
    this.mainContainer.appendChild(this.gameContainer);
  }

  start() {
    this.buildMap();
    //this.createPlayers();
    this.powerUpManager = new PowerUpManager(this.gameBoard, this.mapStructure);
    startAnimating(60);
  }
}
