import Game from "./components/Game.js";
import UIController from "./ui/UIController.js";
import ClientConnection from "./network/WebSocket.js";

document.addEventListener("DOMContentLoaded", () => {
  const mainContainer = document.getElementById("app");
  const uiController = new UIController(mainContainer);

  const conn = new ClientConnection({
    playerAdded: uiController.addPlayerLobby.bind(uiController),
    playerLeft: uiController.removePlayerLobby.bind(uiController),
    nicknameSet: uiController.handleNicknameSet.bind(uiController),
    remainingSeconds: uiController.updateWaitingTimer.bind(uiController),
    startGame: uiController.startGame.bind(uiController),
  });

  uiController.setConnection(conn);
  uiController.showStartScreen();
});
