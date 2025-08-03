package messaging

import (
	"encoding/json"
	"log"

	mq "github.com/cheshir/go-mq/v2"
	"github.com/uselagoon/machinery/api/schema"
)

// Messaging is used for the config and client information for the messaging queue.
type Messenger struct {
	Config      mq.Config
	EnableDebug bool
}

// New returns a messaging with config and controller-runtime client.
func New(config mq.Config,
	enableDebug bool,

) *Messenger {
	return &Messenger{
		Config:      config,
		EnableDebug: enableDebug,
	}
}

// Publish publishes a message to a given queue
func (m *Messenger) Publish(queue string, message []byte) error {
	messageQueue, err := mq.New(m.Config)
	if err != nil {
		return err
	}
	defer messageQueue.Close()

	producer, err := messageQueue.AsyncProducer(queue)
	if err != nil {
		return err
	}
	producer.Produce(message)
	return nil
}

func (m *Messenger) SendToLagoonLogs(severity, project, uuid, event, message string, meta schema.LagoonLogMeta) {
	msg := schema.LagoonLog{
		Severity: severity,
		Project:  project,
		Event:    event,
		UUID:     uuid,
		Message:  message,
		Meta:     &meta,
	}
	msgBytes, err := json.Marshal(msg)
	if err != nil {
		log.Println("unable to marshal message", err.Error())
		return
	}
	if err := m.Publish("lagoon-logs", msgBytes); err != nil {
		log.Println("unable to send message to lagoon-logs", err.Error())
	}
}
