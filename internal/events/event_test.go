package events

import (
	"reflect"
	"testing"

	"github.com/uselagoon/machinery/api/schema"
)

func Test_bitbucketSSHURLVariants(t *testing.T) {
	tests := []struct {
		name   string
		gitURL string
		want   []string
	}{
		{
			name:   "legacy scp style adds ssh host",
			gitURL: "git@bitbucket.org:team/repo.git",
			want:   []string{"git@bitbucket.org:team/repo.git", "git@ssh.bitbucket.org:team/repo.git"},
		},
		{
			name:   "new scp style adds legacy host",
			gitURL: "git@ssh.bitbucket.org:team/repo.git",
			want:   []string{"git@ssh.bitbucket.org:team/repo.git", "git@bitbucket.org:team/repo.git"},
		},
		{
			name:   "legacy ssh scheme with port",
			gitURL: "ssh://git@bitbucket.org:7999/team/repo.git",
			want:   []string{"ssh://git@bitbucket.org:7999/team/repo.git", "ssh://git@ssh.bitbucket.org:7999/team/repo.git"},
		},
		{
			name:   "new ssh scheme adds legacy host",
			gitURL: "ssh://git@ssh.bitbucket.org/team/repo.git",
			want:   []string{"ssh://git@ssh.bitbucket.org/team/repo.git", "ssh://git@bitbucket.org/team/repo.git"},
		},
		{
			name:   "other host unchanged",
			gitURL: "git@github.com:team/repo.git",
			want:   []string{"git@github.com:team/repo.git"},
		},
		{
			name:   "private bitbucket server unchanged",
			gitURL: "ssh://git@bitbucket.example.com:7999/team/repo.git",
			want:   []string{"ssh://git@bitbucket.example.com:7999/team/repo.git"},
		},
		{
			name:   "legacy hostname suffix unchanged",
			gitURL: "ssh://git@bitbucket.org.example.com:7999/team/repo.git",
			want:   []string{"ssh://git@bitbucket.org.example.com:7999/team/repo.git"},
		},
		{
			name:   "new hostname suffix unchanged",
			gitURL: "ssh://git@ssh.bitbucket.org.example.com:7999/team/repo.git",
			want:   []string{"ssh://git@ssh.bitbucket.org.example.com:7999/team/repo.git"},
		},
		{
			name:   "empty",
			gitURL: "",
			want:   []string{""},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := bitbucketSSHURLVariants(tt.gitURL); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("bitbucketSSHURLVariants() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestBitBucketGitURL(t *testing.T) {
	tests := []struct {
		name    string
		repoURL string
		want    string
	}{
		{"cloud", "https://bitbucket.org/team/repo", "git@bitbucket.org:team/repo.git"},
		{"server with port", "https://bitbucket.example.com:7999/team/repo", "ssh://git@bitbucket.example.com:7999/team/repo.git"},
		{"invalid", "not-a-url", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := BitBucketGitURL(tt.repoURL, "team/repo"); got != tt.want {
				t.Errorf("BitBucketGitURL() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_lookupProjects(t *testing.T) {
	newProject := func(id uint) schema.Project {
		var project schema.Project
		project.ID = id
		return project
	}
	projectA := newProject(1)
	projectB := newProject(2)
	tests := []struct {
		name      string
		gitType   string
		gitURL    string
		store     map[string][]schema.Project
		wantCalls []string
		wantIDs   []uint
	}{
		{
			name:      "bitbucket primary host only",
			gitType:   "bitbucket",
			gitURL:    "git@bitbucket.org:team/repo.git",
			store:     map[string][]schema.Project{"git@bitbucket.org:team/repo.git": {projectA}},
			wantCalls: []string{"git@bitbucket.org:team/repo.git", "git@ssh.bitbucket.org:team/repo.git"},
			wantIDs:   []uint{1},
		},
		{
			name:      "bitbucket ssh host only",
			gitType:   "bitbucket",
			gitURL:    "git@bitbucket.org:team/repo.git",
			store:     map[string][]schema.Project{"git@ssh.bitbucket.org:team/repo.git": {projectB}},
			wantCalls: []string{"git@bitbucket.org:team/repo.git", "git@ssh.bitbucket.org:team/repo.git"},
			wantIDs:   []uint{2},
		},
		{
			name:    "bitbucket merges projects across both hosts",
			gitType: "bitbucket",
			gitURL:  "git@bitbucket.org:team/repo.git",
			store: map[string][]schema.Project{
				"git@bitbucket.org:team/repo.git":     {projectA},
				"git@ssh.bitbucket.org:team/repo.git": {projectB},
			},
			wantCalls: []string{"git@bitbucket.org:team/repo.git", "git@ssh.bitbucket.org:team/repo.git"},
			wantIDs:   []uint{1, 2},
		},
		{
			name:    "bitbucket de-duplicates the same project",
			gitType: "bitbucket",
			gitURL:  "git@bitbucket.org:team/repo.git",
			store: map[string][]schema.Project{
				"git@bitbucket.org:team/repo.git":     {projectA},
				"git@ssh.bitbucket.org:team/repo.git": {projectA},
			},
			wantCalls: []string{"git@bitbucket.org:team/repo.git", "git@ssh.bitbucket.org:team/repo.git"},
			wantIDs:   []uint{1},
		},
		{
			name:      "non bitbucket never tries variants",
			gitType:   "github",
			gitURL:    "git@github.com:team/repo.git",
			store:     map[string][]schema.Project{},
			wantCalls: []string{"git@github.com:team/repo.git"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var calls []string
			got, err := lookupProjects(tt.gitType, tt.gitURL, func(url string) (*[]schema.Project, error) {
				calls = append(calls, url)
				found := tt.store[url]
				return &found, nil
			})
			if err != nil {
				t.Fatal(err)
			}
			if !reflect.DeepEqual(calls, tt.wantCalls) {
				t.Errorf("calls = %v, want %v", calls, tt.wantCalls)
			}
			var gotIDs []uint
			for _, project := range got {
				gotIDs = append(gotIDs, project.ID)
			}
			if !reflect.DeepEqual(gotIDs, tt.wantIDs) {
				t.Errorf("ids = %v, want %v", gotIDs, tt.wantIDs)
			}
		})
	}
}
