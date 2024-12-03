package routes

import (
	"bomberman/internal/websockets"
	"fmt"
	"net/http"
)

func HandleRoutes() {
	fmt.Println("routes")
	manager := websockets.NewManager()
	http.Handle("/", http.FileServer(http.Dir("../frontend/")))

	http.HandleFunc("/ws", manager.ServeWS)
}
