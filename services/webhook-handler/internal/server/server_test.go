package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/andreyvit/diff"
	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/lagoon/internal/lagoon/mockapi"
	"github.com/uselagoon/lagoon/internal/messaging"
	lagooncrd "github.com/uselagoon/remote-controller/api/lagoon/v1beta2"
)

var eventUUID string = "a667f4d0-fa5c-48fa-9ef5-1ff81cfe5cbb"

func TestWebhookEvents(t *testing.T) {
	tests := []struct {
		name         string
		description  string
		gitType      string
		event        string
		webhook      string
		wantCode     int
		wantResponse string
	}{
		{
			name:         "github-push-create-environment",
			description:  "should create an environment",
			gitType:      "github",
			event:        "push",
			webhook:      "github/push",
			wantCode:     200,
			wantResponse: "github/push.result.json",
		},
		{
			name:         "github-push-existing-environment",
			gitType:      "github",
			event:        "push",
			webhook:      "github/push-existing",
			wantCode:     200,
			wantResponse: "github/push-existing.result.json",
		},
		{
			name:         "github-push-skip-deployment",
			gitType:      "github",
			event:        "push",
			webhook:      "github/push-skipped",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "github-push-delete",
			gitType:      "github",
			event:        "push",
			webhook:      "github/push-delete",
			wantCode:     200,
			wantResponse: "github/push-delete.result.json",
		},
		{
			name:         "github-push-delete-production",
			gitType:      "github",
			event:        "push",
			webhook:      "github/push-delete-prod",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "github-pull-open",
			gitType:      "github",
			event:        "pull_request",
			webhook:      "github/pr-open",
			wantCode:     200,
			wantResponse: "github/pr-open.result.json",
		},
		{
			name:         "github-pull-open-draft",
			gitType:      "github",
			event:        "pull_request",
			webhook:      "github/pr-open-draft",
			wantCode:     200,
			wantResponse: "github/pr-open-draft.result.json",
		},
		{
			name:         "github-pull-open-skip-title",
			gitType:      "github",
			event:        "pull_request",
			webhook:      "github/pr-open-skip",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "github-pull-ready-review",
			gitType:      "github",
			event:        "pull_request",
			webhook:      "github/pr-ready",
			wantCode:     200,
			wantResponse: "github/pr-ready.result.json",
		},
		{
			name:         "github-pull-closed",
			gitType:      "github",
			event:        "pull_request",
			webhook:      "github/pr-closed",
			wantCode:     200,
			wantResponse: "github/pr-closed.result.json",
		},
		{
			name:         "github-pull-merged",
			gitType:      "github",
			event:        "pull_request",
			webhook:      "github/pr-merged",
			wantCode:     200,
			wantResponse: "github/pr-merged.result.json",
		},
		{
			name:         "gitlab-push-create-environment",
			description:  "should create an environment",
			gitType:      "gitlab",
			event:        "Push Hook",
			webhook:      "gitlab/push",
			wantCode:     200,
			wantResponse: "gitlab/push.result.json",
		},
		{
			name:         "gitlab-push-existing-environment",
			gitType:      "gitlab",
			event:        "Push Hook",
			webhook:      "gitlab/push-existing",
			wantCode:     200,
			wantResponse: "gitlab/push-existing.result.json",
		},
		{
			name:         "gitlab-push-skip-deployment",
			gitType:      "gitlab",
			event:        "Push Hook",
			webhook:      "gitlab/push-skipped",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "gitlab-push-delete",
			gitType:      "gitlab",
			event:        "Push Hook",
			webhook:      "gitlab/push-delete",
			wantCode:     200,
			wantResponse: "gitlab/push-delete.result.json",
		},
		{
			name:         "gitlab-push-delete-production",
			gitType:      "gitlab",
			event:        "Push Hook",
			webhook:      "gitlab/push-delete-prod",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "gitlab-pull-open",
			gitType:      "gitlab",
			event:        "Merge Request Hook",
			webhook:      "gitlab/pr-open",
			wantCode:     200,
			wantResponse: "gitlab/pr-open.result.json",
		},
		{
			name:         "gitlab-pull-open-draft",
			gitType:      "gitlab",
			event:        "Merge Request Hook",
			webhook:      "gitlab/pr-open-draft",
			wantCode:     200,
			wantResponse: "gitlab/pr-open-draft.result.json",
		},
		{
			name:         "gitlab-pull-open-skip-title",
			gitType:      "gitlab",
			event:        "Merge Request Hook",
			webhook:      "gitlab/pr-open-skip",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "gitlab-pull-ready-review",
			gitType:      "gitlab",
			event:        "Merge Request Hook",
			webhook:      "gitlab/pr-ready",
			wantCode:     200,
			wantResponse: "gitlab/pr-ready.result.json",
		},
		{
			name:         "gitlab-pull-closed",
			gitType:      "gitlab",
			event:        "Merge Request Hook",
			webhook:      "gitlab/pr-closed",
			wantCode:     200,
			wantResponse: "gitlab/pr-closed.result.json",
		},
		{
			name:         "gitlab-pull-merged",
			gitType:      "gitlab",
			event:        "Merge Request Hook",
			webhook:      "gitlab/pr-merged",
			wantCode:     200,
			wantResponse: "gitlab/pr-merged.result.json",
		},
		{
			name:         "gitea-push-create-environment",
			description:  "should create an environment",
			gitType:      "gitea",
			event:        "push",
			webhook:      "gitea/push",
			wantCode:     200,
			wantResponse: "gitea/push.result.json",
		},
		{
			name:         "gitea-push-existing-environment",
			gitType:      "gitea",
			event:        "push",
			webhook:      "gitea/push-existing",
			wantCode:     200,
			wantResponse: "gitea/push-existing.result.json",
		},
		{
			name:         "gitea-push-skip-deployment",
			gitType:      "gitea",
			event:        "push",
			webhook:      "gitea/push-skipped",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "gitea-branch-delete",
			gitType:      "gitea",
			event:        "delete",
			webhook:      "gitea/branch-delete",
			wantCode:     200,
			wantResponse: "gitea/branch-delete.result.json",
		},
		{
			name:         "gitea-branch-delete-production",
			gitType:      "gitea",
			event:        "delete",
			webhook:      "gitea/branch-delete-prod",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "gitea-pull-open",
			gitType:      "gitea",
			event:        "pull_request",
			webhook:      "gitea/pr-open",
			wantCode:     200,
			wantResponse: "gitea/pr-open.result.json",
		},
		{
			name:         "gitea-pull-open-skip-title",
			gitType:      "gitea",
			event:        "pull_request",
			webhook:      "gitea/pr-open-skip",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "gitea-pull-closed",
			gitType:      "gitea",
			event:        "pull_request",
			webhook:      "gitea/pr-closed",
			wantCode:     200,
			wantResponse: "gitea/pr-closed.result.json",
		},
		{
			name:         "gitea-pull-merged",
			gitType:      "gitea",
			event:        "pull_request",
			webhook:      "gitea/pr-merged",
			wantCode:     200,
			wantResponse: "gitea/pr-merged.result.json",
		},
		{
			name:         "stash-push-create-environment",
			description:  "should create an environment",
			gitType:      "stash",
			event:        "repo:refs_changed",
			webhook:      "stash/push",
			wantCode:     200,
			wantResponse: "stash/push.result.json",
		},
		{
			name:         "stash-push-existing-environment",
			gitType:      "stash",
			event:        "repo:refs_changed",
			webhook:      "stash/push-existing",
			wantCode:     200,
			wantResponse: "stash/push-existing.result.json",
		},
		{
			name:         "stash-push-skip-deployment",
			gitType:      "stash",
			event:        "repo:refs_changed",
			webhook:      "stash/push-skipped",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "stash-push-delete",
			gitType:      "stash",
			event:        "repo:refs_changed",
			webhook:      "stash/push-delete",
			wantCode:     200,
			wantResponse: "stash/push-delete.result.json",
		},
		{
			name:         "stash-push-delete-production",
			gitType:      "stash",
			event:        "repo:refs_changed",
			webhook:      "stash/push-delete-prod",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "stash-pull-open",
			gitType:      "stash",
			event:        "pr:opened",
			webhook:      "stash/pr-open",
			wantCode:     200,
			wantResponse: "stash/pr-open.result.json",
		},
		{
			name:         "stash-pull-open-draft",
			gitType:      "stash",
			event:        "pr:opened",
			webhook:      "stash/pr-open-draft",
			wantCode:     200,
			wantResponse: "stash/pr-open-draft.result.json",
		},
		{
			name:         "stash-pull-open-skip-title",
			gitType:      "stash",
			event:        "pr:opened",
			webhook:      "stash/pr-open-skip",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "stash-pull-declined",
			gitType:      "stash",
			event:        "pr:declined",
			webhook:      "stash/pr-declined",
			wantCode:     200,
			wantResponse: "stash/pr-declined.result.json",
		},
		{
			name:         "stash-pull-merged",
			gitType:      "stash",
			event:        "pr:merged",
			webhook:      "stash/pr-merged",
			wantCode:     200,
			wantResponse: "stash/pr-merged.result.json",
		},
		{
			name:         "gogs-push-create-environment",
			description:  "should create an environment",
			gitType:      "gogs",
			event:        "push",
			webhook:      "gogs/push",
			wantCode:     200,
			wantResponse: "gogs/push.result.json",
		},
		{
			name:         "gogs-push-existing-environment",
			gitType:      "gogs",
			event:        "push",
			webhook:      "gogs/push-existing",
			wantCode:     200,
			wantResponse: "gogs/push-existing.result.json",
		},
		{
			name:         "gogs-push-skip-deployment",
			gitType:      "gogs",
			event:        "push",
			webhook:      "gogs/push-skipped",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "gogs-branch-delete",
			gitType:      "gogs",
			event:        "delete",
			webhook:      "gogs/branch-delete",
			wantCode:     200,
			wantResponse: "gogs/branch-delete.result.json",
		},
		{
			name:         "gogs-branch-delete-production",
			gitType:      "gogs",
			event:        "delete",
			webhook:      "gogs/branch-delete-prod",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "gogs-pull-open",
			gitType:      "gogs",
			event:        "pull_request",
			webhook:      "gogs/pr-open",
			wantCode:     200,
			wantResponse: "gogs/pr-open.result.json",
		},
		{
			name:         "gogs-pull-open-skip-title",
			gitType:      "gogs",
			event:        "pull_request",
			webhook:      "gogs/pr-open-skip",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "gogs-pull-closed",
			gitType:      "gogs",
			event:        "pull_request",
			webhook:      "gogs/pr-closed",
			wantCode:     200,
			wantResponse: "gogs/pr-closed.result.json",
		},
		{
			name:         "gogs-pull-merged",
			gitType:      "gogs",
			event:        "pull_request",
			webhook:      "gogs/pr-merged",
			wantCode:     200,
			wantResponse: "gogs/pr-merged.result.json",
		},
		{
			name:         "bitbucket-push-create-environment",
			description:  "should create an environment",
			gitType:      "bitbucket",
			event:        "repo:push",
			webhook:      "bitbucket/push",
			wantCode:     200,
			wantResponse: "bitbucket/push.result.json",
		},
		{
			name:         "bitbucket-push-existing-environment",
			gitType:      "bitbucket",
			event:        "repo:push",
			webhook:      "bitbucket/push-existing",
			wantCode:     200,
			wantResponse: "bitbucket/push-existing.result.json",
		},
		{
			name:         "bitbucket-push-skip-deployment",
			gitType:      "bitbucket",
			event:        "repo:push",
			webhook:      "bitbucket/push-skipped",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "bitbucket-push-delete",
			gitType:      "bitbucket",
			event:        "repo:push",
			webhook:      "bitbucket/push-delete",
			wantCode:     200,
			wantResponse: "bitbucket/push-delete.result.json",
		},
		{
			name:         "bitbucket-push-delete-production",
			gitType:      "bitbucket",
			event:        "repo:push",
			webhook:      "bitbucket/push-delete-prod",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "bitbucket-pull-open",
			gitType:      "bitbucket",
			event:        "pullrequest:created",
			webhook:      "bitbucket/pr-open",
			wantCode:     200,
			wantResponse: "bitbucket/pr-open.result.json",
		},
		{
			name:         "bitbucket-pull-open-draft",
			gitType:      "bitbucket",
			event:        "pullrequest:updated",
			webhook:      "bitbucket/pr-open-draft",
			wantCode:     200,
			wantResponse: "bitbucket/pr-open-draft.result.json",
		},
		{
			name:         "bitbucket-pull-ready-review",
			gitType:      "bitbucket",
			event:        "pullrequest:updated",
			webhook:      "bitbucket/pr-ready",
			wantCode:     200,
			wantResponse: "bitbucket/pr-ready.result.json",
		},
		{
			name:         "bitbucket-pull-open-skip-title",
			gitType:      "bitbucket",
			event:        "pullrequest:created",
			webhook:      "bitbucket/pr-open-skip",
			wantCode:     400,
			wantResponse: "invalid.json",
		},
		{
			name:         "bitbucket-pull-declined",
			gitType:      "bitbucket",
			event:        "pullrequest:rejected",
			webhook:      "bitbucket/pr-declined",
			wantCode:     200,
			wantResponse: "bitbucket/pr-declined.result.json",
		},
		{
			name:         "bitbucket-pull-merged",
			gitType:      "bitbucket",
			event:        "pullrequest:fulfilled",
			webhook:      "bitbucket/pr-merged",
			wantCode:     200,
			wantResponse: "bitbucket/pr-merged.result.json",
		},
	}
	testSrv := mockapi.TestGraphQLServer()
	msg := &messaging.MessengerMock{}
	s := &Server{
		LagoonAPI: lagoon.LagoonAPI{
			Endpoint:        fmt.Sprintf("%s/graphql", testSrv.URL),
			TokenSigningKey: "jwt",
			JWTAudience:     "dev",
			JWTSubject:      "dev",
			JWTIssuer:       "dev",
			Version:         "1.2.3",
		},
		Messaging:       msg,
		VerboseResponse: true,
	}
	s.Initialize()
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request := newWebhookRequest(tt.webhook, tt.gitType, tt.event)
			response := httptest.NewRecorder()
			s.handleWebhookPost(response, request)
			if response.Code != tt.wantCode {
				t.Errorf("response code is wrong, got %d want %d", response.Code, tt.wantCode)
			}
			a, _ := os.ReadFile(fmt.Sprintf("testdata/%s", tt.wantResponse))
			var respJSON bytes.Buffer
			_ = json.Indent(&respJSON, response.Body.Bytes(), "", "  ")
			buildData := &lagooncrd.LagoonBuild{}
			_ = json.Unmarshal(respJSON.Bytes(), buildData)
			log.Println("[RESPONSE]", buildData.Name, buildData.Spec.Project.Name, buildData.Spec.Project.Environment)
			assertResponseBody(t, respJSON.String(), string(a))
		})
	}
}

