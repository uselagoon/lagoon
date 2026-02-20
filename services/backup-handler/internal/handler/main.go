package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/uselagoon/machinery/api/lagoon"
	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/jwt"
)

// BackupInterface .
type BackupInterface interface {
	WebhookHandler(w http.ResponseWriter, r *http.Request)
}

// BackupHandler .
type BackupHandler struct {
	Endpoint LagoonAPI
}

// GraphQLEndpoint .
type GraphQLEndpoint struct {
	Endpoint        string `json:"endpoint"`
	JWTAudience     string `json:"audience"`
	TokenSigningKey string `json:"tokenSigningKey"`
}

// LagoonAPI .
type LagoonAPI struct {
	Endpoint        string `json:"endpoint"`
	JWTAudience     string `json:"audience"`
	TokenSigningKey string `json:"tokenSigningKey"`
	JWTSubject      string `json:"subject"`
	JWTIssuer       string `json:"issuer"`
	Version         string `json:"version"`
}

// NewBackupHandler .
func NewBackupHandler(graphql LagoonAPI) (BackupInterface, error) {
	newBackupHandler := &BackupHandler{
		Endpoint: graphql,
	}
	return newBackupHandler, nil
}

// WebhookHandler handles processing the actual webhooks that come in via the http listener
func (b *BackupHandler) WebhookHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	var backupData Backups
	// decode the body result into the backups struct
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&backupData)
	if err != nil {
		log.Printf("unable to decode json data from webhook, error is %s:", err.Error())
	} else {
		// get backups from the API
		// handle restores
		if backupData.RestoreLocation != "" {
			token, err := jwt.GenerateAdminToken(b.Endpoint.TokenSigningKey, b.Endpoint.JWTAudience, b.Endpoint.JWTSubject, b.Endpoint.JWTIssuer, time.Now().Unix(), 60)
			if err != nil {
				// the token wasn't generated
				log.Printf("unable to generate token: %v", err)
				return
			}
			l := lclient.New(b.Endpoint.Endpoint, b.Endpoint.JWTSubject, b.Endpoint.Version, &token, false)
			input := schema.UpdateRestoreInput{
				BackupID: backupData.SnapshotID,
				Patch: schema.UpdateRestorePatchInput{
					RestoreLocation: backupData.RestoreLocation,
					Status:          schema.RestoreSuccessful,
				},
			}
			restore, err := lagoon.UpdateRestore(ctx, input, l)
			if err != nil {
				log.Printf("unable to add backup from webhook, error is: %v", err)
			} else {
				log.Printf("updated restore %s", restore.BackupID)
			}
			// else handle snapshots
		} else if backupData.Snapshots != nil {
			// use the name from the webhook to get the environment in the api
			token, err := jwt.GenerateAdminToken(b.Endpoint.TokenSigningKey, b.Endpoint.JWTAudience, b.Endpoint.JWTSubject, b.Endpoint.JWTIssuer, time.Now().Unix(), 60)
			if err != nil {
				// the token wasn't generated
				log.Printf("unable to generate token: %v", err)
				return
			}
			l := lclient.New(b.Endpoint.Endpoint, b.Endpoint.JWTSubject, b.Endpoint.Version, &token, false)
			backupsEnv, err := lagoon.GetBackupsByEnvironmentNamespace(ctx, backupData.Name, l)
			if err != nil {
				log.Printf("unable to connect to the api, error is %s:", err.Error())
				return
			}
			if backupsEnv.OpenshiftProjectName != backupData.Name {
				log.Printf("unable to handle backups, returned environment does not match namespace for backups %s", backupData.Name)
				return
			}
			// remove backups that no longer exists from the api
			for index, backup := range backupsEnv.Backups {
				// check that the backup in the api is not in the webhook payload
				if !apiBackupInWebhook(backupData.Snapshots, backup.BackupID) {
					// if the backup in the api is not in the webhook payload
					// remove it from the webhook payload data
					removeSnapshot(backupData.Snapshots, index)
					// now delete it from the api as it no longer exists
					_, err := lagoon.DeleteBackup(ctx, backup.BackupID, l)
					if err != nil {
						// log, but don't break the loop
						log.Printf("unable to delete backup %v from api, error is %s:", backup.BackupID, err.Error())
					} else {
						log.Printf("deleted backup %s for %s", backup.BackupID, backupsEnv.OpenshiftProjectName)
					}
				}
			}

			// if we get this far, then the payload data from the webhook should only have snapshots that are new or exist in the api
			b.processBackups(ctx, backupData, backupsEnv.Backups, backupsEnv)
		} else {
			// if we get something that we don't know how to handle, spit out what it is so we can check it in the logs
			backupJSON, err := json.Marshal(backupData)
			if err != nil {
				log.Printf("unable to handle webhook, error is: %v", err)
			}
			log.Printf("unable to handle webhook, data is: %v", string(backupJSON))
		}
	}
}

