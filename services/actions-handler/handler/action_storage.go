package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/cheshir/go-mq"
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
	BytesUsed            int    `json:"bytesUsed"`
}

func (m *Messenger) handleUpdateStorage(ctx context.Context, messageQueue mq.MQ, action *Action, messageID string) {
	prefix := fmt.Sprintf("(messageid:%s) %s: ", messageID, action.EventType)
	data, _ := json.Marshal(action.Data)
	storageClaims := Storage{}
	json.Unmarshal(data, &storageClaims)
	token, err := jwt.GenerateAdminToken(m.LagoonAPI.TokenSigningKey, m.LagoonAPI.JWTAudience, m.LagoonAPI.JWTSubject, m.LagoonAPI.JWTIssuer, time.Now().Unix(), 60)
	if err != nil {
		// the token wasn't generated
		if m.EnableDebug {
			log.Println(fmt.Sprintf("%sERROR: unable to generate token: %v", prefix, err))
		}
		return
	}
	// the action data can contain multiple storage claims, so iterate over them here
	for _, sc := range storageClaims.Claims {
		sci := schema.UpdateEnvironmentStorageInput{}
		scdata, _ := json.Marshal(sc)
		json.Unmarshal(scdata, &sci)
		l := lclient.New(m.LagoonAPI.Endpoint, "actions-handler", &token, false)
		environment, err := lagoon.UpdateStorage(ctx, &sci, l)
		if err != nil {
			// send the log to the lagoon-logs exchange to be processed
			m.toLagoonLogs(messageQueue, map[string]interface{}{
				"severity": "error",
				"event":    fmt.Sprintf("actions-handler:%s:error", action.EventType),
				"meta":     sci,
				"message":  err.Error(),
			})
			if m.EnableDebug {
				log.Println(fmt.Sprintf("%sERROR: unable to update storage in the api: %v", prefix, err))
			}
			// try and update the next storage claim if there is one
			continue
		}
		// send the log to the lagoon-logs exchange to be processed
		m.toLagoonLogs(messageQueue, map[string]interface{}{
			"severity": "info",
			"event":    fmt.Sprintf("actions-handler:%s:updated", action.EventType),
			"meta":     sci,
			"message":  fmt.Sprintf("updated environment: %v, storage claim: %s, id: %v", sci.Environment, sci.PersisteStorageClaim, environment.ID),
		})
		if m.EnableDebug {
			log.Println(fmt.Sprintf("%supdated environment: %v, storage claim: %s, id: %v", prefix, sci.Environment, sci.PersisteStorageClaim, environment.ID))
		}

	}
}
