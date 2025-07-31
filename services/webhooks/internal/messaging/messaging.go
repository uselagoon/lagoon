package messaging

import (
	mq "github.com/cheshir/go-mq/v2"
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
