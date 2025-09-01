package server

import (
	"log"
	"net/http"
	"strconv"

	"github.com/uselagoon/lagoon/internal/events"
)

func (s *Server) removeEnvironment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	r.ParseForm()
	environmentName := r.Form.Get("environmentName")
	projectName := r.Form.Get("projectName")
	forceDeleteProductionEnvironment := r.Form.Get("forceDeleteProductionEnvironment")
	fdpe, err := strconv.ParseBool(forceDeleteProductionEnvironment)
	if err != nil {
		// handle err
		http.Error(w, "", http.StatusInternalServerError)
		return
	}
	if !fdpe {
		log.Printf("%s is defined as the production environment for %s, refusing to remove.", environmentName, projectName)
		return
	}
	e := events.New(s.LagoonAPI, s.Messaging)
	project, err := e.LagoonAPI.ProjectByName(projectName)
	if err != nil {
		// handle err
		http.Error(w, "", http.StatusInternalServerError)
		return
	}
	err = e.CreateRemoveTask(*project, environmentName)
	if err != nil {
		// handle err
		http.Error(w, "", http.StatusInternalServerError)
		return
	}
	log.Printf("removed environment %s from project %s", environmentName, project.Name)
}
