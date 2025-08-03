package gitlab

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/uselagoon/lagoon/services/webhooks/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

type ProjectCreate struct {
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	EventName  string    `json:"event_name"`
	Name       string    `json:"name"`
	OwnerEmail string    `json:"owner_email"`
	OwnerName  string    `json:"owner_name"`
	Owners     []struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	} `json:"owners"`
	Path               string `json:"path"`
	PathWithNamespace  string `json:"path_with_namespace"`
	ProjectID          int    `json:"project_id"`
	ProjectNamespaceID int    `json:"project_namespace_id"`
	ProjectVisibility  string `json:"project_visibility"`
}

type ProjectRenameTransfer struct {
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
	EventName         string    `json:"event_name"`
	Name              string    `json:"name"`
	Path              string    `json:"path"`
	PathWithNamespace string    `json:"path_with_namespace"`
	ProjectID         int       `json:"project_id"`
	OwnerName         string    `json:"owner_name"`
	OwnerEmail        string    `json:"owner_email"`
	Owners            []struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	} `json:"owners"`
	ProjectNamespaceID   int    `json:"project_namespace_id"`
	ProjectVisibility    string `json:"project_visibility"`
	OldPathWithNamespace string `json:"old_path_with_namespace"`
}

type ProjectDestroy struct {
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	EventName  string    `json:"event_name"`
	Name       string    `json:"name"`
	OwnerEmail string    `json:"owner_email"`
	OwnerName  string    `json:"owner_name"`
	Owners     []struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	} `json:"owners"`
	Path               string `json:"path"`
	PathWithNamespace  string `json:"path_with_namespace"`
	ProjectID          int    `json:"project_id"`
	ProjectNamespaceID int    `json:"project_namespace_id"`
	ProjectVisibility  string `json:"project_visibility"`
}

func (sh *SystemHook) gitlabProjectCreate(b []byte) {
	var w ProjectCreate
	_ = json.Unmarshal(b, &w)
	glProject, _, err := sh.client.Projects.GetProject(w.ProjectID, nil)
	if err != nil {
		log.Println(err)
		return
	}
	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Printf("ERROR1: %v", err)
		return
	}
	data, _ := json.Marshal(b)
	agi := &schema.AddProjectInput{
		Name:                  glProject.Path,
		GitURL:                glProject.SSHURLToRepo,
		ProductionEnvironment: "main",
		Openshift:             1,
	}
	json.Unmarshal(data, agi)
	project := schema.Project{}
	err = lc.AddProject(context.Background(), agi, &project)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		return
	}
	log.Println(project)
}

func (sh *SystemHook) gitlabProjectUpdate(b []byte) {
	var w ProjectRenameTransfer
	_ = json.Unmarshal(b, &w)
	log.Println(w)
}
func (sh *SystemHook) gitlabProjectDelete(b []byte) {
	var w ProjectDestroy
	_ = json.Unmarshal(b, &w)
	log.Println(w)
}
