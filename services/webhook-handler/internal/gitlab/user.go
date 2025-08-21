package gitlab

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/uselagoon/lagoon/services/webhook-handler/internal/lagoon"
	gitlab "gitlab.com/gitlab-org/api/client-go"

	"github.com/uselagoon/machinery/api/schema"
)

type UserCreate struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Email     string    `json:"email"`
	EventName string    `json:"event_name"`
	Name      string    `json:"name"`
	Username  string    `json:"username"`
	UserID    int       `json:"user_id"`
}

type UserRename struct {
	EventName   string    `json:"event_name"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Name        string    `json:"name"`
	Email       string    `json:"email"`
	UserID      int       `json:"user_id"`
	Username    string    `json:"username"`
	OldUsername string    `json:"old_username"`
}

type UserDestroy struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Email     string    `json:"email"`
	EventName string    `json:"event_name"`
	Name      string    `json:"name"`
	Username  string    `json:"username"`
	UserID    int       `json:"user_id"`
}

type UserAddToGroup struct {
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
	GroupName    string      `json:"group_name"`
	GroupPath    string      `json:"group_path"`
	GroupID      int         `json:"group_id"`
	UserUsername string      `json:"user_username"`
	UserName     string      `json:"user_name"`
	UserEmail    string      `json:"user_email"`
	UserID       int         `json:"user_id"`
	GroupAccess  string      `json:"group_access"`
	ExpiresAt    time.Time   `json:"expires_at"`
	GroupPlan    interface{} `json:"group_plan"`
	EventName    string      `json:"event_name"`
}

type UserRemoveFromGroup struct {
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	EventName    string    `json:"event_name"`
	GroupAccess  string    `json:"group_access"`
	GroupID      int       `json:"group_id"`
	GroupName    string    `json:"group_name"`
	GroupPath    string    `json:"group_path"`
	UserEmail    string    `json:"user_email"`
	UserName     string    `json:"user_name"`
	UserUsername string    `json:"user_username"`
	UserID       int       `json:"user_id"`
}

type UserAddToTeam struct {
	CreatedAt                time.Time `json:"created_at"`
	UpdatedAt                time.Time `json:"updated_at"`
	ProjectName              string    `json:"project_name"`
	ProjectPath              string    `json:"project_path"`
	ProjectPathWithNamespace string    `json:"project_path_with_namespace"`
	ProjectID                int       `json:"project_id"`
	UserUsername             string    `json:"user_username"`
	UserName                 string    `json:"user_name"`
	UserEmail                string    `json:"user_email"`
	UserID                   int       `json:"user_id"`
	AccessLevel              string    `json:"access_level"`
	ProjectVisibility        string    `json:"project_visibility"`
	EventName                string    `json:"event_name"`
}

type UserRemoveFromTeam struct {
	CreatedAt                time.Time `json:"created_at"`
	UpdatedAt                time.Time `json:"updated_at"`
	EventName                string    `json:"event_name"`
	AccessLevel              string    `json:"access_level"`
	ProjectID                int       `json:"project_id"`
	ProjectName              string    `json:"project_name"`
	ProjectPath              string    `json:"project_path"`
	ProjectPathWithNamespace string    `json:"project_path_with_namespace"`
	UserEmail                string    `json:"user_email"`
	UserName                 string    `json:"user_name"`
	UserUsername             string    `json:"user_username"`
	UserID                   int       `json:"user_id"`
	ProjectVisibility        string    `json:"project_visibility"`
}

func (sh *SystemHook) gitlabUserCreate(b []byte) {
	var w UserCreate
	_ = json.Unmarshal(b, &w)
	glUser, _, err := sh.client.Users.GetUser(w.UserID, gitlab.GetUsersOptions{}, nil)
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
	user := &schema.AddUserInput{
		Email:    glUser.Email,
		GitlabID: uint(glUser.ID),
	}
	name := strings.Split(glUser.Name, " ")
	if len(name) > 1 {
		user.FirstName = name[0]
		user.LastName = name[1]
	} else {
		user.FirstName = glUser.Name
	}
	json.Unmarshal(data, user)
	lUser := schema.User{}
	err = lc.AddUser(context.Background(), user, &lUser)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		return
	}
	log.Println(lUser)
}

func (sh *SystemHook) gitlabUserUpdate(b []byte) {
	var w UserRename
	_ = json.Unmarshal(b, &w)
	glUser, _, err := sh.client.Users.GetUser(w.UserID, gitlab.GetUsersOptions{}, nil)
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
	gluID := uint(glUser.ID)
	user := &schema.UpdateUserInput{
		User: schema.UserInput{
			Email: glUser.Email,
		},
		Patch: schema.UpdateUserPatchInput{
			GitlabID: &gluID,
		},
	}
	name := strings.Split(glUser.Name, " ")
	if len(name) > 1 {
		user.Patch.FirstName = &name[0]
		user.Patch.LastName = &name[1]
	} else {
		user.Patch.FirstName = &glUser.Name
	}
	json.Unmarshal(data, user)
	lUser := schema.User{}
	err = lc.UpdateUser(context.Background(), user, &lUser)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		return
	}
	log.Println(lUser)
}

func (sh *SystemHook) gitlabUserDelete(b []byte) {
	var w UserDestroy
	_ = json.Unmarshal(b, &w)
	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Printf("ERROR1: %v", err)
		return
	}
	user := &schema.DeleteUserInput{
		User: schema.UserInput{
			Email: w.Email,
		},
	}
	lUser := schema.User{}
	err = lc.DeleteUser(context.Background(), user, &lUser)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		return
	}
	log.Println(lUser)
}

func (sh *SystemHook) gitlabUserGroupAdd(b []byte) {
	var w UserAddToGroup
	_ = json.Unmarshal(b, &w)
	group, _, err := sh.client.Groups.GetGroup(w.GroupID, nil)
	if err != nil {
		log.Println(err)
		return
	}
	glUser, _, err := sh.client.Users.GetUser(w.UserID, gitlab.GetUsersOptions{}, nil)
	if err != nil {
		log.Println(err)
		return
	}
	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Printf("ERROR1: %v", err)
		return
	}
	groupRole := &schema.UserGroupRoleInput{
		UserEmail: glUser.Email,
		GroupName: sanitizeGroupName(group.FullPath),
		GroupRole: schema.GroupRole(w.GroupAccess),
	}
	lGroup := schema.Group{}
	err = lc.AddUserToGroup(context.Background(), groupRole, &lGroup)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		return
	}
	log.Println(lGroup)
}

func (sh *SystemHook) gitlabUserGroupRemove(b []byte) {
	var w UserRemoveFromGroup
	_ = json.Unmarshal(b, &w)
	group, _, err := sh.client.Groups.GetGroup(w.GroupID, nil)
	if err != nil {
		log.Println(err)
		return
	}
	glUser, _, err := sh.client.Users.GetUser(w.UserID, gitlab.GetUsersOptions{}, nil)
	if err != nil {
		log.Println(err)
		return
	}
	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Printf("ERROR1: %v", err)
		return
	}
	groupRole := &schema.UserGroupInput{
		UserEmail: glUser.Email,
		GroupName: sanitizeGroupName(group.FullPath),
	}
	lGroup := schema.Group{}
	err = lc.RemoveUserFromGroup(context.Background(), groupRole, &lGroup)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		return
	}
	log.Println(lGroup)
}

func (sh *SystemHook) gitlabUserProjectAdd(b []byte) {
	var w UserAddToTeam
	_ = json.Unmarshal(b, &w)
	glUser, _, err := sh.client.Users.GetUser(w.UserID, gitlab.GetUsersOptions{}, nil)
	if err != nil {
		log.Println(err)
		return
	}
	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Printf("ERROR1: %v", err)
		return
	}
	groupRole := &schema.UserGroupRoleInput{
		UserEmail: glUser.Email,
		GroupName: fmt.Sprintf("project-%s", w.ProjectPath),
		GroupRole: schema.GroupRole(w.AccessLevel),
	}
	lGroup := schema.Group{}
	err = lc.AddUserToGroup(context.Background(), groupRole, &lGroup)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		return
	}
	log.Println(lGroup)
}

func (sh *SystemHook) gitlabUserProjectRemove(b []byte) {
	var w UserRemoveFromTeam
	_ = json.Unmarshal(b, &w)
	glUser, _, err := sh.client.Users.GetUser(w.UserID, gitlab.GetUsersOptions{}, nil)
	if err != nil {
		log.Println(err)
		return
	}
	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Printf("ERROR1: %v", err)
		return
	}
	groupRole := &schema.UserGroupInput{
		UserEmail: glUser.Email,
		GroupName: fmt.Sprintf("project-%s", w.ProjectPath),
	}
	lGroup := schema.Group{}
	err = lc.RemoveUserFromGroup(context.Background(), groupRole, &lGroup)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		return
	}
	log.Println(lGroup)
}
