package events

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/lagoon/internal/messaging"
	"github.com/uselagoon/machinery/api/schema"
)

type Events struct {
	LagoonAPI lagoon.LagoonAPI
	Messaging messaging.Messaging
}

func New(lapi lagoon.LagoonAPI, m messaging.Messaging) Events {
	return Events{
		LagoonAPI: lapi,
		Messaging: m,
	}
}

type Response struct {
	Project  string `json:"project,omitempty"`
	Response string `json:"response,omitempty"`
	Error    error  `json:"error,omitempty"`
}

type PullMetadata struct {
	ProjectName       string `json:"projectName"`
	PullrequestTitle  string `json:"pullrequestTitle"`
	PullrequestNumber int    `json:"pullrequestNumber"`
	PullrequestURL    string `json:"pullrequestUrl"`
	RepoName          string `json:"repoName"`
	RepoURL           string `json:"repoUrl"`
}

type PushMetadata struct {
	ProjectName  string `json:"projectName"`
	Branch       string `json:"branch"`
	SHA          string `json:"sha"`
	ShortSHA     string `json:"shortSha"`
	RepoFullName string `json:"repoFullName"`
	RepoURL      string `json:"repoUrl"`
	BranchName   string `json:"branchName"`
	CommitURL    string `json:"commitUrl"`
	Event        string `json:"event"`
}

type BranchMetadata struct {
	ProjectName  string `json:"projectName"`
	Branch       string `json:"branch"`
	SHA          string `json:"sha"`
	ShortSHA     string `json:"shortSha"`
	RepoFullName string `json:"repoFullName"`
	RepoURL      string `json:"repoUrl"`
	BranchName   string `json:"branchName"`
	CommitURL    string `json:"commitUrl"`
	Event        string `json:"event"`
}

type LagoonLog struct {
	Severity string `json:"severity"`
	Project  string `json:"project"`
	UUID     string `json:"uuid"`
	Meta     any    `json:"meta"`
	Level    string `json:"level"`
}

// bitbucketCloudSSHPrefixes pairs the legacy bitbucket cloud ssh prefixes with their ssh.bitbucket.org equivalents.
// bitbucket cloud is moving its ssh endpoint, but webhook payloads only contain the non ssh domain,
// so a project may be registered with either host.
// related change in bitbucket https://community.atlassian.com/forums/discussion/3234032/upcoming-change-to-bitbucket-cloud-ssh-access-move-from-bitbucket-org-to-ssh-bitbucket-org
var bitbucketCloudSSHPrefixes = [][2]string{
	{"git@bitbucket.org:", "git@ssh.bitbucket.org:"},
	{"ssh://git@bitbucket.org", "ssh://git@ssh.bitbucket.org"},
}

// hostPrefixEndCheck reports whether the prefix ends a complete hostname, so that unrelated hosts
// such as bitbucket.org.example.com are not matched.
func hostPrefixEndCheck(prefix, rest string) bool {
	if strings.HasSuffix(prefix, ":") {
		return true
	}
	return rest == "" || rest[0] == '/' || rest[0] == ':'
}

// bitbucketSSHURLVariants returns the given git url, plus the equivalent url on the other bitbucket cloud ssh host if there is one.
// since lagoon uses the giturl to do git pulls, the giturl must work there.
// secondary to that, the giturl is used to match project, if the webhook payload does not contain the `ssh.` prefixed version of the domain
// then we need to do this variant check to extract the correct domain to match against
func bitbucketSSHURLVariants(gitURL string) []string {
	for _, prefixes := range bitbucketCloudSSHPrefixes {
		if rest, ok := strings.CutPrefix(gitURL, prefixes[0]); ok && hostPrefixEndCheck(prefixes[0], rest) {
			return []string{gitURL, prefixes[1] + rest}
		}
		if rest, ok := strings.CutPrefix(gitURL, prefixes[1]); ok && hostPrefixEndCheck(prefixes[1], rest) {
			return []string{gitURL, prefixes[0] + rest}
		}
	}
	return []string{gitURL}
}

// lookupProjects queries the api for the given git url. For bitbucket webhooks only, it also queries the
// alternate bitbucket cloud ssh host and merges the results (de-duplicated by project id), as projects
// sharing a repo (polysites) may be registered under either host. Other git types make a single call.
func lookupProjects(gitType, gitURL string, query func(string) (*[]schema.Project, error)) ([]schema.Project, error) {
	candidates := []string{gitURL}
	if gitType == "bitbucket" {
		candidates = bitbucketSSHURLVariants(gitURL)
	}
	var projects []schema.Project
	seen := map[uint]struct{}{}
	for _, candidate := range candidates {
		found, err := query(candidate)
		if err != nil {
			return nil, err
		}
		if found == nil {
			continue
		}
		for _, project := range *found {
			if _, ok := seen[project.ID]; !ok {
				seen[project.ID] = struct{}{}
				projects = append(projects, project)
			}
		}
	}
	return projects, nil
}

func (e *Events) findProjectsByGitURL(gitType, event, uuid, gitURL string) ([]schema.Project, string, string, error) {
	projects, err := lookupProjects(gitType, gitURL, e.LagoonAPI.AllProjectByGitURL)
	if err != nil {
		return nil, "", "", err
	}
	resultProjects := []schema.Project{}
	for _, project := range projects {
		if project.DeploymentsDisabled == nil || *project.DeploymentsDisabled != 1 {
			resultProjects = append(resultProjects, project)
		}
	}

	if len(resultProjects) > 1 {
		return resultProjects, uuid, fmt.Sprintf("Polysite - %s:%s - %s", gitType, event, time.Now().UTC().Format("2006-01-02 15:04:05")), nil
	}
	return resultProjects, "", "", nil
}

func skipDeploy(message string) bool {
	// case-insensitive regex match for "[skip deploy]" or "[deploy skip]"
	re := regexp.MustCompile(`(?i)\[skip deploy\]|\[deploy skip\]`)
	return re.MatchString(message)
}

// Bitbucket does not provide a git-ssh URI to the repo in the webhook payload
// We the html repo link (example https://bitbucket.org/teamawesome/repository) to extract the correct target domain (bitbucket.org)
// this could be bitbuck.org(.com) or a private bitbucket server
// Also the git server could be running on another port than 22, so there is a second regex match for `:[0-9]`
func BitBucketGitURL(repositoryURL, fullName string) string {
	// https://github.com/uselagoon/lagoon/blob/v2.27.0/src/extractWebhookData.ts#L68-L78
	re := regexp.MustCompile(`https?:\/\/([a-z0-9-_.]*)(:[0-9]*)?\/`)
	matches := re.FindStringSubmatch(repositoryURL)
	if len(matches) == 0 {
		return ""
	}
	domain := matches[1]
	port := matches[2]
	var gitURL string
	if port == "" {
		gitURL = fmt.Sprintf("git@%s:%s.git", domain, fullName)
	} else {
		gitURL = fmt.Sprintf("ssh://git@%s%s/%s.git", domain, port, fullName)
	}
	return gitURL
}
