package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"

	"github.com/vanng822/go-solr/solr"
)

func solrHandler(w http.ResponseWriter, r *http.Request) {
	solrPath := r.URL.Path
	solrRoute := strings.ReplaceAll(solrPath, "/", "")
	solrConnectionStr := fmt.Sprintf("http://%s:8983/solr", solrRoute)
	fmt.Fprintf(w, convertSolrDoc(solrConnector(solrConnectionStr), solrRoute))
}

func convertSolrDoc(d []solr.Document, version string) string {
	solrDoctoString := fmt.Sprintf("%s", d)
	results := strings.Fields(solrDoctoString)
	var replaced []string
	r := regexp.MustCompile(`[\[\]']+`)
	for _, str := range results {
		cleanSolrString := strings.ReplaceAll(str, "map", "")
		replaced = append(replaced, r.ReplaceAllString(cleanSolrString, ""))
	}
	keyVals := connectorKeyValues(replaced)
	solrHost := fmt.Sprintf(`"SERVICE_HOST=%s"`, version)
	solrOutput := solrHost + "\n" + keyVals
	return solrOutput
}

func solrConnector(connectionString string) []solr.Document {
	si, err := solr.NewSolrInterface(connectionString, "mycore")
	if err != nil {
		log.Print(err)
	}
	si.DeleteAll()
	d := solr.Document{}
	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		d.Set(pair[0], pair[1])
		if err != nil {
			log.Print(err)
		}
	}
	documents := []solr.Document{}
	documents = append(documents, d)
	si.Add(documents, 1, nil)
	si.Commit()
	query := solr.NewQuery()
	query.Q("*:*")
	query.FieldList("LAGOON_*")
	s := si.Search(query)
	r, err := s.Result(nil)
	if err != nil {
		log.Print("Error: ", err)
	}
	return r.Results.Docs
}
