package messaging

import (
	"encoding/json"
	"log"
)

// testing rabbitmq/amqp is a pain, so we mock out the messenger
// e2e testing will verify proper amqp functionality

var _ Messaging = (*MessengerMock)(nil)

type MessengerMock struct{}

func (m *MessengerMock) Publish(queue string, message []byte) error {
	log.Println("sent message", queue, string(message))
	return nil
}

func (m *MessengerMock) SendToLagoonTasks(routingKey string, data []byte) error {
	s := map[string]interface{}{}
	json.Unmarshal(data, &s)
	log.Println("sent message", routingKey, s)
	return nil
}
