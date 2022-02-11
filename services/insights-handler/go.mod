module github.com/uselagoon/lagoon/services/insights-handler

go 1.17

require (
	github.com/Khan/genqlient v0.3.0
	github.com/cheshir/go-mq v1.0.2
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/matryer/try v0.0.0-20161228173917-9ac251b645a2
)

require (
	github.com/NeowayLabs/wabbit v0.0.0-20200409220312-12e68ab5b0c6 // indirect
	github.com/agnivade/levenshtein v1.1.1 // indirect
	github.com/alexflint/go-arg v1.4.2 // indirect
	github.com/alexflint/go-scalar v1.0.0 // indirect
	github.com/dustin/go-humanize v1.0.0 // indirect
	github.com/google/uuid v1.1.2 // indirect
	github.com/gopherjs/gopherjs v0.0.0-20181017120253-0766667cb4d1 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/jtolds/gls v4.20.0+incompatible // indirect
	github.com/klauspost/compress v1.13.5 // indirect
	github.com/klauspost/cpuid v1.3.1 // indirect
	github.com/minio/md5-simd v1.1.0 // indirect
	github.com/minio/sha256-simd v0.1.1 // indirect
	github.com/mitchellh/go-homedir v1.1.0 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/pborman/uuid v1.2.0 // indirect
	github.com/rs/xid v1.2.1 // indirect
	github.com/sirupsen/logrus v1.8.1 // indirect
	github.com/smartystreets/assertions v0.0.0-20180927180507-b2de0cb4f26d // indirect
	github.com/streadway/amqp v0.0.0-20200108173154-1c71cc93ed71 // indirect
	github.com/vektah/gqlparser/v2 v2.1.0 // indirect
	golang.org/x/crypto v0.0.0-20201216223049-8b5274cf687f // indirect
	golang.org/x/mod v0.5.1 // indirect
	golang.org/x/sys v0.0.0-20211019181941-9d821ace8654 // indirect
	golang.org/x/text v0.3.7 // indirect
	golang.org/x/tools v0.1.9 // indirect
	golang.org/x/xerrors v0.0.0-20200804184101-5ec99f83aff1 // indirect
	gopkg.in/ini.v1 v1.57.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
)

require (
	github.com/CycloneDX/cyclonedx-go v0.4.0
	github.com/cheekybits/is v0.0.0-20150225183255-68e9c0620927 // indirect
	github.com/fsouza/go-dockerclient v1.7.3 // indirect
	github.com/minio/minio-go/v7 v7.0.21
	github.com/tiago4orion/conjure v0.0.0-20150908101743-93cb30b9d218 // indirect
	golang.org/x/net v0.0.0-20211216030914-fe4d6282115f // indirect
	gopkg.in/yaml.v3 v3.0.0-20210107192922-496545a6307b // indirect
)

// Fixes for AppID
replace github.com/cheshir/go-mq v1.0.2 => github.com/shreddedbacon/go-mq v0.0.0-20200419104937-b8e9af912ead

replace github.com/NeowayLabs/wabbit v0.0.0-20200409220312-12e68ab5b0c6 => github.com/shreddedbacon/wabbit v0.0.0-20200419104837-5b7b769d7204
