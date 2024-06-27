package handler

import (
	"bytes"
	"encoding/json"
	"os"
	"reflect"
	"strings"
	"testing"

	"github.com/uselagoon/machinery/api/schema"
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

func TestProcessBackups(t *testing.T) {
	// // mock amqp
	// mockServer := server.NewServer("amqp://127.0.0.1:35672/%2f")
	// if mockServer == nil {
	// 	t.Errorf("Failed to instantiate fake server")
	// 	return
	// }
	// err := mockServer.Start()
	// if err != nil {
	// 	t.Errorf("Failed to start fake server")
	// 	return
	// }
	// mockConn, err := amqptest.Dial("amqp://127.0.0.1:35672/%2f") // now it works =D
	// if err != nil {
	// 	t.Error(err)
	// 	return
	// }
	// if mockConn == nil {
	// 	t.Error("Invalid mockConn")
	// 	return
	// }
	// mockChannel, err := mockConn.Channel()
	// if err != nil {
	// 	t.Error(err)
	// 	return
	// }

	// srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	// 	_, err := ioutil.ReadAll(r.Body)
	// 	if err != nil {
	// 		t.Error(err.Error())
	// 		return
	// 	}
	// 	io.WriteString(w, `{
	// 		"data": {
	// 			"allBackups": ""
	// 		}
	// 	}`)
	// }))
	// defer srv.Close()

	// broker := RabbitBroker{
	// 	Hostname:     "127.0.0.1",
	// 	Port:         "35672",
	// 	QueueName:    "lagoon-webhooks:queue",
	// 	ExchangeName: "lagoon-webhooks",
	// }
	// graphQL := GraphQLEndpoint{
	// 	Endpoint:        srv.URL,
	// 	TokenSigningKey: "secret-key",
	// 	JWTAudience:     "api.dev",
	// }
	// backupHandler, err := NewBackupHandler(broker, graphQL)
	// if err != nil {
	// 	t.Errorf("unable to create backuphandler, error is %s:", err)
	// }

	var backupData Backups
	jsonBackupTestData, err := os.ReadFile("testdata/example-com.json")
	if err != nil {
		t.Errorf("unable to read file, error is %s:", err.Error())
	}
	resultTestData, err := os.ReadFile("testdata/example-com.result")
	if err != nil {
		t.Errorf("unable to read file, error is %s:", err.Error())
	}
	decoder := json.NewDecoder(bytes.NewReader(jsonBackupTestData))
	err = decoder.Decode(&backupData)
	if err != nil {
		t.Errorf("unable to decode json, error is %s:", err.Error())
	}
	var backupsEnv schema.Environment
	addBackups := ProcessBackups(backupData, backupsEnv.Backups)
	var backupResult []string
	for _, backup := range addBackups {
		backupResult = append(backupResult, backup.Body.Snapshots[0].Hostname)
	}
	bResult := strings.Join(backupResult, ",")
	if string(bResult) != string(resultTestData) {
		checkEqual(t, string(bResult), string(resultTestData), "processing failed")
	}
}
