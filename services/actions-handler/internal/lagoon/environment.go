// Package lagoon implements high-level functions for interacting with the
// Lagoon API.
package lagoon

import (
	"context"

	"github.com/uselagoon/lagoon/services/actions-handler/internal/schema"
)

// Environment interface contains methods for environments in lagoon.
type Environment interface {
	UpdateEnvironmentStorage(ctx context.Context, storage *schema.UpdateEnvironmentStorageInput, result *schema.UpdateEnvironmentStorage) error
}

// UpdateStorage updates environment storage.
func UpdateStorage(ctx context.Context, storage *schema.UpdateEnvironmentStorageInput, m Environment) (*schema.UpdateEnvironmentStorage, error) {
	result := schema.UpdateEnvironmentStorage{}
	return &result, m.UpdateEnvironmentStorage(ctx, storage, &result)
}
