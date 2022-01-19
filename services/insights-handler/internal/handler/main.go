package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	cdx "github.com/CycloneDX/cyclonedx-go"
	"github.com/Khan/genqlient/graphql"
	"github.com/cheshir/go-mq"
	"github.com/matryer/try"

	"github.com/uselagoon/lagoon/services/insights-handler/internal/lagoonclient"
	"github.com/uselagoon/lagoon/services/insights-handler/internal/lagoonclient/jwt"
)

// RabbitBroker .
type RabbitBroker struct {
	Hostname     string `json:"hostname"`
	Port         string `json:"port"`
	Username     string `json:"username,omitempty"`
	Password     string `json:"password,omitempty"`
	QueueName    string `json:"queueName"`
	ExchangeName string `json:"exchangeName"`
}

// LagoonAPI .
type LagoonAPI struct {
	Endpoint        string `json:"endpoint"`
	JWTAudience     string `json:"audience"`
	TokenSigningKey string `json:"tokenSigningKey`
	JWTSubject      string `json:"subject"`
	JWTIssuer       string `json:"issuer"`
}

// Action is the structure of an action that is received via the message queue.
type Action struct {
	Type      string                 `json:"type"`      // defines the action type
	EventType string                 `json:"eventType"` // defines the eventtype field in the event notification
	Data      map[string]interface{} `json:"data"`      // contains the payload for the action, this could be any json so using a map
}

type LagoonLogMeta struct {
	ProjectName    string                  `json:"projectName,omitempty"`
	BranchName     string                  `json:"branchName,omitempty"`
	BuildName      string                  `json:"buildName,omitempty"`
	BuildPhase     string                  `json:"buildPhase,omitempty"`
	EndTime        string                  `json:"endTime,omitempty"`
	Environment    string                  `json:"environment,omitempty"`
	EnvironmentID  *uint                   `json:"environmentId,omitempty"`
	JobName        string                  `json:"jobName,omitempty"`
	JobStatus      string                  `json:"jobStatus,omitempty"`
	LogLink        string                  `json:"logLink,omitempty"`
	MonitoringURLs []string                `json:"monitoringUrls,omitempty"`
	Project        string                  `json:"project,omitempty"`
	ProjectID      *uint                   `json:"projectId,omitempty"`
	RemoteID       string                  `json:"remoteId,omitempty"`
	Route          string                  `json:"route,omitempty"`
	Routes         []string                `json:"routes,omitempty"`
	StartTime      string                  `json:"startTime,omitempty"`
	Services       []string                `json:"services,omitempty"`
	Key            string                  `json:"key,omitempty"`
	AdvancedData   string                  `json:"advancedData,omitempty"`
	Cluster        string                  `json:"clusterName,omitempty"`
	SBOM           *map[string]interface{} `json:"sbom,omitempty"`
	SBOMUrl        string                  `json:"sbomUrl,omitempty"`
}

type LagoonLog struct {
	Severity string         `json:"severity,omitempty"`
	Project  string         `json:"project,omitempty"`
	UUID     string         `json:"uuid,omitempty"`
	Event    string         `json:"event,omitempty"`
	Meta     *LagoonLogMeta `json:"meta,omitempty"`
	Message  string         `json:"message,omitempty"`
}

type messaging interface {
	Consumer()
	Publish(string, []byte)
}

// Messaging is used for the config and client information for the messaging queue.
type Messaging struct {
	Config                  mq.Config
	LagoonAPI               LagoonAPI
	ConnectionAttempts      int
	ConnectionRetryInterval int
	EnableDebug             bool
}

// NewMessaging returns a messaging with config
func NewMessaging(config mq.Config, lagoonAPI LagoonAPI, startupAttempts int, startupInterval int, enableDebug bool) *Messaging {
	return &Messaging{
		Config:                  config,
		LagoonAPI:               lagoonAPI,
		ConnectionAttempts:      startupAttempts,
		ConnectionRetryInterval: startupInterval,
		EnableDebug:             enableDebug,
	}
}

// Consumer handles consuming messages sent to the queue that this action handler is connected to and processes them accordingly
func (h *Messaging) Consumer() {
	//ctx := context.TODO()

	var messageQueue mq.MQ
	// if no mq is found when the goroutine starts, retry a few times before exiting
	// default is 10 retry with 30 second delay = 5 minutes
	err := try.Do(func(attempt int) (bool, error) {
		var err error
		messageQueue, err = mq.New(h.Config)
		if err != nil {
			log.Println(err,
				fmt.Sprintf(
					"Failed to initialize message queue manager, retrying in %d seconds, attempt %d/%d",
					h.ConnectionRetryInterval,
					attempt,
					h.ConnectionAttempts,
				),
			)
			time.Sleep(time.Duration(h.ConnectionRetryInterval) * time.Second)
		}
		return attempt < h.ConnectionAttempts, err
	})
	if err != nil {
		log.Fatalf("Finally failed to initialize message queue manager: %v", err)
	}
	defer messageQueue.Close()

	go func() {
		for err := range messageQueue.Error() {
			log.Println(fmt.Sprintf("Caught error from message queue: %v", err))
		}
	}()

	forever := make(chan bool)

	// Handle any tasks that go to the queue
	log.Println("Listening for messages in queue lagoon-actions:items")
	err = messageQueue.SetConsumerHandler("items-queue", processingIncomingMessageQueueFactory(h))
	if err != nil {
		log.Println(fmt.Sprintf("Failed to set handler to consumer `%s`: %v", "items-queue", err))
	}
	<-forever
}

