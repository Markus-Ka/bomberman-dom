export default class StartScreen {
  constructor(mainContainer, conn) {
    this.mainContainer = mainContainer;
    this.conn = conn;
    this.showingStartScreen = false;
    this.showingRules = false;
    this.initStartScreen();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.startButton.addEventListener(
      "click",
      this.handleSubmitNickname.bind(this)
    );
    this.rulesCloseButton.addEventListener("click", this.hideRules.bind(this));
    this.startContainer.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (this.showingStartScreen) {
          this.handleSubmitNickname();
        } else if (this.showingRules) {
          this.hideRules();
        }
      }
    });
  }

  initStartScreen() {
    this.startContainer = document.createElement("div");
    this.startContainer.id = "start-container";

    this.startTitle = document.createElement("div");
    this.startTitle.id = "start-title";
    this.startTitle.textContent = "BOMBERMAN";

    this.controlsWrapper = document.createElement("div");
    this.controlsWrapper.id = "start-controls-wrapper";

    this.controlsTitle = document.createElement("div");
    this.controlsTitle.id = "start-controls-title";
    this.controlsTitle.textContent = "CONTROLS:";

    this.controlsText = document.createElement("div");
    this.controlsText.id = "start-controls-text";
    this.controlsText.innerHTML = `
    <div>Arrow keys - Move</div>
    <div>Spacebar - Drop bomb</div>`;

    this.controlsWrapper.appendChild(this.controlsTitle);
    this.controlsWrapper.appendChild(this.controlsText);

    this.powerUpsWrapper = document.createElement("div");
    this.powerUpsWrapper.id = "start-powerups-wrapper";

    this.powerUpsTitle = document.createElement("div");
    this.powerUpsTitle.id = "start-powerups-title";
    this.powerUpsTitle.textContent = "POWER-UPS:";

    this.powerUpsDescriptionWrapper = document.createElement("div");
    this.powerUpsDescriptionWrapper.id = "start-powerups-description-wrapper";

    const powerUps = [
      {
        bgPosition: "-60px 0px",
        description: "Speed up. Single upgrade only.",
      },
      { bgPosition: "0px 0px", description: "Extra bomb. Can be stacked." },
      {
        bgPosition: "-30px 0px",
        description: "Bigger explosion. Can be stacked.",
      },
    ];

    powerUps.forEach((powerup) => {
      const powerUpSymbol = document.createElement("div");
      powerUpSymbol.classList.add("start-powerup-icon");
      powerUpSymbol.style.backgroundPosition = powerup.bgPosition;

      const powerUpText = document.createElement("div");
      powerUpText.classList.add("start-powerup-text");
      powerUpText.textContent = powerup.description;

      this.powerUpsDescriptionWrapper.appendChild(powerUpSymbol);
      this.powerUpsDescriptionWrapper.appendChild(powerUpText);
    });

    this.powerUpsWrapper.appendChild(this.powerUpsTitle);
    this.powerUpsWrapper.appendChild(this.powerUpsDescriptionWrapper);

    this.nameInputWrapper = document.createElement("div");
    this.nameInputWrapper.id = "start-name-input-wrapper";

    this.nameInputDescription = document.createElement("div");
    this.nameInputDescription.id = "start-name-input-description";
    this.nameInputDescription.textContent = "Enter your name to start";

    this.nameInput = document.createElement("input");
    this.nameInput.id = "start-name-input";
    this.nameInput.setAttribute("maxlength", 10);

    this.startButton = document.createElement("button");
    this.startButton.classList.add("start-screen-button");
    this.startButton.innerHTML = `<div>START</div>`;

    this.rulesCloseButton = document.createElement("button");
    this.rulesCloseButton.classList.add("start-screen-button");
    this.rulesCloseButton.innerHTML = `<div>CLOSE</div>`;
    this.rulesCloseButton.style.display = "none";

    this.nameInputWrapper.appendChild(this.nameInputDescription);
    this.nameInputWrapper.appendChild(this.nameInput);
    this.nameInputWrapper.appendChild(this.startButton);

    this.startContainer.appendChild(this.startTitle);
    this.startContainer.appendChild(this.controlsWrapper);
    this.startContainer.appendChild(this.powerUpsWrapper);
    this.startContainer.appendChild(this.nameInputWrapper);
    this.startContainer.appendChild(this.rulesCloseButton);

    this.mainContainer.appendChild(this.startContainer);
    this.nameInput.focus();

    this.showingStartScreen = true;
  }

  handleSubmitNickname() {
    if (!this.showingStartScreen) {
      return;
    }
    const nickname = this.nameInput.value;
    if (nickname.trim() !== "") {
      console.log(nickname);
      this.nameInput.value = "";
      this.conn.SendServer("setNickname", nickname, 0);
    }
  }

  hideStartScreen() {
    this.startContainer.style.display = "none";
    this.showingStartScreen = false;
  }

  showStartScreen() {
    this.nameInputWrapper.style.display = "block";
    this.startContainer.style.display = "flex";
    this.showingStartScreen = true;
  }

  showRules() {
    this.nameInputWrapper.style.display = "none";
    this.rulesCloseButton.style.display = "block";
    this.startContainer.style.display = "block";
    this.rulesCloseButton.focus();
    this.showingRules = true;

    this.outsideClickListener = (event) => {
      if (
        !this.startContainer.contains(event.target) &&
        event.target.id !== "show-rules-button"
      ) {
        this.hideRules();
      }
    };
    document.addEventListener("click", this.outsideClickListener);
  }

  hideRules() {
    if (this.showingRules) {
      this.rulesCloseButton.style.display = "none";
      this.startContainer.style.display = "none";
      this.showingRules = false;
    }
    document.removeEventListener("click", this.outsideClickListener);
  }
}
