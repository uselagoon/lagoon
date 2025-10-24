package gitlab

import "testing"

func Test_sanitizeGroupName(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "test1",
			in:   "GroupName",
			want: "groupname",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := sanitizeGroupName(tt.in); got != tt.want {
				t.Errorf("sanitizeGroupName() = %v, want %v", got, tt.want)
			}
		})
	}
}