type authedTransport struct {
	wrapped http.RoundTripper
	h       *Messaging
}

func (t *authedTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	//grab events for project
	token, err := jwt.OneMinuteAdminToken(t.h.LagoonAPI.TokenSigningKey, t.h.LagoonAPI.JWTAudience, t.h.LagoonAPI.JWTSubject, t.h.LagoonAPI.JWTIssuer)
	if err != nil {
		// the token wasn't generated
		if t.h.EnableDebug {
			log.Println(err)
		}
		return nil, err
	}
	req.Header.Set("Authorization", "bearer "+token)
	return t.wrapped.RoundTrip(req)
}

func processingIncomingMessageQueueFactory(h *Messaging) func(mq.Message) {
	return func(message mq.Message) {
		incoming := &LagoonLog{}
		json.Unmarshal(message.Body(), incoming)
		bom := new(cdx.BOM)

		// SBOM passed as json in message payload
		if incoming.Meta != nil && incoming.Meta.SBOM != nil {
			sbomData := incoming.Meta.SBOM
			sbomJson, err := json.MarshalIndent(sbomData, "", " ")
			if err != nil {
				log.Fatalf(err.Error())
			}

			decoder := cdx.NewBOMDecoder(bytes.NewReader(sbomJson), cdx.BOMFileFormatJSON)
			if err = decoder.Decode(bom); err != nil {
				panic(err)
			}
		}

		// Download SBOM from url
		if incoming.Meta != nil && incoming.Meta.SBOMUrl != "" {
			res, err := downloadSBOM(incoming.Meta.SBOMUrl)
			if err != nil {
				panic(err)
			}

			// Decode the SBOM
			decoder := cdx.NewBOMDecoder(res.Body, cdx.BOMFileFormatJSON)
			if err = decoder.Decode(bom); err != nil {
				panic(err)
			}
		}

		// @TODO: Verifying SBOMs
		// perhaps we need to sign the SBOMs when produced - and then verify that digest
		// here to ensure it hasn't been tampered with. Although SBOMs will be stored in private s3 buckets.

		if bom != nil && bom.Metadata != nil {
			log.Printf("Successfully decoded SBOM of image %s\n", bom.Metadata.Component.Name)
			log.Printf("- Generated: %s with %s\n", bom.Metadata.Timestamp, (*bom.Metadata.Tools)[0].Name)
			log.Printf("- Packages found: %d\n", len(*bom.Components))

			if incoming.Meta != nil && incoming.Meta.EnvironmentID != nil && int(*incoming.Meta.EnvironmentID) > 0 {
				client := graphql.NewClient(h.LagoonAPI.Endpoint, &http.Client{Transport: &authedTransport{wrapped: http.DefaultTransport, h: h}})
				environmentId := int(*incoming.Meta.EnvironmentID)
				source := fmt.Sprintf("%s:%s", (*bom.Metadata.Tools)[0].Name, (*bom.Metadata.Component).Name)

				//environment, err := lagoonclient.GetEnvironmentFromId(context.TODO(), client, environmentId)
				//if err != nil {
				//	log.Println(err)
				//	return
				//}

				// remove existing facts from source first
				_, err := lagoonclient.DeleteFactsFromSource(context.TODO(), client, environmentId, source)
				if err != nil {
					log.Println(err)
					return
				}

				log.Printf("Previous facts deleted for environment '%d' and source '%s'", environmentId, source)

				// Process SBOM into facts
				facts := processFactsFromSBOM(*bom, environmentId, source)
				result, err := lagoonclient.AddFacts(context.TODO(), client, facts)
				if err != nil {
					log.Println(err)
					return
				}
				log.Println(result)
			}
		}

		message.Ack(false) // ack to remove from queue
	}
}

func downloadSBOM(sbomURL string) (*http.Response, error) {
	res, err := http.Get(sbomURL)
	if err != nil {
		return nil, err
	}
	// 	defer res.Body.Close()

	return res, nil
}

func processFactsFromSBOM(bom cdx.BOM, environmentId int, source string) []lagoonclient.AddFactInput {
	var facts []lagoonclient.AddFactInput

	for _, c := range *bom.Components {
		facts = append(facts, lagoonclient.AddFactInput{
			Environment: environmentId,
			Name:        fmt.Sprintf("%s:%s", c.Name, c.Version),
			Value:       c.Version,
			Source:      source,
			Description: c.PackageURL,
			Type:        lagoonclient.FactTypeText,
		})
	}
	return facts
}

// toLagoonLogs sends logs to the lagoon-logs message queue
func (h *Messaging) toLagoonLogs(messageQueue mq.MQ, message map[string]interface{}) {
	msgBytes, err := json.Marshal(message)
	if err != nil {
		if h.EnableDebug {
			log.Println(err, "Unable to encode message as JSON")
		}
	}
	producer, err := messageQueue.AsyncProducer("lagoon-logs")
	if err != nil {
		log.Println(fmt.Sprintf("Failed to get async producer: %v", err))
		return
	}
	producer.Produce(msgBytes)
}
