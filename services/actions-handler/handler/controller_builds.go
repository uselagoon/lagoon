package handler

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/cheshir/go-mq"
	"github.com/uselagoon/machinery/api/lagoon"
	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/jwt"
	machinerystrings "github.com/uselagoon/machinery/utils/strings"
)

func (m *Messenger) handleBuild(ctx context.Context, messageQueue mq.MQ, message *schema.LagoonMessage, messageID string) {
	if message.Meta.BuildName == "" {
		// there is no build name, so abandon this message
		return
	}
	prefix := fmt.Sprintf("(messageid:%s) %s/%s: ", messageID, message.Namespace, message.Meta.BuildName)
	buildStatus := message.Meta.BuildPhase // eventually use message.Meta.BuildStatus
	if message.Meta.BuildStatus != "" {
		// use BuildStatus so BuildPhase can be removed
		buildStatus = message.Meta.BuildStatus
	}
	log.Println(fmt.Sprintf("%sreceived deployment status update - %s", prefix, buildStatus))
	// generate a lagoon token with a expiry of 60 seconds from now
	token, err := jwt.GenerateAdminToken(m.LagoonAPI.TokenSigningKey, m.LagoonAPI.JWTAudience, m.LagoonAPI.JWTSubject, m.LagoonAPI.JWTIssuer, time.Now().Unix(), 60)
	if err != nil {
		// the token wasn't generated
		if m.EnableDebug {
			log.Println(fmt.Sprintf("%sERROR:unable to generate token: %v", prefix, err))
		}
		return
	}

	// set up a lagoon client for use in the following process
	l := lclient.New(m.LagoonAPI.Endpoint, "actions-handler", &token, false)
	deployment, err := lagoon.GetDeploymentByName(ctx, message.Namespace, message.Meta.BuildName, l)
	if err != nil {
		m.toLagoonLogs(messageQueue, map[string]interface{}{
			"severity": "error",
			"event":    fmt.Sprintf("actions-handler:%s:failed", "updateDeployment"),
			"meta":     deployment,
			"message":  err.Error(),
		})
		if m.EnableDebug {
			log.Println(fmt.Sprintf("%sERROR:unable to get deployment - %v", prefix, err))
		}
		return
	}
	switch strings.ToLower(deployment.Status) {
	case "complete", "failed", "cancelled":
		// the build/deployment is already in a finished state, don't process any additional messages for this deployment
		if m.EnableDebug {
			log.Println(fmt.Sprintf("%sWARNING:deployment is already %s doing nothing - %v", prefix, strings.ToLower(deployment.Status), err))
		}
		return
	}
	var environmentID uint
	// determine the environment id from the message
	if message.Meta.ProjectID == nil && message.Meta.EnvironmentID == nil {
		project, err := lagoon.GetMinimalProjectByName(ctx, message.Meta.Project, l)
		if err != nil {
			// send the log to the lagoon-logs exchange to be processed
			m.toLagoonLogs(messageQueue, map[string]interface{}{
				"severity": "error",
				"event":    fmt.Sprintf("actions-handler:%s:failed", "updateDeployment"),
				"meta":     project,
				"message":  err.Error(),
			})
			if m.EnableDebug {
				log.Println(fmt.Sprintf("%sERROR:unable to get project - %v", prefix, err))
			}
			return
		}
		environment, err := lagoon.GetEnvironmentByName(ctx, message.Meta.Environment, project.ID, l)
		if err != nil {
			// send the log to the lagoon-logs exchange to be processed
			m.toLagoonLogs(messageQueue, map[string]interface{}{
				"severity": "error",
				"event":    fmt.Sprintf("actions-handler:%s:failed", "updateDeployment"),
				"meta":     project,
				"message":  err.Error(),
			})
			if m.EnableDebug {
				log.Println(fmt.Sprintf("%sERROR:unable to get project - %v", prefix, err))
			}
			return
		}
		environmentID = environment.ID
	} else {
		// pull the id from the message
		environmentID = *message.Meta.EnvironmentID
	}

	// prepare the deployment patch for later step
	statusType := schema.StatusTypes(strings.ToUpper(buildStatus))
	updateDeploymentPatch := schema.UpdateDeploymentPatchInput{
		RemoteID: &message.Meta.RemoteID,
		Status:   &statusType,
		// TODO: eventually can handle `message.Meta.BuildStep` here too with API support
	}
	if message.Meta.StartTime != "" {
		updateDeploymentPatch.Started = &message.Meta.StartTime
	}
	if message.Meta.EndTime != "" {
		updateDeploymentPatch.Completed = &message.Meta.EndTime
	}
	updatedDeployment, err := lagoon.UpdateDeployment(ctx, deployment.ID, updateDeploymentPatch, l)
	if err != nil {
		// send the log to the lagoon-logs exchange to be processed
		m.toLagoonLogs(messageQueue, map[string]interface{}{
			"severity": "error",
			"event":    fmt.Sprintf("actions-handler:%s:failed", "updateDeployment"),
			"meta":     updatedDeployment,
			"message":  err.Error(),
		})
		if m.EnableDebug {
			log.Println(fmt.Sprintf("%sERROR:unable to update deployment - %v", prefix, err))
		}
		return
	}

	// update the environment namespace to be one that is in the cluster
	updateEnvironmentPatch := schema.UpdateEnvironmentPatchInput{
		OpenshiftProjectName: &message.Namespace,
	}
	switch buildStatus {
	case "complete", "failed", "cancelled":
		// set routes in the API
		if message.Meta.Route != "" {
			updateEnvironmentPatch.Route = &message.Meta.Route
		}
		if message.Meta.Routes != nil {
			routes := strings.Join(message.Meta.Routes, ",")
			updateEnvironmentPatch.Routes = &routes
		}
		if message.Meta.MonitoringURLs != nil {
			monitoring := strings.Join(message.Meta.MonitoringURLs, ",")
			updateEnvironmentPatch.MonitoringURLs = &monitoring
		}
		updateEnvironmentPatch.ProjectID = message.Meta.ProjectID
	}
	// only update the api with the status etc on pending, complete, failed, or cancelled
	// reduce calls to the api
	switch buildStatus {
	case "pending", "complete", "failed", "cancelled":
		updateEnvironment, err := lagoon.UpdateEnvironment(ctx, environmentID, updateEnvironmentPatch, l)
		if err != nil {
			// send the log to the lagoon-logs exchange to be processed
			m.toLagoonLogs(messageQueue, map[string]interface{}{
				"severity": "error",
				"event":    fmt.Sprintf("actions-handler:%s:failed", "updateDeployment"),
				"meta":     updateEnvironment,
				"message":  err.Error(),
			})
			if m.EnableDebug {
				log.Println(fmt.Sprintf("%sERROR:unable to update environment - %v", prefix, err))
			}
			return
		}
		log.Println(fmt.Sprintf("%supdated environment", prefix))
		if message.Meta.Services != nil {
			existingServices := []string{}
			for _, s := range updateEnvironment.Services {
				existingServices = append(existingServices, s.Name)
			}
			if !machinerystrings.SlicesEqual(existingServices, message.Meta.Services) {
				setServices, err := lagoon.SetEnvironmentServices(ctx, environmentID, message.Meta.Services, l)
				if err != nil {
					// send the log to the lagoon-logs exchange to be processed
					m.toLagoonLogs(messageQueue, map[string]interface{}{
						"severity": "error",
						"event":    fmt.Sprintf("actions-handler:%s:failed", "updateDeployment"),
						"meta":     setServices,
						"message":  err.Error(),
					})
					if m.EnableDebug {
						log.Println(fmt.Sprintf("%sERROR:unable to update environment services - %v", prefix, err))
					}
					return
				}
				log.Println(fmt.Sprintf("%supdated environment services - %v", prefix, strings.Join(message.Meta.Services, ",")))
			}
		}
	}
}
