package schema

// ProjectInput is based on the Lagoon API type.
type ProjectInput struct {
	ID   uint   `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
}