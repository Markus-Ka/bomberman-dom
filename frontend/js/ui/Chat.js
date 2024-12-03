export class Chat {
  constructor(chatContainer, conn) {
    this.chatContainer = chatContainer;
    this.conn = conn;
    this.id = 0;
    this.createChatElements();
    this.setupEventListeners();
    this.setupChatConn();
  }

  createChatElements() {
    this.chatMessagesContainer = document.createElement("div");
    this.chatMessagesContainer.id = "chat-messages-container";

    this.chatInputWrapper = document.createElement("div");
    this.chatInputWrapper.id = "chat-input-wrapper";

    this.chatInput = document.createElement("textarea");
    this.chatInput.id = "chat-input";
    this.chatInput.placeholder = "Chat with players";

    this.sendButton = document.createElement("button");
    this.sendButton.id = "send-button";

    this.sendButtonText = document.createElement("div");
    this.sendButtonText.id = "send-button-text";
    this.sendButtonText.textContent = "SEND";

    this.sendButton.appendChild(this.sendButtonText);

    this.chatInputWrapper.appendChild(this.chatInput);
    this.chatInputWrapper.appendChild(this.sendButton);

    this.chatContainer.appendChild(this.chatMessagesContainer);
    this.chatContainer.appendChild(this.chatInputWrapper);
  }

  setupChatConn() {
    this.conn.callbacks["newChatMessage"] = (this.addChatMessageToContainer.bind(this));
  }

  setupEventListeners() {
    this.sendButton.addEventListener("click", this.sendChatMessage.bind(this));
    this.chatInput.addEventListener("keydown", (e) => {
      this.chatInput.placeholder = "";
      if (e.key === "Enter") {
        e.preventDefault();
        this.sendChatMessage();
      }
    });
  }

  sendChatMessage() {
    const newMessage = this.chatInput.value;

    if (newMessage.trim() !== "") {
      this.conn.SendServer("newChatMessage", newMessage, this.id);
    }

    this.chatInput.value = "";
  }

  addChatMessageToContainer(Message, id, PlayerName) {
    this.chatMessage = document.createElement("div");
    this.chatMessage.classList.add("chat-message");
    this.chatMessage.classList.add(`sender-${id}`);
    const playerName = id === this.id ? "You" : PlayerName;
    this.chatMessage.textContent = `${playerName}: ${Message}`;
    this.chatMessagesContainer.appendChild(this.chatMessage);
    
     
    this.chatMessagesContainer.lastChild.scrollIntoView();
  }
}
