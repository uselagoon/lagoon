package handler

import (
	"fmt"
	"testing"
)

func TestLagoonAPIErrorCheck(t *testing.T) {
	type args struct {
		err error
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name: "test1",
			args: args{
				err: fmt.Errorf(`ERROR: unable to update storage in the api: Post "http://lagoon-core-api:80/graphql": read tcp 10.204.12.70:55614->10.208.4.225:80: read: connection reset by peer`),
			},
			wantErr: true,
		},
		{
			name: "test2",
			args: args{
				err: fmt.Errorf(`ERROR: unable to update storage in the api: graphql: Cannot destructure property 'name' of '(intermediate value)' as it is undefined.`),
			},
			wantErr: false,
		},
		{
			name: "test3",
			args: args{
				err: fmt.Errorf(`abcdef-ghijk-123/lagoon-build-nv12hf: ERROR:unable to get deployment - Post "http://lagoon-core-api:80/graphql": read tcp 10.204.12.70:39726->10.208.4.225:80: read: connection reset by peer`),
			},
			wantErr: true,
		},
		{
			name: "test4",
			args: args{
				err: nil,
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := LagoonAPIRetryErrorCheck(tt.args.err); (err != nil) != tt.wantErr {
				t.Errorf("LagoonAPIRetryErrorChecks() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
