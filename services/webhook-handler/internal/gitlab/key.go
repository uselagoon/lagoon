package gitlab

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/uselagoon/lagoon/internal/lagoon"
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
		log.Println("Could not get users key, reason:", err)
		return
	}
	glUsers, _, err := sh.client.Users.ListUsers(&gitlab.ListUsersOptions{Username: &w.Username}, nil)
	if err != nil {
		log.Println("Could not list users in gitlab, reason:", err)
		return
	}
	if len(glUsers) == 1 {
		lc, err := lagoon.GetClient(sh.LagoonAPI)
		if err != nil {
			log.Println("Could not create client, reason:", err)
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
			log.Println("Could not create key, reason:", err)
			return
		}
		log.Printf("Added key to user %v", glUsers[0].Email)
	}
}

func (sh *SystemHook) gitlabSshKeyRemove(b []byte) {
	var w KeyCreateDestroy
	_ = json.Unmarshal(b, &w)
	log.Println(w)
	lc, err := lagoon.GetClient(sh.LagoonAPI)
	if err != nil {
		log.Println("Could not create client, reason:", err)
		return
	}
	lUser := schema.User{}
	err = lc.UserBySSHKey(context.Background(), w.Key, &lUser)
	if err != nil {
		log.Println("Could not get user by key, reason:", err)
		return
	}
	err = lc.GetUserSSHKeysByEmail(context.Background(), lUser.Email, &lUser)
	if err != nil {
		log.Println("Could not get users keys, reason:", err)
		return
	}
	for _, key := range lUser.SSHKeys {
		if fmt.Sprintf("%s %s", key.KeyType, key.KeyValue) == w.Key {
			err = lc.DeleteUserSSHPublicKey(context.Background(), key.ID, nil)
			if err != nil {
				log.Println("Could not delete key, reason:", err)
				return
			}
			log.Printf("Deleted key %v", key.ID)
		}
	}
}
