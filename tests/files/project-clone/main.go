package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
)

var mysqlDB *sql.DB
var psqlDB *sql.DB

func main() {
	mysqlCfg := mysql.NewConfig()
	mysqlCfg.User = os.Getenv("MYSQL_USERNAME")
	mysqlCfg.Passwd = os.Getenv("MYSQL_PASSWORD")
	mysqlCfg.Net = "tcp"
	mysqlCfg.Addr = fmt.Sprintf("%s:%s", os.Getenv("MYSQL_HOST"), os.Getenv("MYSQL_PORT"))
	mysqlCfg.DBName = os.Getenv("MYSQL_DATABASE")

	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		os.Getenv("POSTGRES_USERNAME"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_PORT"),
		os.Getenv("POSTGRES_DATABASE"),
	)
	var err error
	mysqlDB, err = sql.Open("mysql", mysqlCfg.FormatDSN())
	if err != nil {
		log.Fatal(err)
	}

	pingErr := mysqlDB.Ping()
	if pingErr != nil {
		log.Fatal(pingErr)
	}

	psqlDB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}

	pingErr = psqlDB.Ping()
	if pingErr != nil {
		log.Fatal(pingErr)
	}

	fmt.Println("Connected!")
	http.HandleFunc("/", handler)
	http.HandleFunc("/seed", seedDataHandler)
	http.HandleFunc("/mysql", mysqlHandler)
	http.HandleFunc("/postgres", postgresHandler)
	http.HandleFunc("/files", filesHandler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Hello World!"))
}

type Data struct {
	ID   int    `json:"id"`
	Data string `json:"data"`
}

func mysqlHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := mysqlDB.Query("SELECT id, data FROM data")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	err = rows.Err()
	if err != nil {
		log.Fatal(err)
	}
	data := make([]Data, 0)

	for rows.Next() {
		oData := Data{}
		err = rows.Scan(&oData.ID, &oData.Data)
		if err != nil {
			log.Fatal(err)
		}

		data = append(data, oData)
	}
	b, _ := json.Marshal(data)
	w.Write(b)
}

func postgresHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := psqlDB.Query("SELECT id, data FROM data")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	err = rows.Err()
	if err != nil {
		log.Fatal(err)
	}
	data := make([]Data, 0)

	for rows.Next() {
		oData := Data{}
		err = rows.Scan(&oData.ID, &oData.Data)
		if err != nil {
			log.Fatal(err)
		}

		data = append(data, oData)
	}
	b, _ := json.Marshal(data)
	w.Write(b)
}

func filesHandler(w http.ResponseWriter, r *http.Request) {
	entries, err := os.ReadDir("/app/files")
	if err != nil {
		log.Fatal(err)
	}

	files := []string{}
	for _, e := range entries {
		files = append(files, e.Name())
	}
	w.Write([]byte(strings.Join(files, ",")))
}

func seedDataHandler(w http.ResponseWriter, r *http.Request) {
	createMySQLTable := `
	CREATE TABLE IF NOT EXISTS data (
		id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
		data TEXT,
		created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`
	insertMySQL := `INSERT INTO data (data) VALUES (?);`

	if _, err := mysqlDB.Exec(createMySQLTable); err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed mysql create")
		return
	}

	if _, err := mysqlDB.Exec(insertMySQL, "mysql data"); err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed mysql insert")
		return
	}
	createPostgresTable := `
	CREATE TABLE IF NOT EXISTS data (
		id SERIAL PRIMARY KEY,
		data TEXT,
		created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`
	insertPostgresSQL := `INSERT INTO data (data) VALUES ($1);`

	if _, err := psqlDB.Exec(createPostgresTable); err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed postgres create")
		return
	}

	if _, err := psqlDB.Exec(insertPostgresSQL, "postgres data"); err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed postgres insert")
		return
	}
	d1 := []byte("test-file")
	path1 := filepath.Join("/app/files", "file")
	err := os.WriteFile(path1, d1, 0644)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.Write([]byte("done"))
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}
