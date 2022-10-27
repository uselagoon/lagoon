package schema

// EnvironmentInput  is based on the Lagoon API type.
type EnvironmentInput struct {
	ID      int          `json:"id,omitempty"`
	Name    string       `json:"name,omitempty"`
	Project ProjectInput `json:"project,omitempty"`
}

// UpdateEnvironmentStorageInput is used as the input for updating an environments storage.
type UpdateEnvironmentStorageInput struct {
	Environment          int    `json:"environment"`
	PersisteStorageClaim string `json:"persistentStorageClaim"`
	BytesUsed            int    `json:"bytesUsed"`
}

// UpdateEnvironmentStorage is the response.
type UpdateEnvironmentStorage struct {
	ID int `json:"id"`
}
