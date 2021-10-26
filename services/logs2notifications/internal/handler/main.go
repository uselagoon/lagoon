package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/cheshir/go-mq"
	"github.com/matryer/try"
	"github.com/uselagoon/lagoon/services/logs2notifications/internal/lagoon"
	lclient "github.com/uselagoon/lagoon/services/logs2notifications/internal/lagoon/client"
	"github.com/uselagoon/lagoon/services/logs2notifications/internal/lagoon/jwt"
	// "github.com/uselagoon/lagoon/services/logs2notifications/internal/schema"
)

// RabbitBroker .
type RabbitBroker struct {
	Hostname     string `json:"hostname"`
	Port         string `json:"port"`
	Username     string `json:"username,omitempty"`
	Password     string `json:"password,omitempty"`
	QueueName    string `json:"queueName"`
	ExchangeName string `json:"exchangeName"`
}

// LagoonAPI .
type LagoonAPI struct {
	Endpoint        string `json:"endpoint"`
	JWTAudience     string `json:"audience"`
	TokenSigningKey string `json:"tokenSigningKey`
	JWTSubject      string `json:"subject"`
	JWTIssuer       string `json:"issuer"`
}

// Action is the structure of an action that is received via the message queue.
type Action struct {
	Type      string                 `json:"type"`      // defines the action type
	EventType string                 `json:"eventType"` // defines the eventtype field in the event notification
	Data      map[string]interface{} `json:"data"`      // contains the payload for the action, this could be any json so using a map
}

type messaging interface {
	Consumer()
	Publish(string, []byte)
}

// Messaging is used for the config and client information for the messaging queue.
type Messaging struct {
	Config                  mq.Config
	LagoonAPI               LagoonAPI
	ConnectionAttempts      int
	ConnectionRetryInterval int
	EnableDebug             bool
	LagoonAppID             string
}

// Notification .
type Notification struct {
	Severity string `json:"severity"`
	Project  string `json:"project"`
	UUID     string `json:"uuid"`
	Event    string `json:"event"`
	Meta     struct {
		User struct {
			ID                string `json:"id"`
			PreferredUsername string `json:"preferred_username"`
			Email             string `json:"email"`
		} `json:"user"`
		Headers struct {
			UserAgent     string `json:"user-agent"`
			ContentType   string `json:"content-type"`
			ContentLength string `json:"content-length"`
			Host          string `json:"host"`
			IPAddress     string `json:"ipAddress"`
		} `json:"headers"`
		Project                  string `json:"project"`
		ProjectName              string `json:"projectName"`
		BranchName               string `json:"branchName`
		Event                    string `json:"event"`
		Level                    string `json:"level"`
		Message                  string `json:"message"`
		Timestamp                string `json:"timestamp"`
		ShortSha                 string `json:"shortSha"`
		BuildName                string `json:"buildName"`
		CommitURL                string `json:"commitUrl"`
		Environment              string `json:"environment"`
		EnvironmentID            string `json:"environmentId"`
		EnvironmentName          string `json:"environmentName"`
		Error                    string `json:"error"`
		JobName                  string `json:"jobName"`
		LogLink                  string `json:"logLink"`
		Name                     string `json:"name"`
		OpenshiftProject         string `json:"openshiftProject"`
		PromoteSourceEnvironment string `json:"promoteSourceEnvironment"`
		PullrequestNumber        string `json:"pullrequestNumber"`
		PullrequestTitle         string `json:"pullrequestTitle"`
		PullrequestURL           string `json:"pullrequestUrl"`
		RemoteID                 string `json:"remoteId"`
		RepoFullName             string `json:"repoFullName"`
		RepoName                 string `json:"repoName"`
		RepoURL                  string `json:"repoUrl"`
		Route                    string `json:"route"`
		Routes                   string `json:"routes"`
		Task                     string `json:"task"`
	} `json:"meta"`
	Message string `json:"message"`
}

// NewMessaging returns a messaging with config
func NewMessaging(config mq.Config, lagoonAPI LagoonAPI, startupAttempts int, startupInterval int, enableDebug bool, appID string) *Messaging {
	return &Messaging{
		Config:                  config,
		LagoonAPI:               lagoonAPI,
		ConnectionAttempts:      startupAttempts,
		ConnectionRetryInterval: startupInterval,
		EnableDebug:             enableDebug,
		LagoonAppID:             appID,
	}
}

