import StartScreen from "./StartScreen.js";
import { PlayersStats } from "./PlayersStats.js";
import { Chat } from "./Chat.js";
import { WaitingRoom } from "./WaitRoomView.js";
import Game from "../components/Game.js";
import Player from "../components/Player.js";

export default class UIController {
  constructor(mainContainer) {
    this.mainContainer = mainContainer;
    this.players = [];
    this.game;
    this.setupGameEndedListener();
  }

  setConnection(conn) {
    this.conn = conn;
  }

  showStartScreen() {
    this.StartScreen = new StartScreen(this.mainContainer, this.conn);
  }

  createGameView() {
    this.gameContainer = document.createElement("div");
    this.gameContainer.id = "game-container";

    this.statsContainer = document.createElement("div");
    this.statsContainer.id = "stats-container";

    this.gameBoard = document.createElement("div");
    this.gameBoard.id = "game-board";

    this.chatContainer = document.createElement("div");
    this.chatContainer.id = "chat-container";

    this.boardAndChatWrapper = document.createElement("div");
    this.boardAndChatWrapper.id = "board-and-chat-wrapper";

    this.waitingRoomContainer = document.createElement("div");
    this.waitingRoomContainer.id = "waiting-room-container";

    this.gameContainer.appendChild(this.statsContainer);
    this.boardAndChatWrapper.appendChild(this.gameBoard);
    this.boardAndChatWrapper.appendChild(this.waitingRoomContainer);
    this.boardAndChatWrapper.appendChild(this.chatContainer);
    this.gameContainer.appendChild(this.boardAndChatWrapper);
    this.mainContainer.appendChild(this.gameContainer);

    this.StatsSidebar = new PlayersStats(this.statsContainer, this.players);
    this.Chat = new Chat(this.chatContainer, this.conn);
    this.WaitingRoom = new WaitingRoom(this, this.players);
  }

  findPlayer(id) {
    let Player;
    for (let i = 0; i < this.players.length; i++) {
      let value = this.players[i];
      if (value.id == id) {
        Player = id;
      }
    }
    return Player;
  }

  addPlayerLobby(nickname, id) {
    if (this.findPlayer(id)) {
      return;
    }
    if (this.players.length < 4) {
      this.players.push({
        id: id,
        name: nickname,
      });
      this.WaitingRoom.updateTimer();
      this.StatsSidebar.createPlayerCards();
    } else {
      console.log("at max players");
    }
  }

  removePlayerLobby(args, id) {
    let Player = this.findPlayer(id);
    if (!Player) {
      return;
    }

    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].id == id) {
        this.players.splice(i, 1);
      }
    }
    this.StatsSidebar.createPlayerCards();

    // if only 1 player left in lobby, cancel countdown
    if (this.players.length < 2) {
      this.WaitingRoom.updateTimer();
    }
  }

  handleNicknameSet(nickname, id) {
    this.StartScreen.hideStartScreen();
    this.createGameView();
    this.showWaitingRoom();

    this.id = id;
    this.Chat.id = id;
    this.players.push({
      id: id,
      myPlayer: true, // means that this is the player the web browser is controlling.
      name: nickname,
    });
    this.StatsSidebar.createPlayerCards();
  }

  updateWaitingTimer(secondsLeft, id) {
    this.WaitingRoom.startWaitingTimer(secondsLeft);
  }

  startGame() {
    this.showGame();
    this.game = new Game(this);
    this.game.start();
  }

  showWaitingRoom() {
    this.gameBoard.style.display = "none";
    this.waitingRoomContainer.style.display = "";
  }
  showGame() {
    this.waitingRoomContainer.style.display = "none";
    this.gameBoard.style.display = "";
  }

  setupGameEndedListener() {
    document.addEventListener("gameEnded", this.gameEnded.bind(this));
  }

  gameEnded(event) {
    console.log("UIcontroller received game ended event", event, event.detail.lastPlayer, event.detail.lastPlayer[0]);
    let PlayerName
    this.players.forEach((value) => {
      if (value.id == event.detail.lastPlayer[0].id) {
        PlayerName = value.name
      }
    })

    this.WaitingRoom.timerMessage.textContent = "Round Over" + "\n Winner: " + PlayerName;
    this.WaitingRoom.waitingRoomTimer.textContent = "";
    this.WaitingRoom.waitingRoomTimer.textContent = "";
    this.WaitingRoom.buttons.leaveButton.style.display = "none";
    this.WaitingRoom.buttons.rulesButton.style.display = "none";

    this.showWaitingRoom();
    setTimeout(() => {
      location.reload(); // simplest way and seems to work well, can try without reload but it gets messy
    }, 5000);
  }
}
