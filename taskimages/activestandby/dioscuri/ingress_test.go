package dioscuri

import (
	"context"
	"encoding/json"
	"os"
	"reflect"
	"testing"

	"github.com/andreyvit/diff"
	networkv1 "k8s.io/api/networking/v1"
)

func Test_getIngressWithLabel(t *testing.T) {
	type args struct {
		ctx         context.Context
		namespace   string
		seedIngress []string
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			name: "test1 - active environment",
			args: args{
				namespace: "active-main",
				seedIngress: []string{
					"test-data/get-ingress-labels/test1-seed-ingress.json",
				},
			},
			want: "test-data/get-ingress-labels/test1-result-ingresslist.json",
		},
		{
			name: "test2 - standby environment",
			args: args{
				namespace: "standby-main",
				seedIngress: []string{
					"test-data/get-ingress-labels/test2-seed-ingress.json",
				},
			},
			want: "test-data/get-ingress-labels/test2-result-ingresslist.json",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fakeClient, _ := GetFakeClient()
			for _, ingress := range tt.args.seedIngress {
				iBytes, err := os.ReadFile(ingress)
				if err != nil {
					t.Errorf("couldn't read file %v: %v", ingress, err)
				}
				cIngress := &networkv1.Ingress{}
				json.Unmarshal(iBytes, cIngress)
				err = fakeClient.Create(context.Background(), cIngress)
				if err != nil {
					t.Errorf("getIngressWithLabel() error = %v", err)
				}
			}
			got, err := getIngressWithLabel(tt.args.ctx, fakeClient, tt.args.namespace)
			if (err != nil) != tt.wantErr {
				t.Errorf("getIngressWithLabel() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			r1, err := os.ReadFile(tt.want)
			if err != nil {
				t.Errorf("couldn't read file %v: %v", tt.want, err)
			}
			wantIngressList := &networkv1.IngressList{}
			if err = json.Unmarshal(r1, wantIngressList); err != nil {
				t.Errorf("couldn't unmarshal ingress list result %v: %v", tt.want, err)
			}
			if !reflect.DeepEqual(got, wantIngressList) {
				gotB, _ := json.MarshalIndent(got, "", "  ")
				wantB, _ := json.MarshalIndent(wantIngressList, "", "  ")
				t.Errorf("getIngressWithLabel() = \n%v", diff.LineDiff(string(gotB), string(wantB)))
			}
		})
	}
}

func Test_patchIngress(t *testing.T) {
	type args struct {
		ctx         context.Context
		seedIngress string
		labels      map[string]interface{}
	}
	tests := []struct {
		name       string
		args       args
		wantErr    bool
		wantLabels map[string]string
	}{
		{
			name: "test1 - active environment",
			args: args{
				seedIngress: "test-data/patch-ingress/test1-seed-ingress.json",
				labels: map[string]interface{}{
					"activestandby.lagoon.sh/migrating": "true",
				},
			},
			wantLabels: map[string]string{
				"activestandby.lagoon.sh/migrate":   "true",
				"activestandby.lagoon.sh/migrating": "true",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fakeClient, _ := GetFakeClient()
			iBytes, err := os.ReadFile(tt.args.seedIngress)
			if err != nil {
				t.Errorf("couldn't read file %v: %v", tt.args.seedIngress, err)
			}
			cIngress := &networkv1.Ingress{}
			json.Unmarshal(iBytes, cIngress)
			err = fakeClient.Create(context.Background(), cIngress)
			if err != nil {
				t.Errorf("getIngressWithLabel() error = %v", err)
			}
			if err := patchIngress(tt.args.ctx, fakeClient, cIngress, tt.args.labels); (err != nil) != tt.wantErr {
				t.Errorf("patchIngress() error = %v, wantErr %v", err, tt.wantErr)
			}
			if !reflect.DeepEqual(cIngress.ObjectMeta.Labels, tt.wantLabels) {
				gotB, _ := json.MarshalIndent(cIngress.ObjectMeta.Labels, "", "  ")
				wantB, _ := json.MarshalIndent(tt.wantLabels, "", "  ")
				t.Errorf("checkKubernetesServices() = \n%v", diff.LineDiff(string(gotB), string(wantB)))
			}
		})
	}
}

func Test_individualIngressMigration(t *testing.T) {
	type args struct {
		ctx                  context.Context
		seedIngress          string
		sourceNamespace      string
		destinationNamespace string
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			name: "test1 - active to standby",
			args: args{
				sourceNamespace:      "active-main",
				destinationNamespace: "standby-main",
				seedIngress:          "test-data/individual-migration/test1-seed-ingress.json",
			},
			want: "test-data/individual-migration/test1-result-ingress.json",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fakeClient, _ := GetFakeClient()
			iBytes, err := os.ReadFile(tt.args.seedIngress)
			if err != nil {
				t.Errorf("couldn't read file %v: %v", tt.args.seedIngress, err)
			}
			cIngress := &networkv1.Ingress{}
			json.Unmarshal(iBytes, cIngress)
			err = fakeClient.Create(context.Background(), cIngress)
			if err != nil {
				t.Errorf("getIngressWithLabel() error = %v", err)
			}
			got, err := individualIngressMigration(tt.args.ctx, fakeClient, cIngress, tt.args.sourceNamespace, tt.args.destinationNamespace)
			if (err != nil) != tt.wantErr {
				t.Errorf("individualIngressMigration() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			r1, err := os.ReadFile(tt.want)
			if err != nil {
				t.Errorf("couldn't read file %v: %v", tt.want, err)
			}
			wantIngress := &networkv1.Ingress{}
			if err = json.Unmarshal(r1, wantIngress); err != nil {
				t.Errorf("couldn't unmarshal ingress list result %v: %v", tt.want, err)
			}
			if !reflect.DeepEqual(got, wantIngress) {
				gotB, _ := json.MarshalIndent(got, "", "  ")
				wantB, _ := json.MarshalIndent(wantIngress, "", "  ")
				t.Errorf("individualIngressMigration() = \n%v", diff.LineDiff(string(gotB), string(wantB)))
			}
		})
	}
}
