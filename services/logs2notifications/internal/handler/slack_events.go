package handler

import (
	"fmt"
)

func getSlackEvent(msgEvent string) (string, string, error) {
	if val, ok := slackEventTypeMap[msgEvent]; ok {
		return val.Emoji, val.Color, nil
	}
	return "", "", fmt.Errorf("no matching event source")
}

type slackEvent struct {
	Emoji string `json:"emoji"`
	Color string `json:"color"`
}

var slackEventTypeMap = map[string]slackEvent{
	"github:pull_request:closed:handled":                           {Emoji: ":information_source:", Color: "#E8E8E8"},
	"github:pull_request:opened:handled":                           {Emoji: ":information_source:", Color: "#E8E8E8"},
	"github:pull_request:synchronize:handled":                      {Emoji: ":information_source:", Color: "#E8E8E8"},
	"github:delete:handled":                                        {Emoji: ":information_source:", Color: "#E8E8E8"},
	"github:push:handled":                                          {Emoji: ":information_source:", Color: "#E8E8E8"},
	"bitbucket:repo:push:handled":                                  {Emoji: ":information_source:", Color: "#E8E8E8"},
	"bitbucket:pullrequest:created:handled":                        {Emoji: ":information_source:", Color: "#E8E8E8"},
	"bitbucket:pullrequest:updated:handled":                        {Emoji: ":information_source:", Color: "#E8E8E8"},
	"bitbucket:pullrequest:fulfilled:handled":                      {Emoji: ":information_source:", Color: "#E8E8E8"},
	"bitbucket:pullrequest:rejected:handled":                       {Emoji: ":information_source:", Color: "#E8E8E8"},
	"gitlab:push:handled":                                          {Emoji: ":information_source:", Color: "#E8E8E8"},
	"gitlab:merge_request:opened:handled":                          {Emoji: ":information_source:", Color: "#E8E8E8"},
	"gitlab:merge_request:updated:handled":                         {Emoji: ":information_source:", Color: "#E8E8E8"},
	"gitlab:merge_request:closed:handled":                          {Emoji: ":information_source:", Color: "#E8E8E8"},
	"rest:deploy:receive":                                          {Emoji: ":information_source:", Color: "#E8E8E8"},
	"rest:remove:receive":                                          {Emoji: ":information_source:", Color: "#E8E8E8"},
	"rest:promote:receive":                                         {Emoji: ":information_source:", Color: "#E8E8E8"},
	"api:deployEnvironmentLatest":                                  {Emoji: ":information_source:", Color: "#E8E8E8"},
	"api:deployEnvironmentBranch":                                  {Emoji: ":information_source:", Color: "#E8E8E8"},
	"api:deleteEnvironment":                                        {Emoji: ":information_source:", Color: "#E8E8E8"},
	"github:push:skipped":                                          {Emoji: ":information_source:", Color: "#E8E8E8"},
	"gitlab:push:skipped":                                          {Emoji: ":information_source:", Color: "#E8E8E8"},
	"bitbucket:push:skipped":                                       {Emoji: ":information_source:", Color: "#E8E8E8"},
	"task:deploy-openshift:finished":                               {Emoji: ":white_check_mark:", Color: "good"},
	"task:remove-openshift:finished":                               {Emoji: ":white_check_mark:", Color: "good"},
	"task:remove-kubernetes:finished":                              {Emoji: ":white_check_mark:", Color: "good"},
	"task:remove-openshift-resources:finished":                     {Emoji: ":white_check_mark:", Color: "good"},
	"task:builddeploy-openshift:complete":                          {Emoji: ":white_check_mark:", Color: "good"},
	"task:builddeploy-kubernetes:complete":                         {Emoji: ":white_check_mark:", Color: "good"},
	"task:deploy-openshift:retry":                                  {Emoji: ":warning:", Color: "warning"},
	"task:remove-openshift:retry":                                  {Emoji: ":warning:", Color: "warning"},
	"task:remove-kubernetes:retry":                                 {Emoji: ":warning:", Color: "warning"},
	"task:remove-openshift-resources:retry":                        {Emoji: ":warning:", Color: "warning"},
	"github:pull_request:closed:CannotDeleteProductionEnvironment": {Emoji: ":warning:", Color: "warning"},
	"github:push:CannotDeleteProductionEnvironment":                {Emoji: ":warning:", Color: "warning"},
	"bitbucket:repo:push:CannotDeleteProductionEnvironment":        {Emoji: ":warning:", Color: "warning"},
	"gitlab:push:CannotDeleteProductionEnvironment":                {Emoji: ":warning:", Color: "warning"},
	"rest:remove:CannotDeleteProductionEnvironment":                {Emoji: ":warning:", Color: "warning"},
	"task:deploy-openshift:error":                                  {Emoji: ":bangbang:", Color: "danger"},
	"task:remove-openshift:error":                                  {Emoji: ":bangbang:", Color: "danger"},
	"task:remove-kubernetes:error":                                 {Emoji: ":bangbang:", Color: "danger"},
	"task:remove-openshift-resources:error":                        {Emoji: ":bangbang:", Color: "danger"},
	"task:builddeploy-openshift:failed":                            {Emoji: ":bangbang:", Color: "danger"},
	"task:builddeploy-kubernetes:failed":                           {Emoji: ":bangbang:", Color: "danger"},
}
