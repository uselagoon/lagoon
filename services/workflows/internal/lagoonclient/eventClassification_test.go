package lagoonclient

import "testing"

func TestEventClassificationInterface_isEventOfType(t *testing.T) {
	type fields struct {
		name string
	}
	type args struct {
		eventType string
	}
	tests := []struct {
		name   string
		fields fields
		args   args
		want   bool
	}{
		{
			name: "Should find event type",
			fields: fields{name: "github:push:CannotDeleteProductionEnvironment"},
			args: args{
				eventType: "notDeleted",
			},
			want: true,
		},
		{
			name: "Should NOT find event type",
			fields: fields{name: "github:push:CannotDeleteProductionEnvironment"},
			args: args{
				eventType: "deployError",
			},
			want: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := &EventClassificationInterface{
				name: tt.fields.name,
			}
			if got := e.isEventOfType(tt.args.eventType); got != tt.want {
				t.Errorf("isEventOfType() = %v, want %v", got, tt.want)
			}
		})
	}
}
