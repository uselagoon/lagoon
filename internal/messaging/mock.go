package messaging

import (
	"encoding/json"
	"log"
	"strings"

	"github.com/uselagoon/lagoon/internal/lagoon"
	lagooncrd "github.com/uselagoon/remote-controller/api/lagoon/v1beta2"
)

// testing rabbitmq/amqp is a pain, so we mock out the messenger
// e2e testing will verify proper amqp functionality

var _ Messaging = (*MessengerMock)(nil)

type MessengerMock struct{}

func (m *MessengerMock) Publish(queue string, message []byte) error {
	log.Println("[MOCK] sent message", queue, string(message))
	return nil
}

func (m *MessengerMock) SendToLagoonTasks(routingKey string, data []byte) error {
	switch {
	case strings.Contains(routingKey, ":remove"):
		s := lagoon.RemoveData{}
		_ = json.Unmarshal(data, &s)
		log.Println("[MOCK] sent removal message", routingKey, s.EnvironmentName, s.ProjectName)
	default:
		s := lagooncrd.LagoonBuild{}
		_ = json.Unmarshal(data, &s)
		log.Println("[MOCK] sent deploy message", routingKey, s.Spec.Project.Name)
	}
	return nil
}
