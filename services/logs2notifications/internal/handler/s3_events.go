package handler

import (
	"bytes"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/uselagoon/machinery/utils/namespace"
)

// MessageType .
type MessageType string

const (
	buildMessageType MessageType = "build"
	taskMessageType  MessageType = "task"
)

// SendToS3 .
func (h *Messaging) SendToS3(notification *Notification, msgType MessageType) {
	if msgType == buildMessageType {
		h.uploadFileS3(
			notification.Message,
			fmt.Sprintf("buildlogs/%s/%s/%s-%s.txt",
				notification.Project,
				notification.Meta.BranchName,
				notification.Meta.BuildName,
				notification.Meta.RemoteID,
			),
		)
	} else if msgType == taskMessageType {
		filePath := fmt.Sprintf("tasklogs/%s/%s-%s.txt",
			notification.Project,
			notification.Meta.Task.ID,
			notification.Meta.RemoteID,
		)
		if notification.Meta.Environment != "" {
			filePath = fmt.Sprintf("tasklogs/%s/%s/%s-%s.txt",
				notification.Project,
				namespace.ShortenEnvironment(notification.Project, namespace.MakeSafe(notification.Meta.Environment)),
				notification.Meta.Task.ID,
				notification.Meta.RemoteID,
			)

		}
		h.uploadFileS3(
			notification.Message,
			filePath,
		)
	}
}

// UploadFileS3
func (h *Messaging) uploadFileS3(message, fileName string) {
	forcePath := true
	session, err := session.NewSession(&aws.Config{
		Region:           aws.String(h.S3FilesRegion),
		Endpoint:         aws.String(h.S3FilesOrigin),
		Credentials:      credentials.NewStaticCredentials(h.S3FilesAccessKeyID, h.S3FilesSecretAccessKey, ""),
		S3ForcePathStyle: &forcePath,
	})
	if err != nil {
		log.Fatal(err)
	}

	object := s3.PutObjectInput{
		Bucket:      aws.String(h.S3FilesBucket),
		Key:         aws.String(fileName),
		Body:        bytes.NewReader([]byte(message)),
		ContentType: aws.String("text/plain"),
	}
	if !h.S3IsGCS {
		object.ACL = aws.String("private")
	}
	_, err = s3.New(session).PutObject(&object)
	if err != nil {
		log.Println(err)
	}
	log.Printf("Uploaded file %s\n", fileName)
}
