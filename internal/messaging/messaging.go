package messaging

import (
	"log"

	mq "github.com/cheshir/go-mq/v2"
)

type Messaging interface {
	Publish(queue string, message []byte) error
	SendToLagoonTasks(routingKey string, build []byte) error
}

type Messenger struct {
	Config      mq.Config
	EnableDebug bool
}

var _ Messaging = (*Messenger)(nil)

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
