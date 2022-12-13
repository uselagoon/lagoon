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
	postgresSSL           = "disable"
	postgresVersion       string
	postgresConnectionStr string
)

func postgresHandler(w http.ResponseWriter, r *http.Request) {
	postgresPath := r.URL.Path
	localService, lagoonService := cleanRoute(postgresPath)
	postgresUser := getEnv(fmt.Sprintf("%s_USERNAME", lagoonService), "lagoon")
	postgresPassword := getEnv(fmt.Sprintf("%s_PASSWORD", lagoonService), "lagoon")
	postgresHost := getEnv(fmt.Sprintf("%s_HOST", lagoonService), localService)
	postgresPort := getEnv(fmt.Sprintf("%s_PORT", lagoonService), "5432")
	postgresDatabase := getEnv(fmt.Sprintf("%s_DATABASE", lagoonService), "lagoon")

	postgresConnectionStr = fmt.Sprintf("user=%s password=%s dbname=%s sslmode=%s host=%s port=%s", postgresUser, postgresPassword, postgresDatabase, postgresSSL, postgresHost, postgresPort)
	log.Print(fmt.Sprintf("Using %s as the connstring", postgresConnectionStr))

	fmt.Fprintf(w, dbConnectorPairs(postgresDBConnector(postgresConnectionStr), postgresVersion))
}

func postgresDBConnector(connectionString string) map[string]string {
	db, err := sql.Open("postgres", connectionString)
	if err != nil {
		log.Print(err)
	}

	defer db.Close()

	createTable := "CREATE TABLE IF NOT EXISTS env(env_key text, env_value text)"
	_, err = db.Exec(createTable)
	if err != nil {
		log.Print(err)
	}

	query := "INSERT INTO env(env_key, env_value) VALUES ($1, $2)"
	for _, e := range os.Environ() {

		pair := strings.SplitN(e, "=", 2)
		_, err := db.Exec(query, pair[0], pair[1])
		if err != nil {
			log.Print(err)
		}
	}

	gitSHA := "LAGOON_%"
	rows, err := db.Query(`SELECT * FROM env where env_key LIKE $1`, gitSHA)
	if err != nil {
		log.Print(err)
	}

	db.QueryRow("SELECT VERSION()").Scan(&postgresVersion)

	defer rows.Close()
	results := make(map[string]string)
	for rows.Next() {
		var envKey, envValue string
		_ = rows.Scan(&envKey, &envValue)
		results[envKey] = envValue
	}

	return results
}
