package websockets

import (
	"bomberman/internal/structs"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var (
	pongWait          = 10 * time.Second
	pingInterval      = (pongWait * 9) / 10
	writeWait         = 5 * time.Second
	egressBufferSize  = 10
	websocketUpgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     checkOrigin,
	}
)

func checkOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	return strings.HasSuffix(origin, ":8080")
}

type Manager struct {
	clients ClientList
	sync.RWMutex
	Games structs.Games
}

func NewManager() *Manager {
	return &Manager{
		clients: make(ClientList),
		Games: structs.Games{ // assuming Games is a slice of Game
			structs.Game{
				Players:   make([]int, 0, 4),
				Ongoing:   true,
				SizeLimit: 4,
			},
		},
	}
}

func (m *Manager) ServeWS(w http.ResponseWriter, r *http.Request) {

	log.Println("New connection")

	conn, err := websocketUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := NewClient(conn, m)
	// Add the newly created client to the manager
	m.AddClient(client)

}

func NewClient(conn *websocket.Conn, manager *Manager) *Client {
	return &Client{
		conn:    conn,
		manager: manager,
		egress:  make(chan []byte, egressBufferSize),
	}
}

func (m *Manager) AddClient(client *Client) {
	// Lock so we can manipulate
	m.Lock()
	defer m.Unlock()

	// Add Client
	m.clients[client] = true
	go client.WritePump()
	go client.ReadPump()
}

func (m *Manager) RegisterPlayer(client *Client, nickname string) {
	m.Lock()

	client.nickname = nickname
	nicknameJSON, err := json.Marshal(client.nickname)
	if err != nil {
		fmt.Printf("Error marshalling nickname: %v", err)
		return
	}

	// add client to the game and assign an ID
	client.id = m.FindFreeId()
	m.Games[0].Players = append(m.Games[0].Players, client.id)

	if len(m.Games[0].Players) == 2 {
		m.Games[0].TwoPlayersJoinedAt = time.Now()
	}

	m.Unlock()

	IDData := structs.Receive{
		Message:   "nicknameSet",
		ID:        client.id,
		Arguments: string(nicknameJSON),
	}
	client.manager.SendClient(client.id, IDData)

	client.manager.SendRegisteredPlayers(client)
	client.manager.AnnounceNewPlayerAdded(client.id, nicknameJSON)

	if len(m.Games[0].Players) == 3 {
		client.manager.SendRemainingSeconds(client)
	}
}

func (m *Manager) SendRemainingSeconds(currentClient *Client) {
	remainingSeconds := 19 - int(time.Since(m.Games[0].TwoPlayersJoinedAt).Seconds())

	remainingSecondsJSON, err := json.Marshal(remainingSeconds)
	if err != nil {
		fmt.Printf("Error marshalling remaining seconds: %v", err)
		return
	}

	IDData := structs.Receive{
		Message:   "remainingSeconds",
		ID:        currentClient.id,
		Arguments: string(remainingSecondsJSON),
	}
	currentClient.manager.SendClient(currentClient.id, IDData)
}

func (m *Manager) SendRegisteredPlayers(currentClient *Client) {
	m.RLock()
	defer m.RUnlock()

	for otherClient := range m.clients {
		if otherClient.id != 0 && otherClient.id != currentClient.id && otherClient.nickname != "" {
			nicknameJSON, err := json.Marshal(otherClient.nickname)
			if err != nil {
				fmt.Printf("Error marshalling nickname: %v", err)
				return
			}

			playerData := structs.Receive{
				Message:   "playerAdded",
				ID:        otherClient.id,
				Arguments: string(nicknameJSON),
			}

			playerDataByte, err := json.Marshal(playerData)
			if err != nil {
				fmt.Println("Error marshaling player data:", err)
				continue
			}

			// Send the player data to the current client
			currentClient.egress <- playerDataByte
		}
	}
}

func (m *Manager) AnnounceNewPlayerAdded(id int, nicknameJSON []byte) {
	m.RLock()
	defer m.RUnlock()

	for client := range m.clients {
		if client.id != 0 && client.nickname != "" {
			Data := structs.Receive{
				Message:   "playerAdded",
				ID:        id,
				Arguments: string(nicknameJSON),
			}

			DataByte, err := json.Marshal(Data)
			if err != nil {
				fmt.Println("Error marshaling data to send to client:", err)
				continue
			}
			client.egress <- DataByte
		}
	}
}

func (m *Manager) RemoveClient(client *Client) {
	m.Lock()
	defer m.Unlock()

	if _, ok := m.clients[client]; ok {
		// close connection
		client.conn.Close()

		// remove from game array
		var index = find(m.Games[0].Players, client.id)
		if index >= 0 {
			m.Games[0].Players = remove(m.Games[0].Players, index)
		}

		// remove

		Data := structs.Receive{
			Message: "playerLeft",
			ID:      client.id,
		}
		delete(m.clients, client)
		m.SendAllRegisteredPlayers(Data)
	}
}

func (m *Manager) SendAllRegisteredPlayers(Data structs.Receive) {
	DataByte, err := json.Marshal(Data)
	if err != nil {
		fmt.Println("Error marshaling: ", DataByte)
		return
	}
	for c := range m.clients {
		if c.id != 0 && c.nickname != "" {
			fmt.Println("sending to client: ", c.id)
			c.egress <- DataByte
		}
	}
}

func (m *Manager) SendClient(id int, Data structs.Receive) {
	DataByte, err := json.Marshal(Data)
	if err != nil {
		fmt.Println("Error marshaling: ", DataByte)
		return
	}
	for c := range m.clients {
		if c.id != id {
			fmt.Println("failed check with client: ", c.id, id)
			continue
		}
		fmt.Println("sending to single client: ", c.id)
		c.egress <- DataByte
	}

}
