package handler

import (
	"context"
	"encoding/base64"
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

type Idled struct {
	Idled bool `json:"idled"`
}

type ServiceState struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Replicas *int32 `json:"replicas"`
}

func (m *Messenger) handleIdling(ctx context.Context, messageQueue *mq.MessageQueue, message *schema.LagoonMessage, messageID string) error {
	prefix := fmt.Sprintf("(messageid:%s) %s: ", messageID, message.Namespace)
	log.Printf("%sreceived idling environment status update", prefix)
	// generate a lagoon token with a expiry of 60 seconds from now
	token, err := jwt.GenerateAdminToken(m.LagoonAPI.TokenSigningKey, m.LagoonAPI.JWTAudience, m.LagoonAPI.JWTSubject, m.LagoonAPI.JWTIssuer, time.Now().Unix(), 60)
	if err != nil {
		// the token wasn't generated
		if m.EnableDebug {
			log.Printf("ERROR: unable to generate token: %v", err)
		}
		return nil
	}
	// set up a lagoon client for use in the following process
	l := lclient.New(m.LagoonAPI.Endpoint, "actions-handler", m.LagoonAPI.Version, &token, false)
	var environmentID uint
	// determine the environment id from the message
	if message.Meta.ProjectID == nil && message.Meta.EnvironmentID == nil {
		project, err := lagoon.GetMinimalProjectByName(ctx, message.Meta.Project, l)
		if err != nil {
			// send the log to the lagoon-logs exchange to be processed
			m.toLagoonLogs(messageQueue, map[string]interface{}{
				"severity": "error",
				"event":    fmt.Sprintf("actions-handler:%s:failed", "updateEnvironment"),
				"meta":     project,
				"message":  err.Error(),
			})
			if m.EnableDebug {
				log.Printf("%sERROR: unable to get project - %v", prefix, err)
			}
			return err
		}
		environment, err := lagoon.GetEnvironmentByName(ctx, message.Meta.Environment, project.ID, l)
		if err != nil {
			// send the log to the lagoon-logs exchange to be processed
			m.toLagoonLogs(messageQueue, map[string]interface{}{
				"severity": "error",
				"event":    fmt.Sprintf("actions-handler:%s:failed", "updateEnvironment"),
				"meta":     project,
				"message":  err.Error(),
			})
			if m.EnableDebug {
				log.Printf("%sERROR: unable to get environment - %v", prefix, err)
			}
			return err
		}
		environmentID = environment.ID
	} else {
		// pull the id from the message
		environmentID = *message.Meta.EnvironmentID
	}
	decodeData, _ := base64.StdEncoding.DecodeString(message.Meta.AdvancedData)
	idled := &Idled{}
	json.Unmarshal(decodeData, idled)
	updateEnvironmentPatch := schema.UpdateEnvironmentPatchInput{
		Idled: &idled.Idled,
	}
	updateEnvironment, err := lagoon.UpdateEnvironment(ctx, environmentID, updateEnvironmentPatch, l)
	if err != nil {
		// send the log to the lagoon-logs exchange to be processed
		m.toLagoonLogs(messageQueue, map[string]interface{}{
			"severity": "error",
			"event":    fmt.Sprintf("actions-handler:%s:failed", "updateEnvironment"),
			"meta":     updateEnvironment,
			"message":  err.Error(),
		})
		if m.EnableDebug {
			log.Printf("%sERROR: unable to update environment - %v", prefix, err)
		}
		return err
	}
	log.Printf("%supdated environment", prefix)
	return nil
}

func (m *Messenger) handleServiceState(ctx context.Context, messageQueue *mq.MessageQueue, message *schema.LagoonMessage, messageID string) error {
	prefix := fmt.Sprintf("(messageid:%s) %s: ", messageID, message.Namespace)
	log.Printf("%sreceived environment service status update", prefix)
	// generate a lagoon token with a expiry of 60 seconds from now
	token, err := jwt.GenerateAdminToken(m.LagoonAPI.TokenSigningKey, m.LagoonAPI.JWTAudience, m.LagoonAPI.JWTSubject, m.LagoonAPI.JWTIssuer, time.Now().Unix(), 60)
	if err != nil {
		// the token wasn't generated
		if m.EnableDebug {
			log.Printf("ERROR: unable to generate token: %v", err)
		}
		return nil
	}
	// set up a lagoon client for use in the following process
	l := lclient.New(m.LagoonAPI.Endpoint, "actions-handler", m.LagoonAPI.Version, &token, false)
	var environmentID uint
	// determine the environment id from the message
	if message.Meta.ProjectID == nil && message.Meta.EnvironmentID == nil {
		project, err := lagoon.GetMinimalProjectByName(ctx, message.Meta.Project, l)
		if err != nil {
			// send the log to the lagoon-logs exchange to be processed
			m.toLagoonLogs(messageQueue, map[string]interface{}{
				"severity": "error",
				"event":    fmt.Sprintf("actions-handler:%s:failed", "addOrUpdateEnvironmentService"),
				"meta":     project,
				"message":  err.Error(),
			})
			if m.EnableDebug {
				log.Printf("%sERROR: unable to get project - %v", prefix, err)
			}
			return err
		}
		environment, err := lagoon.GetEnvironmentByName(ctx, message.Meta.Environment, project.ID, l)
		if err != nil {
			// send the log to the lagoon-logs exchange to be processed
			m.toLagoonLogs(messageQueue, map[string]interface{}{
				"severity": "error",
				"event":    fmt.Sprintf("actions-handler:%s:failed", "addOrUpdateEnvironmentService"),
				"meta":     project,
				"message":  err.Error(),
			})
			if m.EnableDebug {
				log.Printf("%sERROR: unable to get environment - %v", prefix, err)
			}
			return err
		}
		environmentID = environment.ID
	} else {
		// pull the id from the message
		environmentID = *message.Meta.EnvironmentID
	}
	decodeData, _ := base64.StdEncoding.DecodeString(message.Meta.AdvancedData)
	serviceState := &ServiceState{}
	json.Unmarshal(decodeData, serviceState)
	addEnvService := schema.AddEnvironmentServiceInput{EnvironmentID: environmentID, Name: serviceState.Name, Type: serviceState.Type, Replicas: serviceState.Replicas}
	// add or update it
	setServices, err := lagoon.AddOrUpdateEnvironmentService(ctx, addEnvService, l)
	if err != nil {
		// send the log to the lagoon-logs exchange to be processed
		m.toLagoonLogs(messageQueue, map[string]interface{}{
			"severity": "error",
			"event":    fmt.Sprintf("actions-handler:%s:failed", "addOrUpdateEnvironmentService"),
			"meta":     setServices,
			"message":  err.Error(),
		})
		if m.EnableDebug {
			log.Printf("%sERROR: unable to update environment services - %v", prefix, err)
		}
		return err
	}
	log.Printf("%supdated service replicas", prefix)
	return nil
}
