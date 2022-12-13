package main

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	mongoConnectionStr string
	mongoHost 		   string
	database           string
)

func mongoHandler(w http.ResponseWriter, r *http.Request) {
	mongoPath := r.URL.Path
	localService, lagoonService := cleanRoute(mongoPath)
	mongoUser := getEnv(fmt.Sprintf("%s_USERNAME", lagoonService), "lagoon")
	mongoPassword := getEnv(fmt.Sprintf("%s_PASSWORD", lagoonService), "lagoon")
	mongoHost := getEnv(fmt.Sprintf("%s_HOST", lagoonService), localService)
	mongoPort := getEnv(fmt.Sprintf("%s_PORT", lagoonService), "27017")
	mongoDatabase := getEnv(fmt.Sprintf("%s_DATABASE", lagoonService), "lagoon")

	if mongoHost != localService {
		mongoConnectionStr = fmt.Sprintf("mongodb://%s:%s@%s:%s/%s", mongoUser, mongoPassword, mongoHost, mongoPort, mongoDatabase)
		database = mongoDatabase
	} else {
		mongoConnectionStr = fmt.Sprintf("mongodb://%s:%s", mongoHost, mongoPort)
		database = mongoDatabase
	}
	log.Print(fmt.Sprintf("Using %s as the connstring", mongoConnectionStr))

	fmt.Fprintf(w, mongoConnector(mongoConnectionStr, database))
}

func cleanMongoOutput(docs []primitive.M) string {
	valStr := fmt.Sprint(docs)
	r := regexp.MustCompile(`(?:LAGOON_\w*)\s\w*:(?:\w*)`)
	matches := r.FindAllString(valStr, -1)
	var mongoResults []string
	for _, str := range matches {
		mongoVals := strings.ReplaceAll(str, "value:", "")
		mongoResults = append(mongoResults, mongoVals)
	}

	b := new(bytes.Buffer)
	for _, value := range mongoResults {
		v := strings.SplitN(value, " ", 2)
		fmt.Fprintf(b, "\"%s=%s\"\n", v[0], v[1])
	}
	host := fmt.Sprintf(`"SERVICE_HOST=%s"`, mongoHost)
	mongoOutput := host + "\n" + b.String()
	return mongoOutput
}

func mongoConnector(connectionString string, database string) string {
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(connectionString))
	if err != nil {
		log.Print(err)
	}

	envCollection := client.Database(database).Collection("env-vars")

	deleteFilter := bson.D{{}}
	_, err = envCollection.DeleteMany(context.TODO(), deleteFilter)
	if err != nil {
		log.Print(err)
	}

	environmentVariables := []interface{}{}

	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		bsonData := bson.D{{"Key", pair[0]}, {"value", pair[1]}}
		environmentVariables = append(environmentVariables, bsonData)
		if err != nil {
			log.Print(err)
		}
	}

	_, err = envCollection.InsertMany(context.TODO(), environmentVariables)
	if err != nil {
		log.Print(err)
	}
	filter := bson.D{{"Key", primitive.Regex{Pattern: "LAGOON", Options: ""}}}
	cursor, _ := envCollection.Find(context.TODO(), filter, options.Find().SetProjection(bson.M{"_id": 0}))
	var docs []bson.M
	if err = cursor.All(context.TODO(), &docs); err != nil {
		log.Print(err)
	}

	mongoOutput := cleanMongoOutput(docs)
	return mongoOutput
}
