package handler

import (
	"bufio"
	"bytes"
	"compress/gzip"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/Khan/genqlient/graphql"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	cdx "github.com/CycloneDX/cyclonedx-go"
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
	TokenSigningKey string `json:"tokenSigningKey"`
	JWTSubject      string `json:"subject"`
	JWTIssuer       string `json:"issuer"`
	Disabled        bool   `json:"disableApiIntegration"`
}

// S3 Config .
type S3 struct {
	SecretAccessKey string `json:"secretAccessKey"`
	S3Origin        string `json:"s3Origin"`
	AccessKeyId     string `json:"accessKeyId"`
	Bucket          string `json:"bucket"`
	Region          string `json:"region"`
	UseSSL          bool   `json:"useSSL"`
	Disabled        bool   `json:"disableS3upload"`
}

type InsightsMessage struct {
	Payload       map[string]string `json:"payload"`
	BinaryPayload map[string]string `json:"binaryPayload""`
	Annotations   map[string]string `json:"annotations"`
	Labels        map[string]string `json:"labels"`
}

type InsightsData struct {
	InputType  string
	LagoonType LagoonType
	Format     string
}

type LagoonType int64

const (
	Facts = iota
	KeyFacts
	DockerInspect
	Problems
)

func (t LagoonType) String() string {
	switch t {
	case Facts:
		return "FACTS"
	case KeyFacts:
		return "KEY_FACTS"
	case DockerInspect:
		return "DOCKER_INSPECT"
	case Problems:
		return "PROBLEMS"
	}
	return "UNKNOWN"
}

type ResourceDestination struct {
	Project     string
	Environment string
	Service     string
	Format      string
}

// Messaging is used for the config and client information for the messaging queue.
type Messaging struct {
	Config                  mq.Config
	LagoonAPI               LagoonAPI
	S3Config                S3
	ConnectionAttempts      int
	ConnectionRetryInterval int
	EnableDebug             bool
}

// NewMessaging returns a messaging with config
func NewMessaging(config mq.Config, lagoonAPI LagoonAPI, s3 S3, startupAttempts int, startupInterval int, enableDebug bool) *Messaging {
	return &Messaging{
		Config:                  config,
		LagoonAPI:               lagoonAPI,
		S3Config:                s3,
		ConnectionAttempts:      startupAttempts,
		ConnectionRetryInterval: startupInterval,
		EnableDebug:             enableDebug,
	}
}

// Consumer handles consuming messages sent to the queue that this action handler is connected to and processes them accordingly
func (h *Messaging) Consumer() {
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
	log.Println("Listening for messages in queue lagoon-insights:items")
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
		var insights InsightsData
		var resource ResourceDestination

		incoming := &InsightsMessage{}
		json.Unmarshal(message.Body(), incoming)

		// Check labels for sbom data from message
		if incoming.Labels != nil {
			for key, value := range incoming.Labels {
				if key == "lagoon.sh/insights" && value == "sbom" {
					insights = InsightsData{
						InputType: "sbom",
					}
				}
				if key == "lagoon.sh/insights" && value == "sbom-gz" {
					insights = InsightsData{
						InputType: "sbom-gz",
					}
				}
				if key == "lagoon.sh/insightsProject" {
					resource.Project = value
				}
				if key == "lagoon.sh/insightsEnvironment" {
					resource.Environment = value
				}
				if key == "lagoon.sh/insightsService" {
					resource.Service = value
				}
				if key == "lagoon.sh/insightsFormat" {
					resource.Format = value
				}
			}
		}

		if incoming.Payload == nil && incoming.BinaryPayload == nil {
			log.Printf("no payload was found")
		}

		// If we are dealing with an sbom data type, push sbom to s3 and api
		if insights.InputType == "sbom" || insights.InputType == "sbom-gz" {
			// Process s3 upload
			if !h.S3Config.Disabled {
				err := h.sendToLagoonS3(incoming, resource)
				if err != nil {
					log.Printf("Unable to send to S3: %s", err.Error())
				}
			}

			// Process Lagoon API integration
			if !h.LagoonAPI.Disabled {
				err := h.sendToLagoonAPI(incoming, resource, insights)
				if err != nil {
					log.Printf("Unable to send to the api: %s", err.Error())
				}
			}
		}

		message.Ack(false) // ack to remove from queue
	}
}

