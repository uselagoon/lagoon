package server

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

type ParsedPublicKeyResponse struct {
	Error             string `json:"error,omitempty"`
	PublicKey         string `json:"publickey,omitempty"`
	Type              string `json:"type,omitempty"`
	Value             string `json:"value,omitempty"`
	SHA256Fingerprint string `json:"sha256fingerprint,omitempty"`
	MD5Fingerprint    string `json:"md5fingerprint,omitempty"`
	Comment           string `json:"comment,omitempty"`
}

func (p *ParsedPublicKeyResponse) String() string {
	b, err := json.Marshal(p)
	if err != nil {
		return ""
	}
	return string(b)
}

type ParsedPrivateKeyResponse struct {
	Error             string `json:"error,omitempty"`
	PublicKey         string `json:"publickey,omitempty"`
	PublicKeyPEM      string `json:"publickeypem,omitempty"`
	SHA256Fingerprint string `json:"sha256fingerprint,omitempty"`
	MD5Fingerprint    string `json:"md5fingerprint,omitempty"`
	Type              string `json:"type,omitempty"`
	Value             string `json:"value,omitempty"`
	PrivateKeyPEM     string `json:"privatekeypem,omitempty"`
}

func (p *ParsedPrivateKeyResponse) String() string {
	b, err := json.Marshal(p)
	if err != nil {
		return ""
	}
	return string(b)
}
func Run() error {
	r := mux.NewRouter()
	r.HandleFunc("/status", status).Methods("GET")
	r.HandleFunc("/validate/public", validatePublicKey).Methods("POST")
	r.HandleFunc("/validate/private", validatePrivateKey).Methods("POST")
	r.HandleFunc("/generate/ed25519", generateED25519Key).Methods("GET")

	if err := http.ListenAndServe(":3333", r); err != nil {
		return err
	}
	return nil
}
