package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	_ "github.com/go-sql-driver/mysql"
)

var (
	mariadbVersion       string
	mariadbConnectionStr string
)

func mariadbHandler(w http.ResponseWriter, r *http.Request) {
	mariadbPath := r.URL.Path
	localService, lagoonService := cleanRoute(mariadbPath)
	mariadbUser := getEnv(fmt.Sprintf("%s_USERNAME", lagoonService), "lagoon")
	mariadbPassword := getEnv(fmt.Sprintf("%s_PASSWORD", lagoonService), "lagoon")
	mariadbHost := getEnv(fmt.Sprintf("%s_HOST", lagoonService), localService)
	mariadbPort := getEnv(fmt.Sprintf("%s_PORT", lagoonService), "3306")
	mariadbDatabase := getEnv(fmt.Sprintf("%s_DATABASE", lagoonService), "lagoon")

	mariadbConnectionStr = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", mariadbUser, mariadbPassword, mariadbHost, mariadbPort, mariadbDatabase)
	log.Print(fmt.Sprintf("Using %s as the connstring", mariadbConnectionStr))

	fmt.Fprintf(w, dbConnectorPairs(mariadbConnector(mariadbConnectionStr), mariadbVersion))
}

func mariadbConnector(connectionString string) map[string]string {
	db, err := sql.Open("mysql", connectionString)
	if err != nil {
		log.Print(err)
	}

	defer db.Close()

	createTable := "CREATE TABLE IF NOT EXISTS env(env_key text, env_value text)"
	_, err = db.Exec(createTable)
	if err != nil {
		log.Print(err)
	}

	query := "INSERT INTO env(env_key, env_value) VALUES (?, ?)"

	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		_, err := db.Exec(query, pair[0], pair[1])
		if err != nil {
			log.Print(err)
		}
	}

	q := "LAGOON_%"
	rows, err := db.Query(`SELECT * FROM env where env_key LIKE ?`, q)
	if err != nil {
		log.Print(err)
	}

	db.QueryRow("SELECT VERSION()").Scan(&mariadbVersion)

	defer rows.Close()
	results := make(map[string]string)
	for rows.Next() {
		var envKey, envValue string
		_ = rows.Scan(&envKey, &envValue)
		results[envKey] = envValue
	}

	return results
}
