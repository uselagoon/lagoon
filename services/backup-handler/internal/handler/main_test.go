package handler

import (
	"testing"
	"time"
)

func Test_getSnapshotSource(t *testing.T) {
	tests := []struct {
		name     string
		snapshot Snapshot
		want     string
	}{
		{
			name: "test1",
			snapshot: Snapshot{
				ID:       "4038fcde41b31169dbd74c8923c92356e14a9dbff5b1247b825d656cffacfdc1",
				Time:     timeFromStr("2020-02-09T06:56:09.744111693Z"),
				Tree:     "5136413b575b6cc078b3d83791143d6c7de5adbbdd474d61b146f5d1d872e369",
				Paths:    []string{"/example-com-dev-mariadb-prebackuppod.mariadb.sql"},
				Hostname: "example-com-dev-mariadb-prebackuppod",
				Username: "",
				UID:      0,
				GID:      0,
				Tags:     nil,
			},
			want: "mariadb",
		},
		{
			name: "test2",
			snapshot: Snapshot{
				ID:       "2100c733934497bdf8afae1ae2e68bbd6f9edf9dcb1203138f7a1d4e86f08d98",
				Time:     timeFromStr("2020-02-16T03:10:54.033069403Z"),
				Tree:     "65ca3ca3fffc5573b7cc98edf1d9fd3183e1dd983a19cf85094813e1c09f1316",
				Paths:    []string{"/example-com-master-solr-prebackuppod.solr.tar"},
				Hostname: "example-com-master-solr-prebackuppod",
				Username: "",
				UID:      0,
				GID:      0,
				Tags:     nil,
			},
			want: "solr",
		},
		{
			name: "test3",
			snapshot: Snapshot{
				ID:       "5e6be12b8cf468b5166aaeecb1565db66f71f6898e77f97ea2d3dd1bcc1f6f9c",
				Time:     timeFromStr("2020-02-16T06:45:01.088867041Z"),
				Tree:     "c070507e88eaef60b48477f5b4bf206aab213296396805eed0d5e4e48fec5304",
				Paths:    []string{"/data/nginx"},
				Hostname: "example-com-dev",
				Username: "",
				UID:      0,
				GID:      0,
				Tags:     nil,
			},
			want: "nginx",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getSnapshotSource(tt.snapshot)
			if got != tt.want {
				t.Errorf("getSnapshotSource() = %v, want %v", got, tt.want)
			}
		})
	}
}

func timeFromStr(str string) time.Time {
	t, _ := time.Parse("2006-01-02 15:04:05", str)
	return t
}
