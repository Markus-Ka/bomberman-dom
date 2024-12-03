package structs

import "time"

type Receive struct {
	Message   string `json:"message"`
	ID        int    `json:"id"`
	Nickname  string `json:"nickname,omitempty"`
	Arguments string `json:"args"`
}

type Game struct {
	Players            []int
	Ongoing            bool
	SizeLimit          int // 4
	MapStructure       [][]int
	TwoPlayersJoinedAt time.Time
}

type Games = []Game
