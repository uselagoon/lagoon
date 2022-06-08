package handler

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"reflect"
	"testing"

	"github.com/cheshir/go-mq"
)

func checkEqual(t *testing.T, got, want interface{}, msgs ...interface{}) {
	if !reflect.DeepEqual(got, want) {
		buf := bytes.Buffer{}
		buf.WriteString("got:\n[%v]\nwant:\n[%v]\n")
		for _, v := range msgs {
			buf.WriteString(v.(string))
		}
		t.Errorf(buf.String(), got, want)
	}
}

func TestProcessing(t *testing.T) {
	config := mq.Config{}
	graphQLConfig := LagoonAPI{
		// Endpoint:        svr.URL,
		// TokenSigningKey: "jwtTokenSigningKey",
		// JWTAudience:     "jwtAudience",
		// JWTSubject:      "jwtSubject",
		// JWTIssuer:       "jwtIssuer",
	}
	messaging := NewMessaging(config,
		graphQLConfig,
		1,
		1,
		true,
		"lagoonAppID",
		false,
		false,
		false,
		false,
		false,
		false,
		"emailSender",
		"emailSenderPassword",
		"emailHost",
		"emailPort",
		true,
		"s3FilesAccessKeyID",
		"s3FilesSecretAccessKey",
		"s3FilesBucket",
		"s3FilesRegion",
		"s3FilesOrigin",
	)
	var testCases = map[string]struct {
		input       string
		description string
		slack       string
		rocketchat  string
		emailhtml   string
		emailplain  string
		teams       string
	}{
		"repoPushHandledGithub": {
			description: "test github repo push handled events",
			input:       "testdata/input.repoPushHandledGithub.json",
			slack:       "testdata/repoPushHandled/slack.txt",
			rocketchat:  "testdata/repoPushHandled/rocketchat.txt",
			emailhtml:   "testdata/repoPushHandled/emailhtml.txt",
			emailplain:  "testdata/repoPushHandled/emailplain.txt",
			teams:       "testdata/repoPushHandled/teams.txt",
		},
		"repoPushSkippedGithub": {
			description: "test github repo push skipped events",
			input:       "testdata/input.repoPushSkippedGithub.json",
			slack:       "testdata/repoPushSkipped/slack.txt",
			rocketchat:  "testdata/repoPushSkipped/rocketchat.txt",
			emailhtml:   "testdata/repoPushSkipped/emailhtml.txt",
			emailplain:  "testdata/repoPushSkipped/emailplain.txt",
			teams:       "testdata/repoPushSkipped/teams.txt",
		},
		"deleteEnvironmentGithub": {
			description: "test github repo push deleted events",
			input:       "testdata/input.deleteEnvironmentGithub.json",
			slack:       "testdata/deleteEnvironment/slack.txt",
			rocketchat:  "testdata/deleteEnvironment/rocketchat.txt",
			emailhtml:   "testdata/deleteEnvironment/emailhtml.txt",
			emailplain:  "testdata/deleteEnvironment/emailplain.txt",
			teams:       "testdata/deleteEnvironment/teams.txt",
		},
		"deployEnvironment": {
			description: "test github repo push deleted events",
			input:       "testdata/input.deployEnvironment.json",
			slack:       "testdata/deployEnvironment/slack.txt",
			rocketchat:  "testdata/deployEnvironment/rocketchat.txt",
			emailhtml:   "testdata/deployEnvironment/emailhtml.txt",
			emailplain:  "testdata/deployEnvironment/emailplain.txt",
			teams:       "testdata/deployEnvironment/teams.txt",
		},
		"deployError": {
			description: "test github repo push deleted events",
			input:       "testdata/input.deployError.json",
			slack:       "testdata/deployError/slack.txt",
			rocketchat:  "testdata/deployError/rocketchat.txt",
			emailhtml:   "testdata/deployError/emailhtml.txt",
			emailplain:  "testdata/deployError/emailplain.txt",
			teams:       "testdata/deployError/teams.txt",
		},
		"deployFinished": {
			description: "test github repo push deleted events",
			input:       "testdata/input.deployFinished.json",
			slack:       "testdata/deployFinished/slack.txt",
			rocketchat:  "testdata/deployFinished/rocketchat.txt",
			emailhtml:   "testdata/deployFinished/emailhtml.txt",
			emailplain:  "testdata/deployFinished/emailplain.txt",
			teams:       "testdata/deployFinished/teams.txt",
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(tt *testing.T) {
			// read the input into a the notification struct
			inputBytes, err := ioutil.ReadFile(tc.input) // just pass the file name
			if err != nil {
				tt.Fatalf("unexpected error %v", err)
			}
			notification := &Notification{}
			json.Unmarshal(inputBytes, notification)

			// process slack template
			resultBytes, err := ioutil.ReadFile(tc.slack) // just pass the file name
			if err != nil {
				tt.Fatalf("unexpected error %v", err)
			}
			_, _, message, err := messaging.processSlackTemplate(notification)
			if err != nil {
				tt.Fatalf("unexpected error %v", err)
			}
			if message != string(resultBytes) {
				t.Log(string(message))
				tt.Fatalf("message doesn't match")
			}

			// process rocketchat template
			resultBytes, err = ioutil.ReadFile(tc.rocketchat) // just pass the file name
			if err != nil {
				tt.Fatalf("unexpected error %v", err)
			}
			_, _, message, err = messaging.processRocketChatTemplate(notification)
			if err != nil {
				tt.Fatalf("unexpected error %v", err)
			}
			if message != string(resultBytes) {
				t.Log(string(message))
				tt.Fatalf("message doesn't match")
			}

			// process email templates
			resultBytesHTML, err := ioutil.ReadFile(tc.emailhtml) // just pass the file name
			if err != nil {
				tt.Fatalf("unexpected error %v", err)
			}
			resultBytesPlainText, err := ioutil.ReadFile(tc.emailplain) // just pass the file name
			if err != nil {
				tt.Fatalf("unexpected error %v", err)
			}
			_, _, _, htmlMessage, plaintextMessage, err := messaging.processEmailTemplates(notification)
			if err != nil {
				tt.Fatalf("unexpected error %v", err)
			}
			if htmlMessage != string(resultBytesHTML) {
				t.Log(string(htmlMessage))
				tt.Fatalf("html message doesn't match")
			}
			if plaintextMessage != string(resultBytesPlainText) {
				t.Log(string(plaintextMessage))
				tt.Fatalf("plaintext message doesn't match")
			}

			// process teams template
			resultBytes, err = ioutil.ReadFile(tc.teams) // just pass the file name
			if err != nil {
				tt.Fatalf("unexpected error %v", err)
			}
			_, _, message, err = messaging.processMicrosoftTeamsTemplate(notification)
			if err != nil {
				tt.Fatalf("unexpected error %v", err)
			}
			if message != string(resultBytes) {
				t.Log(string(message))
				tt.Fatalf("message doesn't match")
			}
		})
	}
}
