package client

import (
	"context"

	"github.com/uselagoon/lagoon/services/logs2notifications/internal/schema"
)

// NotificationsForProjectByName gets all notifications for a project
func (c *Client) NotificationsForProjectByName(
	ctx context.Context, name string, project *schema.Project) error {
	req, err := c.newRequest("_lgraphql/projectNotifications.graphql",
		map[string]interface{}{
			"name": name,
		})
	if err != nil {
		return err
	}

	return c.client.Run(ctx, req, &struct {
		Response *schema.Project `json:"projectByName"`
	}{
		Response: project,
	})
}
