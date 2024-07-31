package server

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

var (
	rsaPub     string = base64.StdEncoding.EncodeToString([]byte("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDEZlms5XsiyWjmnnUyhpt93VgHypse9Bl8kNkmZJTiM3Ex/wZAfwogzqd2LrTEiIOWSH1HnQazR+Cc9oHCmMyNxRrLkS/MEl0yZ38Q+GDfn37h/llCIZNVoHlSgYkqD0MQrhfGL5AulDUKIle93dA6qdCUlnZZjDPiR0vEXR36xGuX7QYAhK30aD2SrrBruTtFGvj87IP/0OEOvUZe8dcU9G/pCoqrTzgKqJRpqs/s5xtkqLkTIyR/SzzplO21A+pCKNax6csDDq3snS8zfx6iM8MwVfh8nvBW9seax1zBvZjHAPSTsjzmZXm4z32/ujAn/RhIkZw3ZgRKrxzryttGnWJJ8OFyF31JTJgwWWuPdH53G15PC83ZbmEgSV3win51RZRVppN4uQUuaqZWG9wwk2a6P5aen1RLCSLpTkd2mAEk9PlgmJrf8vITkiU9pF9n68ENCoo556qSdxW2pxnjrzKVPSqmqO1Xg5K4LOX4/9N4n4qkLEOiqnzzJClhFif3O28RW86RPxERGdPT81UI0oDAcU5euQr8Emz+Hd+PY1115UIld3CIHib5PYL9Ee0bFUKiWpR/acSe1fHB64mCoHP7hjFepGsq7inkvg2651wUDKBshGltpNkMj6+aZedNc0/rKYyjl80nT8g8QECgOSRzpmYp0zli2HpFoLOiWw== local-cli"))
	ed25519Key string = base64.StdEncoding.EncodeToString([]byte(`-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAArAAAABNlY2RzYS
1zaGEyLW5pc3RwNTIxAAAACG5pc3RwNTIxAAAAhQQA/BOcH7y4PL73zvZph1bGUCvHTYHS
jORa08S+DkQ6uumedDvM1MwcBdVUzuWcfqsAe52ozHVrJ1tNAQujzMrEjSUA+RyOAqJMiq
phnXkl3ETmML2Do5Q0Pow+ajkppJZUWWZ5BGFxORVQV2mVk6MnxlBiKBAryhlEGcZAQx7G
ytdyXXwAAAEQ2qoa0tqqGtIAAAATZWNkc2Etc2hhMi1uaXN0cDUyMQAAAAhuaXN0cDUyMQ
AAAIUEAPwTnB+8uDy+9872aYdWxlArx02B0ozkWtPEvg5EOrrpnnQ7zNTMHAXVVM7lnH6r
AHudqMx1aydbTQELo8zKxI0lAPkcjgKiTIqqYZ15JdxE5jC9g6OUND6MPmo5KaSWVFlmeQ
RhcTkVUFdplZOjJ8ZQYigQK8oZRBnGQEMexsrXcl18AAAAQVr/ti+u4L5jRkZFILddaexL
mOE274AeMUG6NKlCQWsDdD2hroKJuUQ59TQdpe6e5jBoUZ300EHjA40wmbU+oC/8AAAAE3
RvYnliZWxsd29vZEBwb3Atb3M=
-----END OPENSSH PRIVATE KEY-----`))
	ed25519Pub   string = base64.StdEncoding.EncodeToString([]byte("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMdEs1h19jv2UrbtKcqPDatUxT9lPYcbGlEAbInsY8Ka local-cli"))
	ed25519SKPub string = base64.StdEncoding.EncodeToString([]byte("sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29tAAAAIKdtLKvpwRRMdmoo1Exj8/MxSVOb5zN47eJmVg9ttVP2AAAABHNzaDo="))
)

