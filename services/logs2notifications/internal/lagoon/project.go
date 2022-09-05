// Package lagoon implements high-level functions for interacting with the
// Lagoon API.
package lagoon

import (
	"context"

	"github.com/uselagoon/lagoon/services/logs2notifications/internal/schema"
)

// Project interface contains methods for projects in lagoon.
type Project interface {
	NotificationsForProjectByName(ctx context.Context, name string, result *schema.Project) error
}

// NotificationsForProject gets notifications for a project.
func NotificationsForProject(ctx context.Context, name string, m Project) (*schema.Project, error) {
	result := schema.Project{}
	return &result, m.NotificationsForProjectByName(ctx, name, &result)
}
