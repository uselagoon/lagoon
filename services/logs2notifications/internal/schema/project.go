package schema

// Project is based on the Lagoon API type.
type Project struct {
	ID            uint           `json:"id,omitempty"`
	Name          string         `json:"name,omitempty"`
	Notifications *Notifications `json:"notifications,omitempty"`
}
