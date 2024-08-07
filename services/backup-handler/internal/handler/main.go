package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/google/uuid"
	"github.com/isayme/go-amqp-reconnect/rabbitmq"
	"github.com/streadway/amqp"

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
	rabbitConn    *rabbitmq.Connection
	rabbitChannel *rabbitmq.Channel
	amqpURI       string
	Broker        RabbitBroker
	Endpoint      LagoonAPI
}

// RabbitBroker .
type RabbitBroker struct {
	Hostname     string `json:"hostname"`
	Port         string `json:"port"`
	Username     string `json:"username,omitempty"`
	Password     string `json:"password,omitempty"`
	QueueName    string `json:"queueName"`
	ExchangeName string `json:"exchangeName"`
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
func NewBackupHandler(broker RabbitBroker, graphql LagoonAPI) (BackupInterface, error) {
	var amqpURI string
	amqpURI = fmt.Sprintf("amqp://%s:%s@%s:%s", broker.Username, broker.Password, broker.Hostname, broker.Port)
	if broker.Username == "" && broker.Password == "" {
		amqpURI = fmt.Sprintf("amqp://%s:%s", broker.Hostname, broker.Port)
	}

	newBackupHandler := &BackupHandler{
		Broker:   broker,
		Endpoint: graphql,
		amqpURI:  amqpURI,
	}
	newBackupHandler.initAmqp()
	return newBackupHandler, nil
}

func (b *BackupHandler) initAmqp() {
	// github.com/isayme/go-amqp-reconnect/rabbitmq
	// reconnect to rabbit automatically eventually, but still accept webhooks (just fails and webhook data is lost)
	var err error
	b.rabbitConn, err = rabbitmq.Dial(b.amqpURI)
	failOnError(err, "Failed to connect to RabbitMQ")
	b.rabbitChannel, err = b.rabbitConn.Channel()
	failOnError(err, "Failed to open a channel")
	err = b.rabbitChannel.ExchangeDeclare(
		b.Broker.QueueName, // name
		"direct",           // type
		true,               // durable
		false,              // auto-deleted
		false,              // internal
		false,              // no-wait
		nil,                // arguments
	)
	failOnError(err, "Could not declare exchange")
	queue, err := b.rabbitChannel.QueueDeclare(
		b.Broker.QueueName,
		true,
		false,
		false,
		false,
		nil)
	failOnError(err, "Could not declare queue")
	err = b.rabbitChannel.QueueBind(
		queue.Name,            // queue name
		"",                    // routing key
		b.Broker.ExchangeName, // exchange
		false,
		nil)
	failOnError(err, "Failed to bind queue")
}

// add our backup to the message queue to be processed
func (b *BackupHandler) addToMessageQueue(message Webhook) {
	backupMessage, _ := json.Marshal(message)
	err := b.rabbitChannel.Publish(
		"",
		b.Broker.QueueName,
		false, // mandatory
		false, // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(backupMessage),
		})
	if message.Body.Snapshots != nil {
		log.Printf("webhook for %s, snapshotname %s, ID:%s added to queue", message.Webhooktype+":"+message.Event, message.Body.Snapshots[0].Hostname, message.Body.Snapshots[0].ID)
	} else {
		log.Printf("webhook for %s, ID:%s added to queue", message.Webhooktype+":"+message.Event, message.Body.SnapshotID)
	}
	failOnError(err, "Failed to publish a message")
}

// WebhookHandler handles processing the actual webhooks that come in via the http listener
func (b *BackupHandler) WebhookHandler(w http.ResponseWriter, r *http.Request) {
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
			singleBackup := Webhook{
				Webhooktype: "resticbackup",
				Event:       "restore:finished",
				UUID:        uuid.New().String(),
				Body:        backupData,
			}
			b.addToMessageQueue(singleBackup)
			// else handle snapshots
		} else if backupData.Snapshots != nil {
			// use the name from the webhook to get the environment in the api
			ctx := context.Background()
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
			addBackups := ProcessBackups(backupData, backupsEnv.Backups)
			for _, backup := range addBackups {
				b.addToMessageQueue(backup)
			}
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

// ProcessBackups actually process the backups here, check that the ones we want to add to the API aren't already in the API
func ProcessBackups(backupData Backups, backupsEnv []schema.Backup) []Webhook {
	var addBackups []Webhook
	for _, snapshotData := range backupData.Snapshots {
		// we want to check that we match the name to the project/environment properly and capture any prebackuppods too
		matched, _ := regexp.MatchString("^"+backupData.Name+"-mariadb$|^"+backupData.Name+"-mariadb-single$|^"+backupData.Name+"-.*-prebackuppod$|^"+backupData.Name+"$", snapshotData.Hostname)
		if matched {
			// if the snapshot id is not in already in the api, then we want to add this backup to the webhooks queue
			// this results in far less messages being sent to the queue as only new snapshots will be added
			if !backupInEnvironment(backupsEnv, snapshotData.ID) {
				singleBackup := Webhook{
					Webhooktype: "resticbackup",
					Event:       "snapshot:finished",
					UUID:        uuid.New().String(),
					Body: Backups{
						Name:          backupData.Name,
						BucketName:    backupData.BucketName,
						BackupMetrics: backupData.BackupMetrics,
						Snapshots: []Snapshot{
							snapshotData,
						},
					},
				}
				addBackups = append(addBackups, singleBackup)
			}
		}
	}
	// return the ones we added
	return addBackups
}

func failOnError(err error, msg string) {
	if err != nil {
		log.Printf("rabbit failure, error is %s/%s:", msg, err.Error())
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