func Test_validatePublicKey(t *testing.T) {
	tt := []struct {
		name       string
		method     string
		input      string
		want       string
		statusCode int
	}{
		{
			name:       "without key",
			method:     http.MethodPost,
			want:       `{"error":"ssh: no key found"}`,
			statusCode: http.StatusInternalServerError,
		},
		{
			name:       "with public rsa",
			method:     http.MethodPost,
			input:      fmt.Sprintf("key=%s", rsaPub),
			want:       `{"publickey":"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDEZlms5XsiyWjmnnUyhpt93VgHypse9Bl8kNkmZJTiM3Ex/wZAfwogzqd2LrTEiIOWSH1HnQazR+Cc9oHCmMyNxRrLkS/MEl0yZ38Q+GDfn37h/llCIZNVoHlSgYkqD0MQrhfGL5AulDUKIle93dA6qdCUlnZZjDPiR0vEXR36xGuX7QYAhK30aD2SrrBruTtFGvj87IP/0OEOvUZe8dcU9G/pCoqrTzgKqJRpqs/s5xtkqLkTIyR/SzzplO21A+pCKNax6csDDq3snS8zfx6iM8MwVfh8nvBW9seax1zBvZjHAPSTsjzmZXm4z32/ujAn/RhIkZw3ZgRKrxzryttGnWJJ8OFyF31JTJgwWWuPdH53G15PC83ZbmEgSV3win51RZRVppN4uQUuaqZWG9wwk2a6P5aen1RLCSLpTkd2mAEk9PlgmJrf8vITkiU9pF9n68ENCoo556qSdxW2pxnjrzKVPSqmqO1Xg5K4LOX4/9N4n4qkLEOiqnzzJClhFif3O28RW86RPxERGdPT81UI0oDAcU5euQr8Emz+Hd+PY1115UIld3CIHib5PYL9Ee0bFUKiWpR/acSe1fHB64mCoHP7hjFepGsq7inkvg2651wUDKBshGltpNkMj6+aZedNc0/rKYyjl80nT8g8QECgOSRzpmYp0zli2HpFoLOiWw== local-cli","type":"ssh-rsa","value":"AAAAB3NzaC1yc2EAAAADAQABAAACAQDEZlms5XsiyWjmnnUyhpt93VgHypse9Bl8kNkmZJTiM3Ex/wZAfwogzqd2LrTEiIOWSH1HnQazR+Cc9oHCmMyNxRrLkS/MEl0yZ38Q+GDfn37h/llCIZNVoHlSgYkqD0MQrhfGL5AulDUKIle93dA6qdCUlnZZjDPiR0vEXR36xGuX7QYAhK30aD2SrrBruTtFGvj87IP/0OEOvUZe8dcU9G/pCoqrTzgKqJRpqs/s5xtkqLkTIyR/SzzplO21A+pCKNax6csDDq3snS8zfx6iM8MwVfh8nvBW9seax1zBvZjHAPSTsjzmZXm4z32/ujAn/RhIkZw3ZgRKrxzryttGnWJJ8OFyF31JTJgwWWuPdH53G15PC83ZbmEgSV3win51RZRVppN4uQUuaqZWG9wwk2a6P5aen1RLCSLpTkd2mAEk9PlgmJrf8vITkiU9pF9n68ENCoo556qSdxW2pxnjrzKVPSqmqO1Xg5K4LOX4/9N4n4qkLEOiqnzzJClhFif3O28RW86RPxERGdPT81UI0oDAcU5euQr8Emz+Hd+PY1115UIld3CIHib5PYL9Ee0bFUKiWpR/acSe1fHB64mCoHP7hjFepGsq7inkvg2651wUDKBshGltpNkMj6+aZedNc0/rKYyjl80nT8g8QECgOSRzpmYp0zli2HpFoLOiWw==","sha256fingerprint":"SHA256:kDhWiCrizJSFOAPdDcpVIOV3W9f2VlwtjUrDUudJgTg","md5fingerprint":"cd:1f:41:c6:8c:28:2e:5c:64:3a:c4:ce:75:f7:71:83","comment":"local-cli"}`,
			statusCode: http.StatusOK,
		},
		{
			name:       "with public ed25519",
			method:     http.MethodPost,
			input:      fmt.Sprintf("key=%s", ed25519Pub),
			want:       `{"publickey":"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMdEs1h19jv2UrbtKcqPDatUxT9lPYcbGlEAbInsY8Ka local-cli","type":"ssh-ed25519","value":"AAAAC3NzaC1lZDI1NTE5AAAAIMdEs1h19jv2UrbtKcqPDatUxT9lPYcbGlEAbInsY8Ka","sha256fingerprint":"SHA256:inQGcrMz0Bp0fTovkhOQgH70z8sMU8jjZbrHSw2MPN4","md5fingerprint":"a4:1d:32:73:d7:76:d0:15:8e:24:dd:10:f6:fd:d0:d6","comment":"local-cli"}`,
			statusCode: http.StatusOK,
		},
		{
			name:       "with public sk-ed25519",
			method:     http.MethodPost,
			input:      fmt.Sprintf("key=%s", ed25519SKPub),
			want:       `{"publickey":"sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29tAAAAIKdtLKvpwRRMdmoo1Exj8/MxSVOb5zN47eJmVg9ttVP2AAAABHNzaDo=","type":"sk-ssh-ed25519@openssh.com","value":"AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29tAAAAIKdtLKvpwRRMdmoo1Exj8/MxSVOb5zN47eJmVg9ttVP2AAAABHNzaDo=","sha256fingerprint":"SHA256:8BN0c1Mhxdsc02+KTwDSujhKYqa5Aucv9oL3IYr53aE","md5fingerprint":"fc:25:a3:b4:f0:d1:47:e8:ef:8c:85:d5:9b:9c:9f:7c"}`,
			statusCode: http.StatusOK,
		},
		{
			name:       "with public invalid ed25519",
			method:     http.MethodPost,
			input:      fmt.Sprintf("key=%sinvalid", ed25519Pub),
			want:       `{"error":"illegal base64 data at input byte 124"}`,
			statusCode: http.StatusInternalServerError,
		},
		{
			name:       "with bad method public",
			method:     http.MethodGet,
			want:       "Method not allowed",
			statusCode: http.StatusMethodNotAllowed,
		},
	}

	for _, tc := range tt {
		t.Run(tc.name, func(t *testing.T) {
			request, _ := http.NewRequest(tc.method, "/validate/public", strings.NewReader(tc.input))
			request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			responseRecorder := httptest.NewRecorder()

			validatePublicKey(responseRecorder, request)

			if responseRecorder.Code != tc.statusCode {
				t.Errorf("Want status '%d', got '%d'", tc.statusCode, responseRecorder.Code)
			}

			if strings.TrimSpace(responseRecorder.Body.String()) != tc.want {
				t.Errorf("Want '%s', got '%s'", tc.want, responseRecorder.Body)
			}
		})
	}
}

