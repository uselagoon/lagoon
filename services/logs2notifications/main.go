package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/cheshir/go-mq"
	"github.com/uselagoon/lagoon/services/logs2notifications/internal/handler"
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
	jwtSubject                   string
	jwtIssuer                    string

	s3FilesAccessKeyID     string
	s3FilesSecretAccessKey string
	s3FilesBucket          string
	s3FilesRegion          string
	s3FilesOrigin          string
	s3isGCS                bool

	disableSlack          bool
	disableRocketChat     bool
	disableMicrosoftTeams bool
	disableEmail          bool
	disableWebhooks       bool
	disableS3             bool

	emailSender             string
	emailSenderPassword     string
	emailHost               string
	emailPort               string
	emailInsecureSkipVerify bool
)

func main() {
	flag.StringVar(&lagoonAppID, "lagoon-app-id", "logs2notifications",
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
	flag.StringVar(&jwtSubject, "jwt-subject", "logs2notifications",
		"The jwt audience.")
	flag.StringVar(&jwtIssuer, "jwt-issuer", "logs2notifications",
		"The jwt audience.")

	// Other notifications configuration
	flag.BoolVar(&disableSlack, "disable-slack", false,
		"Disable the logs2slack feature.")
	flag.BoolVar(&disableRocketChat, "disable-rocketchat", false,
		"Disable the logs2rocketchat feature.")
	flag.BoolVar(&disableMicrosoftTeams, "disable-microsoft-teams", false,
		"Disable the logs2microsoftteams feature.")
	flag.BoolVar(&disableWebhooks, "disable-webhooks", false,
		"Disable the logs2webhooks feature.")

	// S3 configuration
	flag.BoolVar(&disableS3, "disable-s3", false,
		"Disable the logs2s3 feature.")
	flag.StringVar(&s3FilesAccessKeyID, "s3-files-access-key", "minio",
		"The jwt audience.")
	flag.StringVar(&s3FilesSecretAccessKey, "s3-files-secret-access-key", "minio123",
		"The jwt audience.")
	flag.StringVar(&s3FilesBucket, "s3-files-bucket", "lagoon-files",
		"The jwt audience.")
	flag.StringVar(&s3FilesRegion, "s3-files-region", "auto",
		"The jwt audience.")
	flag.StringVar(&s3FilesOrigin, "s3-files-origin", "http://minio.127.0.0.1.nip.io:9000",
		"The jwt audience.")
	flag.BoolVar(&s3isGCS, "s3-google-cloud", false,
		"If the storage backend is google cloud.")

	// Email sending configuration
	flag.BoolVar(&disableEmail, "disable-email", false,
		"Disable the logs2email feature.")
	flag.StringVar(&emailSender, "email-sender-address", "notifications@lagoon.sh",
		"The email address to send notifications as.")
	flag.StringVar(&emailSenderPassword, "email-sender-password", "",
		"The password (if required) for the sending email address.")
	flag.StringVar(&emailHost, "email-host", "localhost",
		"The host name or address for the email server.")
	flag.StringVar(&emailPort, "email-port", "1025",
		"The port for the email server.")
	flag.BoolVar(&emailInsecureSkipVerify, "email-tls-insecure-skip-verify", true,
		"Use TLS verification when talking to the email server.")
	flag.Parse()

	// get overrides from environment variables
	mqUser = getEnv("RABBITMQ_USERNAME", mqUser)
	mqPass = getEnv("RABBITMQ_PASSWORD", mqPass)
	mqHost = getEnv("RABBITMQ_ADDRESS", mqHost)
	mqPort = getEnv("RABBITMQ_PORT", mqPort)
	lagoonAPIHost = getEnv("GRAPHQL_ENDPOINT", lagoonAPIHost)
	jwtTokenSigningKey = getEnv("JWT_SECRET", jwtTokenSigningKey)
	jwtAudience = getEnv("JWT_AUDIENCE", jwtAudience)
	jwtSubject = getEnv("JWT_SUBJECT", jwtSubject)
	jwtIssuer = getEnv("JWT_ISSUER", jwtIssuer)

	s3FilesAccessKeyID = getEnv("S3_FILES_ACCESS_KEY_ID", s3FilesAccessKeyID)
	s3FilesSecretAccessKey = getEnv("S3_FILES_SECRET_ACCESS_KEY", s3FilesSecretAccessKey)
	s3FilesBucket = getEnv("S3_FILES_BUCKET", s3FilesBucket)
	s3FilesRegion = getEnv("S3_FILES_REGION", s3FilesRegion)
	s3FilesOrigin = getEnv("S3_FILES_HOST", s3FilesOrigin)
	s3isGCS = getEnvBool("S3_FILES_GCS", s3isGCS)

	emailSender = getEnv("EMAIL_SENDER_ADDRESS", emailSender)
	emailSenderPassword = getEnv("EMAIL_SENDER_PASSWORD", emailSenderPassword)
	emailHost = getEnv("EMAIL_HOST", emailHost)
	emailPort = getEnv("EMAIL_PORT", emailPort)

	enableDebug := true

	// configure the backup handler settings
	broker := handler.RabbitBroker{
		Hostname: fmt.Sprintf("%s:%s", mqHost, mqPort),
		Username: mqUser,
		Password: mqPass,
	}
	graphQLConfig := handler.LagoonAPI{
		Endpoint:        lagoonAPIHost,
		TokenSigningKey: jwtTokenSigningKey,
		JWTAudience:     jwtAudience,
		JWTSubject:      jwtSubject,
		JWTIssuer:       jwtIssuer,
	}

	log.Println("logs2notifications running")

	config := mq.Config{
		ReconnectDelay: time.Duration(rabbitReconnectRetryInterval) * time.Second,
		Exchanges: mq.Exchanges{
			{
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
			{
				Name:    "notifications-queue",
				Queue:   "lagoon-logs:notifications",
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
			{
				Name:     "lagoon-logs:notifications",
				Exchange: "lagoon-logs",
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
					"app_id":        lagoonAppID,
					"delivery_mode": "2",
					"headers":       "",
					"content_type":  "",
				},
			},
		},
		DSN: fmt.Sprintf("amqp://%s:%s@%s/", broker.Username, broker.Password, broker.Hostname),
	}

	messaging := handler.NewMessaging(config,
		graphQLConfig,
		startupConnectionAttempts,
		startupConnectionInterval,
		enableDebug,
		lagoonAppID,
		disableSlack,
		disableRocketChat,
		disableMicrosoftTeams,
		disableEmail,
		disableWebhooks,
		disableS3,
		emailSender,
		emailSenderPassword,
		emailHost,
		emailPort,
		emailInsecureSkipVerify,
		s3FilesAccessKeyID,
		s3FilesSecretAccessKey,
		s3FilesBucket,
		s3FilesRegion,
		s3FilesOrigin,
		s3isGCS,
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
