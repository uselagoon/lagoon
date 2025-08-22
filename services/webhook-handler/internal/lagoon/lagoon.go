package lagoon

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/variables"
)

func getRouterPatternAndVariables(deployData DeployData, environment schema.Environment, buildPriority int) (string, []EnvVar) {
	appliedEnvVars := []EnvVar{}
	routerPattern := deployData.Project.DeployTarget.RouterPattern
	if deployData.DeployTarget.RouterPattern != "" {
		routerPattern = deployData.DeployTarget.RouterPattern
	}
	if deployData.Project.RouterPattern != "" {
		routerPattern = deployData.Project.RouterPattern
	}
	/*
		Internal scoped env vars.

		Uses the env vars system to send data to lagoon-remote but should not be
		overrideable by Lagoon API env vars.
	*/
	appliedEnvVars = append(appliedEnvVars, EnvVar{
		Name:  "LAGOON_SYSTEM_CORE_VERSION",
		Value: variables.GetEnv("LAGOON_VERSION", "unknown"),
		Scope: "internal_system",
	})
	appliedEnvVars = append(appliedEnvVars, EnvVar{
		Name:  "LAGOON_SYSTEM_ROUTER_PATTERN",
		Value: routerPattern,
		Scope: "internal_system",
	})
	bucket, shared := getBAASBucketName(deployData.Project, deployData.DeployTarget)
	if shared {
		appliedEnvVars = append(appliedEnvVars, EnvVar{
			Name:  "LAGOON_SYSTEM_PROJECT_SHARED_BUCKET",
			Value: bucket,
			Scope: "internal_system",
		})
	}
	if deployData.Project.OrganizationDetails != nil {
		appliedEnvVars = append(appliedEnvVars, EnvVar{
			Name:  "LAGOON_ROUTE_QUOTA",
			Value: strconv.Itoa(deployData.Project.OrganizationDetails.QuotaRoute),
			Scope: "internal_system",
		})
	}
	/*
	   Normally scoped env vars.

	   Env vars that are set by users, or derived from them.
	*/
	// Build env vars passed to the API.
	appliedEnvVars = append(appliedEnvVars, deployData.BuildVariables...)

	// Bulk deployment vars
	switch deployData.BulkType {
	case BulkDeploy:
		appliedEnvVars = append(appliedEnvVars, EnvVar{
			Name:  "LAGOON_BUILD_PRIORITY",
			Value: strconv.Itoa(buildPriority),
			Scope: "build",
		})
		if deployData.BulkID != "" {
			appliedEnvVars = append(appliedEnvVars, EnvVar{
				Name:  "LAGOON_BULK_DEPLOY",
				Value: "true",
				Scope: "build",
			})
			appliedEnvVars = append(appliedEnvVars, EnvVar{
				Name:  "LAGOON_BULK_DEPLOY_ID",
				Value: deployData.BulkID,
				Scope: "build",
			})
			if deployData.BulkName != "" {
				appliedEnvVars = append(appliedEnvVars, EnvVar{
					Name:  "LAGOON_BULK_DEPLOY_NAME",
					Value: deployData.BulkName,
					Scope: "build",
				})
			}
		}
	case BulkTask:
		appliedEnvVars = append(appliedEnvVars, EnvVar{
			Name:  "LAGOON_TASK_PRIORITY",
			Value: strconv.Itoa(buildPriority),
			Scope: "build",
		})
		if deployData.BulkID != "" {
			appliedEnvVars = append(appliedEnvVars, EnvVar{
				Name:  "LAGOON_BULK_TASK",
				Value: "true",
				Scope: "build",
			})
			appliedEnvVars = append(appliedEnvVars, EnvVar{
				Name:  "LAGOON_BULK_TASK_ID",
				Value: deployData.BulkID,
				Scope: "build",
			})
			if deployData.BulkName != "" {
				appliedEnvVars = append(appliedEnvVars, EnvVar{
					Name:  "LAGOON_BULK_TASK_NAME",
					Value: deployData.BulkName,
					Scope: "build",
				})
			}
		}
	}
	for _, v := range environment.EnvVariables {
		addVarIfNotExist(&appliedEnvVars, EnvVar{
			Name:  v.Name,
			Scope: strings.ToLower(string(v.Scope)),
			Value: v.Value,
		})
	}
	for _, v := range deployData.Project.EnvVariables {
		addVarIfNotExist(&appliedEnvVars, EnvVar{
			Name:  v.Name,
			Scope: strings.ToLower(string(v.Scope)),
			Value: v.Value,
		})
	}
	if deployData.Project.OrganizationDetails != nil {
		for _, v := range deployData.Project.OrganizationDetails.EnvVariables {
			addVarIfNotExist(&appliedEnvVars, EnvVar{
				Name:  v.Name,
				Scope: strings.ToLower(string(v.Scope)),
				Value: v.Value,
			})
		}
	}

	return routerPattern, appliedEnvVars
}

func addVarIfNotExist(envVars *[]EnvVar, envVar EnvVar) {
	exists := false
	for _, e := range *envVars {
		if e.Name == envVar.Name {
			exists = true
		}
	}
	if !exists {
		*envVars = append(*envVars, envVar)
	}
}

func getBAASBucketName(project schema.Project, deploytarget schema.DeployTarget) (string, bool) {
	for _, v := range project.EnvVariables {
		if v.Name == "LAGOON_BAAS_BUCKET_NAME" {
			return v.Value, false
		}
	}
	if project.SharedBaasBucket != nil && *project.SharedBaasBucket {
		return deploytarget.SharedBaasBucketName, true
	}
	return "", false
}

func projectSecret(name, seed string) string {
	data := fmt.Sprintf("%s-%s", name, seed)
	hash := sha256.New()
	hash.Write([]byte(data))
	hashInBytes := hash.Sum(nil)
	return hex.EncodeToString(hashInBytes)
}

func GenerateBuildName() string {
	return fmt.Sprintf("lagoon-build-%s", strconv.FormatInt(rand.New(rand.NewSource(time.Now().UnixNano())).Int63(), 36)[7:])
}

func RemoveToBytes(payload *RemoveData) []byte {
	payloadBytes, _ := json.Marshal(payload)
	return payloadBytes
}
