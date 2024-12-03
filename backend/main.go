package main

import (
	"bomberman/internal/routes"
	"fmt"
	"log"
	"net/http"
)

func main() {
	routes.HandleRoutes()
	fmt.Println("test!")

	log.Fatal(http.ListenAndServe(":8080", nil))
}
