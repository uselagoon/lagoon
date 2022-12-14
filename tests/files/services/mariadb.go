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
	mariadbUser          = os.Getenv("MARIADB_USERNAME")
	mariadbPassword      = os.Getenv("MARIADB_PASSWORD")
	mariadb              = os.Getenv("MARIADB_DATABASE")
	mariadbHost          = os.Getenv("MARIADB_HOST")
	mariadbPort          = 3306
	mariadbConnectionStr = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s", mariadbUser, mariadbPassword, mariadbHost, mariadbPort, mariadb)
)

func mariadbHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, dbConnectorPairs(mariadbConnector(), mariadbHost))
}

func mariadbConnector() map[string]string {
	db, err := sql.Open("mysql", mariadbConnectionStr)
	if err != nil {
		log.Print(err)
	}

	defer db.Close()

	createTable := "CREATE TABLE IF NOT EXISTS env(env_key text, env_value text)"
	_, err = db.Exec(createTable)
	if err != nil {
		panic(err.Error())
	}

	query := "INSERT INTO env(env_key, env_value) VALUES (?, ?)"

	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		_, err := db.Exec(query, pair[0], pair[1])
		if err != nil {
			panic(err.Error())
		}
	}

	q := "LAGOON_%"
	rows, err := db.Query(`SELECT * FROM env where env_key LIKE ?`, q)
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
