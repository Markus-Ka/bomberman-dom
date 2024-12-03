export class PlayersStats {
  constructor(statsContainer, players) {
    this.statsContainer = statsContainer;
    this.players = players;
    this.playerCardElements = [];
    this.createPlayerCards();
    this.setupLostLifeListener();
  }

  compareFn(a, b) {
    if (a.id < b.id) {
      return -1;
    } else if (a.id > b.id) {
      return 1;
    }
    // a must be equal to b
    return 0;
  }

  createPlayerCards() {
    // simple solution, could compare existing ones and skip the card creation for them
    this.playerCardElements = [];
    const existingElements = document.querySelectorAll(".player-card-wrapper");
    existingElements.forEach((element) => {
      element.remove();
    });
    this.players.sort(this.compareFn)
    this.players.forEach((player) => {
      const playerCard = new PlayerStatsCard(player, this.statsContainer);
      this.playerCardElements.push(playerCard);
    });
  }

  setupLostLifeListener() {
    document.addEventListener("playerLostLife", this.handleLostLife.bind(this));
  }

  handleLostLife(event) {
    const playerId = event.detail.playerId;
    const livesLeft = event.detail.livesLeft;
    const playerCard = this.playerCardElements.find(
      (card) => card.playerId === playerId
    );

    if (playerCard) {
      playerCard.removeLife();
      if (livesLeft === 0) {
        playerCard.grayOutPlayer();
        const event = new CustomEvent("playerDied", {});
        document.dispatchEvent(event);
      }
    } else {
      console.log(`PlayerStatsCard for player ID ${playerId} not found.`);
    }
  }
}

class PlayerStatsCard {
  constructor(player, statsContainer) {
    this.statsContainer = statsContainer;
    this.playerId = player.id;
    this.playerName = player.name;
    this.createElement();
  }

  createElement() {
    this.cardWrapper = document.createElement("div");
    this.cardWrapper.classList.add("player-card-wrapper");

    this.avatar = document.createElement("div");
    this.avatar.classList.add("player-card-avatar");
    this.avatar.style.backgroundPositionX = `-${(this.playerId - 1) * 29.4}px`;

    this.playerNameEl = document.createElement("div");
    this.playerNameEl.classList.add("player-card-name");
    this.playerNameEl.textContent = this.playerName;

    this.livesWrapper = document.createElement("div");
    this.livesWrapper.classList.add("player-card-lives-wrapper");

    this.nameAndLivesWrapper = document.createElement("div");
    this.nameAndLivesWrapper.classList.add("player-card-name-lives-wrapper");

    this.nameAndLivesWrapper.appendChild(this.playerNameEl);
    this.nameAndLivesWrapper.appendChild(this.livesWrapper);

    for (let i = 0; i < 3; i++) {
      this.life = document.createElement("div");
      this.life.classList.add("player-card-life");
      this.livesWrapper.appendChild(this.life);
    }

    this.cardWrapper.appendChild(this.avatar);
    this.cardWrapper.appendChild(this.nameAndLivesWrapper);

    this.statsContainer.appendChild(this.cardWrapper);
  }

  removeLife() {
    if (this.livesWrapper.lastElementChild) {
      this.livesWrapper.removeChild(this.livesWrapper.lastElementChild);
    } else {
      console.log("Error: No more lives to remove");
    }
  }

  grayOutPlayer() {
    this.overlay = document.createElement("div");
    this.overlay.classList.add("gray-out-overlay");
    this.cardWrapper.appendChild(this.overlay);
  }
}
