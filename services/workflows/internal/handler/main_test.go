package handler

import (
	"bytes"
	"github.com/cheshir/go-mq"
	"reflect"
	"testing"
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

type MqMessageFake struct {
}

func (f MqMessageFake) Ack(Multiple bool) error {
	return nil
}

func (f MqMessageFake) Nack(Multiple bool, request bool) error {
	return nil
}

func Test_processingIncomingMessageQueue(t *testing.T) {
	type args struct {
		message mq.Message
	}
	tests := []struct {
		name string
		args args
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
		})
	}
}
