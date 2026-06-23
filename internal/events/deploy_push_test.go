package events

import (
	"encoding/json"
	"fmt"
	"reflect"
	"testing"

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
		want       []byte
		wantErr    bool
	}{
		{
			name:    "test deploy 1",
			project: `{"id":19,"name":"demo-project7","gitUrl":"git@github.com:amazeeio/lagoon-nginx-example-2.git","branches":"true","pullrequests":"^(?!WIP:).+","productionEnvironment":"main","autoIdle":1,"storageCalc":1,"developmentEnvironmentsLimit":5,"privateKey":"-----BEGIN OPENSSH PRIVATE KEY-----\nSNIPKEY\n-----END OPENSSH PRIVATE KEY-----\n","productionBuildPriority":6,"developmentBuildPriority":5,"deploymentsDisabled":0,"sharedBaasBucket":true,"environments":[],"envVariables": [{"name": "SSMTP_MAILHUB","scope": "runtime","value": "mxout.lagoon.svc:25"}],"openshift":{"id":2001,"name":"ci-local-control-k8s","routerPattern":"${project}.${environment}.example.com"}}`,
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
			want: []byte(`{"metadata":{"name":"lagoon-build-abcdefg","namespace":"lagoon"},"spec":{"build":{"type":"branch","priority":5},"project":{"id":19,"name":"demo-project7","environment":"dev-push","environmentId":15,"uiLink":"https://ui.example.com/projects/demo-project7/demo-project7-dev-push/deployments/lagoon-build-abcdefg","gitUrl":"git@github.com:amazeeio/lagoon-nginx-example-2.git","routerPattern":"${project}.${environment}.example.com","environmentType":"development","productionEnvironment":"main","standbyEnvironment":"","deployTarget":"ci-local-control-k8s","projectSecret":"dbff8df91982b1243e2be8bc4609bac78b38a173cadf655e171c5fbcf5e957ae","key":"LS0tLS1CRUdJTiBPUEVOU1NIIFBSSVZBVEUgS0VZLS0tLS0KU05JUEtFWQotLS0tLUVORCBPUEVOU1NIIFBSSVZBVEUgS0VZLS0tLS0K","monitoring":{},"variables":{"environment":"W3sic2NvcGUiOiJpbnRlcm5hbF9zeXN0ZW0iLCJuYW1lIjoiTEFHT09OX1NZU1RFTV9DT1JFX1ZFUlNJT04iLCJ2YWx1ZSI6InVua25vd24ifSx7InNjb3BlIjoiaW50ZXJuYWxfc3lzdGVtIiwibmFtZSI6IkxBR09PTl9TWVNURU1fUk9VVEVSX1BBVFRFUk4iLCJ2YWx1ZSI6IiR7cHJvamVjdH0uJHtlbnZpcm9ubWVudH0uZXhhbXBsZS5jb20ifSx7InNjb3BlIjoiaW50ZXJuYWxfc3lzdGVtIiwibmFtZSI6IkxBR09PTl9TWVNURU1fUFJPSkVDVF9TSEFSRURfQlVDS0VUIiwidmFsdWUiOiJjaS1sb2NhbC1jb250cm9sLWs4cyJ9LHsic2NvcGUiOiJydW50aW1lIiwibmFtZSI6IlNTTVRQX01BSUxIVUIiLCJ2YWx1ZSI6Im14b3V0LmxhZ29vbi5zdmM6MjUifV0="},"environmentIdling":1,"projectIdling":1,"storageCalculator":1},"branch":{"name":"dev-push"},"pullrequest":{},"promote":{},"gitReference":"abcdefg123456"},"status":{}}`),
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
			var p schema.Project
			_ = json.Unmarshal([]byte(tt.project), &p)
			// set the project to the deploytarget value
			tt.deployData.Project = p
			got, gotErr := e.deployPush(p, tt.deployData)
			if gotErr != nil {
				if !tt.wantErr {
					t.Errorf("deployPush() failed: %v", gotErr)
				}
				return
			}
			if tt.wantErr {
				t.Fatal("deployPush() succeeded unexpectedly")
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("deployPush() = %s, want %s", got, tt.want)
			}
		})
	}
}
