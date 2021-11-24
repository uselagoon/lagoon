package schema

type Workflow struct {
	Id int `json:"id"`
	Event string `json:"event"`
	Project int `json:"project"`
	AdvancedTaskDefinition int `json:"advanced_task_definition"`
}


// Notification .
type Notification struct {
	Severity string `json:"severity"`
	Project  string `json:"project"`
	UUID     string `json:"uuid"`
	Event    string `json:"event"`
	Meta     struct {
		User struct {
			ID                string `json:"id"`
			PreferredUsername string `json:"preferred_username"`
			Email             string `json:"email"`
		} `json:"user"`
		Headers struct {
			UserAgent     string `json:"user-agent"`
			ContentType   string `json:"content-type"`
			ContentLength string `json:"content-length"`
			Host          string `json:"host"`
			IPAddress     string `json:"ipAddress"`
		} `json:"headers"`
		Project                  string `json:"project"`
		ProjectName              string `json:"projectName"`
		BranchName               string `json:"branchName`
		Event                    string `json:"event"`
		Level                    string `json:"level"`
		Message                  string `json:"message"`
		Timestamp                string `json:"timestamp"`
		ShortSha                 string `json:"shortSha"`
		BuildName                string `json:"buildName"`
		CommitURL                string `json:"commitUrl"`
		Environment              string `json:"environment"`
		EnvironmentID            string `json:"environmentId"`
		EnvironmentName          string `json:"environmentName"`
		Error                    string `json:"error"`
		JobName                  string `json:"jobName"`
		LogLink                  string `json:"logLink"`
		Name                     string `json:"name"`
		OpenshiftProject         string `json:"openshiftProject"`
		PromoteSourceEnvironment string `json:"promoteSourceEnvironment"`
		PullrequestNumber        string `json:"pullrequestNumber"`
		PullrequestTitle         string `json:"pullrequestTitle"`
		PullrequestURL           string `json:"pullrequestUrl"`
		RemoteID                 string `json:"remoteId"`
		RepoFullName             string `json:"repoFullName"`
		RepoName                 string `json:"repoName"`
		RepoURL                  string `json:"repoUrl"`
		Route                    string `json:"route"`
		Routes                   string `json:"routes"`
		Task                     string `json:"task"`
	} `json:"meta"`
	Message string `json:"message"`
}