// Incoming payload may contain facts or problems, so we need to handle these differently
func (h *Messaging) sendToLagoonAPI(incoming *InsightsMessage, resource ResourceDestination, insights InsightsData) (err error) {
	// Facts
	if insights.LagoonType == LagoonType(Facts) || insights.LagoonType == LagoonType(KeyFacts) {
		if resource.Project == "" && resource.Environment == "" {
			log.Println("no resource definition labels could be found in payload (i.e. lagoon.sh/insightsProject or lagoon.sh/insightsEnvironment)")
		}

		if incoming.Payload != nil {
			for _, v := range incoming.Payload {
				bom := new(cdx.BOM)

				b := []byte(v)
				if err != nil {
					log.Fatalf(err.Error())
				}

				decoder := cdx.NewBOMDecoder(bytes.NewReader(b), cdx.BOMFileFormatJSON)
				if err = decoder.Decode(bom); err != nil {
					panic(err)
				}

				err = h.pushToLagoonApi(bom, resource)
				if err != nil {
					log.Fatalf(err.Error())
				}
			}
		}

		if incoming.BinaryPayload != nil {
			for _, v := range incoming.BinaryPayload {
				bom := new(cdx.BOM)

				result, err := decodeSbomString(v)
				if err != nil {
					fmt.Errorf(err.Error())
				}
				sbomJson, err := json.MarshalIndent(result, "", " ")
				if err != nil {
					log.Fatalf(err.Error())
				}

				decoder := cdx.NewBOMDecoder(bytes.NewReader(sbomJson), cdx.BOMFileFormatJSON)
				if err = decoder.Decode(bom); err != nil {
					panic(err)
				}

				err = h.pushToLagoonApi(bom, resource)
				if err != nil {
					log.Fatalf(err.Error())
				}
			}
		}
	}

	return nil
}

func (h *Messaging) sendToLagoonS3(incoming *InsightsMessage, resource ResourceDestination) (err error) {
	// Push to s3 bucket
	minioClient, err := minio.New(h.S3Config.S3Origin, &minio.Options{
		Creds:  credentials.NewStaticV4(h.S3Config.AccessKeyId, h.S3Config.SecretAccessKey, ""),
		Secure: h.S3Config.UseSSL,
	})
	if err != nil {
		return err
	}

	ctx := context.Background()
	err = minioClient.MakeBucket(ctx, h.S3Config.Bucket, minio.MakeBucketOptions{Region: h.S3Config.Region})
	if err != nil {
		exists, errBucketExists := minioClient.BucketExists(ctx, h.S3Config.Bucket)
		if errBucketExists != nil && !exists {
			return err
		}
	} else {
		log.Printf("Successfully created %s\n", h.S3Config.Bucket)
	}

	if incoming.Payload != nil {
		// Create sbom file
		sbomBytes, err := json.Marshal(incoming)
		if err != nil {
			return err
		}

		// Upload the sbom file
		objectName := strings.ToLower(fmt.Sprintf("%s-%s-%s-sbom.json", resource.Project, resource.Environment, resource.Service))
		sbomReader := bytes.NewReader(sbomBytes)
		info, putObjErr := minioClient.PutObject(ctx, h.S3Config.Bucket, objectName, sbomReader, sbomReader.Size(), minio.PutObjectOptions{})
		if putObjErr != nil {
			return putObjErr
		}

		log.Printf("Successfully uploaded %s of size %d\n", objectName, info.Size)
	}

	if incoming.BinaryPayload != nil {
		for _, p := range incoming.BinaryPayload {
			result, err := decodeSbomString(p)
			if err != nil {
				fmt.Errorf(err.Error())
			}
			sbomJson, _ := json.MarshalIndent(result, "", " ")

			objectName := strings.ToLower(fmt.Sprintf("%s-%s-%s-sbom.json.gz", resource.Project, resource.Environment, resource.Service))
			tempSBOMfilePath := fmt.Sprintf("/tmp/%s", objectName)
			contentType := "application/gzip"

			var buf bytes.Buffer
			gz := gzip.NewWriter(&buf)
			gz.Write(sbomJson)
			gz.Close()
			err = ioutil.WriteFile(tempSBOMfilePath, buf.Bytes(), 0644)
			if err != nil {
				fmt.Errorf(err.Error())
			}

			// Upload the sbom gzip with FPutObject
			info, err := minioClient.FPutObject(ctx, h.S3Config.Bucket, objectName, tempSBOMfilePath, minio.PutObjectOptions{ContentType: contentType})
			if err != nil {
				fmt.Errorf(err.Error())
			}
			log.Printf("Successfully uploaded %s of size %d\n", objectName, info.Size)

			// clean up
			//err = os.Remove(tempSBOMfilePath)
			//if err != nil {
			//	fmt.Errorf(err.Error())
			//}
		}
	}

	return nil
}

