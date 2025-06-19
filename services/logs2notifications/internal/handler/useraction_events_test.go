package handler

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
)

func TestMessaging_handleUserActionToEmail(t *testing.T) {
	type fields struct {
	}
	type args struct {
		notification *Notification
		event        string
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
				event:      "api:addAdminToOrganization",
				rawPayload: "{\"severity\":\"user_action\",\"project\":\"\",\"uuid\":\"\",\"event\":\"api:addAdminToOrganization\",\"meta\":{\"user\":{\"id\":\"05be1321-9956-4a67-82fa-046e1fec5240\",\"jti\":\"63779cf0-e15e-4d06-9f36-111d888e27b1\",\"preferred_username\":\"orgowner@example.com\",\"email\":\"orgowner@example.com\",\"azp\":\"lagoon-ui\",\"typ\":\"Bearer\",\"iat\":1747604362,\"iss\":\"http://localhost:8088/auth/realms/lagoon\",\"scope\":\"openid profile email\",\"aud\":\"account\",\"roles\":[\"offline_access\",\"default-roles-lagoon\",\"uma_authorization\"]},\"headers\":{\"user-agent\":\"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0\",\"accept-language\":\"en-US,en;q=0.5\",\"content-type\":\"application/json\",\"content-length\":\"378\",\"host\":\"localhost:3000\",\"origin\":\"http://localhost:3003\",\"referer\":\"http://localhost:3003/\",\"ipAddress\":\"::ffff:172.21.0.1\"},\"project\":\"\",\"event\":\"api:addAdminToOrganization\",\"payload\":{\"user\":{\"id\":\"d2783121-ef44-43c8-ac6b-227cbda1c6b3\",\"email\":\"blaize.kaye@gmail.com\",\"organization\":1,\"role\":\"ADMIN\"},\"resource\":{\"id\":1,\"type\":\"organization\",\"details\":\"lagoon-demo-organization\"},\"linkedResource\":{\"id\":\"d2783121-ef44-43c8-ac6b-227cbda1c6b3\",\"type\":\"user\",\"details\":\"blaize.kaye@gmail.com role ADMIN\"}},\"level\":\"user_action\",\"message\":\"User added an administrator to organization 'lagoon-demo-organization'\",\"timestamp\":\"2025-05-18 21:42:55\"},\"message\":\"User added an administrator to organization 'lagoon-demo-organization'\"}\n",
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &Messaging{}
			tt.args.notification.Meta.Event = tt.args.event
			if err := h.handleUserActionToEmail(tt.args.notification, []byte(tt.args.rawPayload)); (err != nil) != tt.wantErr {
				t.Errorf("handleUserActionToEmail() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestMessaging_handleUserActionToEmail1(t *testing.T) {
	type constructNotification func() *Notification
	type args struct {
		payloadConstructor      func() []byte
		notificationConstructor constructNotification
	}
	type want struct {
		subjectSentFragment   string
		plaintextSentFragment string
		htmlSentFragment      string
	}
	tests := []struct {
		name    string
		args    args
		want    want
		wantErr bool
	}{
		{
			name: "Test handleUserActionToEmail with email delivery",
			want: want{
				subjectSentFragment:   "User test user role updated",
				plaintextSentFragment: "test user granted role TESTROLE for organization test-organization",
				htmlSentFragment:      "You (<strong>test user</strong>) have been assigned the role of",
			},
			args: args{
				payloadConstructor: func() []byte {
					useraction := &handleUserActionPayload{}
					useraction.Meta.Payload.UserActionEmailDetails = &UseractionEmailDetails{
						Name:             "test user",
						OrganizationName: "test-organization",
						Email:            "test@example.com",
						Role:             "TESTROLE",
					}
					ret, _ := json.Marshal(useraction)
					return ret
				},
				notificationConstructor: func() *Notification {
					n := &Notification{}
					n.Project = "test-project"
					n.Meta.Event = "api:addAdminToOrganization"
					n.Event = "api:addAdminToOrganization"
					return n
				},
			},
		},
	}
	for _, tt := range tests {

		// let's create a mock EmailDeliveryFunction
		var subjectSent, plaintextSent, htmlSent string
		var emailDeliveryFunction DeliverEmailType
		emailDeliveryFunction = func(h *Messaging, emailAddress string, subject string, plainText string, htmlMessage bytes.Buffer) error {
			subjectSent = subject
			plaintextSent = plainText
			htmlSent = htmlMessage.String()
			return nil
		}

		t.Run(tt.name, func(t *testing.T) {
			h := &Messaging{
				EmailDeliveryFunction: emailDeliveryFunction,
			}
			if err := h.handleUserActionToEmail(tt.args.notificationConstructor(), tt.args.payloadConstructor()); (err != nil) != tt.wantErr {

				if !strings.Contains(subjectSent, tt.want.subjectSentFragment) {
					t.Errorf("handleUserActionToEmail() subject = %v, want %v", subjectSent, tt.want.subjectSentFragment)
				}
				if !strings.Contains(plaintextSent, tt.want.plaintextSentFragment) {
					t.Errorf("handleUserActionToEmail() plaintext = %v, want %v", plaintextSent, tt.want.plaintextSentFragment)
				}
				if !strings.Contains(htmlSent, tt.want.htmlSentFragment) {
					t.Errorf("handleUserActionToEmail() html = %v, want %v", htmlSent, tt.want.htmlSentFragment)
				}
			}
		})
	}
}
