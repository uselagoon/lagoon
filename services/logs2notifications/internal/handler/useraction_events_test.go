package handler

import (
	"strings"
	"testing"
)

func TestMessaging_handleUserActionToEmail(t *testing.T) {
	type fields struct {
	}
	type args struct {
		notification *Notification
		rawPayload   string
	}
	tests := []struct {
		name string
		//fields  fields
		args    args
		wantErr bool
	}{
		{
			name: "Test handleUserActionToEmail",
			args: args{
				notification: &Notification{
					Project: "test-project",
				},
				rawPayload: "{\"severity\":\"user_action\",\"project\":\"\",\"uuid\":\"\",\"event\":\"api:addAdminToOrganization\",\"meta\":{\"user\":{\"id\":\"05be1321-9956-4a67-82fa-046e1fec5240\",\"jti\":\"63779cf0-e15e-4d06-9f36-111d888e27b1\",\"preferred_username\":\"orgowner@example.com\",\"email\":\"orgowner@example.com\",\"azp\":\"lagoon-ui\",\"typ\":\"Bearer\",\"iat\":1747604362,\"iss\":\"http://localhost:8088/auth/realms/lagoon\",\"scope\":\"openid profile email\",\"aud\":\"account\",\"roles\":[\"offline_access\",\"default-roles-lagoon\",\"uma_authorization\"]},\"headers\":{\"user-agent\":\"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0\",\"accept-language\":\"en-US,en;q=0.5\",\"content-type\":\"application/json\",\"content-length\":\"378\",\"host\":\"localhost:3000\",\"origin\":\"http://localhost:3003\",\"referer\":\"http://localhost:3003/\",\"ipAddress\":\"::ffff:172.21.0.1\"},\"project\":\"\",\"event\":\"api:addAdminToOrganization\",\"payload\":{\"user\":{\"id\":\"d2783121-ef44-43c8-ac6b-227cbda1c6b3\",\"email\":\"blaize.kaye@gmail.com\",\"organization\":1,\"role\":\"ADMIN\"},\"resource\":{\"id\":1,\"type\":\"organization\",\"details\":\"lagoon-demo-organization\"},\"linkedResource\":{\"id\":\"d2783121-ef44-43c8-ac6b-227cbda1c6b3\",\"type\":\"user\",\"details\":\"blaize.kaye@gmail.com role ADMIN\"}},\"level\":\"user_action\",\"message\":\"User added an administrator to organization 'lagoon-demo-organization'\",\"timestamp\":\"2025-05-18 21:42:55\"},\"message\":\"User added an administrator to organization 'lagoon-demo-organization'\"}\n",
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &Messaging{}
			if err := h.handleUserActionToEmail(tt.args.notification, []byte(tt.args.rawPayload)); (err != nil) != tt.wantErr {
				t.Errorf("handleUserActionToEmail() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestMessaging_useractionEmailTemplate(t *testing.T) {

	type args struct {
		details *UseractionEmailDetails
	}
	tests := []struct {
		name    string
		args    args
		emoji   string
		color   string
		subject string
		//mainHTML  string
		//plainText string
		wantErr bool
	}{
		{
			name: "Test useractionEmailTemplate",
			args: args{
				details: &UseractionEmailDetails{
					Name:    "test",
					Role:    "Admin",
					Email:   "test@example.com",
					Orgname: "TestOrg",
				},
			},
			emoji:   infoEmoji,
			color:   "#E8E8E8",
			subject: "User test role updated for Organization: TestOrg",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &Messaging{}
			got, got1, got2, got3, got4, err := h.useractionEmailTemplate(tt.args.details)
			if (err != nil) != tt.wantErr {
				t.Errorf("useractionEmailTemplate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.emoji {
				t.Errorf("useractionEmailTemplate() got = %v, want %v", got, tt.emoji)
			}
			if got1 != tt.color {
				t.Errorf("useractionEmailTemplate() got1 = %v, want %v", got1, tt.color)
			}
			if got2 != tt.subject {
				t.Errorf("useractionEmailTemplate() got2 = %v, want %v", got2, tt.subject)
			}
			if !strings.Contains(got3, tt.args.details.Name) {
				t.Errorf("useractionEmailTemplate() got3 = %v, wanted to see their name %v", got3, tt.args.details.Name)
			}
			if !strings.Contains(got4, tt.args.details.Role) {
				t.Errorf("useractionEmailTemplate() got4 = %v, wanted to see %v", got4, tt.args.details.Role)
			}
		})
	}
}
