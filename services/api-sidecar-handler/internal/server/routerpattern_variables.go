package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
)

type RouterPatternAndVariablesResponse struct {
	RouterPattern string `json:"routerPattern,omitempty"`
	EnvVars       []byte `json:"envVars,omitempty"`
}

func (p *RouterPatternAndVariablesResponse) String() string {
	b, err := json.Marshal(p)
	if err != nil {
		return ""
	}
	return string(b)
}

func (s *Server) getRouterPatternAndVariables(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	r.ParseForm()
	environmentIdStr := r.Form.Get("environmentId")
	environmentId, err := strconv.Atoi(environmentIdStr)
	if err != nil {
		// handle err
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	projectName := r.Form.Get("projectName")
	bulkId := r.Form.Get("bulkId")
	bulkName := r.Form.Get("bulkName")
	routerPattern, envvars, err := s.LagoonAPI.GetTaskProjectEnvironmentVariables(projectName, environmentId, bulkId, bulkName)
	if err != nil {
		// handle err
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	envVarBytes, _ := json.Marshal(envvars)
	resp := RouterPatternAndVariablesResponse{
		RouterPattern: routerPattern,
		EnvVars:       envVarBytes,
	}
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, resp.String())
}
