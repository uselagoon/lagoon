package handler

import (
	"strings"
	"testing"
)

func Test_templateGenerator(t *testing.T) {
	type args struct {
		mailTemplate    string
		contentTemplate string
		contentValues   interface{}
		image           string
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			name: "Valid template with values",
			args: args{
				mailTemplate:    "Subject: Test Email\n\n{{.Content}}\n\nBest regards,\nLagoon Team",
				contentTemplate: `Hello, {{.Name}}! Your image is {{.Image}}.`,
				contentValues: map[string]string{
					"Name":  "World",
					"Image": "example/image:latest",
				},
				image: "example/image:latest",
			},
			want: "Hello, World! Your image is example/image:latest.",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := templateGenerator(tt.args.mailTemplate, tt.args.contentTemplate, tt.args.contentValues, tt.args.image)
			//fmt.Print("Generated Template: ", got)
			if (err != nil) != tt.wantErr {
				t.Errorf("templateGenerator() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !strings.Contains(got, tt.want) {
				t.Errorf("templateGenerator() got = %v, want %v", got, tt.want)
			}
		})
	}
}
