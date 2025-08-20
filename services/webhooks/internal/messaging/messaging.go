package messaging

import (
	"encoding/json"
	"log"

	mq "github.com/cheshir/go-mq/v2"
	"github.com/uselagoon/machinery/api/schema"
)

type Messaging interface {
	Publish(queue string, message []byte) error
	SendToLagoonTasks(routingKey string, build []byte) error
	SendToLagoonLogs(severity, project, uuid, event, message string, meta schema.LagoonLogMeta) error
}

type Messenger struct {
	Config      mq.Config
	EnableDebug bool
}

var _ Messaging = (*Messenger)(nil)

// New returns a messaging with config and controller-runtime client.
func NewMessaging(
	config mq.Config,
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

// Publish publishes a message to a given queue
func (m *Messenger) publishWithKey(queue, routingKey string, message []byte) error {
	producers := mq.Producers{}
	for _, p := range m.Config.Producers {
		if p.Name == "lagoon-tasks" {
			p.RoutingKey = routingKey
		}
		producers = append(producers, p)
	}
	m.Config.Producers = producers
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

func (m *Messenger) SendToLagoonTasks(routingKey string, build []byte) error {
	if err := m.publishWithKey("lagoon-tasks", routingKey, build); err != nil {
		log.Println("unable to send message to lagoon-tasks", err.Error())
		return err
	}
	return nil
}

func (m *Messenger) SendToLagoonLogs(severity, project, uuid, event, message string, meta schema.LagoonLogMeta) error {
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
		return err
	}
	if err := m.Publish("lagoon-logs", msgBytes); err != nil {
		log.Println("no-op unable to send message to lagoon-logs", err.Error())
		return err
	}
	return nil
}
