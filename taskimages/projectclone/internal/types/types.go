package types

type CloneFile struct {
	ID       int    `json:"id"`
	Filename string `json:"filename"`
}

// Placeholder struct until archive cmd is defined
type PayloadData struct {
	ProjectName            string      `json:"projectName"`
	SourceEnvironment      string      `json:"sourceEnvironment,omitempty"`
	DestinationEnvironment string      `json:"destinationEnvironment,omitempty"`
	CloneId                int         `json:"cloneId"`
	Action                 string      `json:"action,omitempty"` // "archive"/"restore"
	Files                  []CloneFile `json:"files,omitempty"`
}
