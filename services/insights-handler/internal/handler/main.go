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
	"net/url"
	"os"
	"regexp"
	"sort"
	"strconv"
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
	BinaryPayload map[string]string `json:"binaryPayload"`
	Annotations   map[string]string `json:"annotations"`
	Labels        map[string]string `json:"labels"`
}

type InsightsData struct {
	InputType               string
	InputPayload            PayloadType
	InsightsType            InsightType
	InsightsCompressionType string
	InsightsFileType        string
	LagoonType              LagoonType
	OutputFileExt           string
	OutputFileMIMEType      string
	OutputCompressed        bool
}

type InsightType int64

const (
	Raw = iota
	Sbom
	ImageInspect
)

func (i InsightType) String() string {
	switch i {
	case Raw:
		return "RAW"
	case Sbom:
		return "SBOM"
	case ImageInspect:
		return "IMAGE-INSPECT"
	}
	return "RAW"
}

type LagoonType int64

const (
	Facts = iota
	ImageInspectFacts
	Problems
)

func (t LagoonType) String() string {
	switch t {
	case Facts:
		return "FACTS"
	case ImageInspectFacts:
		return "IMAGE-INSPECT"
	case Problems:
		return "PROBLEMS"
	}
	return "UNKNOWN"
}

type PayloadType int64

const (
	Payload = iota
	BinaryPayload
)

func (p PayloadType) String() string {
	switch p {
	case Payload:
		return "PAYLOAD"
	case BinaryPayload:
		return "BINARY_PAYLOAD"
	}
	return "PAYLOAD"
}

type ImageInspectData struct {
	Name          string            `json:"name"`
	Digest        string            `json:"digest"`
	RepoTags      []string          `json:"repoTags"`
	Created       string            `json:"created"`
	DockerVersion string            `json:"dockerVersion"`
	Labels        map[string]string `json:"labels"`
	Architecture  string            `json:"architecture"`
	OS            string            `json:"os"`
	Layers        []string          `json:"layers"`
	Env           []string          `json:"env"`
}

type EnvironmentVariable struct {
	Key   string
	Value string
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

		// Check labels for insights data from message
		if incoming.Labels != nil {
			labelKeys := make([]string, 0, len(incoming.Labels))
			for k := range incoming.Labels {
				labelKeys = append(labelKeys, k)
			}
			sort.Strings(labelKeys)

			// Set some insight data defaults
			insights = InsightsData{
				LagoonType:         Facts,
				OutputFileExt:      "json",
				OutputFileMIMEType: "application/json",
			}

			for _, label := range labelKeys {
				if label == "lagoon.sh/project" {
					resource.Project = incoming.Labels["lagoon.sh/project"]
				}
				if label == "lagoon.sh/environment" {
					resource.Environment = incoming.Labels["lagoon.sh/environment"]
				}
				if label == "lagoon.sh/service" {
					resource.Service = incoming.Labels["lagoon.sh/service"]
				}

				if label == "lagoon.sh/insightsType" {
					insights.InputType = incoming.Labels["lagoon.sh/insightsType"]
				}
				if incoming.Labels["lagoon.sh/insightsType"] == "image-gz" || incoming.Labels["lagoon.sh/insightsType"] == "image-inspect-gz" {
					insights.LagoonType = ImageInspectFacts
				}
				if label == "lagoon.sh/insightsOutputCompressed" {
					compressed, _ := strconv.ParseBool(incoming.Labels["lagoon.sh/insightsOutputCompressed"])
					insights.OutputCompressed = compressed
				}
				if label == "lagoon.sh/insightsOutputFileMIMEType" {
					insights.OutputFileMIMEType = incoming.Labels["lagoon.sh/insightsOutputFileMIMEType"]
				}
				if label == "lagoon.sh/insightsOutputFileExt" {
					insights.OutputFileExt = incoming.Labels["lagoon.sh/insightsOutputFileExt"]
				}
			}
		}

		// Define insights type from incoming 'insightsType' label
		if insights.InputType != "" {
			switch insights.InputType {
			case "sbom", "sbom-gz":
				insights.InsightsType = Sbom
			case "image-gz", "image-inspect", "image-inspect-gz":
				insights.InsightsType = ImageInspect
			default:
				insights.InsightsType = Raw
			}
		}

		// Determine incoming payload type
		if incoming.Payload == nil && incoming.BinaryPayload == nil {
			log.Printf("no payload was found")
			err := message.Reject(false)
			if err != nil {
				fmt.Errorf("%s", err.Error())
			}
			return
		} else {
			if len(incoming.Payload) != 0 {
				insights.InputPayload = Payload
			}
			if len(incoming.BinaryPayload) != 0 {
				insights.InputPayload = BinaryPayload
			}
		}

		// Process s3 upload
		if !h.S3Config.Disabled {
			err := h.sendToLagoonS3(incoming, insights, resource)
			if err != nil {
				log.Printf("Unable to send to S3: %s", err.Error())
			}
		}

		// Process Lagoon API integration
		if !h.LagoonAPI.Disabled {
			log.Println(insights)
			log.Println(insights.InsightsType)
			log.Println(insights.InputType)

			if insights.InsightsType != Sbom && insights.InsightsType != ImageInspect {
				log.Println("only 'sbom' and 'image-inspect' types are currently supported for api processing")
			} else {
				err := h.sendToLagoonAPI(incoming, resource, insights)
				if err != nil {
					log.Printf("Unable to send to the api: %s", err.Error())
				}
			}

		}

		err := message.Ack(false)
		if err != nil {
			fmt.Errorf("%s", err.Error())
		} // ack to remove from queue
	}
}

