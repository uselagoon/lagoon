package lagoonclient

import "testing"

func TestIsEventOfType(t *testing.T) {
	type args struct {
		eventName string
		eventType string
	}
	tests := []struct {
		name string
		args args
		want bool
	}{
		{
			name: "Event does match",
			args: args{
				eventName: "github:pull_request:closed:CannotDeleteProductionEnvironment",
				eventType: "notDeleted",
			},
			want: true,
		},
		{
			name: "Event does not match",
			args: args{
				eventName: "github:pull_request:closed:CannotDeleteProductionEnvironment",
				eventType: "deployEnvironment",
			},
			want: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsEventOfType(tt.args.eventName, tt.args.eventType); got != tt.want {
				t.Errorf("IsEventOfType() = %v, want %v", got, tt.want)
			}
		})
	}
}
