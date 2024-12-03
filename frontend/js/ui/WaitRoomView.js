export class WaitingRoom {
  constructor(UIController, players) {
    this.UIController = UIController;
    this.waitingRoomContainer = UIController.waitingRoomContainer;
    this.players = players;
    this.timerIntervalId = null;
    this.createElements();
    this.updateTimer();
  }
  createElements() {
    // timer message
    this.timerMessage = document.createElement("div");
    this.timerMessage.id = "timer-message";
    this.timerMessage.textContent = "Waiting For Players";
    this.waitingRoomContainer.appendChild(this.timerMessage);
    // timer
    this.waitingRoomTimer = document.createElement("div");
    this.waitingRoomTimer.id = "waiting-room-timer";
    this.waitingRoomContainer.appendChild(this.waitingRoomTimer);
    // buttons
    this.buttons = new WaitingButtons(
      this.waitingRoomContainer,
      this.UIController
    );
  }

  startWaitingTimer(duration) {
    let timer = duration;

    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
    }

    if (this.timerMessage.textContent !== "Waiting For Players") {
      this.timerMessage.textContent = "Waiting For Players";
    }

    this.timerIntervalId = setInterval(() => {
      this.waitingRoomTimer.textContent = timer;
      if (--timer < 0) {
        timer = 0;
        clearInterval(this.timerIntervalId);
        this.timerIntervalId = null;
        this.startGetReadyTimer(3);
        return;
      }
    }, 1000);
  }

  startGetReadyTimer(duration) {
    let timer = duration;
    this.waitingRoomTimer.textContent = timer;
    --timer;

    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
    }

    if (this.timerMessage.textContent !== "Get ready") {
      this.timerMessage.textContent = "Get ready";
    }

    this.timerIntervalId = setInterval(() => {
      if (timer > 0) {
        this.waitingRoomTimer.textContent = timer;
      }
      if (--timer < 0) {
        timer = 0;
        clearInterval(this.timerIntervalId);
        this.timerIntervalId = null;
        this.trySendStartGame();
        return;
      }
    }, 1000);
  }

  trySendStartGame() {
    if (this.players[0].id === this.UIController.id) {
      this.UIController.conn.SendServer("startGame", undefined, this.id);
    }
  }

  updateTimer() {
    const numPlayers = this.players.length;

    console.log("Updating timer, numPlayers: ", numPlayers);
    console.log("timerIntervalId", this.timerIntervalId);

    if (numPlayers === 1) {
      if (this.timerIntervalId !== null) {
        clearInterval(this.timerIntervalId);
        this.timerIntervalId = null;
      }
      this.timerMessage.textContent = "Waiting For Players";
      this.waitingRoomTimer.textContent = null;
    } else if (numPlayers >= 2 && numPlayers < 4 && !this.timerIntervalId) {
      this.startWaitingTimer(20);
    } else if (numPlayers === 4) {
      this.startGetReadyTimer(10);
    }
  }
}

class WaitingButtons {
  constructor(waitingRoomContainer, UIController) {
    this.UIController = UIController;
    this.waitingRoomContainer = waitingRoomContainer;
    this.createElement();
  }
  createElement() {
    this.buttonContainer = document.createElement("div");
    this.buttonContainer.id = "button-container";
    this.waitingRoomContainer.appendChild(this.buttonContainer);

    this.leaveButton = document.createElement("div");
    this.leaveButton.id = "leave-game-button";
    this.leaveButton.textContent = "Leave Game";
    this.buttonContainer.appendChild(this.leaveButton);
    this.leaveButton.addEventListener("click", () => {
      location.reload();
    });

    this.rulesButton = document.createElement("div");
    this.rulesButton.id = "show-rules-button";
    this.rulesButton.textContent = "Rules"; //Show Rules
    this.rulesButton.addEventListener("click", () => {
      this.UIController.StartScreen.showRules();
    });
    this.buttonContainer.appendChild(this.rulesButton);
  }
}