// Incoming payload may contain facts or problems, so we need to handle these differently
func (h *Messaging) sendToLagoonAPI(incoming *InsightsMessage, resource ResourceDestination, insights InsightsData) (err error) {
	apiClient := h.getApiClient()

	if resource.Project == "" && resource.Environment == "" {
		log.Println("no resource definition labels could be found in payload (i.e. lagoon.sh/project or lagoon.sh/environment)")
	}

	if insights.InputPayload == Payload {
		for _, v := range incoming.Payload {
			if insights.InsightsType == Sbom {
				err := h.processSbomInsightsData(insights, v, apiClient, resource)
				if err != nil {
					log.Println(fmt.Errorf(err.Error()))
				}
			}
		}
	}

	if insights.InputPayload == BinaryPayload {
		for _, v := range incoming.BinaryPayload {
			if insights.InsightsType == Sbom {
				err := h.processSbomInsightsData(insights, v, apiClient, resource)
				if err != nil {
					log.Println("warning: unable to process sbom: ", fmt.Errorf(err.Error()))
				}
			}

			if insights.InsightsType == ImageInspect {
				err = h.processImageInspectInsightsData(insights, v, apiClient, resource)
				if err != nil {
					log.Println("warning: unable to process inspect image data: ", fmt.Errorf(err.Error()))
				}
			}
		}
	}

	return nil
}

func (h *Messaging) processSbomInsightsData(insights InsightsData, v string, apiClient graphql.Client, resource ResourceDestination) error {
	bom := new(cdx.BOM)

	// Decode base64
	r := strings.NewReader(v)
	dec := base64.NewDecoder(base64.StdEncoding, r)

	res, err := ioutil.ReadAll(dec)
	if err != nil {
		return err
	}

	fileType := http.DetectContentType(res)

	if fileType != "application/zip" && fileType != "application/x-gzip" && fileType != "application/gzip" {
		decoder := cdx.NewBOMDecoder(bytes.NewReader(res), cdx.BOMFileFormatJSON)
		if err = decoder.Decode(bom); err != nil {
			return err
		}
	} else {
		// Compressed cyclonedx sbom
		result, decErr := decodeGzipString(v)
		if decErr != nil {
			return decErr
		}
		b, mErr := json.MarshalIndent(result, "", " ")
		if mErr != nil {
			return mErr
		}

		decoder := cdx.NewBOMDecoder(bytes.NewReader(b), cdx.BOMFileFormatJSON)
		if err = decoder.Decode(bom); err != nil {
			panic(err)
		}
	}

	// Determine lagoon resource destination
	project, environment, apiErr := determineResourceFromLagoonAPI(apiClient, resource)
	if apiErr != nil {
		return apiErr
	}
	source := fmt.Sprintf("%s:%s", (*bom.Metadata.Component).Name, resource.Service)

	// Process SBOM into facts
	facts := processFactsFromSBOM(bom.Components, environment.Id, source)
	if len(facts) == 0 {
		return fmt.Errorf("no facts to process")
	}

	log.Printf("Successfully decoded SBOM of image %s\n", bom.Metadata.Component.Name)
	log.Printf("- Generated: %s with %s\n", bom.Metadata.Timestamp, (*bom.Metadata.Tools)[0].Name)
	log.Printf("- Packages found: %d\n", len(*bom.Components))

	apiErr = h.deleteExistingFactsBySource(apiClient, environment, source, project)
	if apiErr != nil {
		return apiErr
	}

	apiErr = h.pushFactsToLagoonApi(facts, resource)
	if apiErr != nil {
		return apiErr
	}
	return nil
}

