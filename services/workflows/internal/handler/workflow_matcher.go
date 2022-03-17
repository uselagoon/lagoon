package handler

import "github.com/uselagoon/lagoon/services/actions-handler/internal/schema"

func matchWorkflows(notification schema.Notification, workflows []schema.Workflow) schema.Workflow  {
	for _, workflow := range workflows {
		if(notification.Event == workflow.Event) {
			return workflow
		}
	}
	return schema.Workflow{}
}