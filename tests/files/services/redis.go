package main

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/go-redis/redis/v8"
)

var (
	ctx                = context.Background()
	redisHost          = os.Getenv("REDIS_HOST")
	redisConnectionStr = fmt.Sprintf("%s:6379", redisHost)
)

func redisHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, redisConnector())
}

func cleanRedisOutput(r *redis.StringCmd) string {
	redistoString := r.String()
	cleanString := strings.ReplaceAll(redistoString, "get ", "")
	redisVals := strings.ReplaceAll(cleanString, " ", "")
	return redisVals
}

func redisConnector() string {
	client := redis.NewClient(&redis.Options{
		Addr:     redisConnectionStr,
		Password: "",
		DB:       0,
	})

	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		err := client.Set(ctx, pair[0], pair[1], 0).Err()
		if err != nil {
			panic(err)
		}
	}

	var cursor uint64
	results, _, _ := client.Scan(ctx, cursor, "LAGOON_*", 100).Result()

	var keyVals []string
	for _, res := range results {
		redisKeyVals := client.Get(ctx, res)
		redisVals := cleanRedisOutput(redisKeyVals)
		keyVals = append(keyVals, redisVals)
	}

	b := new(bytes.Buffer)
	for _, value := range keyVals {
		fmt.Fprintf(b, "\"%s\"\n", value)
	}

	redisData := redisHost + "\n" + b.String()
	return redisData
}
