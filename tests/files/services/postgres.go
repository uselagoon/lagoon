package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	_ "github.com/lib/pq"
)

var (
	postgresUser          = os.Getenv("POSTGRES_USERNAME")
	postgresPassword      = os.Getenv("POSTGRES_PASSWORD")
	postgresDB            = os.Getenv("POSTGRES_DATABASE")
	postgresHost          = os.Getenv("POSTGRES_HOST")
	postgresSSL           = "disable"
	postgresConnectionStr = fmt.Sprintf(
		"user=%s password=%s dbname=%s sslmode=%s host=%s",
		postgresUser, postgresPassword, postgresDB, postgresSSL, postgresHost)
)

func postgresHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, dbConnectorPairs(postgresDBConnector(), postgresHost))
}

func postgresDBConnector() map[string]string {
	db, err := sql.Open("postgres", postgresConnectionStr)
	if err != nil {
		log.Print(err)
	}

	defer db.Close()

	createTable := "CREATE TABLE IF NOT EXISTS env(env_key text, env_value text)"
	_, err = db.Exec(createTable)
	if err != nil {
		panic(err.Error())
	}

	query := "INSERT INTO env(env_key, env_value) VALUES ($1, $2)"
	for _, e := range os.Environ() {

		pair := strings.SplitN(e, "=", 2)
		_, err := db.Exec(query, pair[0], pair[1])
		if err != nil {
			panic(err.Error())
		}
	}

	gitSHA := "LAGOON_%"
	rows, err := db.Query(`SELECT * FROM env where env_key LIKE $1`, gitSHA)
	if err != nil {
		log.Print(err)
	}

	defer rows.Close()
	results := make(map[string]string)
	for rows.Next() {
		var envKey, envValue string
		_ = rows.Scan(&envKey, &envValue)
		results[envKey] = envValue
	}

	return results
}