// Consumer handles consuming messages sent to the queue that this action handler is connected to and processes them accordingly
func (h *Messaging) Consumer() {
	ctx := context.TODO()

	var messageQueue mq.MQ
	// if no mq is found when the goroutine starts, retry a few times before exiting
	// default is 10 retry with 30 second delay = 5 minutes
	err := try.Do(func(attempt int) (bool, error) {
		var err error
		messageQueue, err = mq.New(h.Config)
		if err != nil {
			log.Println(err,
				fmt.Sprintf(
					"Failed to initialize message queue manager, retrying in %d seconds, attempt %d/%d",
					h.ConnectionRetryInterval,
					attempt,
					h.ConnectionAttempts,
				),
			)
			time.Sleep(time.Duration(h.ConnectionRetryInterval) * time.Second)
		}
		return attempt < h.ConnectionAttempts, err
	})
	if err != nil {
		log.Fatalf("Finally failed to initialize message queue manager: %v", err)
	}
	defer messageQueue.Close()

	go func() {
		for err := range messageQueue.Error() {
			log.Println(fmt.Sprintf("Caught error from message queue: %v", err))
		}
	}()

	forever := make(chan bool)

	// Handle any tasks that go to the queue
	log.Println("Listening for messages in queue lagoon-logs:notifications")
	err = messageQueue.SetConsumerHandler("notifications-queue", func(message mq.Message) {
		notification := &Notification{}
		json.Unmarshal(message.Body(), notification)
		switch notification.Event {
		// check if this a `deployEnvironmentLatest` type of action
		// and perform the steps to run the mutation against the lagoon api
		case "api:unknownEvent":
		default:
			// marshal unmarshal the data into the input we need to use when talking to the lagoon api
			token, err := jwt.OneMinuteAdminToken(h.LagoonAPI.TokenSigningKey, h.LagoonAPI.JWTAudience, h.LagoonAPI.JWTSubject, h.LagoonAPI.JWTIssuer)
			if err != nil {
				// the token wasn't generated
				if h.EnableDebug {
					log.Println(err)
				}
				break
			}
			// get all notifications for said project
			l := lclient.New(h.LagoonAPI.Endpoint, token, "logs2notifications", false)
			projectNotifications, err := lagoon.NotificationsForProject(ctx, notification.Project, l)
			if err != nil {
				log.Println(err)
				break
			}
			// if len(projectNotifications.Notifications.Slack) > 0 {
			// 	fmt.Println(projectNotifications.Notifications.Slack)
			// }
			if len(projectNotifications.Notifications.RocketChat) > 0 {
				for _, rc := range projectNotifications.Notifications.RocketChat {
					SendToRocketChat(notification, rc.Channel, rc.Webhook, h.LagoonAppID)
				}
			}
			// if len(projectNotifications.Notifications.Email) > 0 {
			// 	fmt.Println(projectNotifications.Notifications.Email)
			// }
			// if len(projectNotifications.Notifications.MicrosoftTeams) > 0 {
			// 	fmt.Println(projectNotifications.Notifications.MicrosoftTeams)
			// }
			// if len(projectNotifications.Notifications.Webhook) > 0 {
			// 	fmt.Println(projectNotifications.Notifications.Webhook)
			// }
		}
		message.Ack(false) // ack to remove from queue
	})
	if err != nil {
		log.Println(fmt.Sprintf("Failed to set handler to consumer `%s`: %v", "items-queue", err))
	}
	<-forever
}

// toLagoonLogs sends logs to the lagoon-logs message queue
func (h *Messaging) toLagoonLogs(messageQueue mq.MQ, message map[string]interface{}) {
	msgBytes, err := json.Marshal(message)
	if err != nil {
		if h.EnableDebug {
			log.Println(err, "Unable to encode message as JSON")
		}
	}
	producer, err := messageQueue.AsyncProducer("lagoon-logs")
	if err != nil {
		log.Println(fmt.Sprintf("Failed to get async producer: %v", err))
		return
	}
	producer.Produce(msgBytes)
}
