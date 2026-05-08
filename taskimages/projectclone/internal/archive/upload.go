package archive

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
)

// uploadFile performs an S3 multipart form upload to postUrl.
func uploadFile(postUrl string, formFields map[string]string, filePath string) error {
	filename := filePath[strings.LastIndex(filePath, "/")+1:]

	requestForm := new(bytes.Buffer)
	writer := multipart.NewWriter(requestForm)

	for name, value := range formFields {
		if err := writer.WriteField(name, value); err != nil {
			return fmt.Errorf("couldn't write upload form field %s: %v\n", name, err)
		}
	}

	fileField, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return fmt.Errorf("Task couldn't create upload file field, error: %v\n", err)
	}

	fd, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("Task couldn't read file, error: %v\n", err)
	}

	_, err = io.Copy(fileField, fd)
	fd.Close()
	if err != nil {
		return fmt.Errorf("Task couldn't copy file, error: %v\n", err)
	}

	writer.Close()

	httpClient := &http.Client{}
	req, err := http.NewRequest("POST", postUrl, requestForm)
	if err != nil {
		return fmt.Errorf("Task couldn't create HTTP request, error: %v\n", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("Task couldn't upload file, error: %v\n", err)
	}

	bodyText, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		return fmt.Errorf("Task couldn't read S3 upload response, error: %v\n", err)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("Task couldn't upload file %s (HTTP %d): %s", filename, resp.StatusCode, bodyText)
	}

	return nil
}
