package server

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/uselagoon/lagoon/internal/lagoon"
	mockapi "github.com/uselagoon/lagoon/internal/lagoon/fakeapi"
	"github.com/uselagoon/lagoon/internal/messaging"
)

var eventUUID string = "a667f4d0-fa5c-48fa-9ef5-1ff81cfe5cbb"

func TestWebhookEvents(t *testing.T) {
	tests := []struct {
		name        string
		description string
		gitType     string
		event       string
		webhook     string
		wantCode    int
	}{
		{
			name:        "github-push-create-environment",
			description: "should create an environment",
			gitType:     "github",
			event:       "push",
			webhook:     "github/push",
			wantCode:    200,
		},
		{
			name:     "github-push-existing-environment",
			gitType:  "github",
			event:    "push",
			webhook:  "github/push-existing",
			wantCode: 200,
		},
		{
			name:     "github-push-skip-deployment",
			gitType:  "github",
			event:    "push",
			webhook:  "github/push-skipped",
			wantCode: 400,
		},
		{
			name:     "github-push-delete",
			gitType:  "github",
			event:    "push",
			webhook:  "github/push-delete",
			wantCode: 200,
		},
		{
			name:     "github-push-delete-production",
			gitType:  "github",
			event:    "push",
			webhook:  "github/push-delete-prod",
			wantCode: 400,
		},
		{
			name:     "github-pull-open",
			gitType:  "github",
			event:    "pull_request",
			webhook:  "github/pr-open",
			wantCode: 200,
		},
		{
			name:     "github-pull-open-draft",
			gitType:  "github",
			event:    "pull_request",
			webhook:  "github/pr-open-draft",
			wantCode: 200,
		},
		{
			name:     "github-pull-open-skip-title",
			gitType:  "github",
			event:    "pull_request",
			webhook:  "github/pr-open-skip",
			wantCode: 400,
		},
		{
			name:     "github-pull-ready-review",
			gitType:  "github",
			event:    "pull_request",
			webhook:  "github/pr-ready",
			wantCode: 200,
		},
		{
			name:     "github-pull-closed",
			gitType:  "github",
			event:    "pull_request",
			webhook:  "github/pr-closed",
			wantCode: 200,
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
		Messaging: msg,
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
			a, _ := os.ReadFile(fmt.Sprintf("testdata/%s.result.json", tt.webhook))
			assertResponseBody(t, response.Body.String(), string(a))
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
	}
	return req
}

func assertResponseBody(t testing.TB, got, want string) {
	t.Helper()
	if got != want {
		t.Errorf("response body is wrong, got %q want %q", got, want)
	}
}