func (h *Messaging) processImageInspectInsightsData(insights InsightsData, v string, apiClient graphql.Client, resource ResourceDestination) error {
	if insights.OutputCompressed {
		decoded, err := decodeGzipString(v)
		if err != nil {
			fmt.Errorf(err.Error())
		}

		project, environment, apiErr := determineResourceFromLagoonAPI(apiClient, resource)
		if apiErr != nil {
			return apiErr
		}
		source := fmt.Sprintf("image-inspect:%s", resource.Service)

		marshallDecoded, err := json.Marshal(decoded)
		var imageInspect ImageInspectData
		err = json.Unmarshal(marshallDecoded, &imageInspect)
		if err != nil {
			return err
		}

		facts, err := processFactsFromImageInspect(imageInspect, environment.Id, source)
		if err != nil {
			return err
		}
		log.Printf("Successfully decoded image-inspect")

		if len(facts) == 0 {
			return fmt.Errorf("no facts to process")
		}

		apiErr = h.deleteExistingFactsBySource(apiClient, environment, source, project)
		if apiErr != nil {
			return apiErr
		}

		apiErr = h.pushFactsToLagoonApi(facts, resource)
		if apiErr != nil {
			return apiErr
		}
	}

	return nil
}

func (h *Messaging) deleteExistingFactsBySource(apiClient graphql.Client, environment lagoonclient.Environment, source string, project lagoonclient.Project) error {
	// Remove existing facts from source first
	_, err := lagoonclient.DeleteFactsFromSource(context.TODO(), apiClient, environment.Id, source)
	if err != nil {
		return err
	}

	log.Println("--------------------")
	log.Printf("Previous facts deleted for '%s:%s' and source '%s'", project.Name, environment.Name, source)
	log.Println("--------------------")
	return nil
}

func (h *Messaging) getApiClient() graphql.Client {
	apiClient := graphql.NewClient(h.LagoonAPI.Endpoint, &http.Client{Transport: &authedTransport{wrapped: http.DefaultTransport, h: h}})
	return apiClient
}

func determineResourceFromLagoonAPI(apiClient graphql.Client, resource ResourceDestination) (lagoonclient.Project, lagoonclient.Environment, error) {
	// Get project data (we need the project ID to be able to utilise the environmentByName query)
	project, err := lagoonclient.GetProjectByName(context.TODO(), apiClient, resource.Project)
	if err != nil {
		return lagoonclient.Project{}, lagoonclient.Environment{}, err
	}

	if project.Id == 0 || project.Name == "" {
		return lagoonclient.Project{}, lagoonclient.Environment{}, fmt.Errorf("error: unable to determine resource destination (does %s:%s exist?)", resource.Project, resource.Environment)
	}

	environment, err := lagoonclient.GetEnvironmentFromName(context.TODO(), apiClient, resource.Environment, project.Id)
	if err != nil {
		return lagoonclient.Project{}, lagoonclient.Environment{}, err
	}
	return project, environment, nil
}

