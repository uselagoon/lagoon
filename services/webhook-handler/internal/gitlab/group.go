package gitlab

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/uselagoon/lagoon/services/webhook-handler/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

type GroupRename struct {
	EventName   string    `json:"event_name"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Name        string    `json:"name"`
	Path        string    `json:"path"`
	FullPath    string    `json:"full_path"`
	GroupID     int       `json:"group_id"`
	OldPath     string    `json:"old_path"`
	OldFullPath string    `json:"old_full_path"`
}

type GroupCreate struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	EventName string    `json:"event_name"`
	Name      string    `json:"name"`
	Path      string    `json:"path"`
	GroupID   int       `json:"group_id"`
}

type GroupDestroy struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	EventName string    `json:"event_name"`
	Name      string    `json:"name"`
	Path      string    `json:"path"`
	GroupID   int       `json:"group_id"`
}

func (sh *SystemHook) gitlabGroupCreate(b []byte) {
	var w GroupCreate
	_ = json.Unmarshal(b, &w)
	group, _, err := sh.client.Groups.GetGroup(w.GroupID, nil)
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
	agi := &schema.AddGroupInput{
		Name: sanitizeGroupName(group.FullPath),
	}
	json.Unmarshal(data, agi)
	lGroup := schema.Group{}
	err = lc.AddGroup(context.Background(), agi, &lGroup)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		return
	}
	log.Println(lGroup)
}

func (sh *SystemHook) gitlabGroupUpdate(b []byte) {
	var w GroupRename
	_ = json.Unmarshal(b, &w)
	group, _, err := sh.client.Groups.GetGroup(w.GroupID, nil)
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
	gName := sanitizeGroupName(group.FullPath)
	ugi := &schema.UpdateGroupInput{
		Group: schema.GroupInput{
			Name: sanitizeGroupName(w.OldFullPath),
		},
		Patch: schema.UpdateGroupPatchInput{
			Name: &gName,
		},
	}
	json.Unmarshal(data, ugi)
	lGroup := schema.Group{}
	err = lc.UpdateGroup(context.Background(), ugi, &lGroup)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		return
	}
	log.Println(lGroup)
}

func (sh *SystemHook) gitlabGroupDelete(b []byte) {
	var w GroupDestroy
	_ = json.Unmarshal(b, &w)
	group, _, err := sh.client.Groups.GetGroup(w.GroupID, nil)
	if err != nil {
		log.Println(err)
		return
	}
	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Printf("ERROR1: %v", err)
		return
	}
	lGroup := schema.DeleteGroupInput{}
	err = lc.DeleteGroup(context.Background(), sanitizeGroupName(group.FullPath), &lGroup)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		return
	}
	log.Println(lGroup)
}
