package server

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/lagoon/internal/messaging"
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

type Server struct {
	Router    *mux.Router
	Messaging messaging.Messaging
	LagoonAPI lagoon.LagoonAPI
	Debug     bool
}

func (s *Server) Initialize() {
	s.Router = mux.NewRouter()
	s.Router.HandleFunc("/status", status).Methods("GET")
	s.Router.HandleFunc("/validate/public", validatePublicKey).Methods("POST")
	s.Router.HandleFunc("/validate/private", validatePrivateKey).Methods("POST")
	s.Router.HandleFunc("/generate/ed25519", generateED25519Key).Methods("GET")
	s.Router.HandleFunc("/environment/deploy", s.deployEnvironment).Methods("POST")
	s.Router.HandleFunc("/environment/remove", s.removeEnvironment).Methods("POST")
	s.Router.HandleFunc("/environment/routerpatternvariables", s.getRouterPatternAndVariables).Methods("POST")
}

func (s *Server) Run(addr string) {
	log.Fatal(http.ListenAndServe(addr, s.Router))
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