func (h *Messaging) pushToLagoonApi(bom *cdx.BOM, resource ResourceDestination) error {
	// Push to API
	apiClient := graphql.NewClient(h.LagoonAPI.Endpoint, &http.Client{Transport: &authedTransport{wrapped: http.DefaultTransport, h: h}})

	// Get project data (we need the project ID to be able to utilise the environmentByName query)
	project, err := lagoonclient.GetProjectByName(context.TODO(), apiClient, resource.Project)
	if err != nil {
		return err
	}

	if project.Id == 0 || project.Name == "" {
		return fmt.Errorf("error: unable to determine resource destination (does %s:%s exist?)", resource.Project, resource.Environment)
	}

	environment, err := lagoonclient.GetEnvironmentFromName(context.TODO(), apiClient, resource.Environment, project.Id)
	if err != nil {
		return err
	}

	source := fmt.Sprintf("%s:%s", (*bom.Metadata.Component).Name, resource.Service)

	// Remove existing facts from source first
	_, err = lagoonclient.DeleteFactsFromSource(context.TODO(), apiClient, environment.Id, source)
	if err != nil {
		return err
	}

	log.Printf("Previous facts deleted for '%s:%s' and source '%s'", project.Name, environment.Name, source)
	log.Println("--------------------")
	log.Printf("Successfully decoded SBOM of image %s\n", bom.Metadata.Component.Name)
	log.Printf("- Generated: %s with %s\n", bom.Metadata.Timestamp, (*bom.Metadata.Tools)[0].Name)
	log.Printf("- Packages found: %d\n", len(*bom.Components))

	// Process SBOM into facts
	facts := processFactsFromSBOM(bom.Components, environment.Id, source)
	log.Println("--------------------")
	log.Printf("Attempting to add %d facts...", len(facts))
	log.Println("--------------------")

	result, err := lagoonclient.AddFacts(context.TODO(), apiClient, facts)
	if err != nil {
		return err
	}

	log.Println(result)
	return nil
}

func decodeSbomString(encodedSbom string) (result interface{}, err error) {
	// base64 decode it
	base64Decoder := base64.NewDecoder(base64.StdEncoding, strings.NewReader(encodedSbom))
	decodedGzipReader, err := gzip.NewReader(base64Decoder)
	if err != nil {
		return "", err
	}

	// Decode json from reader
	var data interface{}
	jsonDecoder := json.NewDecoder(decodedGzipReader)
	err = jsonDecoder.Decode(&data)
	if err != nil && err != io.EOF {
		return "", err
	}

	return data, nil
}

func downloadSBOM(sbomURL string) (*http.Response, error) {
	res, err := http.Get(sbomURL)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func processFactsFromSBOM(facts *[]cdx.Component, environmentId int, source string) []lagoonclient.AddFactInput {
	var factsInput []lagoonclient.AddFactInput
	if len(*facts) == 0 {
		return factsInput
	}

	keyFacts, err := scanFile("./key_facts.txt")
	if err != nil {
		fmt.Errorf("scan file error: %v", err)
	}

	var filteredFacts []cdx.Component
	keyFactsExistMap := make(map[string]bool)

	// Filter key facts
	for _, v := range *facts {
		for _, k := range keyFacts {
			hasMatch, err := regexp.Match(k, []byte(v.Name))
			if err != nil {
				fmt.Errorf(err.Error())
			}
			if hasMatch {
				// Remove duplicate key facts
				if _, ok := keyFactsExistMap[v.Name]; !ok {
					keyFactsExistMap[v.Name] = true
					filteredFacts = append(filteredFacts, v)
				}
			}
		}
	}

	for _, f := range filteredFacts {
		factsInput = append(factsInput, lagoonclient.AddFactInput{
			Environment: environmentId,
			Name:        fmt.Sprintf("%s:%s", f.Name, f.Version),
			Value:       f.Version,
			Source:      source,
			Description: f.PackageURL,
			KeyFact:     true,
			Type:        lagoonclient.FactTypeText,
		})
	}
	return factsInput
}

func scanFile(file string) ([]string, error) {
	var expectedKeyFacts []string

	f, err := os.OpenFile(file, os.O_RDONLY, os.ModePerm)
	if err != nil {
		log.Fatalf("open file error: %v", err)
		return nil, err
	}
	defer f.Close()

	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := bytes.TrimSpace(sc.Bytes())
		if len(line) == 0 {
			continue
		}
		if !strings.HasPrefix(string(line), "#") {
			expectedKeyFacts = append(expectedKeyFacts, sc.Text())
		}
	}
	if err := sc.Err(); err != nil {
		log.Fatalf("scan file error: %v", err)
		return nil, err
	}
	return expectedKeyFacts, nil
}

// toLagoonInsights sends logs to the lagoon-insights message queue
func (h *Messaging) toLagoonInsights(messageQueue mq.MQ, message map[string]interface{}) {
	msgBytes, err := json.Marshal(message)
	if err != nil {
		if h.EnableDebug {
			log.Println(err, "Unable to encode message as JSON")
		}
	}
	producer, err := messageQueue.AsyncProducer("lagoon-insights")
	if err != nil {
		log.Println(fmt.Sprintf("Failed to get async producer: %v", err))
		return
	}
	producer.Produce(msgBytes)
}
