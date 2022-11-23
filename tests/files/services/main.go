package main

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
)

type funcType func() map[string]string

func main() {

	handler := http.HandlerFunc(handleReq)
	mariaHandler := http.HandlerFunc(mariaHandler)
	postgresHandler := http.HandlerFunc(postgresHandler)
	solrHandler := http.HandlerFunc(solrHandler)
	redisHandler := http.HandlerFunc(redisHandler)
	opensearchHandler := http.HandlerFunc(opensearchHandler)
	mongoHandler := http.HandlerFunc(mongoHandler)
	http.Handle("/", handler)
	http.Handle("/maria", mariaHandler)
	http.Handle("/postgres", postgresHandler)
	http.Handle("/solr", solrHandler)
	http.Handle("/redis", redisHandler)
	http.Handle("/opensearch", opensearchHandler)
	http.Handle("/mongo", mongoHandler)

	log.Fatal(http.ListenAndServe(":3000", nil))
}

func handleReq(w http.ResponseWriter, r *http.Request) {
	var funcToCall []funcType
	for _, conFunc := range funcToCall {
		fmt.Fprintf(w, createKeyValuePairs(conFunc(), ""))
	}
}

func createKeyValuePairs(f map[string]string, connectorHost string) string {
	b := new(bytes.Buffer)
	for key, value := range f {
		fmt.Fprintf(b, "\"%s=%s\"\n", key, value)
	}
	connectorOutput := connectorHost + "\n" + b.String()
	return connectorOutput
}
