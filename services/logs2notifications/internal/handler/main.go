package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"time"

	"github.com/cheshir/go-mq/v2"
	"github.com/matryer/try"

	"github.com/uselagoon/machinery/api/lagoon"
	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/jwt"
)

// RabbitBroker .
type RabbitBroker struct {
	Hostname string `json:"hostname"`
	Port     string `json:"port"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
}

// LagoonAPI .
type LagoonAPI struct {
	Endpoint        string `json:"endpoint"`
	JWTAudience     string `json:"audience"`
	TokenSigningKey string `json:"tokenSigningKey"`
	JWTSubject      string `json:"subject"`
	JWTIssuer       string `json:"issuer"`
	Version         string `json:"version"`
}

// Action is the structure of an action that is received via the message queue.
type Action struct {
	Type      string                 `json:"type"`      // defines the action type
	EventType string                 `json:"eventType"` // defines the eventtype field in the event notification
	Data      map[string]interface{} `json:"data"`      // contains the payload for the action, this could be any json so using a map
}

// Messaging is used for the config and client information for the messaging queue.
type Messaging struct {
	Config                  mq.Config
	LagoonAPI               LagoonAPI
	ConnectionAttempts      int
	ConnectionRetryInterval int
	EnableDebug             bool
	LagoonAppID             string
	DisableSlack            bool
	DisableRocketChat       bool
	DisableMicrosoftTeams   bool
	DisableEmail            bool
	DisableWebhooks         bool
	DisableS3               bool
	EmailSender             string
	EmailUsername           string
	EmailSenderPassword     string
	EmailHost               string
	EmailPort               string
	EmailSSL                bool
	EmailInsecureSkipVerify bool
	EmailBase64Logo         string
	S3FilesAccessKeyID      string
	S3FilesSecretAccessKey  string
	S3FilesBucket           string
	S3FilesRegion           string
	S3FilesOrigin           string
	S3IsGCS                 bool
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
		Project                  string   `json:"project"`
		ProjectName              string   `json:"projectName"`
		BranchName               string   `json:"branchName"`
		Event                    string   `json:"event"`
		Level                    string   `json:"level"`
		Message                  string   `json:"message"`
		Timestamp                string   `json:"timestamp"`
		ShortSha                 string   `json:"shortSha"`
		BuildName                string   `json:"buildName"`
		BuildPhase               string   `json:"buildPhase"`
		BuildStep                string   `json:"buildStep"`
		CommitURL                string   `json:"commitUrl"`
		Environment              string   `json:"environment"`
		EnvironmentID            string   `json:"environmentId"`
		EnvironmentName          string   `json:"environmentName"`
		ServiceName              string   `json:"serviceName"`
		Severity                 string   `json:"severity"`
		Description              string   `json:"description"`
		Error                    string   `json:"error"`
		JobName                  string   `json:"jobName"`
		LogLink                  string   `json:"logLink"`
		Name                     string   `json:"name"`
		OpenshiftProject         string   `json:"openshiftProject"`
		PromoteSourceEnvironment string   `json:"promoteSourceEnvironment"`
		PullrequestNumber        int      `json:"pullrequestNumber"`
		PullrequestTitle         string   `json:"pullrequestTitle"`
		PullrequestURL           string   `json:"pullrequestUrl"`
		RemoteID                 string   `json:"remoteId"`
		RepoFullName             string   `json:"repoFullName"`
		RepoName                 string   `json:"repoName"`
		RepoURL                  string   `json:"repoUrl"`
		Route                    string   `json:"route"`
		Routes                   []string `json:"routes"`
		Task                     struct {
			ID string `json:"id"`
		} `json:"task"`
	} `json:"meta"`
	Message string `json:"message"`
}

// EventMap .
type EventMap struct {
	Emoji    string `json:"emoji"`
	Color    string `json:"color"`
	Template string `json:"template"`
}

var (
	warningEmoji = "⚠️"
	infoEmoji    = "ℹ️"
	successEmoji = "✅"
	failEmoji    = "🛑"
)

// NewMessaging returns a messaging with config
func NewMessaging(config mq.Config,
	lagoonAPI LagoonAPI,
	startupAttempts int,
	startupInterval int,
	enableDebug bool,
	appID string,
	disableSlack, disableRocketChat, disableMicrosoftTeams, disableEmail, disableWebhooks, disableS3 bool,
	emailSender, emailusername, emailSenderPassword, emailHost, emailPort string, emailSSL, emailInsecureSkipVerify bool, emailBase64Logo string,
	s3FilesAccessKeyID, s3FilesSecretAccessKey, s3FilesBucket, s3FilesRegion, s3FilesOrigin string, s3isGCS bool) *Messaging {
	return &Messaging{
		Config:                  config,
		LagoonAPI:               lagoonAPI,
		ConnectionAttempts:      startupAttempts,
		ConnectionRetryInterval: startupInterval,
		EnableDebug:             enableDebug,
		LagoonAppID:             appID,
		DisableSlack:            disableSlack,
		DisableRocketChat:       disableRocketChat,
		DisableMicrosoftTeams:   disableMicrosoftTeams,
		DisableEmail:            disableEmail,
		DisableWebhooks:         disableWebhooks,
		DisableS3:               disableS3,
		EmailSender:             emailSender,
		EmailUsername:           emailusername,
		EmailSenderPassword:     emailSenderPassword,
		EmailHost:               emailHost,
		EmailPort:               emailPort,
		EmailSSL:                emailSSL,
		EmailInsecureSkipVerify: emailInsecureSkipVerify,
		EmailBase64Logo:         emailBase64Logo,
		S3FilesAccessKeyID:      s3FilesAccessKeyID,
		S3FilesSecretAccessKey:  s3FilesSecretAccessKey,
		S3FilesBucket:           s3FilesBucket,
		S3FilesRegion:           s3FilesRegion,
		S3FilesOrigin:           s3FilesOrigin,
		S3IsGCS:                 s3isGCS,
	}
}

// Consumer handles consuming messages sent to the queue that this action handler is connected to and processes them accordingly
func (h *Messaging) Consumer() {

	messageQueue := &mq.MessageQueue{}
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
			log.Printf("Caught error from message queue: %v", err)
		}
	}()

	forever := make(chan bool)

	// Handle any tasks that go to the queue
	log.Println("Listening for messages in queue lagoon-logs:notifications")
	err = messageQueue.SetConsumerHandler("notifications-queue", func(message mq.Message) {
		h.processMessage(message.Body())
		message.Ack(false) // ack to remove from queue
	})
	if err != nil {
		log.Printf("Failed to set handler to consumer `%s`: %v", "items-queue", err)
	}
	<-forever
}

func (h *Messaging) processMessage(message []byte) {
	ctx := context.Background()
	notification := &Notification{}
	json.Unmarshal(message, notification)

	var buildLogs = regexp.MustCompile(`^build-logs:builddeploy-kubernetes:.*`)
	var taskLogs = regexp.MustCompile(`^(build|task)-logs:job-kubernetes:.*`)
	switch notification.Event {
	case buildLogs.FindString(notification.Event):
		// if this is a build logs message handle it accordingly
		if !h.DisableS3 {
			h.SendToS3(notification, buildMessageType)
		}
	case taskLogs.FindString(notification.Event):
		// if this is a task logs message handle it accordingly
		if !h.DisableS3 {
			h.SendToS3(notification, taskMessageType)
		}
	default:
		// all other events are notifications, so do notification handling with them
		// and as long as the event is not a `user_action` (activity logger)
		if notification.Project != "" && notification.Meta.Level != "user_action" {
			// marshal unmarshal the data into the input we need to use when talking to the lagoon api
			projectNotifications, err := h.getProjectNotifictions(ctx, notification.Project)
			if err != nil {
				log.Println(err)
				break
			}
			if projectNotifications.Notifications != nil {
				if len(projectNotifications.Notifications.Slack) > 0 && !h.DisableSlack {
					for _, slack := range projectNotifications.Notifications.Slack {
						h.SendToSlack(notification, slack.Channel, slack.Webhook, h.LagoonAppID)
					}
				}
				if len(projectNotifications.Notifications.RocketChat) > 0 && !h.DisableRocketChat {
					for _, rc := range projectNotifications.Notifications.RocketChat {
						h.SendToRocketChat(notification, rc.Channel, rc.Webhook, h.LagoonAppID)
					}
				}
				if len(projectNotifications.Notifications.Email) > 0 && !h.DisableEmail {
					for _, email := range projectNotifications.Notifications.Email {
						h.SendToEmail(notification, email.EmailAddress)
					}
				}
				if len(projectNotifications.Notifications.MicrosoftTeams) > 0 && !h.DisableMicrosoftTeams {
					for _, teams := range projectNotifications.Notifications.MicrosoftTeams {
						h.SendToMicrosoftTeams(notification, teams.Webhook)
					}
				}
				if len(projectNotifications.Notifications.Webhook) > 0 && !h.DisableWebhooks {
					for _, hook := range projectNotifications.Notifications.Webhook {
						h.SendToWebhook(notification, hook)
					}
				}
			}
		}

		// Here we deal explicitly with a class of 'user_action' events
		if notification.Meta.Level == "user_action" {
			//if notification.Meta.Event == "api:addAdminToOrganization" {
			err := h.handleUserActionToEmail(notification, message)
			if err != nil {
				log.Println(err)
				break
			}
			//}
		}

	}
}

func (h *Messaging) getProjectNotifictions(ctx context.Context, projectName string) (*schema.Project, error) {
	token, err := jwt.GenerateAdminToken(h.LagoonAPI.TokenSigningKey, h.LagoonAPI.JWTAudience, h.LagoonAPI.JWTSubject, h.LagoonAPI.JWTIssuer, time.Now().Unix(), 60)
	if err != nil {
		// the token wasn't generated
		if h.EnableDebug {
			log.Println(err)
		}
		return nil, err
	}
	// get all notifications for said project
	l := lclient.New(h.LagoonAPI.Endpoint, "actions-handler", h.LagoonAPI.Version, &token, false)
	projectNotifications, err := lagoon.NotificationsForProject(ctx, projectName, l)
	if err != nil {
		log.Println(err)
		return nil, err
	}
	return projectNotifications, nil
}
