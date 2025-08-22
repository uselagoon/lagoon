package lagoon

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/namespace"
	"github.com/uselagoon/machinery/utils/variables"
	lagooncrd "github.com/uselagoon/remote-controller/api/lagoon/v1beta2"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (l *LagoonAPI) GetControllerBuildData(deployData DeployData) (*lagooncrd.LagoonBuild, error) {
	// shorten and make safe the environment name from the branch and project
	environmentName := namespace.ShortenEnvironment(deployData.Project.Name, namespace.MakeSafe(deployData.UnsafeEnvironmentName))
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
		gitRef = fmt.Sprintf("origin/%s", deployData.UnsafeEnvironmentName)
	}

	var deployBaseRef, deployHeadRef, deployTitle string
	pullrequest := &lagooncrd.Pullrequest{}
	promote := &lagooncrd.Promote{}
	switch deployData.DeployType {
	case schema.Branch:
		deployBaseRef = deployData.UnsafeEnvironmentName
	case schema.PullRequest:
		gitRef = deployData.GitSHA
		deployTitle = deployData.Pull.PullRequest.Title
		deployBaseRef = deployData.Pull.PullRequest.Target
		deployHeadRef = deployData.Pull.PullRequest.Source
		pullrequest = &lagooncrd.Pullrequest{
			Title:      deployData.Pull.PullRequest.Title,
			Number:     strconv.Itoa(deployData.Pull.PullRequest.Number), // uugghh string in the crd
			BaseBranch: deployData.Pull.PullRequest.Target,
			BaseSha:    deployData.Pull.PullRequest.Base.Sha,
			HeadBranch: deployData.Pull.PullRequest.Source,
			HeadSha:    deployData.Pull.PullRequest.Sha,
		}
		switch deployData.GitType {
		case "gogs":
			pullrequest.BaseSha = fmt.Sprintf("origin/%s", deployData.Pull.PullRequest.Target)
			pullrequest.HeadSha = fmt.Sprintf("origin/%s", deployData.Pull.PullRequest.Source)
		case "gitlab":
			// gitlab does not send us the target sha, we just use the target_branch
			pullrequest.BaseSha = fmt.Sprintf("origin/%s", deployData.Pull.PullRequest.Target)
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
			Name:      deployment.Name, // use the name from the deployment, which should match deployData.BuildName that was provided
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
				Name: deployData.UnsafeEnvironmentName,
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
