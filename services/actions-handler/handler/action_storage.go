package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	mq "github.com/cheshir/go-mq/v2"
	"github.com/uselagoon/machinery/api/lagoon"
	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/jwt"
)

// these are used for storage-calculator action data

type Storage struct {
	Claims []StorageClaim `json:"claims"`
}

type StorageClaim struct {
	Environment          int    `json:"environment"`
	PersisteStorageClaim string `json:"persistentStorageClaim"`
	BytesUsed            uint64 `json:"bytesUsed"`
	KiBUsed              uint64 `json:"kibUsed"`
}

func (m *Messenger) handleUpdateStorage(ctx context.Context, messageQueue *mq.MessageQueue, action *Action, messageID string) error {
	prefix := fmt.Sprintf("(messageid:%s) %s: ", messageID, action.EventType)
	data, _ := json.Marshal(action.Data)
	storageClaims := Storage{}
	json.Unmarshal(data, &storageClaims)
	token, err := jwt.GenerateAdminToken(m.LagoonAPI.TokenSigningKey, m.LagoonAPI.JWTAudience, m.LagoonAPI.JWTSubject, m.LagoonAPI.JWTIssuer, time.Now().Unix(), 60)
	if err != nil {
		// the token wasn't generated
		if m.EnableDebug {
			log.Printf("%sERROR: unable to generate token: %v", prefix, err)
		}
		return nil
	}
	// the action data can contain multiple storage claims, so iterate over them here
	var errs []error
	for _, sc := range storageClaims.Claims {
		l := lclient.New(m.LagoonAPI.Endpoint, "actions-handler", m.LagoonAPI.Version, &token, false)
		var envID int
		var hasErr error
		// if this is a newer storage calculator with the `kibUsed` field, use the new mutation
		if sc.KiBUsed != 0 {
			scoei := schema.UpdateStorageOnEnvironmentInput{}
			scdata, _ := json.Marshal(sc)
			json.Unmarshal(scdata, &scoei)
			environment, err := lagoon.UpdateStorageOnEnvironment(ctx, &scoei, l)
			if err != nil {
				hasErr = err
			} else {
				envID = environment.ID
			}
		} else {
			// else use the old mutation
			// @DEPRECATED to be removed in a future release
			sci := schema.UpdateEnvironmentStorageInput{}
			scdata, _ := json.Marshal(sc)
			json.Unmarshal(scdata, &sci)
			environment, err := lagoon.UpdateStorage(ctx, &sci, l)
			if err != nil {
				hasErr = err
			} else {
				envID = environment.ID
			}
		}
		if hasErr != nil {
			// send the log to the lagoon-logs exchange to be processed
			m.toLagoonLogs(messageQueue, map[string]interface{}{
				"severity": "error",
				"event":    fmt.Sprintf("actions-handler:%s:error", action.EventType),
				"meta":     sc,
				"message":  hasErr.Error(),
			})
			if m.EnableDebug {
				log.Printf("%sERROR: unable to update storage for environment %v in the api: %v", prefix, sc.Environment, hasErr)
			}
			// if the error is in LagoonAPIErrorCheck, this should be retried
			if LagoonAPIRetryErrorCheck(hasErr) == nil {
				errs = append(errs, hasErr)
			}
			// try and update the next storage claim if there is one
			continue
		}
		// send the log to the lagoon-logs exchange to be processed
		m.toLagoonLogs(messageQueue, map[string]interface{}{
			"severity": "info",
			"event":    fmt.Sprintf("actions-handler:%s:updated", action.EventType),
			"meta":     sc,
			"message":  fmt.Sprintf("updated environment: %v, storage claim: %s, id: %v", sc.Environment, sc.PersisteStorageClaim, envID),
		})
		if m.EnableDebug {
			log.Printf("%supdated environment: %v, storage claim: %s, id: %v", prefix, sc.Environment, sc.PersisteStorageClaim, envID)
		}
	}
	if len(errs) > 0 {
		// return the first one so that the handler will retry
		return errs[0]
	}
	return nil
}
