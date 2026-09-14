package gitlab

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
	gitlab "gitlab.com/gitlab-org/api/client-go"
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

var deployTargetID uint = 1

func (sh *SystemHook) gitlabProjectCreate(b []byte) {
	var w ProjectCreate
	_ = json.Unmarshal(b, &w)
	ctx := context.Background()
	glProject, _, err := sh.client.Projects.GetProject(w.ProjectID, nil)
	if err != nil {
		log.Println("Could not get project, reason:", err)
		return
	}
	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Println("Could not create client, reason:", err)
		return
	}
	data, _ := json.Marshal(b)
	agi := &schema.AddProjectInput{
		Name:                  glProject.Path,
		GitURL:                glProject.SSHURLToRepo,
		ProductionEnvironment: "main",
		Openshift:             deployTargetID,
	}
	json.Unmarshal(data, agi)
	project := schema.Project{}
	err = lc.AddProject(ctx, agi, &project)
	if err != nil {
		log.Println("Could not add project, reason:", err)
		return
	}

	projectKey := schema.Project{}
	err = lc.ProjectKeyByName(ctx, project.Name, false, &projectKey)
	if err != nil {
		log.Println("Could not get project key, reason:", err)
	} else {
		keyTitle := "Lagoon Project Key"
		canPush := false
		sh.client.DeployKeys.AddDeployKey(w.ProjectID, &gitlab.AddDeployKeyOptions{
			Title:   &keyTitle,
			Key:     &projectKey.PublicKey,
			CanPush: &canPush,
		})
	}
	gtpi := &schema.ProjectGroupsInput{
		Project: schema.ProjectInput{
			Name: project.Name,
		},
		Groups: []schema.GroupInput{
			{
				Name: sanitizeGroupName(glProject.Namespace.FullPath),
			},
		},
	}
	projectwGroup := schema.Project{}
	if err := lc.AddGroupsToProject(ctx, gtpi, &projectwGroup); err != nil {
		log.Println("Could not add group to project, reason:", err)
		return
	}

	log.Printf("Created project %v", project.Name)
}

func (sh *SystemHook) gitlabProjectUpdate(b []byte) {
	var w ProjectRenameTransfer
	_ = json.Unmarshal(b, &w)

	glProject, _, err := sh.client.Projects.GetProject(w.ProjectID, nil)
	if err != nil {
		log.Println("Could not get project info from Gitlab, reason:", err)
		return
	}

	// check project topics against excluded topics
	if hasExcludedTopic(glProject.Topics, sh.GitlabAPI.ExcludeProjectUpdateTopics) {
		log.Println("Ignoring project update as has topic in exclusion list")
		return
	}

	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Println("Could not create client, reason:", err)
		return
	}

	ctx := context.Background()
	projectName := glProject.Path
	gitURL := glProject.SSHURLToRepo

	if glProject.Namespace.Kind != "group" {
		if err := lc.DeleteProject(ctx, projectName, nil); err != nil {
			log.Println("Could not delete project, reason:", err)
			return
		}
		log.Printf("Deleted project %v: not in group namespace anymore", projectName)
		return
	}

	project := schema.Project{}
	err = lc.ProjectByName(ctx, projectName, &project)
	if err != nil {
		// project doesn't exist, or failed to get, so create it

		productionEnvironment := "master"

		agi := &schema.AddProjectInput{
			Name:                  projectName,
			GitURL:                gitURL,
			ProductionEnvironment: productionEnvironment,
			// TODO: figure out openshift id
			Openshift: deployTargetID,
		}
		addedProject := schema.Project{}
		if err := lc.AddProject(ctx, agi, &addedProject); err != nil {
			log.Println("Could not add project, reason:", err)
			return
		}
		gtpi := &schema.ProjectGroupsInput{
			Project: schema.ProjectInput{
				Name: projectName,
			},
			Groups: []schema.GroupInput{
				{
					Name: sanitizeGroupName(glProject.Namespace.FullPath),
				},
			},
		}
		if err := lc.AddGroupsToProject(ctx, gtpi, &addedProject); err != nil {
			log.Println("Could not add group to project, reason:", err)
			return
		}

		log.Printf("Added project %v: transfer to group namespace", projectName)
		return
	} else {
		// update the project
		upi := schema.UpdateProjectPatchInput{
			GitURL: &gitURL,
		}
		err = lc.UpdateProject(ctx, uint(project.ID), upi, &project)
		if err != nil {
			log.Println("Could not update project, reason:", err)
			return
		}
	}

	// handle group transfer, move project from old group to new group.
	if w.EventName == "project_transfer" && w.PathWithNamespace != w.OldPathWithNamespace {
		oldNamespace := strings.TrimSuffix(w.OldPathWithNamespace, "/"+projectName)
		oldGroupName := sanitizeGroupName(oldNamespace)
		newGroupName := sanitizeGroupName(glProject.Namespace.FullPath)

		rgfp := &schema.ProjectGroupsInput{
			Project: schema.ProjectInput{
				Name: projectName,
			},
			Groups: []schema.GroupInput{
				{
					Name: oldGroupName,
				},
			},
		}
		if err := lc.RemoveGroupsFromProject(ctx, rgfp, &project); err != nil {
			log.Printf("Could not remove group %s from project %s, reason: %v", oldGroupName, projectName, err)
		}

		agtp := &schema.ProjectGroupsInput{
			Project: schema.ProjectInput{
				Name: projectName,
			},
			Groups: []schema.GroupInput{
				{
					Name: newGroupName,
				},
			},
		}
		if err := lc.AddGroupsToProject(ctx, agtp, &project); err != nil {
			log.Printf("Could not add group %s to project %s, reason: %v", newGroupName, projectName, err)
		}
	}

	log.Printf("Updated project %v", projectName)
}

func (sh *SystemHook) gitlabProjectDelete(b []byte) {
	var w ProjectDestroy
	_ = json.Unmarshal(b, &w)

	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Println("Could not create client, reason:", err)
		return
	}

	ctx := context.Background()
	projectName := w.Path
	groupName := sanitizeGroupName(strings.TrimSuffix(w.PathWithNamespace, "/"+projectName))

	groupProjects := []schema.Group{}
	if err := lc.GroupProjects(ctx, groupName, &groupProjects); err != nil {
		log.Println("Could not get group projects, reason:", err)
		return
	}

	projectExists := false
	for _, group := range groupProjects {
		for _, p := range group.Projects {
			if p.Name == projectName {
				projectExists = true
				break
			}
		}
	}

	if projectExists {
		if err := lc.DeleteProject(ctx, projectName, nil); err != nil {
			log.Println("Could not delete project, reason:", err)
			return
		}
		log.Printf("Deleted project %v", projectName)
		return
	}

	log.Printf("Project %s not a member of group %s", projectName, groupName)
}
