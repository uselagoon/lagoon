package lagoon

import (
	"time"

	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"github.com/uselagoon/machinery/utils/jwt"
)

// LagoonAPI .
type LagoonAPI struct {
	Endpoint        string `json:"endpoint"`
	JWTAudience     string `json:"audience"`
	TokenSigningKey string `json:"tokenSigningKey"`
	JWTSubject      string `json:"subject"`
	JWTIssuer       string `json:"issuer"`
	Version         string `json:"version"`
}

func GetClient(l LagoonAPI) (*lclient.Client, error) {
	token, err := jwt.GenerateAdminToken(l.TokenSigningKey, l.JWTAudience, l.JWTSubject, l.JWTIssuer, time.Now().Unix(), 60)
	if err != nil {
		// the token wasn't generated
		return nil, err
	}
	return lclient.New(l.Endpoint, "webhook-handler", l.Version, &token, false), nil
}
