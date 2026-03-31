package mockapi

import (
	"embed"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
)

//go:embed testdata/*
var f embed.FS

func graphql(w http.ResponseWriter, r *http.Request) {
	var p map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&p)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	var variables map[string]interface{}
	if val, ok := p["variables"]; ok {
		if val != nil {
			b, _ := json.Marshal(val)
			json.Unmarshal(b, &variables)
		}
	}
	// fmt.Println(variables)
	for t, i := range p {
		switch t {
		// if the request is a query, the value of the query (query and mutations) will be in `i`
		// it is an interface in go because its graphql, and not json
		// so you'd have to do some sort of comparison like this against known queries
		case "query":
			request := i.(string)
			a := []byte(`{"data":{}}`)
			if strings.Contains(request, "allProjects") {
				a = []byte(`{"data":{"allProjects":[]}}`)
				switch {
				case variables["gitUrl"].(string) == "git@github.com:amazeeio/lagoon-nginx-example.git":
					a, _ = f.ReadFile("testdata/allProjects.1.json")
				case variables["gitUrl"].(string) == "git@62cfac0b10da:root/example-project.git":
					a, _ = f.ReadFile("testdata/allProjects.2.json")
				case variables["gitUrl"].(string) == "git@localhost:example/testrepo.git":
					a, _ = f.ReadFile("testdata/allProjects.3.json")
				case variables["gitUrl"].(string) == "ssh://git@localhost:7999/tes/testrepo.git":
					a, _ = f.ReadFile("testdata/allProjects.4.json")
				case variables["gitUrl"].(string) == "ssh://git@localhost:10022/exampleuser/testrepository.git":
					a, _ = f.ReadFile("testdata/allProjects.5.json")
				case variables["gitUrl"].(string) == "git@bitbucket.org:aio-test/test.git":
					a, _ = f.ReadFile("testdata/allProjects.6.json")
				}
			}
			if strings.Contains(request, "addOrUpdateEnvironment") {
				switch {
				case variables["name"].(string) == "test-branch":
					a, _ = f.ReadFile("testdata/addOrUpdateEnvironment.1.json")
				case variables["name"].(string) == "dev":
					a, _ = f.ReadFile("testdata/addOrUpdateEnvironment.2.json")
				case variables["name"].(string) == "pr-2":
					a, _ = f.ReadFile("testdata/addOrUpdateEnvironment.3.json")
				case variables["name"].(string) == "promotedev":
					a, _ = f.ReadFile("testdata/addOrUpdateEnvironment.4.json")
				case variables["name"].(string) == "deploy/production":
					a, _ = f.ReadFile("testdata/addOrUpdateEnvironment.5.json")
				}
			}
			if strings.Contains(request, "addDeployment") {
				switch {
				case variables["environment"].(float64) == 10:
					a, _ = f.ReadFile("testdata/addDeployment.1.json")
				case variables["environment"].(float64) == 5:
					a, _ = f.ReadFile("testdata/addDeployment.2.json")
				case variables["environment"].(float64) == 11:
					a, _ = f.ReadFile("testdata/addDeployment.3.json")
				case variables["environment"].(float64) == 13:
					a, _ = f.ReadFile("testdata/addDeployment.4.json")
				case variables["environment"].(float64) == 14:
					a, _ = f.ReadFile("testdata/addDeployment.5.json")
				}
			}
			if strings.Contains(request, "projectByName") {

				switch {
				case variables["name"].(string) == "demo-project1":
					a, _ = f.ReadFile("testdata/projectByName.1.json")
				case variables["name"].(string) == "demo-project2":
					a, _ = f.ReadFile("testdata/projectByName.2.json")
				}
			}
			if strings.Contains(request, "environmentById") {
				switch {
				case variables["id"].(float64) == 5:
					a, _ = f.ReadFile("testdata/environmentById.1.json")
				}
			}
			fmt.Fprintf(w, "%s", a)
		}
	}
	fmt.Fprintf(w, "")
}

// TestGraphQLServer is a test server used to test api responses
func TestGraphQLServer() *httptest.Server {
	mux := http.NewServeMux()
	mux.HandleFunc("/graphql", graphql)
	ts := httptest.NewServer(mux)
	return ts
}
