package websockets

import (
	"bomberman/internal/structs"
	"fmt"
	"time"

	"encoding/json"

	"github.com/gorilla/websocket"
)

type ClientList map[*Client]bool

type Client struct {
	id       int // keep track of join order
	nickname string
	conn     *websocket.Conn
	egress   chan []byte
	manager  *Manager
}

func (c *Client) ReadPump() {
	// Close client ws conn in case of ReadPump error
	defer func() {
		c.manager.RemoveClient(c)
	}()

	const maxMessageSize = 8192 // 8KB
	c.conn.SetReadLimit(maxMessageSize)
	// Reset the countdown for considering connection alive/dead
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	// Set pong handler
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				fmt.Println("unexpected close: ", err)
			}
			break
		}
		fmt.Println("new message:", string(message))
		var Data structs.Receive
		if err := json.Unmarshal(message, &Data); err != nil {
			fmt.Printf("Error unmarshalling message: %v", err)
			continue
		}

		if Data.Message == "setNickname" {
			c.manager.RegisterPlayer(c, Data.Arguments)
			continue
		}

		if Data.Message == "newChatMessage" {
			Data.Nickname = c.nickname
		}

		fmt.Println("Data: ", Data)
		c.manager.SendAllRegisteredPlayers(Data)

	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingInterval)
	defer func() {
		ticker.Stop()
	}()
	for {
		select {
		case message, ok := <-c.egress:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				fmt.Println("not ok! closing!", c.id)
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			fmt.Println("message:", string(message))

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				fmt.Println("ERR: ", err)
				return
			}
			w.Write([]byte(message))
			if err := w.Close(); err != nil {
				fmt.Println("ERR: ", err)
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				fmt.Println("not ok1! closing!", c.id)
				return
			}
		}
	}
}
