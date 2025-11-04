package handler

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	mq "github.com/cheshir/go-mq/v2"
	"github.com/uselagoon/machinery/api/lagoon"
	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/jwt"
)

func (m *Messenger) handleTask(ctx context.Context, messageQueue *mq.MessageQueue, message *schema.LagoonMessage, messageID string) error {
	prefix := fmt.Sprintf("(messageid:%s) %s/%s: ", messageID, message.Namespace, message.Meta.Task.Name)
	log.Printf("%sreceived task status update: %s", prefix, message.Meta.JobStatus)
	// generate a lagoon token with a expiry of 60 seconds from now
	token, err := jwt.GenerateAdminToken(m.LagoonAPI.TokenSigningKey, m.LagoonAPI.JWTAudience, m.LagoonAPI.JWTSubject, m.LagoonAPI.JWTIssuer, time.Now().Unix(), 60)
	if err != nil {
		// the token wasn't generated
		if m.EnableDebug {
			log.Printf("%sERROR: unable to generate token: %v", prefix, err)
		}
		return nil
	}

	// set up a lagoon client for use in the following process
	l := lclient.New(m.LagoonAPI.Endpoint, "actions-handler", m.LagoonAPI.Version, &token, false)

	switch message.Meta.Key {
	case "kubernetes:route:migrate", "deploytarget:route:migrate", "deploytarget:task:activestandby":
		// if the result is from an active/standby task, handle updating the project here
		switch message.Meta.JobStatus {
		case "complete", "succeeded":
			project, err := lagoon.GetMinimalProjectByName(ctx, message.Meta.Project, l)
			if err != nil {
				// send the log to the lagoon-logs exchange to be processed
				m.toLagoonLogs(messageQueue, map[string]interface{}{
					"severity": "error",
					"event":    fmt.Sprintf("actions-handler:%s:failed", "updateTask"),
					"meta":     message.Meta.Project,
					"message":  err.Error(),
				})
				if m.EnableDebug {
					log.Printf("%sERROR: unable to project information: %v", prefix, err)
				}
				return err
			}
			// decode and unmarshal the result into an activestandby result
			decodeData, _ := base64.StdEncoding.DecodeString(message.Meta.AdvancedData)
			advTask := &schema.ActiveStandbyResult{}
			json.Unmarshal(decodeData, advTask)
			// then prepare the patch operation
			updateProject := schema.UpdateProjectPatchInput{
				ProductionEnvironment:        &advTask.ProductionEnvironment,
				StandbyProductionEnvironment: &advTask.StandbyProductionEnvironment,
				ProductionRoutes:             &advTask.ProductionRoutes,
				StandbyRoutes:                &advTask.StandbyRoutes,
			}
			switch message.Meta.Key {
			case "kubernetes:route:migrate", "deploytarget:route:migrate":
				// the old task had these inverted, so this keeps that inversion in place for now
				updateProject.ProductionEnvironment = &advTask.StandbyProductionEnvironment
				updateProject.StandbyProductionEnvironment = &advTask.ProductionEnvironment
			}
			// update the project in the api
			updatedProject, err := lagoon.UpdateProject(ctx, project.ID, updateProject, l)
			if err != nil {
				// send the log to the lagoon-logs exchange to be processed
				m.toLagoonLogs(messageQueue, map[string]interface{}{
					"severity": "error",
					"event":    fmt.Sprintf("actions-handler:%s:failed", "updateTask"),
					"meta":     updatedProject,
					"message":  err.Error(),
				})
				if m.EnableDebug {
					log.Printf("%sERROR: unable to update project with active/standby result: %v", prefix, err)
				}
				return err
			}
			// if the project has API defined routes, handle updating those here
			updateActiveStandbyRoutes(l, message.Meta.Project, *updateProject.ProductionEnvironment, *updateProject.StandbyProductionEnvironment, prefix)
			log.Printf("%supdated project %s with active/standby result: %v", prefix, message.Meta.Project, "success")
		}
	}
	// continue on to updating the task as normal
	// the task id is a string (legacy hold over, tricky to fix :( ) convert it to int for use against the api
	taskId, _ := strconv.Atoi(message.Meta.Task.ID)
	// prepare the task patch for later step
	updateTaskPatch := schema.UpdateTaskPatchInput{
		Status: schema.StatusTypes(strings.ToUpper(message.Meta.JobStatus)),
	}
	if message.Meta.RemoteID != "" {
		updateTaskPatch.RemoteID = message.Meta.RemoteID
	}
	if message.Meta.StartTime != "" {
		updateTaskPatch.Started = message.Meta.StartTime
	}
	if message.Meta.EndTime != "" {
		updateTaskPatch.Completed = message.Meta.EndTime
	}
	updatedTask, err := lagoon.UpdateTask(ctx, taskId, updateTaskPatch, l)
	if err != nil {
		// send the log to the lagoon-logs exchange to be processed
		m.toLagoonLogs(messageQueue, map[string]interface{}{
			"severity": "error",
			"event":    fmt.Sprintf("actions-handler:%s:failed", "updateTask"),
			"meta":     updatedTask,
			"message":  err.Error(),
		})
		if m.EnableDebug {
			log.Printf("%sERROR: unable to update task: %v", prefix, err)
		}
		return err
	}
	log.Printf("%supdated task: %s", prefix, message.Meta.JobStatus)
	return nil
}

/*
these will need to be added to machinery at some point
for now they're defined here and adding or extending to existing schema
*/
type Project struct {
	schema.Project
	// @TODO: add to machinery
	APIRoutes []Route `json:"apiRoutes"`
}

// @TODO: add to machinery
type Route struct {
	Domain      string              `json:"domain"`
	Service     string              `json:"service"`
	Environment *schema.Environment `json:"environment"`
	Type        string              `json:"type"`
}

/*
updateActiveStandbyRoutes will update routes in the project according to the result
of the active/standby switch, it calls updateRouteType accordingly
*/
func updateActiveStandbyRoutes(l *lclient.Client, project, prod, standby, prefix string) {
	// get routes of the project
	raw := fmt.Sprintf(`query pbn{
		projectByName(name:"%s"){
			id
			apiRoutes{
				domain
				service
				environment{
					name
				}
				type
			}
		}
	}`, project)
	rawResp, err := l.ProcessRaw(context.TODO(), raw, nil)
	if err != nil {
		log.Printf("%sERROR: unable to update task: %v", prefix, err)
		return
	}
	var p Project
	d, _ := json.Marshal(rawResp.(map[string]interface{})["projectByName"])
	json.Unmarshal(d, &p)
	for _, route := range p.APIRoutes {
		// only patch routes with an environment attached
		if route.Type == "ACTIVE" && route.Environment != nil {
			updateRouteType(l, route, prod, project, prefix)
		}
		if route.Type == "STANDBY" && route.Environment != nil {
			updateRouteType(l, route, standby, project, prefix)
		}
	}
}

/*
updateRouteType will just update which environment the route is attached to
based on the result of the active/standby task completion
*/
func updateRouteType(l *lclient.Client, route Route, env, project, prefix string) {
	raw := fmt.Sprintf(`mutation moveRoute{
	activeStandbyRouteMove(
		input:{
			domain: "%s"
			environment: "%s"
			project: "%s"
		}){
			id
		}
	}`, route.Domain, env, project)
	_, err := l.ProcessRaw(context.TODO(), raw, nil)
	if err != nil {
		log.Printf("%sERROR: unable to update task: %v", prefix, err)
		return
	}
}
