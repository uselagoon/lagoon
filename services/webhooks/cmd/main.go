package main

import (
	"flag"
	"fmt"
	"time"

	mq "github.com/cheshir/go-mq/v2"
	"github.com/uselagoon/lagoon-sneak/services/webhooks/internal/messaging"
	"github.com/uselagoon/lagoon-sneak/services/webhooks/internal/server"
	"github.com/uselagoon/machinery/utils/variables"
)

var (
	mqUser              string
	mqPass              string
	mqHost              string
	mqTLS               bool
	mqVerify            bool
	mqCACert            string
	mqClientCert        string
	mqClientKey         string
	mqWorkers           int
	rabbitRetryInterval int
)

func main() {
	flag.StringVar(&mqUser, "rabbitmq-username", "guest",
		"The username of the rabbitmq user.")
	flag.StringVar(&mqPass, "rabbitmq-password", "guest",
		"The password for the rabbitmq user.")
	flag.StringVar(&mqHost, "rabbitmq-hostname", "localhost:5672",
		"The hostname:port for the rabbitmq host.")
	flag.BoolVar(&mqTLS, "rabbitmq-tls", false,
		"To use amqps instead of amqp.")
	flag.BoolVar(&mqVerify, "rabbitmq-verify", false,
		"To verify rabbitmq peer connection.")
	flag.StringVar(&mqCACert, "rabbitmq-cacert", "",
		"The path to the ca certificate")
	flag.StringVar(&mqClientCert, "rabbitmq-clientcert", "",
		"The path to the client certificate")
	flag.StringVar(&mqClientKey, "rabbitmq-clientkey", "",
		"The path to the client key")
	flag.IntVar(&mqWorkers, "rabbitmq-queue-workers", 1,
		"The number of workers to start with.")
	flag.IntVar(&rabbitRetryInterval, "rabbitmq-retry-interval", 30,
		"The retry interval for rabbitmq.")

	flag.Parse()

	// get overrides from environment variables
	mqUser = variables.GetEnv("RABBITMQ_USERNAME", mqUser)
	mqPass = variables.GetEnv("RABBITMQ_PASSWORD", mqPass)
	mqHost = variables.GetEnv("RABBITMQ_HOSTNAME", mqHost)
	mqTLS = variables.GetEnvBool("RABBITMQ_TLS", mqTLS)
	mqCACert = variables.GetEnv("RABBITMQ_CACERT", mqCACert)
	mqClientCert = variables.GetEnv("RABBITMQ_CLIENTCERT", mqClientCert)
	mqClientKey = variables.GetEnv("RABBITMQ_CLIENTKEY", mqClientKey)
	mqVerify = variables.GetEnvBool("RABBITMQ_VERIFY", mqVerify)

	brokerDSN := fmt.Sprintf("amqp://%s:%s@%s", mqUser, mqPass, mqHost)
	if mqTLS {
		verify := "verify_none"
		if mqVerify {
			verify = "verify_peer"
		}
		brokerDSN = fmt.Sprintf("amqps://%s:%s@%s?verify=%s", mqUser, mqPass, mqHost, verify)
		if mqCACert != "" {
			brokerDSN = fmt.Sprintf("%s&cacertfile=%s", brokerDSN, mqCACert)
		}
		if mqClientCert != "" {
			brokerDSN = fmt.Sprintf("%s&certfile=%s", brokerDSN, mqClientCert)
		}
		if mqClientKey != "" {
			brokerDSN = fmt.Sprintf("%s&keyfile=%s", brokerDSN, mqClientKey)
		}
	}
	config := mq.Config{
		ReconnectDelay: time.Duration(rabbitRetryInterval) * time.Second,
		Exchanges: mq.Exchanges{
			{
				Name: "lagoon-tasks",
				Type: "direct",
				Options: mq.Options{
					"durable":       true,
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
		},
		Consumers: mq.Consumers{},
		Queues: mq.Queues{
			{
				Name:     "lagoon-tasks:controller",
				Exchange: "lagoon-tasks",
				Options: mq.Options{
					"durable":       true,
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
		},
		Producers: mq.Producers{
			{
				Name:     "lagoon-logs",
				Exchange: "lagoon-logs",
				Options: mq.Options{
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
			{
				Name:       "lagoon-tasks:controller",
				Exchange:   "lagoon-tasks",
				RoutingKey: "controller",
				Options: mq.Options{
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
		},
		DSN: brokerDSN,
	}

	messaging := messaging.New(config, true)

	srv := server.Server{}
	srv.Messaging = messaging
	srv.Initialize()
	srv.Run(":8010")
}
