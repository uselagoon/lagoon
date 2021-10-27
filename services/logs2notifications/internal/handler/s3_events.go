package handler

import (
	"bytes"
	"fmt"
	"net/http"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

var (
	AWS_S3_REGION = ""
	AWS_S3_BUCKET = ""
)

func getS3Event(msgEvent string) (string, string, string, error) {
	if val, ok := s3Event[msgEvent]; ok {
		return val.Emoji, val.Color, val.Template, nil
	}
	return "", "", "", fmt.Errorf("no matching event source")
}

var s3Event = map[string]EventMap{
	"github:pull_request:closed:handled": {Emoji: ":information_source:", Color: "#E8E8E8"},
}

// func main() {
//     session, err := session.NewSession(&aws.Config{Region: aws.String(AWS_S3_REGION)})
//     if err != nil {
//         log.Fatal(err)
//     }

//     // Upload Files
//     err = uploadFile(session, "test.png")
//     if err != nil {
//         log.Fatal(err)
//     }
// }

func uploadFile(session *session.Session, uploadFileDir string) error {

	upFile, err := os.Open(uploadFileDir)
	if err != nil {
		return err
	}
	defer upFile.Close()

	upFileInfo, _ := upFile.Stat()
	var fileSize int64 = upFileInfo.Size()
	fileBuffer := make([]byte, fileSize)
	upFile.Read(fileBuffer)

	_, err = s3.New(session).PutObject(&s3.PutObjectInput{
		Bucket:               aws.String(AWS_S3_BUCKET),
		Key:                  aws.String(uploadFileDir),
		ACL:                  aws.String("private"),
		Body:                 bytes.NewReader(fileBuffer),
		ContentLength:        aws.Int64(fileSize),
		ContentType:          aws.String(http.DetectContentType(fileBuffer)),
		ContentDisposition:   aws.String("attachment"),
		ServerSideEncryption: aws.String("AES256"),
	})
	return err
}