func (h *Messaging) sendToLagoonS3(incoming *InsightsMessage, insights InsightsData, resource ResourceDestination) (err error) {
	// strip http/s protocol from origin
	u, _ := url.Parse(h.S3Config.S3Origin)
	if u.Scheme == "http" || u.Scheme == "https" {
		h.S3Config.S3Origin = u.Host
	}

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
		b, err := json.Marshal(incoming)
		if err != nil {
			return err
		}

		objectName := strings.ToLower(fmt.Sprintf("%s-%s-%s-%s.json", insights.InsightsType, resource.Project, resource.Environment, resource.Service))
		reader := bytes.NewReader(b)

		info, putObjErr := minioClient.PutObject(ctx, h.S3Config.Bucket, objectName, reader, reader.Size(), minio.PutObjectOptions{
			ContentEncoding: "application/json",
		})
		if putObjErr != nil {
			return putObjErr
		}

		log.Printf("Successfully uploaded %s of size %d\n", objectName, info.Size)
	}

	if incoming.BinaryPayload != nil {
		for _, p := range incoming.BinaryPayload {
			result, err := decodeGzipString(p)
			if err != nil {
				fmt.Errorf(err.Error())
			}
			resultJson, _ := json.MarshalIndent(result, "", " ")

			fileExt := insights.OutputFileExt
			contentType := insights.OutputFileMIMEType
			var contentEncoding string
			if insights.OutputCompressed == true {
				fileExt = fmt.Sprintf("%s.gz", insights.OutputFileExt)
				contentEncoding = "gzip"
			}

			objectName := strings.ToLower(fmt.Sprintf("%s-%s-%s-%s.%s", insights.InsightsType, resource.Project, resource.Environment, resource.Service, fileExt))
			tempFilePath := fmt.Sprintf("/tmp/%s", objectName)

			if insights.OutputCompressed != true {
				err = ioutil.WriteFile(tempFilePath, resultJson, 0644)
				if err != nil {
					fmt.Errorf(err.Error())
				}
			} else {
				var buf bytes.Buffer
				gz := gzip.NewWriter(&buf)
				gz.Write(resultJson)
				gz.Close()
				err = ioutil.WriteFile(tempFilePath, buf.Bytes(), 0644)
				if err != nil {
					fmt.Errorf(err.Error())
				}
			}

			s3FilePath := strings.ToLower(fmt.Sprintf("%s/%s/%s", resource.Project, resource.Environment, objectName))
			info, err := minioClient.FPutObject(ctx, h.S3Config.Bucket, s3FilePath, tempFilePath, minio.PutObjectOptions{
				ContentType:     contentType,
				ContentEncoding: contentEncoding,
			})
			if err != nil {
				fmt.Errorf(err.Error())
			}
			log.Printf("Successfully uploaded %s of size %d\n", s3FilePath, info.Size)

			err = os.Remove(tempFilePath)
			if err != nil {
				fmt.Errorf(err.Error())
			}
		}
	}

	return nil
}

func (h *Messaging) pushFactsToLagoonApi(facts []lagoonclient.AddFactInput, resource ResourceDestination) error {
	apiClient := graphql.NewClient(h.LagoonAPI.Endpoint, &http.Client{Transport: &authedTransport{wrapped: http.DefaultTransport, h: h}})

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

func decodeGzipString(encodedString string) (result interface{}, err error) {
	// base64 decode it
	base64Decoder := base64.NewDecoder(base64.StdEncoding, strings.NewReader(encodedString))
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

func processFactsFromSBOM(facts *[]cdx.Component, environmentId int, source string) []lagoonclient.AddFactInput {
	var factsInput []lagoonclient.AddFactInput
	if len(*facts) == 0 {
		return factsInput
	}

	keyFacts, err := scanKeyFactsFile("./key_facts.txt")
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
			Name:        f.Name,
			Value:       f.Version,
			Source:      source,
			Description: f.PackageURL,
			KeyFact:     true,
			Type:        lagoonclient.FactTypeText,
		})
	}
	return factsInput
}

func processFactsFromImageInspect(imageInspectData ImageInspectData, id int, source string) ([]lagoonclient.AddFactInput, error) {
	var factsInput []lagoonclient.AddFactInput

	keyFacts, err := scanKeyFactsFile("./key_facts.txt")
	if err != nil {
		fmt.Errorf("scan file error: %v", err)
	}

	var filteredFacts []EnvironmentVariable
	keyFactsExistMap := make(map[string]bool)

	// Check if image inspect contains useful environment variables
	if imageInspectData.Env != nil {
		for _, v := range imageInspectData.Env {
			var envSplitStr = strings.Split(v, "=")
			env := EnvironmentVariable{
				Key:   envSplitStr[0],
				Value: envSplitStr[1],
			}

			for _, k := range keyFacts {
				hasMatch, err := regexp.Match(k, []byte(env.Key))
				if err != nil {
					fmt.Errorf(err.Error())
				}
				// Remove duplicate key facts
				if hasMatch {
					if _, ok := keyFactsExistMap[env.Key]; !ok {
						keyFactsExistMap[env.Key] = true
						filteredFacts = append(filteredFacts, env)
					}
				}
			}
		}
	}

	for _, f := range filteredFacts {
		factsInput = append(factsInput, lagoonclient.AddFactInput{
			Environment: id,
			Name:        f.Key,
			Value:       f.Value,
			Source:      source,
			Category:    "Environment Variable",
			KeyFact:     true,
			Type:        lagoonclient.FactTypeText,
		})
	}
	return factsInput, nil
}

func scanKeyFactsFile(file string) ([]string, error) {
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
