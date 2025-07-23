package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/namespace"
)

type S3RetentionCleanUp struct {
	EnvironmentName string `json:"environmentName"`
	ProjectName     string `json:"projectName"`
	Task            struct {
		ID string `json:"id"`
	} `json:"task"`
	EnvironmentID int    `json:"environmentId"`
	ProjectID     int    `json:"projectId"`
	BuildName     string `json:"buildName"`
	RemoteID      string `json:"remoteId"`
}

type S3SaveHistory struct {
	Environment       schema.Environment       `json:"environment"`
	Project           schema.Project           `json:"project"`
	TaskHistory       []map[string]interface{} `json:"taskHistory"`
	DeploymentHistory []map[string]interface{} `json:"deploymentHistory"`
}

func (m *Messenger) handleRetention(action *Action, messageID string) error {
	prefix := fmt.Sprintf("(messageid:%s) %s: ", messageID, action.EventType)
	data, _ := json.Marshal(action.Data)
	retention := S3RetentionCleanUp{}
	json.Unmarshal(data, &retention)
	switch action.EventType {
	case "taskCleanup":
		filePath := fmt.Sprintf("tasklogs/%s/%s-%s.txt",
			retention.ProjectName,
			retention.Task.ID,
			retention.RemoteID,
		)
		if retention.EnvironmentName != "" {
			filePath = fmt.Sprintf("tasklogs/%s/%s/%s-%s.txt",
				retention.ProjectName,
				namespace.ShortenEnvironment(retention.ProjectName, namespace.MakeSafe(retention.EnvironmentName)),
				retention.Task.ID,
				retention.RemoteID,
			)
		}
		// clean up any files/attachments the task may have uploaded into it
		err := m.deleteFileInDirS3(
			prefix,
			fmt.Sprintf("tasks/%s",
				retention.Task.ID,
			),
			retention,
		)
		if err != nil {
			log.Printf("%sError: %v", prefix, err)
			return err
		}
		// handle cleaning up task logs
		err = m.deleteFileS3(
			prefix,
			filePath,
			retention,
		)
		if err != nil {
			log.Printf("%sError: %v", prefix, err)
			return err
		}
	case "buildCleanup":
		// handle cleaning up build logs
		err := m.deleteFileS3(
			prefix,
			fmt.Sprintf("buildlogs/%s/%s/%s-%s.txt",
				retention.ProjectName,
				retention.EnvironmentName,
				retention.BuildName,
				retention.RemoteID,
			),
			retention,
		)
		if err != nil {
			log.Printf("%sError: %v", prefix, err)
			return err
		}
	}
	return nil
}

// handleSaveHistory will save the deployment and task history into a bucket for long term storage, this can be used later to retrieve stats history for deleted environments in the future
func (m *Messenger) handleSaveHistory(action *Action, messageID string) error {
	prefix := fmt.Sprintf("(messageid:%s) %s: ", messageID, action.EventType)
	data, _ := json.Marshal(action.Data)
	retention := S3SaveHistory{}
	json.Unmarshal(data, &retention)
	switch action.EventType {
	case "saveHistory":
		if m.EnableDebug {
			log.Printf("%sSaving history for project %s-%d, environment %s-%d", prefix, retention.Project.Name, retention.Project.ID, retention.Environment.Name, retention.Environment.ID)
		}
		// save the file into a history directory in the lagoon files bucket
		filePath := fmt.Sprintf("history/%s-%d/%s-%d/history-%d.json",
			retention.Project.Name, retention.Project.ID,
			retention.Environment.Name, retention.Environment.ID,
			time.Now().Unix(),
		)
		err := m.uploadFileS3(prefix, filePath, "application/json", data)
		if err != nil {
			return err
		}
	}
	return nil
}

// deleteFileS3
func (m *Messenger) deleteFileS3(prefix, fileName string, retention S3RetentionCleanUp) error {
	forcePath := true
	session, err := session.NewSession(&aws.Config{
		Region:           aws.String(m.S3Configuration.S3FilesRegion),
		Endpoint:         aws.String(m.S3Configuration.S3FilesOrigin),
		Credentials:      credentials.NewStaticCredentials(m.S3Configuration.S3FilesAccessKeyID, m.S3Configuration.S3FilesSecretAccessKey, ""),
		S3ForcePathStyle: &forcePath,
	})
	if err != nil {
		return err
	}

	object := s3.DeleteObjectInput{
		Bucket: aws.String(m.S3Configuration.S3FilesBucket),
		Key:    aws.String(fileName),
	}
	_, err = s3.New(session).DeleteObject(&object)
	if err != nil {
		return err
	}
	if m.EnableDebug {
		log.Printf("%sDeleted file %s for environment: %v, id: %v", prefix, fileName, retention.EnvironmentName, retention.EnvironmentID)
	}
	return nil
}

// deleteDirFileS3 deletes files from a directory in s3
func (m *Messenger) deleteFileInDirS3(prefix, fileName string, retention S3RetentionCleanUp) error {
	forcePath := true
	session, err := session.NewSession(&aws.Config{
		Region:           aws.String(m.S3Configuration.S3FilesRegion),
		Endpoint:         aws.String(m.S3Configuration.S3FilesOrigin),
		Credentials:      credentials.NewStaticCredentials(m.S3Configuration.S3FilesAccessKeyID, m.S3Configuration.S3FilesSecretAccessKey, ""),
		S3ForcePathStyle: &forcePath,
	})
	if err != nil {
		return err
	}
	listobject := s3.ListObjectsInput{
		Bucket: aws.String(m.S3Configuration.S3FilesBucket),
		Prefix: aws.String(fileName),
	}
	s := s3.New(session)
	err = s.ListObjectsPages(&listobject, func(page *s3.ListObjectsOutput, lastPage bool) bool {
		for _, c := range page.Contents {
			_, err := s.DeleteObject(&s3.DeleteObjectInput{
				Bucket: aws.String(m.S3Configuration.S3FilesBucket),
				Key:    c.Key,
			})
			if err != nil {
				log.Printf("%sError deleting file %s for environment: %v, id: %v: %v", prefix, *c.Key, retention.EnvironmentName, retention.EnvironmentID, err)
				continue // try other files
			}
			if m.EnableDebug {
				log.Printf("%sDeleted file %s for environment: %v, id: %v", prefix, *c.Key, retention.EnvironmentName, retention.EnvironmentID)
			}
		}
		return *page.IsTruncated
	})
	if err != nil {
		return err
	}
	return nil
}

// uploadFileS3 saves a file into s3
func (m *Messenger) uploadFileS3(prefix, fileName, contentType string, message []byte) error {
	forcePath := true
	session, err := session.NewSession(&aws.Config{
		Region:           aws.String(m.S3Configuration.S3FilesRegion),
		Endpoint:         aws.String(m.S3Configuration.S3FilesOrigin),
		Credentials:      credentials.NewStaticCredentials(m.S3Configuration.S3FilesAccessKeyID, m.S3Configuration.S3FilesSecretAccessKey, ""),
		S3ForcePathStyle: &forcePath,
	})
	if err != nil {
		return err
	}

	object := s3.PutObjectInput{
		Bucket:      aws.String(m.S3Configuration.S3FilesBucket),
		Key:         aws.String(fileName),
		Body:        bytes.NewReader(message),
		ContentType: aws.String(contentType),
	}
	if !m.S3Configuration.S3IsGCS {
		object.ACL = aws.String("private")
	}
	_, err = s3.New(session).PutObject(&object)
	if err != nil {
		return err
	}
	if m.EnableDebug {
		log.Printf("%sUploaded file %s", prefix, fileName)
	}
	return nil
}
