package restore

import (
	"fmt"
	"io"
	"net/http"
	"os"
)

func downloadFile(downloadURL, dest string) error {
	resp, err := http.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("http get failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download error: %d", resp.StatusCode)
	}

	outFile, err := os.Create(dest)
	if err != nil {
		return fmt.Errorf("create file err %s: %w", dest, err)
	}
	defer outFile.Close()

	if _, err := io.Copy(outFile, resp.Body); err != nil {
		return fmt.Errorf("write file err %s: %w", dest, err)
	}
	return nil
}
