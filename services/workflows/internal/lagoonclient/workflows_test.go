package lagoonclient

import (
	"context"
	"github.com/Khan/genqlient/graphql"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
)


func TestGetEnvironmentWorkflows(t *testing.T) {

	testResponse, err := ioutil.ReadFile("./testassets/TestGetEnvironmentWorkflows.response.json")
	if err != nil {
		t.Fatalf("Could not open file" )
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if r.URL.Path != "/" {
			t.Errorf("Expected to request '/fixedvalue', got: %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusOK)
		w.Write(testResponse)
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


func TestInvokeWorkflowOnEnvironment(t *testing.T) {
	testResponse, err := ioutil.ReadFile("./testassets/TestInvokeWorkflowOnEnvironment.response.json")
	if err != nil {
		t.Fatalf("Could not open file" )
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if r.URL.Path != "/" {
			t.Errorf("Expected to request '/fixedvalue', got: %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusOK)
		w.Write(testResponse)
	}))
	defer server.Close()

	client := graphql.NewClient(server.URL, http.DefaultClient)
	status, err := InvokeWorkflowOnEnvironment(context.TODO(), client, 1, 1)

	if err != nil {
		t.Errorf("GetEnvironmentWorkflows() error = %v", err)
		return
	}

	if status == "" {
		t.Errorf("InvokeWorkflowOnEnvironment not returning status")
		return
	}

}
