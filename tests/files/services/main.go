package main

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
	"strings"
)

type funcType func() map[string]string

func main() {

	handler := http.HandlerFunc(handleReq)
	mariadbHandler := http.HandlerFunc(mariadbHandler)
	postgresHandler := http.HandlerFunc(postgresHandler)
	solrHandler := http.HandlerFunc(solrHandler)
	redisHandler := http.HandlerFunc(redisHandler)
	opensearchHandler := http.HandlerFunc(opensearchHandler)
	mongoHandler := http.HandlerFunc(mongoHandler)
	http.Handle("/", handler)
	http.Handle("/mariadb", mariadbHandler)
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
		fmt.Fprintf(w, dbConnectorPairs(conFunc(), ""))
	}
}

func dbConnectorPairs(m map[string]string, connectorHost string) string {
	b := new(bytes.Buffer)
	for key, value := range m {
		fmt.Fprintf(b, "\"%s=%s\"\n", key, value)
	}
	host := fmt.Sprintf(`"Service_Host=%s"`, connectorHost)
	connectorOutput := host + "\n" + b.String()
	return connectorOutput
}

func connectorKeyValues(values []string) string {
	b := new(bytes.Buffer)
	for _, value := range values {
		v := strings.SplitN(value, ":", 2)
		fmt.Fprintf(b, "\"%s=%s\"\n", v[0], v[1])
	}
	return b.String()
}
