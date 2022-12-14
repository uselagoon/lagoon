package main

import (
	"bytes"
	"context"
	"fmt"
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
	mongoUser     = os.Getenv("MONGO_USERNAME")
	mongoPassword = os.Getenv("MONGO_PASSWORD")
	mongoHost     = os.Getenv("MONGO_HOST")
	mongoDB       = os.Getenv("MONGO_DATABASE")
	mongoPort     = 27017
	mongoUserURI  = fmt.Sprintf("mongodb://%s:%s@%s:%d/%s", mongoUser, mongoPassword, mongoHost, mongoPort, mongoDB)
	mongoLocalURI = fmt.Sprintf("mongodb://%s:%d", mongoHost, mongoPort)
	mongoURI      string
)

func mongoHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, mongoConnector())
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
	host := fmt.Sprintf(`"Service_Host=%s"`, mongoHost)
	mongoOutput := host + "\n" + b.String()
	return mongoOutput
}

func mongoConnector() string {
	if mongoUser != "" {
		mongoURI = mongoUserURI
	} else {
		mongoURI = mongoLocalURI
	}
	fmt.Println(mongoURI)
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(err)
	}

	envCollection := client.Database(mongoDB).Collection("env-vars")

	deleteFilter := bson.D{{}}
	_, err = envCollection.DeleteMany(context.TODO(), deleteFilter)
	if err != nil {
		panic(err)
	}

	environmentVariables := []interface{}{}

	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		bsonData := bson.D{{"Key", pair[0]}, {"value", pair[1]}}
		environmentVariables = append(environmentVariables, bsonData)
		if err != nil {
			panic(err.Error())
		}
	}

	_, err = envCollection.InsertMany(context.TODO(), environmentVariables)
	if err != nil {
		panic(err)
	}
	filter := bson.D{{"Key", primitive.Regex{Pattern: "LAGOON", Options: ""}}}
	cursor, _ := envCollection.Find(context.TODO(), filter, options.Find().SetProjection(bson.M{"_id": 0}))
	var docs []bson.M
	if err = cursor.All(context.TODO(), &docs); err != nil {
		panic(err)
	}

	mongoOutput := cleanMongoOutput(docs)
	return mongoOutput
}
