package handler

import (
	"context"
	"fmt"
	"log"
	"time"

	mq "github.com/cheshir/go-mq/v2"
	"github.com/uselagoon/machinery/api/lagoon"
	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/jwt"
)

func (m *Messenger) handleRemoval(ctx context.Context, messageQueue *mq.MessageQueue, message *schema.LagoonMessage, messageID string) error {
	prefix := fmt.Sprintf("(messageid:%s) %s: ", messageID, message.Namespace)
	log.Println(fmt.Sprintf("%sreceived remove environment status update", prefix))
	// generate a lagoon token with a expiry of 60 seconds from now
	token, err := jwt.GenerateAdminToken(m.LagoonAPI.TokenSigningKey, m.LagoonAPI.JWTAudience, m.LagoonAPI.JWTSubject, m.LagoonAPI.JWTIssuer, time.Now().Unix(), 60)
	if err != nil {
		// the token wasn't generated
		if m.EnableDebug {
			log.Println(fmt.Sprintf("ERROR: unable to generate token: %v", err))
		}
		return nil
	}

	// set up a lagoon client for use in the following process
	l := lclient.New(m.LagoonAPI.Endpoint, "actions-handler", m.LagoonAPI.Version, &token, false)
	execute := false
	deletedEnvironment, err := lagoon.DeleteEnvironment(ctx, message.Meta.Environment, message.Meta.Project, execute, l)
	if err != nil {
		// send the log to the lagoon-logs exchange to be processed
		m.toLagoonLogs(messageQueue, map[string]interface{}{
			"severity": "error",
			"event":    fmt.Sprintf("actions-handler:%s:failed", "deleteEnvironment"),
			"meta": map[string]string{
				"project":     message.Meta.Project,
				"environment": message.Meta.Environment,
			},
			"message": err.Error(),
		})
		if m.EnableDebug {
			log.Println(fmt.Sprintf("%sERROR: unable to delete environment: %v", prefix, err))
		}
		return err
	}
	log.Println(fmt.Sprintf("%sdeleted environment: %v", prefix, deletedEnvironment.DeleteEnvironment))
	return nil
}
