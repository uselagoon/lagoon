package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	mq "github.com/cheshir/go-mq/v2"
	"github.com/uselagoon/lagoon/services/actions-handler/handler"
	"github.com/uselagoon/machinery/utils/variables"
)

var (
	httpListenPort               = os.Getenv("HTTP_LISTEN_PORT")
	mqUser                       string
	mqPass                       string
	mqHost                       string
	mqPort                       string
	mqWorkers                    int
	rabbitReconnectRetryInterval int
	startupConnectionAttempts    int
	startupConnectionInterval    int
	lagoonAPIHost                string
	lagoonAppID                  string
	jwtTokenSigningKey           string
	jwtAudience                  string
	actionsQueueName             string
	actionsExchange              string
	controllerQueueName          string
	controllerExchange           string
	jwtSubject                   string
	jwtIssuer                    string
)

func main() {
	flag.StringVar(&mqUser, "rabbitmq-username", "guest",
		"The username of the rabbitmq user.")
	flag.StringVar(&mqPass, "rabbitmq-password", "guest",
		"The password for the rabbitmq user.")
	flag.StringVar(&mqHost, "rabbitmq-hostname", "localhost",
		"The hostname for the rabbitmq host.")
	flag.StringVar(&mqPort, "rabbitmq-port", "5672",
		"The port for the rabbitmq host.")
	flag.IntVar(&mqWorkers, "rabbitmq-queue-workers", 2,
		"The number of workers to start with.")
	flag.IntVar(&rabbitReconnectRetryInterval, "rabbitmq-reconnect-retry-interval", 30,
		"The retry interval for rabbitmq.")
	flag.IntVar(&startupConnectionAttempts, "startup-connection-attempts", 10,
		"The number of startup attempts before exiting.")
	flag.IntVar(&startupConnectionInterval, "startup-connection-interval-seconds", 30,
		"The duration between startup attempts.")
	flag.StringVar(&lagoonAPIHost, "lagoon-api-host", "http://localhost:3000/graphql",
		"The host for the lagoon api.")
	flag.StringVar(&jwtTokenSigningKey, "jwt-token-signing-key", "super-secret-string",
		"The jwt signing token key or secret.")
	flag.StringVar(&jwtAudience, "jwt-audience", "api.dev",
		"The jwt audience.")
	flag.StringVar(&jwtSubject, "jwt-subject", "actions-handler",
		"The jwt audience.")
	flag.StringVar(&jwtIssuer, "jwt-issuer", "actions-handler",
		"The jwt audience.")
	flag.StringVar(&actionsQueueName, "actions-queue-name", "lagoon-actions:items",
		"The name of the queue in rabbitmq to use.")
	flag.StringVar(&actionsExchange, "actions-exchange", "lagoon-actions",
		"The name of the exchange in rabbitmq to use.")
	flag.StringVar(&controllerQueueName, "controller-queue-name", "lagoon-tasks:controller",
		"The name of the queue in rabbitmq to use.")
	flag.StringVar(&controllerExchange, "controller-exchange", "lagoon-tasks",
		"The name of the exchange in rabbitmq to use.")
	flag.Parse()

	// get overrides from environment variables
	mqUser = variables.GetEnv("RABBITMQ_USERNAME", mqUser)
	mqPass = variables.GetEnv("RABBITMQ_PASSWORD", mqPass)
	mqHost = variables.GetEnv("RABBITMQ_ADDRESS", mqHost)
	mqPort = variables.GetEnv("RABBITMQ_PORT", mqPort)
	mqWorkers = variables.GetEnvInt("RABBITMQ_WORKERS", mqWorkers)
	lagoonAPIHost = variables.GetEnv("GRAPHQL_ENDPOINT", lagoonAPIHost)
	jwtTokenSigningKey = variables.GetEnv("JWT_SECRET", jwtTokenSigningKey)
	jwtAudience = variables.GetEnv("JWT_AUDIENCE", jwtAudience)
	jwtSubject = variables.GetEnv("JWT_SUBJECT", jwtSubject)
	jwtIssuer = variables.GetEnv("JWT_ISSUER", jwtIssuer)
	actionsQueueName = variables.GetEnv("ACTIONS_QUEUE_NAME", actionsQueueName)
	actionsExchange = variables.GetEnv("ACTIONS_EXCHANGE", actionsExchange)
	controllerQueueName = variables.GetEnv("CONTROLLER_QUEUE_NAME", controllerQueueName)
	controllerExchange = variables.GetEnv("CONTROLLER_EXCHANGE", controllerExchange)

	enableDebug := true

	graphQLConfig := handler.LagoonAPI{
		Endpoint:        lagoonAPIHost,
		TokenSigningKey: jwtTokenSigningKey,
		JWTAudience:     jwtAudience,
		JWTSubject:      jwtSubject,
		JWTIssuer:       jwtIssuer,
	}

	log.Println("actions-handler running")

	config := mq.Config{
		ReconnectDelay: time.Duration(rabbitReconnectRetryInterval) * time.Second,
		Exchanges: mq.Exchanges{
			mq.ExchangeConfig{
				Name: "lagoon-logs",
				Type: "direct",
				Options: mq.Options{
					"durable":       true,
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
			mq.ExchangeConfig{
				Name: actionsExchange,
				Type: "direct",
				Options: mq.Options{
					"durable":       true,
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
			mq.ExchangeConfig{
				Name: controllerExchange,
				Type: "direct",
				Options: mq.Options{
					"durable":       true,
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
		},
		Consumers: mq.Consumers{
			mq.ConsumerConfig{
				Name:    actionsQueueName,
				Queue:   actionsQueueName,
				Workers: mqWorkers,
				Options: mq.Options{
					"durable":       true,
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
			mq.ConsumerConfig{
				Name:    controllerQueueName,
				Queue:   controllerQueueName,
				Workers: mqWorkers,
				Options: mq.Options{
					"durable":       true,
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
		},
		Queues: mq.Queues{
			mq.QueueConfig{
				Name:     actionsQueueName,
				Exchange: actionsExchange,
				Options: mq.Options{
					"durable":       true,
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
			mq.QueueConfig{
				Name:       controllerQueueName,
				Exchange:   controllerExchange,
				RoutingKey: "controller",
				Options: mq.Options{
					"durable":       true,
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
		},
		Producers: mq.Producers{
			mq.ProducerConfig{
				Name:     actionsExchange,
				Exchange: actionsExchange,
				Options: mq.Options{
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
			mq.ProducerConfig{
				Name:     "lagoon-logs",
				Exchange: "lagoon-logs",
				Options: mq.Options{
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
		},
		DSN: fmt.Sprintf("amqp://%s:%s@%s/", mqUser, mqPass, fmt.Sprintf("%s:%s", mqHost, mqPort)),
	}

	messenger := handler.New(config,
		graphQLConfig,
		startupConnectionAttempts,
		startupConnectionInterval,
		actionsQueueName,
		controllerQueueName,
		enableDebug,
	)

	// start the consumer
	messenger.Consumer()

}
