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

var (
	solrService       = os.Getenv("SOLR_HOST")
	solrConnectionStr = fmt.Sprintf("http://%s:8983/solr", solrService)
)

func solrHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, convertSolrDoc(solrConnector()))
}

func convertSolrDoc(d []solr.Document) string {
	solrDoctoString := fmt.Sprintf("%s", d)
	results := strings.Fields(solrDoctoString)
	var replaced []string
	r := regexp.MustCompile(`[\[\]']+`)
	for _, str := range results {
		replaced = append(replaced, r.ReplaceAllString(str, ""))
	}
	keyVals := connectorKeyValues(replaced)
	cleanSolrString := strings.ReplaceAll(keyVals, "map", "")
	solrHost := fmt.Sprintf(`"Service_Host=%s"`, solrService)
	solrOutput := solrHost + "\n" + cleanSolrString
	return solrOutput
}

func solrConnector() []solr.Document {
	si, err := solr.NewSolrInterface(solrConnectionStr, "mycore")
	if err != nil {
		log.Print(err)
	}
	si.DeleteAll()
	d := solr.Document{}
	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		d.Set(pair[0], pair[1])
		if err != nil {
			panic(err.Error())
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
