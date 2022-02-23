package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/cheshir/go-mq"
	"github.com/matryer/try"

	"github.com/uselagoon/lagoon/services/actions-handler/internal/lagoon"
	lclient "github.com/uselagoon/lagoon/services/actions-handler/internal/lagoon/client"
	"github.com/uselagoon/lagoon/services/actions-handler/internal/lagoon/jwt"
	"github.com/uselagoon/lagoon/services/actions-handler/internal/schema"
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
	log.Println("Listening for messages in queue lagoon-actions:items")
	err = messageQueue.SetConsumerHandler("items-queue", func(message mq.Message) {
		action := &Action{}
		json.Unmarshal(message.Body(), action)
		switch action.Type {
		// check if this a `deployEnvironmentLatest` type of action
		// and perform the steps to run the mutation against the lagoon api
		case "deployEnvironmentLatest":
			// marshal unmarshal the data into the input we need to use when talking to the lagoon api
			data, _ := json.Marshal(action.Data)
			deploy := &schema.DeployEnvironmentLatestInput{}
			json.Unmarshal(data, deploy)
			token, err := jwt.OneMinuteAdminToken(h.LagoonAPI.TokenSigningKey, h.LagoonAPI.JWTAudience, h.LagoonAPI.JWTSubject, h.LagoonAPI.JWTIssuer)
			if err != nil {
				// the token wasn't generated
				if h.EnableDebug {
					log.Println(err)
				}
				break
			}
			l := lclient.New(h.LagoonAPI.Endpoint, token, "actions-handler", false)
			deployment, err := lagoon.DeployLatest(ctx, deploy, l)
			if err != nil {
				// send the log to the lagoon-logs exchange to be processed
				h.toLagoonLogs(messageQueue, map[string]interface{}{
					"severity": "error",
					"event":    fmt.Sprintf("actions-handler:%s:failed", action.EventType),
					"meta":     deploy,
					"message":  err.Error(),
				})
				if h.EnableDebug {
					log.Println(err)
				}
				break
			}
			// send the log to the lagoon-logs exchange to be processed
			h.toLagoonLogs(messageQueue, map[string]interface{}{
				"severity": "info",
				"event":    fmt.Sprintf("actions-handler:%s:started", action.EventType),
				"meta":     deploy,
				"message":  fmt.Sprintf("started build: %s", deployment.DeployEnvironmentLatest),
			})
			if h.EnableDebug {
				log.Println(deployment.DeployEnvironmentLatest)
			}
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
