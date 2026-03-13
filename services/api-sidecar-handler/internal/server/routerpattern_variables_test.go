package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"reflect"
	"testing"

	"github.com/andreyvit/diff"
	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/lagoon/internal/lagoon/mockapi"
	"github.com/uselagoon/lagoon/internal/messaging"
	"github.com/uselagoon/machinery/api/schema"
)

func TestServer_getRouterPatternAndVariables(t *testing.T) {
	tests := []struct {
		name          string
		description   string
		projectName   string
		environmentId int
		wantCode      int
		wantResponse  string
		wantVars      string
	}{
		{
			name:          "branch.1",
			description:   "",
			projectName:   "demo-project1",
			environmentId: 5,
			wantCode:      200,
			wantResponse:  "routerpatternvars/branch.1.json",
			wantVars:      "routerpatternvars/branch.1.vars.json",
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
			form.Add("projectName", tt.projectName)
			form.Add("environmentId", fmt.Sprintf("%d", tt.environmentId))
			form.Encode()
			request, _ := http.NewRequest(http.MethodPost, "/environment/routerpatternvariables", bytes.NewBufferString(form.Encode()))
			request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			response := httptest.NewRecorder()
			s.getRouterPatternAndVariables(response, request)
			if response.Code != tt.wantCode {
				t.Errorf("response code is wrong, got %d want %d", response.Code, tt.wantCode)
			}
			wantResult, _ := os.ReadFile(fmt.Sprintf("testdata/%s", tt.wantResponse))
			var respJSON bytes.Buffer
			_ = json.Indent(&respJSON, response.Body.Bytes(), "", "  ")
			rpatternVars := &RouterPatternAndVariablesResponse{}
			_ = json.Unmarshal(respJSON.Bytes(), rpatternVars)
			log.Println("[RESPONSE] routerPattern", rpatternVars.RouterPattern)
			assertResponseBody(t, respJSON.String(), string(wantResult))
			if tt.wantVars != "" {
				wantVars, _ := os.ReadFile(fmt.Sprintf("testdata/%s", tt.wantVars))
				wantedVars := []schema.EnvKeyValue{}
				json.Unmarshal(wantVars, &wantedVars)
				gotVars := []schema.EnvKeyValue{}
				json.Unmarshal(rpatternVars.EnvVars, &gotVars)
				if !reflect.DeepEqual(wantedVars, gotVars) {
					a2p, _ := json.MarshalIndent(wantedVars, "", "  ")
					gotp, _ := json.MarshalIndent(gotVars, "", "  ")
					t.Errorf("variables in build don't match expected = \n%v", diff.LineDiff(string(a2p), string(gotp)))
				}
			}
		})
	}
}
