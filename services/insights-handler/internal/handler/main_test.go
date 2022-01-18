package handler

import (
	cdx "github.com/CycloneDX/cyclonedx-go"
	"github.com/cheshir/go-mq"
	"github.com/uselagoon/lagoon/services/insights-handler/internal/lagoonclient"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

func Test_processingIncomingMessageQueue(t *testing.T) {
	type args struct {
		message mq.Message
	}
	var tests []struct {
		name string
		args args
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
		})
	}
}

func Test_processFactsFromSBOM(t *testing.T) {
	type args struct {
		bom           cdx.BOM
		environmentId int
		source        string
	}

	testResponse, err := ioutil.ReadFile("./testassets/testSBOM.cyclonedx.json")
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

	bom := new(cdx.BOM)
	resp, err := http.Get(server.URL)
	if err != nil {
		panic(err)
	}
	decoder := cdx.NewBOMDecoder(resp.Body, cdx.BOMFileFormatJSON)
	if err = decoder.Decode(bom); err != nil {
		panic(err)
	}

	tests := []struct {
		name string
		args args
		want []lagoonclient.AddFactInput
	}{
		{
			name: "sbom.cdx.json",
			args: args{
				bom:           *bom,
				environmentId: 3,
				source:        "syft",
			},
			want: []lagoonclient.AddFactInput{
				{
					Environment: 3,
					Name:        "@npmcli/arborist:2.6.2",
					Value:       "2.6.2",
					Source:      "syft",
					Description: "pkg:npm/@npmcli%2Farborist@2.6.2",
					KeyFact:     false,
					Type:        "TEXT",
				},
				{
					Environment: 3,
					Name:        "@npmcli/ci-detect:1.3.0",
					Value:       "1.3.0",
					Source:      "syft",
					Description: "pkg:npm/@npmcli%2Fci-detect@1.3.0",
					KeyFact:     false,
					Type:        "TEXT",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := processFactsFromSBOM(tt.args.bom, tt.args.environmentId, tt.args.source); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("processFactsFromSBOM() = %v, want %v", got, tt.want)
			}
		})
	}
}
