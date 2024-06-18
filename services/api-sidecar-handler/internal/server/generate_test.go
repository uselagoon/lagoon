package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

func Test_generateED25519Key(t *testing.T) {
	tt := []struct {
		name       string
		method     string
		input      string
		want       ParsedPrivateKeyResponse
		statusCode int
	}{
		{
			name:   "with ed25519",
			method: http.MethodGet,
			want: ParsedPrivateKeyResponse{
				PublicKey:         "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDtqJ7zOtqQtYqOo0CpvDXNlMhV3HeJDpjrASKGLWdop",
				SHA256Fingerprint: "SHA256:tAXFyTXI8xtDaujAEcwJslAYc9/6FKcUkd2Lw0xDhPo",
				MD5Fingerprint:    "27:c6:3f:84:be:6f:a4:5e:eb:f9:4d:6e:bd:c8:bb:48",
				Type:              "ssh-ed25519",
				Value:             "AAAAC3NzaC1lZDI1NTE5AAAAIDtqJ7zOtqQtYqOo0CpvDXNlMhV3HeJDpjrASKGLWdop",
			},
			statusCode: http.StatusOK,
		},
		{
			name:       "with bad method",
			method:     http.MethodPost,
			want:       ParsedPrivateKeyResponse{},
			statusCode: http.StatusMethodNotAllowed,
		},
	}

	for _, tc := range tt {
		t.Run(tc.name, func(t *testing.T) {
			request, _ := http.NewRequest(tc.method, "/generate/ed25519", nil)
			responseRecorder := httptest.NewRecorder()

			// replace the random reader with zero for repeatable result in tests
			var zero zeroReader
			Rand = zero
			generateED25519Key(responseRecorder, request)

			if responseRecorder.Code != tc.statusCode {
				t.Errorf("Want status '%d', got '%d'", tc.statusCode, responseRecorder.Code)
			}

			var got ParsedPrivateKeyResponse
			_ = json.Unmarshal(responseRecorder.Body.Bytes(), &got)
			got.PrivateKeyPEM = "" // remove this because it contains signatures that change during generation
			if !reflect.DeepEqual(got, tc.want) {
				lValues, _ := json.Marshal(got)
				wValues, _ := json.Marshal(tc.want)
				t.Errorf("Want '%s', got '%s'", string(wValues), string(lValues))
			}
		})
	}
}

type zeroReader struct{}

func (zeroReader) Read(buf []byte) (int, error) {
	for i := range buf {
		buf[i] = 0
	}
	return len(buf), nil
}
