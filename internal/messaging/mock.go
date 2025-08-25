package messaging

import (
	"encoding/json"
	"log"

	"github.com/uselagoon/machinery/api/schema"
)

// testing rabbitmq/amqp is a pain, so we mock out the messenger
// e2e testing will verify proper amqp functionality

var _ Messaging = (*MessengerMock)(nil)

type MessengerMock struct{}

func (m *MessengerMock) Publish(queue string, message []byte) error {
	log.Println("sent message", queue, string(message))
	return nil
}

func (m *MessengerMock) SendToLagoonTasks(routingKey string, build []byte) error {
	s := map[string]interface{}{}
	json.Unmarshal(build, &s)
	log.Println("sent message", routingKey, s["metadata"])
	return nil
}

func (m *MessengerMock) SendToLagoonLogs(severity, project, uuid, event, message string, meta schema.LagoonLogMeta) error {
	msg := schema.LagoonLog{
		Severity: severity,
		Project:  project,
		Event:    event,
		UUID:     uuid,
		Message:  message,
		Meta:     &meta,
	}
	log.Println("no-op unable to send message to lagoon-logs", msg)
	return nil
}
