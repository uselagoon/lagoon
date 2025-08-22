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
	fmt.Println(variables)
	for t, i := range p {
		switch t {
		// if the request is a query, the value of the query (query and mutations) will be in `i`
		// it is an interface in go because its graphql, and not json
		// so you'd have to do some sort of comparison like this against known queries
		case "query":
			request := i.(string)
			if strings.Contains(request, "allProjects") {
				d := false
				if _, ok := variables["gitUrl"]; ok {
					d = true
				}
				a := []byte(`{"data":{"allProjects":[]}}`)
				switch {
				case d && variables["gitUrl"].(string) == "git@github.com:amazeeio/lagoon-nginx-example.git":
					a, _ = f.ReadFile("testdata/allProjects.1.json")
				}
				fmt.Fprintf(w, "%s", a)
			}
			if strings.Contains(request, "addOrUpdateEnvironment") {
				d := false
				if _, ok := variables["name"]; ok {
					d = true
				}
				a := []byte(`{"data":{}}`)
				switch {
				case d && variables["name"].(string) == "test-branch":
					a, _ = f.ReadFile("testdata/addOrUpdateEnvironment.1.json")
				case d && variables["name"].(string) == "dev":
					a, _ = f.ReadFile("testdata/addOrUpdateEnvironment.2.json")
				case d && variables["name"].(string) == "pr-2":
					a, _ = f.ReadFile("testdata/addOrUpdateEnvironment.3.json")
				}
				fmt.Fprintf(w, "%s", a)
			}
			if strings.Contains(request, "addDeployment") {
				d := false
				if _, ok := variables["environment"]; ok {
					d = true
				}
				a := []byte(`{"data":{}}`)
				switch {
				case d && variables["environment"].(float64) == 10:
					a, _ = f.ReadFile("testdata/addDeployment.1.json")
				case d && variables["environment"].(float64) == 5:
					a, _ = f.ReadFile("testdata/addDeployment.2.json")
				case d && variables["environment"].(float64) == 11:
					a, _ = f.ReadFile("testdata/addDeployment.3.json")
				}
				fmt.Fprintf(w, "%s", a)
			}
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
