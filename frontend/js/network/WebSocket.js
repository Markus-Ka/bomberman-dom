export default class ClientConnection {


    constructor(callbacks) {
        console.log("ws://" + "localhost:8080" + "/ws", this, this.create);
        this.create();
        this.callbacks = callbacks;
        this.conn.onclose = () => {
            this.Test = "Testing!!!";
            console.log("closed! creating new websocket!", this);
            setTimeout(this.create.bind(this), 1000);
        };
    }

    create() {
        this.conn = new WebSocket("ws://" + "localhost:8080" + "/ws");
        this.GameOver = false;

        this.conn.addEventListener('message', (MessageEvent) => {
            let Data = JSON.parse(MessageEvent.data);
            let Args;
            let Nickname;
            if (Data.args) {
                Args = JSON.parse(Data.args);
            }
            if (Data.nickname) {
                Nickname = Data.nickname;
            }
            let id = Data.id;
            console.log(`Received message from server: ${Data.message} Args: ${Data.args} Args Object: ${Args} ID:${id}`);
            if (this.callbacks[Data.message]) {
                this.callbacks[Data.message](Args, id, Nickname); // nickname is only for chat messages currently (check how to add from backend if needed!)
            }
        });

    }

    SendServer(message, args, id) {
        console.log(`Sending to server message: ${message}, With args: ${args}`);
        if (message !== "setNickname") {
            args = JSON.stringify(args);
        }
        this.conn.send(JSON.stringify({
            message: message,
            args: args,
            id: id
        }));
    }
}