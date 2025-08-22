package main

import (
	"flag"
	"fmt"
	"time"

	mq "github.com/cheshir/go-mq/v2"
	syshook "github.com/uselagoon/lagoon/services/webhook-handler/internal/gitlab"
	"github.com/uselagoon/lagoon/services/webhook-handler/internal/lagoon"
	"github.com/uselagoon/lagoon/services/webhook-handler/internal/messaging"
	"github.com/uselagoon/lagoon/services/webhook-handler/internal/server"
	"github.com/uselagoon/machinery/utils/variables"
)

var (
	mqUser                string
	mqPass                string
	mqHost                string
	mqPort                string
	mqTLS                 bool
	mqVerify              bool
	mqCACert              string
	mqClientCert          string
	mqClientKey           string
	mqWorkers             int
	rabbitRetryInterval   int
	gitlabSystemHookToken string
	gitlabAPIToken        string
	gitlabAPIHost         string
	lagoonAPIHost         string
	lagoonAPIVersion      string
	jwtTokenSigningKey    string
	jwtAudience           string
	jwtSubject            string
	jwtIssuer             string
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

	flag.StringVar(&lagoonAPIHost, "lagoon-api-host", "http://localhost:3000/graphql",
		"The host for the lagoon api.")
	flag.StringVar(&lagoonAPIVersion, "lagoon-api-version", "2.18.0",
		"The version for the lagoon api.")
	flag.StringVar(&jwtTokenSigningKey, "jwt-token-signing-key", "super-secret-string",
		"The jwt signing token key or secret.")
	flag.StringVar(&jwtAudience, "jwt-audience", "api.dev",
		"The jwt audience.")
	flag.StringVar(&jwtSubject, "jwt-subject", "webhook-handler",
		"The jwt audience.")
	flag.StringVar(&jwtIssuer, "jwt-issuer", "webhook-handler",
		"The jwt audience.")

	flag.Parse()

	// get overrides from environment variables
	mqUser = variables.GetEnv("RABBITMQ_USERNAME", mqUser)
	mqPass = variables.GetEnv("RABBITMQ_PASSWORD", mqPass)
	mqHost = variables.GetEnv("RABBITMQ_ADDRESS", mqHost)
	mqPort = variables.GetEnv("RABBITMQ_PORT", mqPort)
	mqTLS = variables.GetEnvBool("RABBITMQ_TLS", mqTLS)
	mqCACert = variables.GetEnv("RABBITMQ_CACERT", mqCACert)
	mqClientCert = variables.GetEnv("RABBITMQ_CLIENTCERT", mqClientCert)
	mqClientKey = variables.GetEnv("RABBITMQ_CLIENTKEY", mqClientKey)
	mqVerify = variables.GetEnvBool("RABBITMQ_VERIFY", mqVerify)

	// gitlab
	gitlabSystemHookToken = variables.GetEnv("GITLAB_SYSTEM_HOOK_TOKEN", "")
	gitlabAPIToken = variables.GetEnv("GITLAB_API_TOKEN", "")
	gitlabAPIHost = variables.GetEnv("GITLAB_API_HOST", "")

	// lagoon
	lagoonAPIHost = variables.GetEnv("GRAPHQL_ENDPOINT", lagoonAPIHost)
	jwtTokenSigningKey = variables.GetEnv("JWT_SECRET", jwtTokenSigningKey)
	jwtAudience = variables.GetEnv("JWT_AUDIENCE", jwtAudience)
	jwtSubject = variables.GetEnv("JWT_SUBJECT", jwtSubject)
	jwtIssuer = variables.GetEnv("JWT_ISSUER", jwtIssuer)

	brokerDSN := fmt.Sprintf("amqp://%s:%s@%s:%s", mqUser, mqPass, mqHost, mqPort)
	if mqTLS {
		verify := "verify_none"
		if mqVerify {
			verify = "verify_peer"
		}
		brokerDSN = fmt.Sprintf("amqps://%s:%s@%s:%s?verify=%s", mqUser, mqPass, mqHost, mqPort, verify)
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
				Name:     "lagoon-tasks",
				Exchange: "lagoon-tasks",
				Options: mq.Options{
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
		},
		DSN: brokerDSN,
	}

	msg := messaging.NewMessaging(config, true)

	srv := server.Server{
		Messaging: msg,
		GitlabAPI: syshook.GitlabAPI{
			GitlabAPIHost:         gitlabAPIHost,
			GitlabAPIToken:        gitlabAPIToken,
			GitlabSystemHookToken: gitlabSystemHookToken,
		},
		LagoonAPI: lagoon.LagoonAPI{
			Endpoint:        lagoonAPIHost,
			JWTAudience:     jwtAudience,
			JWTSubject:      jwtSubject,
			JWTIssuer:       jwtIssuer,
			TokenSigningKey: jwtTokenSigningKey,
			Version:         lagoonAPIVersion,
		},
	}
	srv.Initialize()
	srv.Run(":3000")
}
