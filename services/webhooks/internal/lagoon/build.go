package lagoon

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/namespace"
	"github.com/uselagoon/machinery/utils/variables"
	lagooncrd "github.com/uselagoon/remote-controller/api/lagoon/v1beta2"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (l *LagoonAPI) GetControllerBuildData(deployData DeployData) (*lagooncrd.LagoonBuild, error) {
	environmentName := namespace.ShortenEnvironment(deployData.Project.Name, deployData.BranchName)
	environmentType := schema.DevelopmentEnv
	if deployData.Project.ProductionEnvironment == environmentName || deployData.Project.StandbyProductionEnvironment == environmentName {
		environmentType = schema.ProductionEnv
	}

	buildPriority := deployData.BuildPriority
	if buildPriority == nil {
		buildPriority = deployData.Project.DevelopmentBuildPriority
		if environmentType == schema.ProductionEnv {
			buildPriority = deployData.Project.ProductionBuildPriority
		}
	}

	gitRef := deployData.GitSHA
	if deployData.GitSHA == "" {
		gitRef = fmt.Sprintf("origin/%s", deployData.BranchName)
	}

	var deployBaseRef, deployHeadRef, deployTitle string
	pullrequest := &lagooncrd.Pullrequest{}
	promote := &lagooncrd.Promote{}
	switch deployData.DeployType {
	case schema.Branch:
		deployBaseRef = deployData.BranchName
	case schema.PullRequest:
		deployBaseRef = deployData.Pull.PullRequest.Base.Name
		deployHeadRef = deployData.Pull.PullRequest.Head.Name
		deployTitle = deployData.Pull.PullRequest.Title
		pullrequest = &lagooncrd.Pullrequest{
			HeadBranch: deployData.Pull.PullRequest.Head.Name,
			HeadSha:    deployData.Pull.PullRequest.Head.Sha,
			BaseBranch: deployData.Pull.PullRequest.Base.Name,
			BaseSha:    deployData.Pull.PullRequest.Base.Sha,
			Title:      deployData.Pull.PullRequest.Title,
			Number:     fmt.Sprintf("%d", deployData.Pull.PullRequest.Number), // uugghh
		}
	case schema.Promote:
		deployBaseRef = deployData.PromoteSourceEnvironment
		gitRef = fmt.Sprintf("origin/%s", deployData.PromoteSourceEnvironment)
		promote = &lagooncrd.Promote{
			SourceEnvironment: deployData.PromoteSourceEnvironment,
			SourceProject:     "",
		}
	}

	jwtSecretString := variables.GetEnv("JWTSECRET", "super-secret-string")
	projectSeedString := variables.GetEnv("PROJECTSEED", "super-secret-string")
	var projectSeedVal string
	if projectSeedString != "" {
		projectSeedVal = projectSeedString
	} else {
		projectSeedVal = jwtSecretString
	}

	buildImage := variables.GetEnv("DEFAULT_BUILD_DEPLOY_IMAGE", "")
	buildImage = variables.GetEnv("EDGE_BUILD_DEPLOY_IMAGE", buildImage)
	if deployData.DeployTarget.BuildImage != "" {
		buildImage = deployData.DeployTarget.BuildImage
	}
	if deployData.Project.BuildImage != "" {
		buildImage = deployData.Project.BuildImage
	}

	aoue, err := l.addOrUpdateEnvironment(deployData, deployBaseRef, deployHeadRef, deployTitle, string(environmentType))
	if err != nil {
		return nil, fmt.Errorf("error creating or getting environment: %v", err)
	}
	// fmt.Println("addOrUpdateEnvironment", aoue)

	// create deployment
	deployment, err := l.addDeployment(deployData, aoue.ID, *buildPriority)
	if err != nil {
		return nil, fmt.Errorf("error creating deployment: %v", err)
	}
	// fmt.Println("addDeployment", deployment)

	routerPattern, envvars := getRouterPatternAndVariables(deployData, *aoue, int(*buildPriority))
	envVarBytes, _ := json.Marshal(envvars)

	priority := int(*buildPriority)
	envAutoIdle := int(*aoue.AutoIdle)
	projectAutoIdle := int(*deployData.Project.AutoIdle)
	storageCalc := int(*deployData.Project.StorageCalc)

	buildPayload := lagooncrd.LagoonBuild{
		ObjectMeta: v1.ObjectMeta{
			Name:      deployData.BuildName,
			Namespace: "lagoon",
		},
		Spec: lagooncrd.LagoonBuildSpec{
			Build: lagooncrd.Build{
				Type:     strings.ToLower(string(deployData.DeployType)),
				Image:    buildImage,
				Priority: &priority,
				BulkID:   deployData.BulkID,
			},
			Branch: lagooncrd.Branch{
				Name: deployData.BranchName,
			},
			Pullrequest:  *pullrequest,
			Promote:      *promote,
			GitReference: gitRef,
			Project: lagooncrd.Project{
				ID:                    &deployData.Project.ID,
				Name:                  deployData.Project.Name,
				UILink:                deployment.UILink,
				Environment:           environmentName,
				EnvironmentType:       strings.ToLower(string(environmentType)),
				EnvironmentID:         &aoue.ID,
				GitURL:                deployData.Project.GitURL,
				EnvironmentIdling:     &envAutoIdle,
				ProjectIdling:         &projectAutoIdle,
				StorageCalculator:     &storageCalc,
				ProductionEnvironment: deployData.Project.ProductionEnvironment,
				StandbyEnvironment:    deployData.Project.StandbyProductionEnvironment,
				SubFolder:             deployData.Project.Subfolder,
				RouterPattern:         routerPattern,
				DeployTarget:          deployData.DeployTarget.Name,
				ProjectSecret:         projectSecret(deployData.Project.Name, projectSeedVal),
				Key:                   []byte(deployData.Project.PrivateKey),
				// monitoring config should be deprecated
				// Monitoring: lagooncrd.Monitoring{
				// 	Contact:      "",
				// 	StatuspageID: "",
				// },
				Variables: lagooncrd.LagoonVariables{
					Environment: envVarBytes,
				},
			},
		},
	}
	if deployData.Project.OrganizationDetails != nil {
		buildPayload.Spec.Project.Organization = &lagooncrd.Organization{
			Name: deployData.Project.OrganizationDetails.Name,
			ID:   &deployData.Project.OrganizationDetails.ID,
		}
	}
	return &buildPayload, nil
}

func BuildToBytes(buildPayload *lagooncrd.LagoonBuild) []byte {
	buildPayloadBytes, _ := json.Marshal(buildPayload)
	return buildPayloadBytes
}
