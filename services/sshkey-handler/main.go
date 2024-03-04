package main

import (
	"github.com/uselagoon/lagoon/services/sshkey-handler/internal/server"
)

func main() {
	if err := server.Run(); err != nil {
		panic(err)
	}
}
