package lagoonclient

import (
	"context"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Khan/genqlient/graphql"
)

func TestAddFacts(t *testing.T) {
	testResponse, err := ioutil.ReadFile("./testassets/TestAddFacts.response.json")
	if err != nil {
		t.Fatalf("Could not open file")
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
	testFacts := []AddFactInput{
		{
			Name:        "test-fact-name",
			Value:       "test-fact-value",
			Source:      "test-source",
			Description: "test-description",
			Type:        "STRING",
		},
		{
			Name:        "test-fact-nam-2",
			Value:       "test-fact-value-2",
			Source:      "test-source-2",
			Description: "test-description-2",
			Type:        "STRING",
		},
	}
	result, err := AddFacts(context.TODO(), client, testFacts)
	if err != nil {
		t.Errorf("AddFacts() error = %v", err)
		return
	}

	if result != "Added 2 facts" {
		t.Errorf("Two facts should have been added: %v", err)
		return
	}
}

func TestDeleteFactsFromSourceFacts(t *testing.T) {
	testResponse, err := ioutil.ReadFile("./testassets/TestDeleteFactsFromSource.response.json")
	if err != nil {
		t.Fatalf("Could not open file")
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
	result, err := DeleteFactsFromSource(context.TODO(), client, 2, "test-source")
	if err != nil {
		t.Errorf("DeleteFactsFromSource() error = %v", err)
		return
	}

	if result != "success" {
		t.Error("No success message return from response")
		return
	}
}
