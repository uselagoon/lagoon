module github.com/uselagoon/lagoon/services/logs2notifications

go 1.18

require (
	github.com/aws/aws-sdk-go v1.41.11
	github.com/cheshir/go-mq v1.0.2
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/machinebox/graphql v0.2.3-0.20181106130121-3a9253180225
	github.com/matryer/try v0.0.0-20161228173917-9ac251b645a2
	github.com/slack-go/slack v0.9.5
	gopkg.in/mail.v2 v2.3.1
)

require (
	github.com/NeowayLabs/wabbit v0.0.0-20200409220312-12e68ab5b0c6 // indirect
	github.com/cheekybits/is v0.0.0-20150225183255-68e9c0620927 // indirect
	github.com/fsouza/go-dockerclient v1.7.3 // indirect
	github.com/google/uuid v1.1.1 // indirect
	github.com/gorilla/websocket v1.4.2 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/matryer/is v1.4.0 // indirect
	github.com/pborman/uuid v1.2.0 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/streadway/amqp v0.0.0-20200108173154-1c71cc93ed71 // indirect
	github.com/stretchr/testify v1.4.0 // indirect
	github.com/tiago4orion/conjure v0.0.0-20150908101743-93cb30b9d218 // indirect
	gopkg.in/alexcesaro/quotedprintable.v3 v3.0.0-20150716171945-2caba252f4dc // indirect
)

// Fixes for AppID
replace github.com/cheshir/go-mq v1.0.2 => github.com/shreddedbacon/go-mq v0.0.0-20200419104937-b8e9af912ead

replace github.com/NeowayLabs/wabbit v0.0.0-20200409220312-12e68ab5b0c6 => github.com/shreddedbacon/wabbit v0.0.0-20200419104837-5b7b769d7204
