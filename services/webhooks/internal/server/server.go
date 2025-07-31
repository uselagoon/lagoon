package server

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"slices"

	"github.com/drone/go-scm/scm"
	"github.com/drone/go-scm/scm/driver/azure"
	"github.com/drone/go-scm/scm/driver/bitbucket"
	"github.com/drone/go-scm/scm/driver/gitea"
	"github.com/drone/go-scm/scm/driver/github"
	"github.com/drone/go-scm/scm/driver/gitlab"
	"github.com/drone/go-scm/scm/driver/gogs"
	"github.com/drone/go-scm/scm/driver/stash"
	"github.com/gorilla/mux"
	"github.com/uselagoon/lagoon-sneak/services/webhooks/internal/events"
	syshook "github.com/uselagoon/lagoon-sneak/services/webhooks/internal/gitlab"
	"github.com/uselagoon/lagoon-sneak/services/webhooks/internal/messaging"
)

type Server struct {
	Router    *mux.Router
	Messaging *messaging.Messenger
}

func (s *Server) Initialize() {
	s.Router = mux.NewRouter()
	s.initializeRoutes()
}

func (s *Server) Run(addr string) {
	log.Fatal(http.ListenAndServe(":3000", s.Router))
}

func (s *Server) initializeRoutes() {
	s.Router.HandleFunc("/", s.handleWebhookPost).Methods("POST")
	s.Router.HandleFunc("/", s.handleWebhookGet).Methods("GET")
}

func (s *Server) handleWebhookPost(w http.ResponseWriter, r *http.Request) {
	secret := func(webhook scm.Webhook) (string, error) {
		return "", nil
	}
	var err error
	var webhook scm.Webhook
	var client *scm.Client
	isGit := false
	if r.Header.Get("X-Gitea-Event") != "" {
		log.Println("GITEA")
		// pass an empty url we only need the webhook parse capability
		client, _ = gitea.New("")
		isGit = true
	}
	if r.Header.Get("X-Gogs-Event") != "" {
		log.Println("GOGS")
		// pass an empty url we only need the webhook parse capability
		client, _ = gogs.New("")
		isGit = true
	}
	// azure might not be usable https://github.com/uselagoon/lagoon/issues/3470#issuecomment-1607066097
	if r.Header.Get("X-Lagoon-Azure-Devops") != "" {
		log.Println("AZURE")
		// pass an empty url we only need the webhook parse capability
		client, _ = azure.New("", "none", "")
		isGit = true
	}
	// check if stash or bitbucket
	if r.Header.Get("X-Event-Key") != "" {
		if slices.Contains(
			// stash event types
			[]string{"repo:refs_changed", "pr:opened", "pr:from_ref_updated", "pr:modified", "pr:declined", "pr:deleted", "pr:merged"},
			r.Header.Get("X-Event-Key"),
		) {
			log.Println("STASH")
			client = stash.NewDefault()
			isGit = true
		} else {
			log.Println("BITBUCKET")
			client = bitbucket.NewDefault()
			isGit = true
		}
	}
	if r.Header.Get("X-Gitlab-Event") != "" {
		if r.Header.Get("X-Gitlab-Event") == "System Hook" {
			// drone scm doesn't process gitlab system hooks that we need
			// so handle them differently
			log.Println("GITLAB SECURE")
			// handle gitlab system hooks here
			defer r.Body.Close()
			body, err := io.ReadAll(r.Body)
			if err != nil {
				http.Error(w, "Invalid Body", http.StatusBadRequest)
			}
			token := os.Getenv("GITLAB_SYSTEM_HOOK_TOKEN")
			if r.Header.Get("X-Gitlab-Token") != "" && r.Header.Get("X-Gitlab-Token") != token {
				http.Error(w, "Gitlab system hook secret verification failed", http.StatusUnauthorized)
			}
			if err = syshook.HandleSystemHook("api", token, body); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
			}
			return
		}
		log.Println("GITLAB")
		client = gitlab.NewDefault()
		isGit = true
	}
	if r.Header.Get("X-GitHub-Event") != "" {
		log.Println("GITHUB")
		client = github.NewDefault()
		isGit = true
	}
	if isGit {
		webhook, err = client.Webhooks.Parse(r, secret)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if webhook != nil {
			switch event := webhook.(type) {
			case *scm.PushHook:
				events.HandlePush(event)
			case *scm.BranchHook:
				events.HandleBranch(event)
			case *scm.TagHook:
				// future?
			case *scm.PullRequestHook:
				events.HandlePull(event)
			}
		}
	}
}
func (s *Server) handleWebhookGet(w http.ResponseWriter, r *http.Request) {
	var p map[string]interface{}
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&p); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid resquest payload")
		return
	}
	defer r.Body.Close()
	fmt.Println(p)
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}
