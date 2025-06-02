package handler

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	mq "github.com/cheshir/go-mq/v2"
	"github.com/uselagoon/machinery/api/lagoon"
	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/jwt"
	machinerystrings "github.com/uselagoon/machinery/utils/strings"
)

func (m *Messenger) handleBuild(ctx context.Context, messageQueue *mq.MessageQueue, message *schema.LagoonMessage, messageID string) error {
	if message.Meta.BuildName == "" {
		// there is no build name, so abandon this message
		return nil
	}
	prefix := fmt.Sprintf("(messageid:%s) %s/%s: ", messageID, message.Namespace, message.Meta.BuildName)
	buildStatus := message.Meta.BuildPhase // eventually use message.Meta.BuildStatus
	if message.Meta.BuildStatus != "" {
		// use BuildStatus so BuildPhase can be removed
		buildStatus = message.Meta.BuildStatus
	}
	log.Printf("%sreceived deployment status update - %s", prefix, buildStatus)
	// generate a lagoon token with a expiry of 60 seconds from now
	token, err := jwt.GenerateAdminToken(m.LagoonAPI.TokenSigningKey, m.LagoonAPI.JWTAudience, m.LagoonAPI.JWTSubject, m.LagoonAPI.JWTIssuer, time.Now().Unix(), 60)
	if err != nil {
		// the token wasn't generated
		if m.EnableDebug {
			log.Printf("%sERROR:unable to generate token: %v", prefix, err)
		}
		return nil
	}

	// set up a lagoon client for use in the following process
	l := lclient.New(m.LagoonAPI.Endpoint, "actions-handler", m.LagoonAPI.Version, &token, false)
	// once https://github.com/uselagoon/remote-controller/pull/292 is released, this should be changed to the following
	// this leads the way for also supporting changes that the UI would need to undertake as described in the note in
	// services/api/src/resources/environment/resolvers.ts under the TODO in `addOrUpdateEnvironment`
	// environment, err := lagoon.GetEnvironmentByID(ctx, *message.Meta.EnvironmentID, l)
	environment, err := lagoon.GetEnvironmentByNamespace(ctx, message.Namespace, l)
	if err != nil || environment == nil {
		if err != nil {
			m.toLagoonLogs(messageQueue, map[string]interface{}{
				"severity": "error",
				"event":    fmt.Sprintf("actions-handler:%s:failed", "updateDeployment"),
				"meta":     environment,
				"message":  err.Error(),
			})
			if m.EnableDebug {
				log.Printf("%sERROR:unable to get environment by namespace - %v", prefix, err)
			}
			return err
		}
	}
	environmentID := environment.ID
	deployment, err := lagoon.GetDeploymentByName(ctx, message.Meta.Project, environment.Name, message.Meta.BuildName, false, l)
	if err != nil {
		m.toLagoonLogs(messageQueue, map[string]interface{}{
			"severity": "error",
			"event":    fmt.Sprintf("actions-handler:%s:failed", "updateDeployment"),
			"meta":     deployment,
			"message":  err.Error(),
		})
		if m.EnableDebug {
			log.Printf("%sERROR:unable to get deployment - %v", prefix, err)
		}
		return err
	}
	switch strings.ToLower(deployment.Status) {
	case "complete", "failed", "cancelled":
		// the build/deployment is already in a finished state, don't process any additional messages for this deployment
		if m.EnableDebug {
			log.Printf("%sWARNING:deployment is already %s doing nothing - %v", prefix, strings.ToLower(deployment.Status), err)
		}
		return nil
	}
	// prepare the deployment patch for later step
	statusType := schema.StatusTypes(strings.ToUpper(buildStatus))
	updateDeploymentPatch := schema.UpdateDeploymentPatchInput{
		Status: &statusType,
	}
	if message.Meta.BuildStep != "" {
		updateDeploymentPatch.BuildStep = &message.Meta.BuildStep
	}
	if message.Meta.RemoteID != "" {
		updateDeploymentPatch.RemoteID = &message.Meta.RemoteID
	}
	if message.Meta.StartTime != "" {
		updateDeploymentPatch.Started = &message.Meta.StartTime
	}
	if message.Meta.EndTime != "" {
		updateDeploymentPatch.Completed = &message.Meta.EndTime
	}
	switch buildStatus {
	case "complete", "failed", "cancelled":
		// smol delay for final messages again to try and reduce raciness
		time.Sleep(time.Second)
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
			log.Printf("%sERROR: unable to update deployment - %v", prefix, err)
		}
		return err
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
				log.Printf("%sERROR: unable to update environment - %v", prefix, err)
			}
			return err
		}
		log.Printf("%supdated environment", prefix)
		// @TODO START @DEPRECATED this should be removed when the `setEnvironmentServices` mutation gets removed from the API
		if message.Meta.Services != nil { // @DEPRECATED
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
						log.Printf("%sERROR: unable to update environment services - %v", prefix, err)
					}
					return err
				}
				log.Printf("%supdated environment services - %v", prefix, strings.Join(message.Meta.Services, ","))
			}
		} // END @DEPRECATED
		// services now provide additional information
		if message.Meta.EnvironmentServices != nil {
			// collect all the errors as this process runs through
			errs := []error{}
			// run through the environments services that currently exist
			for _, eService := range environment.Services {
				exists := false
				for _, mService := range message.Meta.EnvironmentServices {
					if eService.Name == mService.Name {
						exists = true
					}
				}
				// remove any that don't exist in the environment anymore
				if !exists {
					// delete it
					s2del := schema.DeleteEnvironmentServiceInput{EnvironmentID: environmentID, Name: eService.Name}
					setServices, err := lagoon.DeleteEnvironmentService(ctx, s2del, l)
					if err != nil {
						// send the log to the lagoon-logs exchange to be processed
						m.toLagoonLogs(messageQueue, map[string]interface{}{
							"severity": "error",
							"event":    fmt.Sprintf("actions-handler:%s:failed", "updateDeployment"),
							"meta":     setServices,
							"message":  err.Error(),
						})
						if m.EnableDebug {
							log.Printf("%sERROR: unable to delete environment services - %v", prefix, err)
						}
						errs = append(errs, err)
					}
				}
			}
			// then update all the existing services
			for _, mService := range message.Meta.EnvironmentServices {
				containers := []schema.ServiceContainerInput{}
				for _, sCon := range mService.Containers {
					containers = append(containers, schema.ServiceContainerInput(sCon))
				}
				s2add := schema.AddEnvironmentServiceInput{EnvironmentID: environmentID, Name: mService.Name, Type: mService.Type, Containers: containers}
				// add or update it
				setServices, err := lagoon.AddOrUpdateEnvironmentService(ctx, s2add, l)
				if err != nil {
					// send the log to the lagoon-logs exchange to be processed
					m.toLagoonLogs(messageQueue, map[string]interface{}{
						"severity": "error",
						"event":    fmt.Sprintf("actions-handler:%s:failed", "updateDeployment"),
						"meta":     setServices,
						"message":  err.Error(),
					})
					if m.EnableDebug {
						log.Printf("%sERROR: unable to update environment services - %v", prefix, err)
					}
					errs = append(errs, err)
				}
			}
			// consolidate error messages down to a single error to return
			var errMsg []string
			errMsgs := false
			for _, err := range errs {
				if err != nil {
					errMsgs = true
					errMsg = append(errMsg, err.Error())
				}
			}
			if errMsgs {
				return fmt.Errorf(strings.Join(errMsg, ","), fmt.Errorf(""))
			}
			log.Printf("%supdated environment services", prefix)
		}
	}
	return nil
}
