package server

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/uselagoon/lagoon/internal/events"
	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

func (s *Server) deployEnvironment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	r.ParseForm()
	deployType := r.Form.Get("type")
	buildName := r.Form.Get("buildName")
	branchName := r.Form.Get("branchName")
	sourceUser := r.Form.Get("sourceUser")
	projectName := r.Form.Get("projectName")
	promoteSourceEnvironment := r.Form.Get("promoteSourceEnvironment")
	gitSHA := r.Form.Get("gitSha")
	bulkID := r.Form.Get("bulkId")
	bulkName := r.Form.Get("bulkName")
	buildPriority := r.Form.Get("buildPriority")
	var priority uint
	if buildPriority != "" {
		i, err := strconv.Atoi(buildPriority)
		if err != nil {
			// handle err
			http.Error(w, "", http.StatusInternalServerError)
			return
		}
		priority = uint(i)
	}
	buildVariables := r.Form.Get("buildVariables")
	buildVars := []schema.EnvKeyValue{}
	data, err := base64.StdEncoding.DecodeString(buildVariables)
	if err != nil {
		// handle err
		http.Error(w, "", http.StatusInternalServerError)
		return
	}
	err = json.Unmarshal(data, &buildVars)
	if err != nil {
		// handle err
		http.Error(w, "", http.StatusInternalServerError)
		return
	}
	pullrequest := r.Form.Get("pullrequest")
	pr := &lagoon.Pullrequest{}
	prd, err := base64.StdEncoding.DecodeString(pullrequest)
	if err != nil {
		// handle err
		http.Error(w, "", http.StatusInternalServerError)
		return
	}
	err = json.Unmarshal(prd, pr)
	if err != nil {
		// handle err
		http.Error(w, "", http.StatusInternalServerError)
		return
	}

	e := events.New(s.LagoonAPI, s.Messaging)
	project, err := e.LagoonAPI.ProjectByName(projectName)
	if err != nil {
		// handle err
		http.Error(w, "", http.StatusInternalServerError)
		return
	}

	deployData := lagoon.DeployData{
		BuildName:                buildName,
		UnsafeEnvironmentName:    branchName,
		SourceUser:               sourceUser,
		Project:                  *project,
		SourceType:               lagoon.SourceAPI,
		DeployType:               schema.DeployType(strings.ToUpper(deployType)),
		BulkType:                 lagoon.BulkDeploy,
		PromoteSourceEnvironment: promoteSourceEnvironment,
		GitSHA:                   gitSHA,
		BulkID:                   bulkID,
		BulkName:                 bulkName,
		BuildVariables:           buildVars,
	}
	if priority != 0 {
		deployData.BuildPriority = &priority
	}
	if pr.Title != "" {
		deployData.Pullrequest = *pr
	}
	_, err = e.CreateDeployTask(*project, deployData)
	if err != nil {
		// handle err
		http.Error(w, "", http.StatusInternalServerError)
		return
	}
	log.Printf("deployed environment %s of type %s for project %s", branchName, deployData.DeployType, project.Name)
}
