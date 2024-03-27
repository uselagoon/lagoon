package dioscuri

import (
	"testing"

	networkv1 "k8s.io/api/networking/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func Test_validateMigratingLabel(t *testing.T) {
	type args struct {
		migrateSourceToDestination *networkv1.IngressList
		migrateDestinationToSource *networkv1.IngressList
		valid                      bool
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name: "test1 - should exist and be true",
			args: args{
				valid: true,
				migrateSourceToDestination: &networkv1.IngressList{
					Items: []networkv1.Ingress{
						{
							ObjectMeta: v1.ObjectMeta{
								Name:      "ingress1",
								Namespace: "ingress1-ns",
								Labels: map[string]string{
									"activestandby.lagoon.sh/migrate":   "true",
									"activestandby.lagoon.sh/migrating": "true",
								},
							},
						},
					},
				},
				migrateDestinationToSource: &networkv1.IngressList{},
			},
		},
		{
			name: "test2 - should exist and be false",
			args: args{
				valid: false,
				migrateSourceToDestination: &networkv1.IngressList{
					Items: []networkv1.Ingress{
						{
							ObjectMeta: v1.ObjectMeta{
								Name:      "ingress1",
								Namespace: "ingress1-ns",
								Labels: map[string]string{
									"activestandby.lagoon.sh/migrate":   "true",
									"activestandby.lagoon.sh/migrating": "false",
								},
							},
						},
					},
				},
				migrateDestinationToSource: &networkv1.IngressList{},
			},
		},
		{
			name: "test3 - should exist and be false, but error because it is true",
			args: args{
				valid: false,
				migrateSourceToDestination: &networkv1.IngressList{
					Items: []networkv1.Ingress{
						{
							ObjectMeta: v1.ObjectMeta{
								Name:      "ingress1",
								Namespace: "ingress1-ns",
								Labels: map[string]string{
									"activestandby.lagoon.sh/migrate":   "true",
									"activestandby.lagoon.sh/migrating": "true",
								},
							},
						},
					},
				},
				migrateDestinationToSource: &networkv1.IngressList{},
			},
			wantErr: true,
		},
		{
			name: "test4 - should exist and be true, but error because it is false",
			args: args{
				valid: true,
				migrateSourceToDestination: &networkv1.IngressList{
					Items: []networkv1.Ingress{
						{
							ObjectMeta: v1.ObjectMeta{
								Name:      "ingress1",
								Namespace: "ingress1-ns",
								Labels: map[string]string{
									"activestandby.lagoon.sh/migrate":   "true",
									"activestandby.lagoon.sh/migrating": "false",
								},
							},
						},
					},
				},
				migrateDestinationToSource: &networkv1.IngressList{},
			},
			wantErr: true,
		},
		{
			name: "test5 - label does not exist, but should be true",
			args: args{
				valid: true,
				migrateSourceToDestination: &networkv1.IngressList{
					Items: []networkv1.Ingress{
						{
							ObjectMeta: v1.ObjectMeta{
								Name:      "ingress1",
								Namespace: "ingress1-ns",
								Labels: map[string]string{
									"activestandby.lagoon.sh/migrate": "true",
								},
							},
						},
					},
				},
				migrateDestinationToSource: &networkv1.IngressList{},
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := validateMigratingLabel(tt.args.migrateSourceToDestination, tt.args.migrateDestinationToSource, tt.args.valid); (err != nil) != tt.wantErr {
				t.Errorf("validateMigratingLabel() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
