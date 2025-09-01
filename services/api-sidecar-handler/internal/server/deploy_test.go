package server

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/lagoon/internal/lagoon/mockapi"
	"github.com/uselagoon/lagoon/internal/messaging"
)

func TestServer_deployEnvironment(t *testing.T) {
	tests := []struct {
		name                     string
		description              string
		deployType               string
		buildName                string
		branchName               string
		sourceUser               string
		projectName              string
		promoteSourceEnvironment string
		gitSha                   string
		bulkId                   string
		bulkName                 string
		buildPriority            int
		buildVariables           string
		pullrequest              string
		wantCode                 int
		wantResponse             string
	}{
		{
			name:           "test1",
			description:    "",
			deployType:     "BRANCH",
			buildName:      "lagoon-build-2ik1a",
			branchName:     "dev",
			sourceUser:     "API",
			projectName:    "demo-project1",
			buildVariables: "[]",
			buildPriority:  5,
			pullrequest:    "{}",
			wantCode:       200,
			wantResponse:   "lagoon-build-2ik1a",
		},
		{
			name:                     "test2",
			description:              "",
			deployType:               "PROMOTE",
			buildName:                "lagoon-build-2ik1a",
			branchName:               "promotedev",
			promoteSourceEnvironment: "dev",
			sourceUser:               "API",
			projectName:              "demo-project1",
			buildVariables:           "[]",
			buildPriority:            5,
			pullrequest:              "{}",
			wantCode:                 200,
			wantResponse:             "lagoon-build-2ik1a",
		},
		{
			name:           "test3",
			description:    "",
			deployType:     "PULLREQUEST",
			buildName:      "lagoon-build-2ik1a",
			branchName:     "pr-2",
			sourceUser:     "API",
			projectName:    "demo-project1",
			buildVariables: "[]",
			buildPriority:  5,
			pullrequest:    `{"number": 2, "title":"pullrequest title"}`,
			wantCode:       200,
			wantResponse:   "lagoon-build-2ik1a",
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
			form := url.Values{}
			form.Add("type", tt.deployType)
			form.Add("branchName", tt.branchName)
			form.Add("buildName", tt.buildName)
			form.Add("sourceUser", tt.sourceUser)
			form.Add("projectName", tt.projectName)
			form.Add("promoteSourceEnvironment", tt.promoteSourceEnvironment)
			form.Add("gitSha", tt.gitSha)
			form.Add("bulkId", tt.bulkId)
			form.Add("bulkName", tt.bulkName)
			form.Add("buildPriority", fmt.Sprintf("%d", tt.buildPriority))
			form.Add("buildVariables", base64.StdEncoding.EncodeToString([]byte(tt.buildVariables)))
			form.Add("pullrequest", base64.StdEncoding.EncodeToString([]byte(tt.pullrequest)))
			form.Encode()
			request, _ := http.NewRequest(http.MethodPost, "/environment/deploy", bytes.NewBufferString(form.Encode()))
			request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			response := httptest.NewRecorder()
			s.deployEnvironment(response, request)
			if response.Code != tt.wantCode {
				t.Errorf("response code is wrong, got %d want %d", response.Code, tt.wantCode)
			}
			log.Println("[RESPONSE]", response.Body.String())
			assertResponseBody(t, response.Body.String(), tt.wantResponse)
		})
	}
}

func assertResponseBody(t testing.TB, got, want string) {
	t.Helper()
	if got != want {
		t.Errorf("response body is wrong, got %q want %q", got, want)
	}
}
