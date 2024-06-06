package main

/*
	this is a simple wrestic snapshot webhook handler for lagoon

	https://nesv.github.io/golang/2014/02/25/worker-queues-in-go.html
	workerqueues maybe in the event rabbit goes away
*/

import (
	"log"
	"net/http"
	"os"

	"github.com/uselagoon/lagoon/services/backup-handler/internal/handler"
)

var (
	httpListenPort = os.Getenv("HTTP_LISTEN_PORT")
)

func main() {
	// we want all of these vars, else fail
	if len(os.Getenv("RABBITMQ_ADDRESS")) == 0 {
		log.Fatalln("RABBITMQ_ADDRESS not set")
	}
	if len(os.Getenv("RABBITMQ_PORT")) == 0 {
		log.Fatalln("RABBITMQ_PORT not set")
	}
	if len(os.Getenv("RABBITMQ_USERNAME")) == 0 {
		log.Fatalln("RABBITMQ_USERNAME not set")
	}
	if len(os.Getenv("RABBITMQ_PASSWORD")) == 0 {
		log.Fatalln("RABBITMQ_PASSWORD not set")
	}
	if len(os.Getenv("JWT_SECRET")) == 0 {
		log.Fatalln("JWT_SECRET not set")
	}
	if len(os.Getenv("JWT_AUDIENCE")) == 0 {
		log.Fatalln("JWT_AUDIENCE not set")
	}
	if len(os.Getenv("JWT_SUBJECT")) == 0 {
		log.Fatalln("JWT_SUBJECT not set")
	}
	if len(os.Getenv("JWT_ISSUER")) == 0 {
		log.Fatalln("JWT_ISSUER not set")
	}
	if len(os.Getenv("LAGOON_API_VERSION")) == 0 {
		log.Fatalln("LAGOON_API_VERSION not set")
	}
	if len(os.Getenv("GRAPHQL_ENDPOINT")) == 0 {
		log.Fatalln("GRAPHQL_ENDPOINT not set")
	}
	if len(os.Getenv("HTTP_LISTEN_PORT")) == 0 {
		httpListenPort = "3000"
	}

	// configure the backup handler settings
	broker := handler.RabbitBroker{
		Hostname:     os.Getenv("RABBITMQ_ADDRESS"),
		Username:     os.Getenv("RABBITMQ_USERNAME"),
		Password:     os.Getenv("RABBITMQ_PASSWORD"),
		Port:         os.Getenv("RABBITMQ_PORT"),
		QueueName:    "lagoon-webhooks:queue",
		ExchangeName: "lagoon-webhooks",
	}
	graphQL := handler.LagoonAPI{
		Endpoint:        os.Getenv("GRAPHQL_ENDPOINT"),
		TokenSigningKey: os.Getenv("JWT_SECRET"),
		JWTAudience:     os.Getenv("JWT_AUDIENCE"),
		JWTSubject:      os.Getenv("JWT_SUBJECT"),
		JWTIssuer:       os.Getenv("JWT_ISSUER"),
		Version:         os.Getenv("LAGOON_API_VERSION"),
	}

	// set up the backup handler
	backupHandler, err := handler.NewBackupHandler(broker, graphQL)
	if err != nil {
		panic(err)
	}

	log.Println("backup-handler running")

	// handle the webhook requests
	http.HandleFunc("/", backupHandler.WebhookHandler)
	http.ListenAndServe(":"+httpListenPort, nil)
}
