package server

import (
	"crypto"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"log"
	"net/http"
	"strings"

	"golang.org/x/crypto/ssh"
)

// curl -X GET "http://localhost:3333/generate/ed25519"

var (
	Rand = rand.Reader
)

func generateED25519Key(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	resp := ParsedPrivateKeyResponse{}
	pub, priv, err := ed25519.GenerateKey(Rand)
	if err != nil {
		log.Println(resp.String())
		resp.Error = err.Error()
		http.Error(w, resp.String(), http.StatusInternalServerError)
		return
	}
	p, err := ssh.MarshalPrivateKey(crypto.PrivateKey(priv), "")
	if err != nil {
		log.Println(resp.String())
		resp.Error = err.Error()
		http.Error(w, resp.String(), http.StatusInternalServerError)
		return
	}
	privateKeyString := string(pem.EncodeToMemory(p))
	publicKey, err := ssh.NewPublicKey(pub)
	if err != nil {
		log.Println(resp.String())
		resp.Error = err.Error()
		http.Error(w, resp.String(), http.StatusInternalServerError)
		return
	}
	resp.PublicKey = "ssh-ed25519" + " " + base64.StdEncoding.EncodeToString(publicKey.Marshal())
	resp.PrivateKeyPEM = privateKeyString
	resp.SHA256Fingerprint = ssh.FingerprintSHA256(publicKey)
	resp.MD5Fingerprint = ssh.FingerprintLegacyMD5(publicKey)
	resp.Type = publicKey.Type()
	resp.Value = strings.Split(resp.PublicKey, " ")[1]
	log.Printf("generated private key with public fingerprint %s/n", resp.SHA256Fingerprint)
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, resp.String())
}
