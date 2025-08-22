package lagoon

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/uselagoon/machinery/api/schema"
)

func (l *LagoonAPI) addOrUpdateEnvironment(deployData DeployData, deployBaseRef, deployHeadRef, deployTitle, environmentType string) (*schema.Environment, error) {
	lc, _ := GetClient(*l)
	envMutation := `mutation addOrUpdateEnvironment($name: String!, $project: Int!, $openshift: Int, $deployType: DeployType!, $deployBaseRef: String!,
	$deployHeadRef: String, $deployTitle: String, $environmentType: EnvType!) {
		addOrUpdateEnvironment(input:{
			name: $name,
			project: $project,
			openshift: $openshift,
			deployType: $deployType,
			deployBaseRef: $deployBaseRef,
			deployHeadRef: $deployHeadRef,
			deployTitle: $deployTitle,
			environmentType: $environmentType,
		}) {
			id
			name
			project {
				name
			}
			autoIdle
			deployType
			environmentType
			openshiftProjectName
			envVariables {
				name
				value
				scope
			}
		}
	}`
	addOrUpdateEnvironment, err := lc.ProcessRaw(context.Background(), envMutation, map[string]interface{}{
		"name":            deployData.UnsafeEnvironmentName,
		"project":         deployData.Project.ID,
		"deployType":      deployData.DeployType,
		"deployBaseRef":   deployBaseRef,
		"environmentType": environmentType,
		"openshift":       deployData.DeployTarget.ID,
		"deployHeadRef":   deployHeadRef,
		"deployTitle":     deployTitle,
	})
	if err != nil {
		return nil, err
	}
	// d, _ := json.Marshal(addOrUpdateEnvironment)
	// fmt.Println(string(d))
	aoue := schema.Environment{}
	ab, _ := json.Marshal(addOrUpdateEnvironment.(map[string]interface{})["addOrUpdateEnvironment"])
	json.Unmarshal(ab, &aoue)
	return &aoue, nil
}

func (l *LagoonAPI) addDeployment(deployData DeployData, environmentID, buildPriority uint) (*schema.Deployment, error) {
	lc, _ := GetClient(*l)
	deployMutation := `mutation addDeployment($name: String!, $status: DeploymentStatusType!, $created: String!, $environment: Int!, $id: Int,
	$priority: Int, $bulkId: String, $bulkName: String,
    $sourceUser: String, $sourceType: DeploymentSourceType) {
		addDeployment(input: {
			name: $name
			status: $status
			created: $created
			environment: $environment
			id: $id
			priority: $priority
			bulkId: $bulkId
			bulkName: $bulkName
			sourceUser: $sourceUser
			sourceType: $sourceType
		}) {
			id
			name
			status
			created
			started
			completed
			remoteId
			uiLink
			environment {
				name
			}
		}
  	}`
	d, err := lc.ProcessRaw(context.Background(), deployMutation, map[string]interface{}{
		"name":        deployData.BuildName,
		"status":      "NEW",
		"created":     time.Now().UTC().Format("2006-01-02T15:04:05"),
		"environment": environmentID,
		"priority":    buildPriority,
		"bulkId":      deployData.BulkID,
		"bulkName":    deployData.BulkName,
		"sourceUser":  deployData.SourceUser,
		"sourceType":  deployData.SourceType,
	})
	if err != nil {
		return nil, err
	}
	// da, _ := json.Marshal(d)
	// fmt.Println(string(da))
	deployment := schema.Deployment{}
	db, _ := json.Marshal(d.(map[string]interface{})["addDeployment"])
	json.Unmarshal(db, &deployment)
	return &deployment, nil
}

func (l *LagoonAPI) AllProjectByGitURL(gitURL string) (*[]schema.Project, error) {
	lc, _ := GetClient(*l)
	query := fmt.Sprintf(`query webhookProcessProjects {
        allProjects(gitUrl: "%s") {
			id
        	name
        	deploymentsDisabled
			developmentBuildPriority
			productionBuildPriority
			routerPattern
			sharedBaasBucket
			privateKey
			autoIdle
			storageCalc
			gitUrl
			branches
			pullrequests
			envVariables {
				name
				value
				scope
			}
			openshift {
				id
				name
				routerPattern
				buildImage
				disabled
				sharedBaasBucketName
				monitoringConfig
			}
			developmentEnvironmentsLimit
			productionEnvironment
			standbyProductionEnvironment
			environments(includeDeleted:false) {
				name
				id
				environmentType
				autoIdle
				kubernetesNamespaceName
				openshift {
					id
					name
					routerPattern
					buildImage
					disabled
					sharedBaasBucketName
					monitoringConfig
				}
			}
			deployTargetConfigs {
			    id
				weight
				branches
				pullrequests
				weight
				deployTarget {
					id
					name
					routerPattern
					buildImage
					disabled
					sharedBaasBucketName
					monitoringConfig
				}
			}
        	organizationDetails {
				id
				name
				friendlyName
				description
				quotaProject
				quotaGroup
				quotaNotification
				quotaEnvironment
				quotaRoute
				envVariables {
					name
					value
					scope
				}
				environments {
					name
					id
					environmentType
					autoIdle
					kubernetesNamespaceName
					openshift {
						id
						name
						routerPattern
						buildImage
						disabled
						sharedBaasBucketName
						monitoringConfig
					}
				}
			}
        }
    }`, gitURL)
	result, err := lc.ProcessRaw(context.Background(), query, nil)
	if err != nil {
		return nil, err
	}
	// d, _ := json.Marshal(result)
	// fmt.Println(string(d))
	rb, _ := json.Marshal(result.(map[string]interface{})["allProjects"])
	projects := []schema.Project{}
	json.Unmarshal(rb, &projects)
	return &projects, nil
}
