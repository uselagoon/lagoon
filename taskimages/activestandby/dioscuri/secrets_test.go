package dioscuri

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	corev1 "k8s.io/api/core/v1"
	networkv1 "k8s.io/api/networking/v1"
)

func Test_checkSecrets(t *testing.T) {
	type args struct {
		ctx                  context.Context
		seedIngressList      string
		seedSecrets          []string
		destinationNamespace string
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name: "test1 - active environment",
			args: args{
				destinationNamespace: "active-main",
				seedSecrets: []string{
					"test-data/check-secrets/test1-seed-secret.json",
				},
				seedIngressList: "test-data/check-secrets/test1-seed-ingresslist.json",
			},
		},
		{
			name: "test1 - active environment secret doesn't exist",
			args: args{
				destinationNamespace: "active-main",
				seedSecrets:          []string{},
				seedIngressList:      "test-data/check-secrets/test1-seed-ingresslist.json",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fakeClient, _ := GetFakeClient()
			for _, service := range tt.args.seedSecrets {
				iBytes, err := os.ReadFile(service)
				if err != nil {
					t.Errorf("couldn't read file %v: %v", service, err)
				}
				cSecret := &corev1.Secret{}
				json.Unmarshal(iBytes, cSecret)
				err = fakeClient.Create(context.Background(), cSecret)
				if err != nil {
					t.Errorf("checkSecrets() error = %v", err)
				}
			}
			r1, err := os.ReadFile(tt.args.seedIngressList)
			if err != nil {
				t.Errorf("couldn't read file %v: %v", tt.args.seedIngressList, err)
			}
			seedIngressList := &networkv1.IngressList{}
			if err = json.Unmarshal(r1, seedIngressList); err != nil {
				t.Errorf("couldn't unmarshal ingress list result %v: %v", tt.args.seedIngressList, err)
			}
			if err := checkSecrets(tt.args.ctx, fakeClient, seedIngressList, tt.args.destinationNamespace); (err != nil) != tt.wantErr {
				t.Errorf("checkSecrets() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
