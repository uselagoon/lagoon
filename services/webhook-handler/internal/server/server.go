package server

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"slices"

	"github.com/drone/go-scm/scm"
	"github.com/drone/go-scm/scm/driver/azure"
	"github.com/drone/go-scm/scm/driver/bitbucket"
	"github.com/drone/go-scm/scm/driver/gitea"
	"github.com/drone/go-scm/scm/driver/github"
	"github.com/drone/go-scm/scm/driver/gitlab"
	"github.com/drone/go-scm/scm/driver/gogs"
	"github.com/drone/go-scm/scm/driver/stash"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/uselagoon/lagoon/services/webhook-handler/internal/events"
	syshook "github.com/uselagoon/lagoon/services/webhook-handler/internal/gitlab"
	"github.com/uselagoon/lagoon/services/webhook-handler/internal/lagoon"
	"github.com/uselagoon/lagoon/services/webhook-handler/internal/messaging"
)

type Server struct {
	Router    *mux.Router
	Messaging *messaging.Messenger
	GitlabAPI syshook.GitlabAPI
	LagoonAPI lagoon.LagoonAPI
}

func (s *Server) Initialize() {
	s.Router = mux.NewRouter()
	s.initializeRoutes()
}

func (s *Server) Run(addr string) {
	log.Fatal(http.ListenAndServe(addr, s.Router))
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
	var isGit bool
	var gitType, reqUUID, event string
	if r.Header.Get("X-GitHub-Event") != "" {
		client = github.NewDefault()
		isGit = true
		gitType = "github"
		event = r.Header.Get("X-GitHub-Event")
		reqUUID = r.Header.Get("X-GitHub-Delivery")
	}
	if r.Header.Get("X-Gogs-Event") != "" {
		// pass an empty url we only need the webhook parse capability
		client, _ = gogs.New("")
		isGit = true
		gitType = "gogs"
		event = r.Header.Get("X-Gogs-Event")
		reqUUID = r.Header.Get("X-Gogs-Delivery")
	}
	if r.Header.Get("X-Gitea-Event") != "" {
		// pass an empty url we only need the webhook parse capability
		client, _ = gitea.New("")
		isGit = true
		gitType = "gitea"
		event = r.Header.Get("X-Gitea-Event")
		reqUUID = r.Header.Get("X-Gitea-Delivery")
	}
	// azure might not be usable https://github.com/uselagoon/lagoon/issues/3470#issuecomment-1607066097
	if r.Header.Get("X-Lagoon-Azure-Devops") != "" {
		// pass an empty url we only need the webhook parse capability
		client, _ = azure.New("", "none", "")
		isGit = true
		gitType = "azure"
		event = r.Header.Get("X-Lagoon-Azure-Devops")
		reqUUID = uuid.New().String()
	}
	// check if stash or bitbucket
	if r.Header.Get("X-Event-Key") != "" {
		if slices.Contains(
			// stash event types
			[]string{"repo:refs_changed", "pr:opened", "pr:from_ref_updated", "pr:modified", "pr:declined", "pr:deleted", "pr:merged"},
			r.Header.Get("X-Event-Key"),
		) {
			client = stash.NewDefault()
			isGit = true
			gitType = "stash"
		} else {
			client = bitbucket.NewDefault()
			isGit = true
			gitType = "bitbucket"
		}
		event = r.Header.Get("X-Event-Key")
		reqUUID = r.Header.Get("X-Request-UUID")
	}
	if r.Header.Get("X-Gitlab-Event") != "" {
		if r.Header.Get("X-Gitlab-Event") == "System Hook" {
			// drone scm doesn't process gitlab system hooks that we need
			// handle them ourselves here
			defer r.Body.Close()
			body, err := io.ReadAll(r.Body)
			if err != nil {
				respondWithError(w, http.StatusBadRequest, "invalid request body")
				return
			}
			// Ensure the system hook came from gitlab
			if r.Header.Get("X-Gitlab-Token") == "" || r.Header.Get("X-Gitlab-Token") != s.GitlabAPI.GitlabSystemHookToken {
				respondWithError(w, http.StatusBadRequest, "gitlab system hook secret verification failed")
				return
			}
			sh, err := syshook.New(s.GitlabAPI.GitlabAPIHost, s.GitlabAPI.GitlabAPIToken, s.LagoonAPI, s.Messaging)
			if err != nil {
				respondWithError(w, http.StatusBadRequest, err.Error())
				return
			}
			if err = sh.HandleSystemHook(body); err != nil {
				respondWithError(w, http.StatusBadRequest, err.Error())
				return
			}
			return
		}
		client = gitlab.NewDefault()
		isGit = true
		gitType = "gitlab"
		event = r.Header.Get("X-Gitlab-Event")
		reqUUID = r.Header.Get("X-Gitlab-Event-UUID")
	}
	if isGit {
		webhook, err = client.Webhooks.Parse(r, secret)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, err.Error())
			return
		}
		e := events.New(s.LagoonAPI, s.Messaging)
		if webhook != nil {
			var response []byte
			var err error
			switch scmWebhook := webhook.(type) {
			case *scm.PushHook:
				if gitType == "bitbucket" {
					// ugh drone replaces the clone urls https://github.com/drone/go-scm/blob/v1.40.6/scm/driver/bitbucket/webhook.go#L752-L753
					// they leave it placed in scmWebhook.Repo.Link so we will just use that
					scmWebhook.Repo.Clone = scmWebhook.Repo.Link
					scmWebhook.Repo.CloneSSH = events.BitBucketGitURL(scmWebhook.Repo.Link, fmt.Sprintf("%s/%s", scmWebhook.Repo.Namespace, scmWebhook.Repo.Name))
				}
				response, err = e.HandlePush(gitType, event, reqUUID, scmWebhook)
			case *scm.BranchHook:
				if gitType == "bitbucket" {
					scmWebhook.Repo.Clone = scmWebhook.Repo.Link
					scmWebhook.Repo.CloneSSH = events.BitBucketGitURL(scmWebhook.Repo.Link, fmt.Sprintf("%s/%s", scmWebhook.Repo.Namespace, scmWebhook.Repo.Name))
				}
				response, err = e.HandleBranch(gitType, event, reqUUID, scmWebhook)
			case *scm.PullRequestHook:
				if gitType == "bitbucket" {
					scmWebhook.Repo.Clone = scmWebhook.Repo.Link
					scmWebhook.Repo.CloneSSH = events.BitBucketGitURL(scmWebhook.Repo.Link, fmt.Sprintf("%s/%s", scmWebhook.Repo.Namespace, scmWebhook.Repo.Name))
				}
				response, err = e.HandlePull(gitType, event, reqUUID, scmWebhook)
			case *scm.TagHook:
				// future?
				respondWithError(w, http.StatusBadRequest, "tags events are currently unsupported")
				return
			}
			if err != nil {
				respondWithError(w, http.StatusBadRequest, err.Error())
				return
			}
			respondWithJSON(w, 200, map[string]string{"response": string(response)})
			return
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
