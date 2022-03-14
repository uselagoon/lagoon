package client

import (
	"context"

	"github.com/uselagoon/lagoon/services/actions-handler/internal/schema"
)

// DeployEnvironmentLatest deploys a latest environment.
func (c *Client) DeployEnvironmentLatest(ctx context.Context,
	in *schema.DeployEnvironmentLatestInput, out *schema.DeployEnvironmentLatest) error {
	req, err := c.newRequest("_lgraphql/deployEnvironmentLatest.graphql", in)
	if err != nil {
		return err
	}
	return c.client.Run(ctx, req, &out)
}
