package dioscuri

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"reflect"
	"testing"

	corev1 "k8s.io/api/core/v1"
	networkv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	client "sigs.k8s.io/controller-runtime/pkg/client"
	ctrlfake "sigs.k8s.io/controller-runtime/pkg/client/fake"
)

var seedNamespaces = []corev1.Namespace{
	{
		ObjectMeta: metav1.ObjectMeta{
			Name: "active-main",
		},
	},
	{
		ObjectMeta: metav1.ObjectMeta{
			Name: "standby-main",
		},
	},
}

func GetFakeClient() (client.Client, error) {
	k8sScheme := runtime.NewScheme()
	if err := networkv1.AddToScheme(k8sScheme); err != nil {
		return nil, err
	}
	if err := corev1.AddToScheme(k8sScheme); err != nil {
		return nil, err
	}
	clientBuilder := ctrlfake.NewClientBuilder()
	clientBuilder = clientBuilder.WithScheme(k8sScheme)

	fakeClient := clientBuilder.Build()
	for _, ns := range seedNamespaces {
		err := fakeClient.Create(context.Background(), &ns)
		if err != nil {
			return nil, err
		}
	}

	return fakeClient, nil
}

func getNamespaces(c client.Client) error {
	v := &corev1.NamespaceList{}
	listOption := (&client.ListOptions{}).ApplyOptions([]client.ListOption{})
	err := c.List(context.Background(), v, listOption)
	if err != nil {
		return err
	}
	fmt.Println(v)
	return nil
}

func Test_checkKubernetesServices(t *testing.T) {
	type args struct {
		ctx                  context.Context
		seedIngressList      string
		seedServices         []string
		destinationNamespace string
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			name: "test1 - active to standby environment",
			args: args{
				destinationNamespace: "standby-main",
				seedServices: []string{
					"test-data/check-services/test1-seed-service.json",
				},
				seedIngressList: "test-data/check-services/test1-seed-ingresslist.json",
			},
			want: "test-data/check-services/test1-result-ingresslist.json",
		},
		{
			name: "test1 - standby to active environment",
			args: args{
				destinationNamespace: "active-main",
				seedServices: []string{
					"test-data/check-services/test2-seed-service.json",
				},
				seedIngressList: "test-data/check-services/test2-seed-ingresslist.json",
			},
			want: "test-data/check-services/test2-result-ingresslist.json",
		},
		{
			name: "test3 - active to standby environment with no matching service in destination",
			args: args{
				destinationNamespace: "standby-main",
				seedServices: []string{
					"test-data/check-services/test3-seed-service.json",
				},
				seedIngressList: "test-data/check-services/test3-seed-ingresslist.json",
			},
			want:    "test-data/check-services/test3-result-ingresslist.json",
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fakeClient, _ := GetFakeClient()
			for _, service := range tt.args.seedServices {
				iBytes, err := os.ReadFile(service)
				if err != nil {
					t.Errorf("couldn't read file %v: %v", service, err)
				}
				cService := &corev1.Service{}
				json.Unmarshal(iBytes, cService)
				err = fakeClient.Create(context.Background(), cService)
				if err != nil {
					t.Errorf("checkKubernetesServices() error = %v", err)
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
			ingressToMigrate := &networkv1.IngressList{}
			if err := checkKubernetesServices(tt.args.ctx, fakeClient, seedIngressList, ingressToMigrate, tt.args.destinationNamespace); (err != nil) != tt.wantErr {
				t.Errorf("checkKubernetesServices() error = %v, wantErr %v", err, tt.wantErr)
			}
			r1, err = os.ReadFile(tt.want)
			if err != nil {
				t.Errorf("couldn't read file %v: %v", tt.want, err)
			}
			wantIngressList := &networkv1.IngressList{}
			if err = json.Unmarshal(r1, wantIngressList); err != nil {
				t.Errorf("couldn't unmarshal ingress list result %v: %v", tt.want, err)
			}
			if !reflect.DeepEqual(ingressToMigrate, wantIngressList) {
				gotB, _ := json.Marshal(ingressToMigrate)
				wantB, _ := json.Marshal(wantIngressList)
				t.Errorf("checkKubernetesServices() got: \n%v \nwant: \n%v", string(gotB), string(wantB))
			}
		})
	}
}

func TestRunMigration(t *testing.T) {
	type args struct {
		c            client.Client
		rData        *ReturnData
		podName      string
		podNamespace string
		seedIngress  []string
		seedServices []string
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
		want    ReturnData
	}{
		{
			name: "test1",
			args: args{
				rData: &ReturnData{
					SourceNamespace:             "active-main",
					DestinationNamespace:        "standby-main",
					ProductionEnvironment:       "standby",
					StandbyProdutionEnvironment: "active",
				},
				podName:      "task-pod",
				podNamespace: "standby-main",
				seedIngress: []string{
					"test-data/run-migration/test1-seed-ingress1.json",
					"test-data/run-migration/test1-seed-ingress2.json",
					"test-data/run-migration/test1-seed-ingress3.json",
				},
				seedServices: []string{
					"test-data/run-migration/test1-seed-service1.json",
					"test-data/run-migration/test1-seed-service2.json",
				},
			},
			want: ReturnData{
				Status:                      "Completed",
				SourceNamespace:             "active-main",
				DestinationNamespace:        "standby-main",
				ProductionEnvironment:       "active",
				ProductionRoutes:            "https://example.com,https://www.example.com",
				StandbyProdutionEnvironment: "standby",
				StandbyRoutes:               "https://standby.example.com",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fakeClient, _ := GetFakeClient()
			err := fakeClient.Create(context.Background(), &corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Name:      tt.args.podName,
					Namespace: tt.args.podNamespace,
				},
			})
			if err != nil {
				t.Errorf("RunMigration() error = %v, wantErr %v", err, tt.wantErr)
			}
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
			for _, service := range tt.args.seedServices {
				iBytes, err := os.ReadFile(service)
				if err != nil {
					t.Errorf("couldn't read file %v: %v", service, err)
				}
				cService := &corev1.Service{}
				json.Unmarshal(iBytes, cService)
				err = fakeClient.Create(context.Background(), cService)
				if err != nil {
					t.Errorf("checkKubernetesServices() error = %v", err)
				}
			}
			if err := RunMigration(fakeClient, tt.args.rData, tt.args.podName, tt.args.podNamespace); (err != nil) != tt.wantErr {
				t.Errorf("RunMigration() error = %v, wantErr %v", err, tt.wantErr)
			}
			if *tt.args.rData != tt.want {
				gotB, _ := json.Marshal(tt.args.rData)
				wantB, _ := json.Marshal(tt.want)
				t.Errorf("getIngressWithLabel() got: \n%v \nwant: \n%v", string(gotB), string(wantB))
			}
		})
	}
}
