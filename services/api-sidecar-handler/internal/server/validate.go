package server

import (
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"strings"

	"golang.org/x/crypto/ssh"
)

// curl -X POST "http://localhost:3333/validate/public" -d key=$(echo -n "sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29tAAAAIKdtLKvpwRRMdmoo1Exj8/MxSVOb5zN47eJmVg9ttVP2AAAABHNzaDo=" | base64 -w0)
// curl -X POST "http://localhost:3333/validate/public" -d key=$(echo -n "sk-ecdsa-sha2-nistp256@openssh.com AAAAInNrLWVjZHNhLXNoYTItbmlzdHAyNTZAb3BlbnNzaC5jb20AAAAIbmlzdHAyNTYAAABBBAlulpLk2cp9XsbCWxwpxgKIBpxUlSki4Y3k+0huraRzVtYy4FaKyXGZ4kyCpkdhsSrkSD8ptbeks9lzV1tGe2wAAAAEc3NoOg==" | base64 -w0)
// curl -X POST "http://localhost:3333/validate/public" -d key=$(echo -n "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDEZlms5XsiyWjmnnUyhpt93VgHypse9Bl8kNkmZJTiM3Ex/wZAfwogzqd2LrTEiIOWSH1HnQazR+Cc9oHCmMyNxRrLkS/MEl0yZ38Q+GDfn37h/llCIZNVoHlSgYkqD0MQrhfGL5AulDUKIle93dA6qdCUlnZZjDPiR0vEXR36xGuX7QYAhK30aD2SrrBruTtFGvj87IP/0OEOvUZe8dcU9G/pCoqrTzgKqJRpqs/s5xtkqLkTIyR/SzzplO21A+pCKNax6csDDq3snS8zfx6iM8MwVfh8nvBW9seax1zBvZjHAPSTsjzmZXm4z32/ujAn/RhIkZw3ZgRKrxzryttGnWJJ8OFyF31JTJgwWWuPdH53G15PC83ZbmEgSV3win51RZRVppN4uQUuaqZWG9wwk2a6P5aen1RLCSLpTkd2mAEk9PlgmJrf8vITkiU9pF9n68ENCoo556qSdxW2pxnjrzKVPSqmqO1Xg5K4LOX4/9N4n4qkLEOiqnzzJClhFif3O28RW86RPxERGdPT81UI0oDAcU5euQr8Emz+Hd+PY1115UIld3CIHib5PYL9Ee0bFUKiWpR/acSe1fHB64mCoHP7hjFepGsq7inkvg2651wUDKBshGltpNkMj6+aZedNc0/rKYyjl80nT8g8QECgOSRzpmYp0zli2HpFoLOiWw== local-cli" | base64 -w0)
// curl -X POST "http://localhost:3333/validate/public" -d key=$(echo -n "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMdEs1h19jv2UrbtKcqPDatUxT9lPYcbGlEAbInsY8Ka local-cli" | base64 -w0)
// curl -X POST "http://localhost:3333/validate/public" -d key=$(echo -n "ecdsa-sha2-nistp521 AAAAE2VjZHNhLXNoYTItbmlzdHA1MjEAAAAIbmlzdHA1MjEAAACFBAD8E5wfvLg8vvfO9mmHVsZQK8dNgdKM5FrTxL4ORDq66Z50O8zUzBwF1VTO5Zx+qwB7najMdWsnW00BC6PMysSNJQD5HI4CokyKqmGdeSXcROYwvYOjlDQ+jD5qOSmkllRZZnkEYXE5FVBXaZWToyfGUGIoECvKGUQZxkBDHsbK13JdfA== local-cli" | base64 -w0)

func validatePublicKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	r.ParseForm()
	key := r.Form.Get("key")
	resp := ParsedPublicKeyResponse{}
	kb, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		resp.Error = err.Error()
		log.Println(resp.String())
		http.Error(w, resp.String(), http.StatusInternalServerError)
		return
	}
	pub, comment, _, _, err := ssh.ParseAuthorizedKey(kb)
	if err != nil {
		resp.Error = err.Error()
		log.Println(resp.String())
		http.Error(w, resp.String(), http.StatusInternalServerError)
		return
	}
	resp.Type = pub.Type()
	resp.PublicKey = string(kb)
	resp.Value = strings.Split(string(kb), " ")[1]
	resp.Comment = comment
	resp.SHA256Fingerprint = ssh.FingerprintSHA256(pub)
	resp.MD5Fingerprint = ssh.FingerprintLegacyMD5(pub)
	log.Printf("validated public key with fingerprint %s", resp.SHA256Fingerprint)
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, resp.String())
}

// curl -X POST "http://localhost:3333/validate/private" -d key=$(echo -n "-----BEGIN OPENSSH PRIVATE KEY-----
// b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAArAAAABNlY2RzYS
// 1zaGEyLW5pc3RwNTIxAAAACG5pc3RwNTIxAAAAhQQA/BOcH7y4PL73zvZph1bGUCvHTYHS
// jORa08S+DkQ6uumedDvM1MwcBdVUzuWcfqsAe52ozHVrJ1tNAQujzMrEjSUA+RyOAqJMiq
// phnXkl3ETmML2Do5Q0Pow+ajkppJZUWWZ5BGFxORVQV2mVk6MnxlBiKBAryhlEGcZAQx7G
// ytdyXXwAAAEQ2qoa0tqqGtIAAAATZWNkc2Etc2hhMi1uaXN0cDUyMQAAAAhuaXN0cDUyMQ
// AAAIUEAPwTnB+8uDy+9872aYdWxlArx02B0ozkWtPEvg5EOrrpnnQ7zNTMHAXVVM7lnH6r
// AHudqMx1aydbTQELo8zKxI0lAPkcjgKiTIqqYZ15JdxE5jC9g6OUND6MPmo5KaSWVFlmeQ
// RhcTkVUFdplZOjJ8ZQYigQK8oZRBnGQEMexsrXcl18AAAAQVr/ti+u4L5jRkZFILddaexL
// mOE274AeMUG6NKlCQWsDdD2hroKJuUQ59TQdpe6e5jBoUZ300EHjA40wmbU+oC/8AAAAE3
// RvYnliZWxsd29vZEBwb3Atb3M=
// -----END OPENSSH PRIVATE KEY-----" | base64 -w0)

func validatePrivateKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	r.ParseForm()
	key := r.Form.Get("key")
	resp := ParsedPrivateKeyResponse{}
	kb, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		resp.Error = err.Error()
		log.Println(resp.String())
		http.Error(w, resp.String(), http.StatusInternalServerError)
		return
	}
	signer, err := ssh.ParsePrivateKey([]byte(kb))
	if err != nil {
		resp.Error = err.Error()
		log.Println(resp.String())
		http.Error(w, resp.String(), http.StatusInternalServerError)
		return
	}
	sshPubKey := ssh.MarshalAuthorizedKey(signer.PublicKey())
	resp.PublicKey = strings.TrimSpace(string(sshPubKey))
	pub, _, _, _, err := ssh.ParseAuthorizedKey(sshPubKey)
	if err != nil {
		resp.Error = err.Error()
		log.Println(resp.String())
		http.Error(w, resp.String(), http.StatusInternalServerError)
		return
	}
	resp.SHA256Fingerprint = ssh.FingerprintSHA256(pub)
	resp.MD5Fingerprint = ssh.FingerprintLegacyMD5(pub)
	resp.Type = pub.Type()
	resp.Value = strings.TrimSpace(strings.Split(string(sshPubKey), " ")[1])
	log.Printf("validated private key with public fingerprint %s", resp.SHA256Fingerprint)
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, resp.String())
}
