module github.com/uselagoon/lagoon/services/logs2notifications

go 1.14

require (
	github.com/cheekybits/is v0.0.0-20150225183255-68e9c0620927 // indirect
	github.com/cheshir/go-mq v1.0.2
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/fsouza/go-dockerclient v1.7.3 // indirect
	github.com/machinebox/graphql v0.2.3-0.20181106130121-3a9253180225
	github.com/matryer/is v1.4.0 // indirect
	github.com/matryer/try v0.0.0-20161228173917-9ac251b645a2
	github.com/tiago4orion/conjure v0.0.0-20150908101743-93cb30b9d218 // indirect
	gopkg.in/check.v1 v1.0.0-20201130134442-10cb98267c6c // indirect
)

// Fixes for AppID
replace github.com/cheshir/go-mq v1.0.2 => github.com/shreddedbacon/go-mq v0.0.0-20200419104937-b8e9af912ead

replace github.com/NeowayLabs/wabbit v0.0.0-20200409220312-12e68ab5b0c6 => github.com/shreddedbacon/wabbit v0.0.0-20200419104837-5b7b769d7204