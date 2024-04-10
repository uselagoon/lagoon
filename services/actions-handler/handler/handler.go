package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	mq "github.com/cheshir/go-mq/v2"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/namespace"
	try "gopkg.in/matryer/try.v1"
)

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

type messenger interface {
	Consumer()
	Publish(string, []byte)
	handleRemoval(context.Context, mq.MessageQueue, *schema.LagoonMessage, string) error
}

// Messenger is used for the config and client information for the messaging queue.
type Messenger struct {
	Config                  mq.Config
	LagoonAPI               LagoonAPI
	ConnectionAttempts      int
	ConnectionRetryInterval int
	ActionsQueueName        string
	ControllerQueueName     string
	EnableDebug             bool
}

// New returns a messaging with config
func New(config mq.Config, lagoonAPI LagoonAPI, startupAttempts int, startupInterval int, actionsQueueName, controllerQueueName string, enableDebug bool) *Messenger {
	return &Messenger{
		Config:                  config,
		LagoonAPI:               lagoonAPI,
		ConnectionAttempts:      startupAttempts,
		ConnectionRetryInterval: startupInterval,
		ActionsQueueName:        actionsQueueName,
		ControllerQueueName:     controllerQueueName,
		EnableDebug:             enableDebug,
	}
}

// Consumer handles consuming messages sent to the queue that this action handler is connected to and processes them accordingly
func (m *Messenger) Consumer() {
	ctx := context.TODO()

	messageQueue := &mq.MessageQueue{}
	// if no mq is found when the goroutine starts, retry a few times before exiting
	// default is 10 retry with 30 second delay = 5 minutes
	err := try.Do(func(attempt int) (bool, error) {
		var err error
		messageQueue, err = mq.New(m.Config)
		if err != nil {
			log.Println(err,
				fmt.Sprintf(
					"Failed to initialize message queue manager, retrying in %d seconds, attempt %d/%d",
					m.ConnectionRetryInterval,
					attempt,
					m.ConnectionAttempts,
				),
			)
			time.Sleep(time.Duration(m.ConnectionRetryInterval) * time.Second)
		}
		return attempt < m.ConnectionAttempts, err
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
	log.Println(fmt.Sprintf("Listening for messages in queue %s", m.ActionsQueueName))
	err = messageQueue.SetConsumerHandler(m.ActionsQueueName, func(message mq.Message) {
		action := &Action{}
		json.Unmarshal(message.Body(), action)
		messageID := namespace.RandString(8)
		var err error
		switch action.Type {
		// check if this a `updateEnvironmentStorage` type of action
		// and perform the steps to run the mutation against the lagoon api
		case "updateEnvironmentStorage":
			err = m.handleUpdateStorage(ctx, messageQueue, action, messageID)
		// check if this a `deployEnvironmentLatest` type of action
		// and perform the steps to run the mutation against the lagoon api
		case "deployEnvironmentLatest":
			err = m.handleDeployEnvironment(ctx, messageQueue, action, messageID)
		}
		// if there aren't any errors, then ack the message, an error indicates that there may have been an issue with the api handling the request
		// skipping this means the message will remain in the queue
		if LagoonAPIRetryErrorCheck(err) != nil {
			log.Println(fmt.Sprintf("Lagoon API error retry: %v", err))
			message.Nack(false, true) // resubmit the message to the queue for processing
		} else {
			message.Ack(false) // ack to remove from queue
		}
	})
	if err != nil {
		log.Println(fmt.Sprintf("Failed to set handler to consumer `%s`: %v", m.ActionsQueueName, err))
	}

	// Handle any tasks that go to the lagoon-tasks:controller queue
	log.Println(fmt.Sprintf("Listening for messages in queue %s", m.ControllerQueueName))
	err = messageQueue.SetConsumerHandler(m.ControllerQueueName, func(message mq.Message) {
		logMsg := &schema.LagoonMessage{}
		json.Unmarshal(message.Body(), logMsg)
		messageID := namespace.RandString(8)
		var err error
		switch logMsg.Type {
		case "build":
			err = m.handleBuild(ctx, messageQueue, logMsg, messageID)
		// check if this a `deployEnvironmentLatest` type of action
		// and perform the steps to run the mutation against the lagoon api
		case "remove":
			err = m.handleRemoval(ctx, messageQueue, logMsg, messageID)
		case "task":
			err = m.handleTask(ctx, messageQueue, logMsg, messageID)
		}
		// if there aren't any errors, then ack the message, an error indicates that there may have been an issue with the api handling the request
		// skipping this means the message will remain in the queue
		if LagoonAPIRetryErrorCheck(err) != nil {
			log.Println(fmt.Sprintf("Lagoon API error retry: %v", err))
			message.Nack(false, true) // resubmit the message to the queue for processing
		} else {
			message.Ack(false) // ack to remove from queue
		}
	})
	if err != nil {
		log.Println(fmt.Sprintf("Failed to set handler to consumer `%s`: %v", m.ControllerQueueName, err))
	}

	<-forever
}

// toLagoonLogs sends logs to the lagoon-logs message queue
func (m *Messenger) toLagoonLogs(messageQueue *mq.MessageQueue, message map[string]interface{}) {
	msgBytes, err := json.Marshal(message)
	if err != nil {
		if m.EnableDebug {
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

// simple error check for lagoon api responses to determine if a retry is required
func LagoonAPIRetryErrorCheck(err error) error {
	if err != nil && strings.Contains(err.Error(), "connection reset by peer") {
		return err
	}
	return nil
}
