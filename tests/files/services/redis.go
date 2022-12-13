package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/go-redis/redis/v8"
)

var (
	ctx = context.Background()
)

func redisHandler(w http.ResponseWriter, r *http.Request) {
	redisPath := r.URL.Path
	redisRoute := strings.ReplaceAll(redisPath, "/", "")
	redisConnectionStr := fmt.Sprintf("%s:6379", redisRoute)
	fmt.Fprintf(w, redisConnector(redisConnectionStr, redisRoute))
}

func cleanRedisOutput(r *redis.StringCmd) string {
	redistoString := r.String()
	cleanString := strings.ReplaceAll(redistoString, "get ", "")
	redisVals := strings.ReplaceAll(cleanString, " ", "")
	return redisVals
}

func redisConnector(connectionString string, version string) string {
	client := redis.NewClient(&redis.Options{
		Addr:     connectionString,
		Password: "",
		DB:       0,
	})

	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		err := client.Set(ctx, pair[0], pair[1], 0).Err()
		if err != nil {
			log.Print(err)
		}
	}

	var cursor uint64
	results, _, _ := client.Scan(ctx, cursor, "LAGOON_*", 100).Result()

	var values []string
	for _, res := range results {
		redisKeyVals := client.Get(ctx, res)
		redisVals := cleanRedisOutput(redisKeyVals)
		values = append(values, redisVals)
	}

	keyVals := connectorKeyValues(values)
	host := fmt.Sprintf(`"SERVICE_HOST=%s"`, version)
	redisData := host + "\n" + keyVals
	return redisData
}
