package events

import (
	"fmt"
	"testing"

	"github.com/drone/go-scm/scm"
	"github.com/uselagoon/lagoon/services/webhook-handler/internal/lagoon"
	mockapi "github.com/uselagoon/lagoon/services/webhook-handler/internal/lagoon/fakeapi"
	"github.com/uselagoon/lagoon/services/webhook-handler/internal/messaging"
)

func TestEvents_HandlePush(t *testing.T) {
	type fields struct {
		LagoonAPI lagoon.LagoonAPI
		Messaging *messaging.Messenger
	}
	type args struct {
		gitType    string
		event      string
		uuid       string
		scmWebhook *scm.PushHook
	}
	tests := []struct {
		name   string
		fields fields
		args   args
	}{
		{
			name: "test-push-existing-environment",
			args: args{
				gitType: "github",
				event:   "push",
				uuid:    "a667f4d0-fa5c-48fa-9ef5-1ff81cfe5cbb",
				scmWebhook: &scm.PushHook{
					Ref:     "refs/heads/main",
					BaseRef: "",
					Repo: scm.Repository{
						ID:         "57102603",
						Namespace:  "",
						Name:       "amazeeio",
						Perm:       nil,
						Branch:     "main",
						Archived:   false,
						Private:    true,
						Visibility: 0,
						Clone:      "https://github.com/fake/repository.git",
						CloneSSH:   "ssh://git@github.com:fake/repository.git",
						Link:       "https://github.com/fake/repository.git",
					},
				},
			},
		}, {
			name: "test-push-new-environment-match-regex",
			args: args{
				gitType: "github",
				event:   "push",
				uuid:    "a667f4d0-fa5c-48fa-9ef5-1ff81cfe5cbb",
				scmWebhook: &scm.PushHook{
					Ref:     "refs/heads/main",
					BaseRef: "",
					Repo: scm.Repository{
						ID:         "57102603",
						Namespace:  "",
						Name:       "amazeeio",
						Perm:       nil,
						Branch:     "main",
						Archived:   false,
						Private:    true,
						Visibility: 0,
						Clone:      "https://github.com/fake/repository2.git",
						CloneSSH:   "ssh://git@github.com:fake/repository2.git",
						Link:       "https://github.com/fake/repository2.git",
					},
					Sender: scm.User{
						Login: "usera",
					},
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			testSrv := mockapi.TestGraphQLServer()
			e := &Events{
				LagoonAPI: lagoon.LagoonAPI{
					Endpoint:        fmt.Sprintf("%s/graphql", testSrv.URL),
					TokenSigningKey: "jwt",
					JWTAudience:     "dev",
					JWTSubject:      "dev",
					JWTIssuer:       "dev",
					Version:         "1.2.3",
				},
				Messaging: &messaging.MessengerMock{},
			}
			_, err := e.HandlePush(tt.args.gitType, tt.args.event, tt.args.uuid, tt.args.scmWebhook)
			if err != nil {
				t.Errorf("HandlePush() = %v", err)
			}
		})
	}
}

func mockBuildSeed() int64 {
	return 1234567890
}
