package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	mq "github.com/cheshir/go-mq/v2"
	"github.com/uselagoon/machinery/api/lagoon"
	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/jwt"
)

func (m *Messenger) handleDeployEnvironment(ctx context.Context, messageQueue *mq.MessageQueue, action *Action, messageID string) error {
	prefix := fmt.Sprintf("(messageid:%s) %s: ", messageID, action.EventType)
	// marshal unmarshal the data into the input we need to use when talking to the lagoon api
	data, _ := json.Marshal(action.Data)
	deploy := &schema.DeployEnvironmentLatestInput{}
	json.Unmarshal(data, deploy)
	token, err := jwt.GenerateAdminToken(m.LagoonAPI.TokenSigningKey, m.LagoonAPI.JWTAudience, m.LagoonAPI.JWTSubject, m.LagoonAPI.JWTIssuer, time.Now().Unix(), 60)
	if err != nil {
		// the token wasn't generated
		if m.EnableDebug {
			log.Println(fmt.Sprintf("%sERROR: unable to generate token: %v", prefix, err))
		}
		return nil
	}
	l := lclient.New(m.LagoonAPI.Endpoint, "actions-handler", &token, false)
	deployment, err := lagoon.DeployLatest(ctx, deploy, l)
	if err != nil {
		// send the log to the lagoon-logs exchange to be processed
		m.toLagoonLogs(messageQueue, map[string]interface{}{
			"severity": "error",
			"event":    fmt.Sprintf("actions-handler:%s:failed", action.EventType),
			"meta":     deploy,
			"message":  err.Error(),
		})
		if m.EnableDebug {
			log.Println(fmt.Sprintf("%sERROR: unable to deploy latest: %v", prefix, err))
		}
		return err
	}
	// send the log to the lagoon-logs exchange to be processed
	m.toLagoonLogs(messageQueue, map[string]interface{}{
		"severity": "info",
		"event":    fmt.Sprintf("actions-handler:%s:started", action.EventType),
		"meta":     deploy,
		"message":  fmt.Sprintf("deployed latest environment: %s", deployment.DeployEnvironmentLatest),
	})
	if m.EnableDebug {
		log.Println(fmt.Sprintf("%sdeployed latest environment: %s", prefix, deployment.DeployEnvironmentLatest))
	}
	return nil
}
