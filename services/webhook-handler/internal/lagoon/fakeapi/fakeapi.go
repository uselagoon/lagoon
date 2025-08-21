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
	for a, i := range p {
		switch a {
		// if the request is a query, the value of the query (query and mutations) will be in `i`
		// it is an interface in go because its graphql, and not json
		// so you'd have to do some sort of comparison like this against known queries
		case "query":
			request := i.(string)
			if strings.Contains(request, "webhookProcessProjects") {
				switch {
				case strings.Contains(request, "https://github.com/fake/repository.git"):
					a, _ := f.ReadFile("testdata/allProjects.1.json")
					fmt.Fprintf(w, "%s", a)
				case strings.Contains(request, "https://github.com/fake/repository2.git"):
					a, _ := f.ReadFile("testdata/allProjects.2.json")
					fmt.Fprintf(w, "%s", a)
				case strings.Contains(request, "https://github.com/fake/repository3.git"):
					a, _ := f.ReadFile("testdata/allProjects.3.json")
					fmt.Fprintf(w, "%s", a)
				default:
					fmt.Fprintf(w, `{"data":{"allProjects":[]}}`)
				}
			}
			if strings.Contains(request, "addOrUpdateEnvironment") {
				d := false
				if _, ok := variables["project"]; ok {
					d = true
				}
				switch {
				case d && variables["project"].(float64) == 18:
					a, _ := f.ReadFile("testdata/addOrUpdateEnvironment.1.json")
					fmt.Fprintf(w, "%s", a)
				case d && variables["project"].(float64) == 19:
					a, _ := f.ReadFile("testdata/addOrUpdateEnvironment.2.json")
					fmt.Fprintf(w, "%s", a)
				case d && variables["project"].(float64) == 20:
					a, _ := f.ReadFile("testdata/addOrUpdateEnvironment.3.json")
					fmt.Fprintf(w, "%s", a)
				default:
					fmt.Fprintf(w, `{"data":{}}`)
				}
			}
			if strings.Contains(request, "addDeployment") {
				// a, _ := f.ReadFile("testdata/addDeployment.1.json")
				// fmt.Fprintf(w, "%s", a)
				d := false
				if _, ok := variables["environment"]; ok {
					d = true
				}
				switch {
				case d && variables["environment"].(float64) == 58:
					a, _ := f.ReadFile("testdata/addDeployment.1.json")
					fmt.Fprintf(w, "%s", a)
				case d && variables["environment"].(float64) == 59:
					a, _ := f.ReadFile("testdata/addDeployment.2.json")
					fmt.Fprintf(w, "%s", a)
				case d && variables["environment"].(float64) == 60:
					a, _ := f.ReadFile("testdata/addDeployment.3.json")
					fmt.Fprintf(w, "%s", a)
				default:
					fmt.Fprintf(w, `{"data":{}}`)
				}
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
