package lagoonclient

import (
	"context"
	"github.com/Khan/genqlient/graphql"
	"net/http"
	"net/http/httptest"
	"testing"
)


func TestGetEnvironmentWorkflows(t *testing.T) {

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if r.URL.Path != "/" {
			t.Errorf("Expected to request '/fixedvalue', got: %s", r.URL.Path)
		}
		//if r.Header.Get("Accept") != "application/json" {
		//	t.Errorf("Expected Accept: application/json header, got: %s", r.Header.Get("Accept"))
		//}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
  "data": {
    "environmentByName": {
      "id": 3,
      "name": "Master",
      "workflows": [
        {
          "id": 1,
          "event": "testevent",
          "advancedTaskDefinition": {
            "id": 1,
            "command": "env | sort",
			"__typename": "AdvancedTaskDefinitionCommand"
          }
        }
      ]
    }
  }
}`))
	}))
	defer server.Close()

	client := graphql.NewClient(server.URL, http.DefaultClient)
	w, err := GetEnvironmentWorkflows(context.TODO(), client, 1, "test")

	if err != nil {
		t.Errorf("GetEnvironmentWorkflows() error = %v", err)
		return
	}

	if w[0].Id != 1 {
		t.Errorf("GetEnvironmentWorkflows() error = %v", "Incorrent id returned" )
		return
	}

}

//type HeaderRoundTripper struct {
//	next http.RoundTripper
//	Header http.Header
//}
//
//func (rt HeaderRoundTripper) RoundTrip(request *http.Request) (*http.Response, error) {
//	if rt.Header != nil {
//		for k, v := range rt.Header {
//			request.Header[k] = v
//		}
//	}
//	fmt.Println("HeaderRoundTrip")
//	return rt.next.RoundTrip(request)
//}
//
//func NewHeaderRoundTripper(next http.RoundTripper, Header http.Header) *HeaderRoundTripper {
//	if next == nil {
//		next = http.DefaultTransport
//	}
//	return &HeaderRoundTripper{
//		next:   next,
//		Header: Header,
//	}
//}
//
//
//func TestGetEnvironmentWorkflowsAgainstServer(t *testing.T) {
//
//
//	var bearer = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4iLCJpc3MiOiJhcGktZGF0YS13YXRjaGVyLXB1c2hlciIsImF1ZCI6ImFwaS5kZXYiLCJzdWIiOiJhcGktZGF0YS13YXRjaGVyLXB1c2hlciJ9.GiSJpvNXF2Yj9IXVCsp7KrxVp8N2gcp7-6qpyNOakVw"
//	header := make(http.Header)
//	header.Set("Accept", "application/json")
//	header.Set("Content-Type", "application/json")
//	header.Set("Authorization", bearer)
//
//	hrt := NewHeaderRoundTripper(nil, header)
//	client := graphql.NewClient("http://localhost:3000/graphql", &http.Client{
//		Transport: hrt,
//	})
//
//	// Create a Bearer string by appending string access token
//
//
//	w, err := GetEnvironmentWorkflows(context.TODO(), client, 18, "Master")
//
//	if err != nil {
//		t.Errorf("GetEnvironmentWorkflows() error = %v", err)
//		return
//	}
//
//	if w[0].Id != 1 {
//		t.Errorf("GetEnvironmentWorkflows() error = %v", "Incorrent id returned" )
//		return
//	}
//
//}
