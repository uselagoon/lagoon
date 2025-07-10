package main

import (
	"github.com/uselagoon/lagoon-sneak/services/webhooks/internal/server"
)

func main() {
	srv := server.Server{}
	srv.Initialize()
	srv.Run(":8010")
}
