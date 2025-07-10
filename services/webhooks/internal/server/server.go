package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"slices"

	"github.com/drone/go-scm/scm"
	"github.com/drone/go-scm/scm/driver/azure"
	"github.com/drone/go-scm/scm/driver/bitbucket"
	"github.com/drone/go-scm/scm/driver/gitea"
	"github.com/drone/go-scm/scm/driver/github"
	"github.com/drone/go-scm/scm/driver/gitlab"
	"github.com/gorilla/mux"
)

type Server struct {
	Router *mux.Router
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
	if r.Header.Get("X-Lagoon-Azure-Devops") != "" {
		log.Println("AZURE")
		// pass an empty url we only need the webhook parse capability
		client, _ = azure.New("", "none", "")
		isGit = true
	}
	if r.Header.Get("X-Event-Key") != "" {
		log.Println("BITBUCKET")
		// bitbucket
		client = bitbucket.NewDefault()
		isGit = true
	}
	if r.Header.Get("X-Gitlab-Event") != "" {
		log.Println("GITLAB")
		client = gitlab.NewDefault()
		if slices.Contains(secureGitlabSystemHooks, r.Header.Get("X-Gitlab-Event")) {
			log.Println("GITLAB SECURE")
		}
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
			// log.Println("ERR:", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if webhook != nil {
			// b, _ := json.Marshal(webhook)
			// fmt.Println(string(b))
			switch event := webhook.(type) {
			case *scm.PushHook:
				log.Println(
					"A2",
					event.Repo.Clone,
					event.Repo.CloneSSH,
					event.Ref,
					event.Commit.Sha,
					event.Commit.Message,
					event.Repo.Namespace,
					event.Repo.Name,
					event.Sender.Login,
				)
			case *scm.BranchHook:
				log.Println(
					"B2",
					event.Repo.Clone,
					event.Repo.CloneSSH,
					event.Ref,
					event.Repo.Namespace,
					event.Repo.Name,
					event.Sender.Login,
				)
			case *scm.TagHook:
			case *scm.IssueHook:
			case *scm.IssueCommentHook:
			case *scm.PullRequestHook:
				log.Println(
					"C2",
					event.Repo.Clone,
					event.Repo.CloneSSH,
					event.PullRequest.Number,
					event.Repo.Namespace,
					event.Repo.Name,
					event.Sender.Login,
				)
			case *scm.PullRequestCommentHook:
			case *scm.ReviewCommentHook:
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

var secureGitlabSystemHooks = []string{
	"group_create",
	"group_rename",
	"group_destroy",
	"project_create",
	"project_transfer",
	"project_rename",
	"project_update",
	"project_destroy",
	"user_create",
	"user_rename",
	"user_destroy",
	"user_add_to_group",
	"user_remove_from_group",
	"user_add_to_team",
	"user_remove_from_team",
	"key_create",
	"key_destroy",
}
