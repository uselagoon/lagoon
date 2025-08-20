package lagoon

import "testing"

func TestGenerateBuildName(t *testing.T) {

	tests := []struct {
		name string
		seed int64
		want string
	}{
		{
			name: "test1",
			seed: 1234567890,
			want: "lagoon-build-2ik1a",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := GenerateBuildName(tt.seed); got != tt.want {
				t.Errorf("GenerateBuildName() = %v, want %v", got, tt.want)
			}
		})
	}
}
