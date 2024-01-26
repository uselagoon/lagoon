package main

import (
	"flag"
	"fmt"
	"os"
	"strconv"
	"time"

	mq "github.com/cheshir/go-mq/v2"
	"github.com/uselagoon/lagoon/services/workflows/internal/handler"
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
	workflowsQueueName           string
	workflowsExchange            string
	jwtSubject                   string
	jwtIssuer                    string
)

func main() {
	flag.StringVar(&lagoonAppID, "lagoon-app-id", "workflows",
		"The appID to use that will be sent with messages.")
	flag.StringVar(&mqUser, "rabbitmq-username", "guest",
		"The username of the rabbitmq user.")
	flag.StringVar(&mqPass, "rabbitmq-password", "guest",
		"The password for the rabbitmq user.")
	flag.StringVar(&mqHost, "rabbitmq-hostname", "localhost",
		"The hostname for the rabbitmq host.")
	flag.StringVar(&mqPort, "rabbitmq-port", "5672",
		"The port for the rabbitmq host.")
	flag.IntVar(&mqWorkers, "rabbitmq-queue-workers", 1,
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
	flag.StringVar(&jwtSubject, "jwt-subject", "workflows",
		"The jwt audience.")
	flag.StringVar(&jwtIssuer, "jwt-issuer", "workflows",
		"The jwt audience.")
	flag.StringVar(&workflowsQueueName, "workflows-queue-name", "lagoon-logs:workflows",
		"The name of the queue in rabbitmq to use.")
	flag.StringVar(&workflowsExchange, "workflows-exchange", "lagoon-logs",
		"The name of the exchange in rabbitmq to use.")
	flag.Parse()

	// get overrides from environment variables
	mqUser = getEnv("RABBITMQ_USERNAME", mqUser)
	mqPass = getEnv("RABBITMQ_PASSWORD", mqPass)
	mqHost = getEnv("RABBITMQ_HOST", mqHost)
	mqPort = getEnv("RABBITMQ_PORT", mqPort)
	lagoonAPIHost = getEnv("API_HOST", lagoonAPIHost)
	jwtTokenSigningKey = getEnv("JWTSECRET", jwtTokenSigningKey)
	jwtAudience = getEnv("JWT_AUDIENCE", jwtAudience)
	jwtSubject = getEnv("JWT_SUBJECT", jwtSubject)
	jwtIssuer = getEnv("JWT_ISSUER", jwtIssuer)
	workflowsQueueName = getEnv("WORKFLOWS_QUEUE_NAME", workflowsQueueName)
	workflowsExchange = getEnv("WORKFLOWS_EXCHANGE", workflowsExchange)

	enableDebug := true

	// configure the backup handler settings
	broker := handler.RabbitBroker{
		Hostname:     fmt.Sprintf("%s:%s", mqHost, mqPort),
		Username:     mqUser,
		Password:     mqPass,
		QueueName:    workflowsQueueName,
		ExchangeName: workflowsExchange,
	}
	graphQLConfig := handler.LagoonAPI{
		Endpoint:        lagoonAPIHost,
		TokenSigningKey: jwtTokenSigningKey,
		JWTAudience:     jwtAudience,
		JWTSubject:      jwtSubject,
		JWTIssuer:       jwtIssuer,
	}

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
		},
		Consumers: mq.Consumers{
			mq.ConsumerConfig{
				Name:    "items-queue",
				Queue:   "lagoon-logs:workflows",
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
				Name:     "lagoon-logs:workflows",
				Exchange: "lagoon-logs",
				Options: mq.Options{
					"durable":       true,
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
		},
		//Producers: mq.Producers{
		//	{
		//		Name:     "lagoon-actions",
		//		Exchange: "lagoon-actions",
		//		Options: mq.Options{
		//			"app_id":        lagoonAppID,
		//			"delivery_mode": "2",
		//			"headers":       "",
		//			"content_type":  "",
		//		},
		//	},
		//	{
		//		Name:     "lagoon-logs",
		//		Exchange: "lagoon-logs",
		//		Options: mq.Options{
		//			"app_id":        lagoonAppID,
		//			"delivery_mode": "2",
		//			"headers":       "",
		//			"content_type":  "",
		//		},
		//	},
		//},
		DSN: fmt.Sprintf("amqp://%s:%s@%s/", broker.Username, broker.Password, broker.Hostname),
	}

	messaging := handler.NewMessaging(config,
		graphQLConfig,
		startupConnectionAttempts,
		startupConnectionInterval,
		enableDebug,
	)

	// start the consumer
	messaging.Consumer()

}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// accepts fallback values 1, t, T, TRUE, true, True, 0, f, F, FALSE, false, False
// anything else is false.
func getEnvBool(key string, fallback bool) bool {
	if value, ok := os.LookupEnv(key); ok {
		rVal, _ := strconv.ParseBool(value)
		return rVal
	}
	return fallback
}