// processBackups actually process the backups here, check that the ones we want to add to the API aren't already in the API
func (b *BackupHandler) processBackups(ctx context.Context, backupData Backups, backupsEnv []schema.Backup, environment *schema.Environment) {
	for _, snapshotData := range backupData.Snapshots {
		// we want to check that we match the name to the project/environment properly and capture any prebackuppods too
		matched, _ := regexp.MatchString("^"+backupData.Name+"-mariadb$|^"+backupData.Name+"-mariadb-single$|^"+backupData.Name+"-.*-prebackuppod$|^"+backupData.Name+"$", snapshotData.Hostname)
		if matched {
			// if the snapshot id is not in already in the api, then we want to add this backup to the api
			if !backupInEnvironment(backupsEnv, snapshotData.ID) {
				// generate a short lived token for this loop
				token, err := jwt.GenerateAdminToken(b.Endpoint.TokenSigningKey, b.Endpoint.JWTAudience, b.Endpoint.JWTSubject, b.Endpoint.JWTIssuer, time.Now().Unix(), 10)
				if err != nil {
					// the token wasn't generated
					log.Printf("unable to generate token: %v", err)
					continue
				}
				l := lclient.New(b.Endpoint.Endpoint, b.Endpoint.JWTSubject, b.Endpoint.Version, &token, false)
				backup, err := lagoon.AddBackup(ctx, environment.ID, getSnapshotSource(snapshotData), snapshotData.ID, snapshotData.Time.Format("2006-01-02 15:04:05"), l)
				if err != nil {
					log.Printf("unable to add backup %s from webhook, error is: %v", snapshotData.ID, err)
				} else {
					log.Printf("added backup %s for %s", backup.BackupID, environment.OpenshiftProjectName)
				}
			}
		}
	}
}

func removeSnapshot(snapshots []Snapshot, s int) []Snapshot {
	result := []Snapshot{}
	for idx, item := range snapshots {
		if idx == s {
			continue
		}
		result = append(result, item)
	}
	return result
}

func apiBackupInWebhook(snaphots []Snapshot, snaphot string) bool {
	for _, snap := range snaphots {
		if snap.ID == snaphot {
			return true
		}
	}
	return false
}

func backupInEnvironment(environment []schema.Backup, backup string) bool {
	for _, envBackup := range environment {
		if envBackup.BackupID == backup {
			return true
		}
	}
	return false
}

func getSnapshotSource(snapshot Snapshot) string {
	source := "unknown"
	if len(snapshot.Paths) == 0 {
		return source
	}
	path := snapshot.Paths[0]
	pattern := regexp.MustCompile(`^/data/([\w-]+)|([\w-]+)\.(?:sql|tar)$|([\w]+)-prebackuppod`)
	matches := pattern.FindStringSubmatch(path)
	if matches == nil {
		return source
	}
	for i := 1; i <= 3; i++ {
		if i < len(matches) && matches[i] != "" {
			return matches[i]
		}
	}
	return source
}
