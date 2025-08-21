package gitlab

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/uselagoon/lagoon/services/webhook-handler/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
	gitlab "gitlab.com/gitlab-org/api/client-go"
)

type KeyCreateDestroy struct {
	EventName string    `json:"event_name"`
	CreatedAt string    `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Username  string    `json:"username"`
	Key       string    `json:"key"`
	ID        int       `json:"id"`
}

func (sh *SystemHook) gitlabSshKeyAdd(b []byte) {
	var w KeyCreateDestroy
	_ = json.Unmarshal(b, &w)
	log.Println(w)
	glKey, _, err := sh.client.Users.GetSSHKey(w.ID, nil)
	if err != nil {
		log.Printf("ERROR1: %v", err)
		sh.handleError("Could not create key, reason:", err)
		return
	}
	glUsers, _, err := sh.client.Users.ListUsers(&gitlab.ListUsersOptions{Username: &w.Username}, nil)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		sh.handleError("Could not create key, reason:", err)
		return
	}
	if len(glUsers) == 1 {
		lc, err := lagoon.GetClient(sh.LagoonAPI)
		if err != nil {
			log.Printf("ERROR3: %v", err)
			sh.handleError("Could not create key, reason:", err)
			return
		}
		sshKey := &schema.AddUserSSHPublicKeyInput{
			UserEmail: glUsers[0].Email,
			PublicKey: w.Key,
			Name:      glKey.Title,
		}
		lSSHKey := schema.SSHKey{}
		err = lc.AddUserSSHPublicKey(context.Background(), sshKey, &lSSHKey)
		if err != nil {
			log.Printf("ERROR4: %v", err)
			sh.handleError("Could not create key, reason:", err)
			return
		}
		log.Println(lSSHKey)
		sh.Messaging.SendToLagoonLogs("info", "", "", "gitlab:key_create:handled", fmt.Sprintf("Added key to user %v", glUsers[0].Email), schema.LagoonLogMeta{})
	}
}

func (sh *SystemHook) gitlabSshKeyRemove(b []byte) {
	var w KeyCreateDestroy
	_ = json.Unmarshal(b, &w)
	log.Println(w)
	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Printf("ERROR1: %v", err)
		sh.handleError("Could not delete key, reason:", err)
		return
	}
	lUser := schema.User{}
	err = lc.UserBySSHKey(context.Background(), w.Key, &lUser)
	if err != nil {
		log.Printf("ERROR2: %v", err)
		sh.handleError("Could not delete key, reason:", err)
		return
	}
	err = lc.GetUserSSHKeysByEmail(context.Background(), lUser.Email, &lUser)
	if err != nil {
		log.Printf("ERROR3: %v", err)
		sh.handleError("Could not delete key, reason:", err)
		return
	}
	for _, key := range lUser.SSHKeys {
		if fmt.Sprintf("%s %s", key.KeyType, key.KeyValue) == w.Key {
			err = lc.DeleteUserSSHPublicKey(context.Background(), key.ID, nil)
			if err != nil {
				log.Printf("ERROR4: %v", err)
				sh.handleError("Could not delete key, reason:", err)
				return
			}
			sh.Messaging.SendToLagoonLogs("info", "", "", "gitlab:key_destroy:handled", fmt.Sprintf("Deleted key %v", key.ID), schema.LagoonLogMeta{})
		}
	}
}
