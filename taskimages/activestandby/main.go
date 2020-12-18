package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"gopkg.in/matryer/try.v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// this is the return data structure for the active standby task.
// this will be sent back to lagoon as a payload to be processed.
type returnData struct {
	Status                      string `json:"status"`
	ProductionEnvironment       string `json:"productionEnvironment"`
	StandbyProdutionEnvironment string `json:"standbyProductionEnvironment"`
	ProductionRoutes            string `json:"productionRoutes"`
	StandbyRoutes               string `json:"standbyRoutes"`
}

func main() {
	// get the values from the provided environment variables.
	JSONPayload := os.Getenv("JSON_PAYLOAD")
	podName := os.Getenv("PODNAME")
	podNamespace := os.Getenv("NAMESPACE")
	// check that they aren't empty.
	if JSONPayload == "" {
		fmt.Printf("Task failed, error was: no payload provided")
		os.Exit(1)
	}
	if podName == "" {
		fmt.Printf("Task failed, error was: no podname provided")
		os.Exit(1)
	}
	if podNamespace == "" {
		fmt.Printf("Task failed, error was: no podnamespace provided")
		os.Exit(1)
	}

	// read the deployer token.
	token, err := ioutil.ReadFile("/var/run/secrets/lagoon/deployer/token")
	if err != nil {
		fmt.Printf("Task failed to read the token, error was: %v", err)
		os.Exit(1)
	}
	// generate the rest config for the client.
	config := &rest.Config{
		BearerToken: string(token),
		Host:        "https://kubernetes.default.svc",
		TLSClientConfig: rest.TLSClientConfig{
			Insecure: true,
		},
	}
	// create the client using the rest config.
	c, err := client.New(config, client.Options{})
	if err != nil {
		fmt.Printf("Task failed creating the client, error was: %v", err)
		os.Exit(1)
	}

	// decode the payload data and unmarshal it.
	payloadBytes, err := base64.StdEncoding.DecodeString(JSONPayload)
	if err != nil {
		fmt.Printf("Task failed to decode the supplied payload data, error was: %v", err)
		os.Exit(1)
	}
	var payloadData map[string]interface{}
	if err := json.Unmarshal(payloadBytes, &payloadData); err != nil {
		fmt.Printf("Task failed to unsmarshal the given payload data, error was: %v", err)
		os.Exit(1)
	}

	// get the provided CRD from the payload data and unmarshal it to unstructured so we can create it in kubernetes.
	crdBytes, err := json.Marshal(payloadData["crd"])
	if err != nil {
		fmt.Printf("Task failed to marshal the given payload data, error was: %v", err)
		os.Exit(1)
	}
	crd := unstructured.Unstructured{}
	if err := crd.UnmarshalJSON([]byte(crdBytes)); err != nil {
		fmt.Printf("Task failed to unsmarshal the given payload data, error was: %v", err)
		os.Exit(1)
	}
	// set the namespace for the crd.
	crd.SetNamespace(podNamespace)

	// create the crd in kubernetes.
	if err := c.Create(context.Background(), &crd); err != nil {
		fmt.Printf("Task failed to create the object, error was: %v", err)
		os.Exit(1)
	}

	// check the status of the crd until we have the status conditions.
	// otherwise give up after a few minutes.
	err = try.Do(func(attempt int) (bool, error) {
		var err error
		if err := c.Get(context.Background(), types.NamespacedName{
			Namespace: podNamespace,
			Name:      crd.GetName(),
		}, &crd); err != nil {
			fmt.Printf("Task failed to get the object from kubernetes, error was: %v", err)
			os.Exit(1)
		}
		// check if the status exists, the job may not have started.
		if _, ok := crd.Object["status"]; ok {
			conditions := crd.Object["status"].(map[string]interface{})
			// check if the conditions exists, the job may not have started.
			if _, ok := conditions["conditions"]; ok {
				// loop over the conditions until we get a completed or failed status.
				for _, condition := range conditions["conditions"].([]interface{}) {
					mapval := condition.(map[string]interface{})
					// if the status is failed, we need to make sure the pod exits accordingly
					if mapval["type"].(string) == "failed" {
						crdSpec := crd.Object["spec"].(map[string]interface{})
						if crdSpec != nil {
							crdHosts := crdSpec["hosts"].(map[string]interface{})
							if crdHosts != nil {
								rData := returnData{
									Status:                      "Failed",
									ProductionEnvironment:       payloadData["productionEnvironment"].(string),
									StandbyProdutionEnvironment: payloadData["standbyEnvironment"].(string),
									ProductionRoutes:            crdHosts["activeHosts"].(string),
									StandbyRoutes:               crdHosts["standbyHosts"].(string),
								}

								// print the result of the task, it will go back to lagoon-logs to be displayed
								// to the user
								jsonData, _ := json.Marshal(rData)
								fmt.Println(string(jsonData))
								// exit as the task failed
								os.Exit(1)
							}
							fmt.Printf("Task failed, error was: no hosts found in resource")
							os.Exit(1)
						}
						fmt.Printf("Task failed, error was: no spec found in resource")
						os.Exit(1)
					}
					// if the status is completed, then do some additional steps as there could still be a failure
					if mapval["type"].(string) == "completed" {
						crdSpec := crd.Object["spec"].(map[string]interface{})
						if crdSpec != nil {
							crdHosts := crdSpec["hosts"].(map[string]interface{})
							if crdHosts != nil {
								rData := returnData{
									Status:                      "Completed",
									ProductionEnvironment:       payloadData["productionEnvironment"].(string),
									StandbyProdutionEnvironment: payloadData["standbyEnvironment"].(string),
									ProductionRoutes:            crdHosts["activeHosts"].(string),
									StandbyRoutes:               crdHosts["standbyHosts"].(string),
								}

								// print the result of the task, it will go back to lagoon-logs to be displayed
								// to the user
								jsonData, _ := json.Marshal(rData)
								fmt.Println(string(jsonData))

								// update this pods annotations so that the lagoonmonitor controller
								// knows that it needs to send information back to lagoon
								pod := corev1.Pod{}
								if err := c.Get(context.Background(), types.NamespacedName{
									Namespace: podNamespace,
									Name:      podName,
								}, &pod); err != nil {
									fmt.Printf(`========================================
Task failed to get the pod to update, error was: %v
========================================
The active standby switch completed, but Lagoon has not been updated to reflect the changes.
Please contact your Lagoon administrator to make sure your project gets updated correctly.
Provide a copy of this entire log to the team.`, err)
									os.Exit(1)
								}
								// the job data to send back to lagoon must be base64 encoded
								pod.ObjectMeta.Annotations = map[string]string{
									"lagoon.sh/taskData": base64.StdEncoding.EncodeToString(jsonData),
								}
								// update the pod with the annotation
								if err := c.Update(context.Background(), &pod); err != nil {
									fmt.Printf(`========================================
Task failed to update pod with return information, error was: %v
========================================
The active standby switch completed, but Lagoon has not been updated to reflect the changes.
Please contact your Lagoon administrator to make sure your project gets updated correctly.
Provide a copy of this entire log to the team.`, err)
									// if the update fails, exit 1
									// if this update fails, it will not update the annotation on the pod
									// and so the monitor controller won't know to send the response data to lagoon
									// in this case, the migration completed, but the task failed
									// inform the user
									os.Exit(1)
								}
								os.Exit(0)
							}
							fmt.Printf("Task failed, error was: no hosts found in resource")
							os.Exit(1)
						}
						fmt.Printf("Task failed, error was: no spec found in resource")
						os.Exit(1)
					}
				}
			}
		}
		// sleep for 5 seconds up to a maximum of 60 times (5 minutes) before finally giving up
		time.Sleep(5 * time.Second)
		err = fmt.Errorf("checking again")
		return attempt < 60, err
	})
	if err != nil {
		fmt.Printf("Task failed, timed out waiting for the job to start: %v", err)
		os.Exit(1)
	}
}
