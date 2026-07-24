package events

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/andreyvit/diff"
	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/lagoon/internal/lagoon/mockapi"
	"github.com/uselagoon/lagoon/internal/messaging"
	"github.com/uselagoon/machinery/api/schema"
)

func TestEvents_deployPush(t *testing.T) {
	tests := []struct {
		name string // description of this test case
		// Named input parameters for target function.
		project    string
		deployData lagoon.DeployData
		want       string
		wantErr    bool
	}{
		{
			name:    "test deploy 1",
			project: "demo-project1",
			deployData: lagoon.DeployData{
				BuildName:             "lagoon-build-abcdefg",
				UnsafeEnvironmentName: "dev-push",
				SourceUser:            "user@example.com",
				SourceType:            lagoon.SourceAPI,
				DeployType:            schema.Branch,
				GitSHA:                "abcdefg123456",
				BuildType:             lagoon.BuildDeployment,
				// Project:                  *project, // gets set in the tests by populating with the data from `project`
				// optionals
				// PromoteSourceEnvironment: promoteSourceEnvironment,
				// BulkID:                   bulkID,
				// BulkName:                 bulkName,
				// BulkType:                 lagoon.BulkDeploy,
				// BuildVariables:           buildVars,
			},
			want: "testdata/push/test.1.result.json",
		},
		{
			name:    "test deploy active-standby",
			project: "demo-project3",
			deployData: lagoon.DeployData{
				BuildName:             "lagoon-build-abcdefg",
				UnsafeEnvironmentName: "main-left",
				SourceUser:            "user@example.com",
				SourceType:            lagoon.SourceAPI,
				DeployType:            schema.Branch,
				GitSHA:                "abcdefg123456",
				BuildType:             lagoon.BuildDeployment,
				// Project:                  *project, // gets set in the tests by populating with the data from `project`
				// optionals
				// PromoteSourceEnvironment: promoteSourceEnvironment,
				// BulkID:                   bulkID,
				// BulkName:                 bulkName,
				// BulkType:                 lagoon.BulkDeploy,
				// BuildVariables:           buildVars,
			},
			want: "testdata/push/test.2.result.json",
		},
		{
			name:    "test deploy active-standby2",
			project: "demo-project4",
			deployData: lagoon.DeployData{
				BuildName:             "lagoon-build-abcdefg",
				UnsafeEnvironmentName: "main/left",
				SourceUser:            "user@example.com",
				SourceType:            lagoon.SourceAPI,
				DeployType:            schema.Branch,
				GitSHA:                "abcdefg123456",
				BuildType:             lagoon.BuildDeployment,
				// Project:                  *project, // gets set in the tests by populating with the data from `project`
				// optionals
				// PromoteSourceEnvironment: promoteSourceEnvironment,
				// BulkID:                   bulkID,
				// BulkName:                 bulkName,
				// BulkType:                 lagoon.BulkDeploy,
				// BuildVariables:           buildVars,
			},
			want: "testdata/push/test.3.result.json",
		},
	}
	for _, tt := range tests {
		testSrv := mockapi.TestGraphQLServer()
		msg := &messaging.MessengerMock{}
		lapi := lagoon.LagoonAPI{
			Endpoint:        fmt.Sprintf("%s/graphql", testSrv.URL),
			TokenSigningKey: "jwt",
			JWTAudience:     "dev",
			JWTSubject:      "dev",
			JWTIssuer:       "dev",
			Version:         "1.2.3",
		}
		t.Run(tt.name, func(t *testing.T) {
			e := New(lapi, msg)
			project, _ := lapi.ProjectByName(tt.project)
			// set the project to the deploytarget value
			tt.deployData.Project = *project
			got, gotErr := e.deployPush(*project, tt.deployData)
			if gotErr != nil {
				if !tt.wantErr {
					t.Errorf("deployPush() failed: %v", gotErr)
				}
				return
			}
			if tt.wantErr {
				t.Fatal("deployPush() succeeded unexpectedly")
			}
			want, _ := os.ReadFile(tt.want)
			var gotJSON bytes.Buffer
			_ = json.Indent(&gotJSON, got, "", "  ")
			if gotJSON.String() != string(want) {
				t.Errorf("deployPush() = %v", diff.LineDiff(string(want), gotJSON.String()))
			}
		})
	}
}
