package server

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"testing"

	"github.com/andreyvit/diff"
	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/lagoon/internal/lagoon/mockapi"
	"github.com/uselagoon/lagoon/internal/messaging"
	lagooncrd "github.com/uselagoon/remote-controller/api/lagoon/v1beta2"
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
			name:          "branch.1",
			description:   "",
			deployType:    "BRANCH",
			buildName:     "lagoon-build-2ik1a",
			branchName:    "dev",
			sourceUser:    "API",
			projectName:   "demo-project1",
			buildPriority: 5,
			wantCode:      200,
			wantResponse:  "branch.1.json",
		},
		{
			name:           "branch.2",
			description:    "",
			deployType:     "BRANCH",
			buildName:      "lagoon-build-2ik1a",
			branchName:     "dev",
			sourceUser:     "API",
			projectName:    "demo-project1",
			buildPriority:  5,
			buildVariables: `[{"name":"BUILDVAR","value":"myvariable"}]`,
			wantCode:       200,
			wantResponse:   "branch.2.json",
		},
		{
			name:          "branch.3",
			description:   "",
			deployType:    "BRANCH",
			buildName:     "lagoon-build-2ik1a",
			branchName:    "dev",
			sourceUser:    "API",
			projectName:   "demo-project1",
			buildPriority: 5,
			gitSha:        "abc123def456",
			wantCode:      200,
			wantResponse:  "branch.3.json",
		},
		{
			name:          "branch.4",
			description:   "",
			deployType:    "BRANCH",
			buildName:     "lagoon-build-a1ki2",
			branchName:    "deploy/production",
			sourceUser:    "API",
			projectName:   "demo-project2",
			buildPriority: 5,
			wantCode:      200,
			wantResponse:  "branch.4.json",
		},
		{
			name:                     "promote.1",
			description:              "",
			deployType:               "PROMOTE",
			buildName:                "lagoon-build-2ik1a",
			branchName:               "promotedev",
			promoteSourceEnvironment: "dev",
			sourceUser:               "API",
			projectName:              "demo-project1",
			buildPriority:            5,
			wantCode:                 200,
			wantResponse:             "promote.1.json",
		},
		{
			name:          "pullrequest.1",
			description:   "",
			deployType:    "PULLREQUEST",
			buildName:     "lagoon-build-2ik1a",
			branchName:    "pr-2",
			sourceUser:    "API",
			projectName:   "demo-project1",
			buildPriority: 5,
			pullrequest:   `{"number":2,"title":"pullrequest title","headBranch":"headBranchName","headSha":"headBranchRef","baseBranch":"baseBranchName","baseSha":"baseBranchRef"}`,
			wantCode:      200,
			wantResponse:  "pullrequest.1.json",
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

func assertResponseBody(t testing.TB, got, want string) {
	t.Helper()
	if got != want {
		t.Errorf("response body is wrong = \n%v", diff.LineDiff(string(want), string(got)))
	}
}