func Test_validatePrivateKey(t *testing.T) {
	tt := []struct {
		name       string
		method     string
		input      string
		want       string
		statusCode int
	}{
		{
			name:       "with private ed25519",
			method:     http.MethodPost,
			input:      fmt.Sprintf("key=%s", ed25519Key),
			want:       `{"publickey":"ecdsa-sha2-nistp521 AAAAE2VjZHNhLXNoYTItbmlzdHA1MjEAAAAIbmlzdHA1MjEAAACFBAD8E5wfvLg8vvfO9mmHVsZQK8dNgdKM5FrTxL4ORDq66Z50O8zUzBwF1VTO5Zx+qwB7najMdWsnW00BC6PMysSNJQD5HI4CokyKqmGdeSXcROYwvYOjlDQ+jD5qOSmkllRZZnkEYXE5FVBXaZWToyfGUGIoECvKGUQZxkBDHsbK13JdfA==\n","sha256fingerprint":"SHA256:RBRWA2mJFPK/8DtsxVoVzoSShFiuRAzlUBws7cXkwG0","md5fingerprint":"72:86:48:50:59:1b:97:81:21:27:e7:55:98:fa:35:95","type":"ecdsa-sha2-nistp521","value":"AAAAE2VjZHNhLXNoYTItbmlzdHA1MjEAAAAIbmlzdHA1MjEAAACFBAD8E5wfvLg8vvfO9mmHVsZQK8dNgdKM5FrTxL4ORDq66Z50O8zUzBwF1VTO5Zx+qwB7najMdWsnW00BC6PMysSNJQD5HI4CokyKqmGdeSXcROYwvYOjlDQ+jD5qOSmkllRZZnkEYXE5FVBXaZWToyfGUGIoECvKGUQZxkBDHsbK13JdfA==\n"}`,
			statusCode: http.StatusOK,
		},
		{
			name:       "with invalid private ed25519",
			method:     http.MethodPost,
			input:      fmt.Sprintf("key=%sinvalid", ed25519Key),
			want:       `{"error":"illegal base64 data at input byte 984"}`,
			statusCode: http.StatusInternalServerError,
		},
		{
			name:       "with bad method private",
			method:     http.MethodGet,
			want:       "Method not allowed",
			statusCode: http.StatusMethodNotAllowed,
		},
	}

	for _, tc := range tt {
		t.Run(tc.name, func(t *testing.T) {
			request, _ := http.NewRequest(tc.method, "/validate/private", strings.NewReader(tc.input))
			request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			responseRecorder := httptest.NewRecorder()

			validatePrivateKey(responseRecorder, request)

			if responseRecorder.Code != tc.statusCode {
				t.Errorf("Want status '%d', got '%d'", tc.statusCode, responseRecorder.Code)
			}

			if strings.TrimSpace(responseRecorder.Body.String()) != tc.want {
				t.Errorf("Want '%s', got '%s'", tc.want, responseRecorder.Body)
			}
		})
	}
}