func newWebhookRequest(webhook, gitType, event string) *http.Request {
	a, _ := os.ReadFile(fmt.Sprintf("testdata/%s.json", webhook))
	req, _ := http.NewRequest(http.MethodPost, "/", bytes.NewReader(a))
	req.Header.Add("Content-type", "application/json")
	switch gitType {
	case "github":
		req.Header.Add("X-GitHub-Event", event)
		req.Header.Add("X-GitHub-Delivery", eventUUID)
	case "gitlab":
		req.Header.Add("X-Gitlab-Event", event)
		req.Header.Add("X-Gitlab-Event-UUID", eventUUID)
	case "bitbucket", "stash":
		req.Header.Add("X-Event-Key", event)
		req.Header.Add("X-Request-UUID", eventUUID)
	case "gitea":
		req.Header.Add("X-Gitea-Event", event)
		req.Header.Add("X-Gitea-Delivery", eventUUID)
	case "gogs":
		req.Header.Add("X-Gogs-Event", event)
		req.Header.Add("X-Gogs-Delivery", eventUUID)
	}
	return req
}

func assertResponseBody(t testing.TB, got, want string) {
	t.Helper()
	if got != want {
		t.Errorf("response body is wrong = \n%v", diff.LineDiff(string(want), string(got)))
	}
}
