package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/Khan/genqlient/graphql"
	mq "github.com/cheshir/go-mq/v2"
	"github.com/matryer/try"
	"github.com/uselagoon/lagoon/services/workflows/internal/lagoon/jwt"
	"github.com/uselagoon/lagoon/services/workflows/internal/lagoonclient"
	//"github.com/uselagoon/lagoon/services/workflows/internal/lagoon"
	//lclient "github.com/uselagoon/lagoon/services/workflows/internal/lagoon/client"
	//"github.com/uselagoon/lagoon/services/workflows/internal/lagoon/jwt"
	//"github.com/uselagoon/lagoon/services/workflows/internal/schema"
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
	TokenSigningKey string `json:"tokenSigningKey"`
	JWTSubject      string `json:"subject"`
	JWTIssuer       string `json:"issuer"`
}

// Action is the structure of an action that is received via the message queue.
type Action struct {
	Type      string                 `json:"type"`      // defines the action type
	EventType string                 `json:"eventType"` // defines the eventtype field in the event notification
	Data      map[string]interface{} `json:"data"`      // contains the payload for the action, this could be any json so using a map
}

type LagoonLogMeta struct {
	BranchName    string   `json:"branchName,omitempty"`
	BuildName     string   `json:"buildName,omitempty"`
	BuildPhase    string   `json:"buildPhase,omitempty"`
	EndTime       string   `json:"endTime,omitempty"`
	Environment   string   `json:"environment,omitempty"`
	EnvironmentID *uint    `json:"environmentId,omitempty"`
	JobName       string   `json:"jobName,omitempty"`
	JobStatus     string   `json:"jobStatus,omitempty"`
	LogLink       string   `json:"logLink,omitempty"`
	Project       string   `json:"project,omitempty"`
	ProjectID     *uint    `json:"projectId,omitempty"`
	ProjectName   string   `json:"projectName,omitempty"`
	RemoteID      string   `json:"remoteId,omitempty"`
	Route         string   `json:"route,omitempty"`
	Routes        []string `json:"routes,omitempty"`
	StartTime     string   `json:"startTime,omitempty"`
	Services      []string `json:"services,omitempty"`
	Key           string   `json:"key,omitempty"`
	AdvancedData  string   `json:"advancedData,omitempty"`
	Cluster       string   `json:"clusterName,omitempty"`
}

type LagoonLog struct {
	Severity string         `json:"severity,omitempty"`
	Project  string         `json:"project,omitempty"`
	UUID     string         `json:"uuid,omitempty"`
	Event    string         `json:"event,omitempty"`
	Meta     *LagoonLogMeta `json:"meta,omitempty"`
	Message  string         `json:"message,omitempty"`
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
}

// NewMessaging returns a messaging with config
func NewMessaging(config mq.Config, lagoonAPI LagoonAPI, startupAttempts int, startupInterval int, enableDebug bool) *Messaging {
	return &Messaging{
		Config:                  config,
		LagoonAPI:               lagoonAPI,
		ConnectionAttempts:      startupAttempts,
		ConnectionRetryInterval: startupInterval,
		EnableDebug:             enableDebug,
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
			log.Println(fmt.Sprintf("Caught error from message queue: %v", err))
		}
	}()

	forever := make(chan bool)

	// Handle any tasks that go to the queue
	log.Println("Listening for messages in queue lagoon-logs:workflows")
	err = messageQueue.SetConsumerHandler("items-queue", processingIncomingMessageQueueFactory(h))
	if err != nil {
		log.Println(fmt.Sprintf("Failed to set handler to consumer `%s`: %v", "items-queue", err))
	}
	<-forever
}

type authedTransport struct {
	wrapped http.RoundTripper
	h       *Messaging
}

func (t *authedTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	//grab events for project
	token, err := jwt.OneMinuteAdminToken(t.h.LagoonAPI.TokenSigningKey, t.h.LagoonAPI.JWTAudience, t.h.LagoonAPI.JWTSubject, t.h.LagoonAPI.JWTIssuer)
	if err != nil {
		// the token wasn't generated
		if t.h.EnableDebug {
			log.Println("Could not get bearer token")
			log.Println(err)
		}
		return nil, err
	}
	req.Header.Set("Authorization", "bearer "+token)
	return t.wrapped.RoundTrip(req)
}

func processingIncomingMessageQueueFactory(h *Messaging) func(mq.Message) {
	return func(message mq.Message) {
		incoming := &LagoonLog{}
		err := json.Unmarshal(message.Body(), incoming)
		if err != nil {
			log.Println("could not unmarshall")
			message.Ack(false)
			return
		}

		environmentIdentifier := fmt.Sprintf("%v", incoming.Meta.EnvironmentID)
		if incoming.Meta.Environment != "" {
			environmentIdentifier = fmt.Sprintf("%v:%v", incoming.Meta.Environment, incoming.Meta.EnvironmentID)
		}

		if incoming.Meta.ProjectID != nil && incoming.Meta.EnvironmentID != nil {
			log.Println("Connecting to " + h.LagoonAPI.Endpoint)
			client := graphql.NewClient(h.LagoonAPI.Endpoint,
				&http.Client{Transport: &authedTransport{wrapped: http.DefaultTransport, h: h}})
			projectId := int(*incoming.Meta.ProjectID)
			environmentWorkflows, err := lagoonclient.GetEnvironmentWorkflowsByEnvironmentId(context.TODO(), client, int(*incoming.Meta.EnvironmentID))
			if err != nil {
				log.Println(err)
				message.Ack(false)
				return
			}
			for _, wf := range environmentWorkflows {
				if lagoonclient.IsEventOfType(incoming.Event, wf.AdvancedTaskDetails) {
					log.Printf("Found event of type %v for project:%v and environment %v - invoking.\n",
						incoming.Event, projectId, environmentIdentifier)
					result, err := lagoonclient.InvokeWorkflowOnEnvironment(context.TODO(), client, wf.EnvironmentId, wf.AdvancedTaskId)
					if err != nil {
						log.Println(fmt.Sprintf("Invocation error of %v for project:%v and environment %v - %v.\n", incoming.Event, projectId, environmentIdentifier, err))
					} else {
						log.Printf("Invocation result of %v for project:%v and environment %v - %v.\n",
							incoming.Event, projectId, environmentIdentifier, result)
					}
				}
			}
		}
		message.Ack(false) // ack to remove from queue
	}
}

// toLagoonLogs sends logs to the lagoon-logs message queue
func (h *Messaging) toLagoonLogs(messageQueue mq.MessageQueue, message map[string]interface{}) {
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
