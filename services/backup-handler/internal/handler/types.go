package handler

import (
	"time"
)

// Webhook - this is used for the incoming webhook data
type Webhook struct {
	Webhooktype string  `json:"webhooktype"`
	Event       string  `json:"event"`
	UUID        string  `json:"uuid"`
	Body        Backups `json:"body"`
}

// Backups - this is used for the actual backup data in the body of the webhook
type Backups struct {
	Name            string        `json:"name"`
	BucketName      string        `json:"bucket_name"`
	BackupMetrics   BackupMetrics `json:"backup_metrics"`
	Snapshots       []Snapshot    `json:"snapshots"`
	RestoreLocation string        `json:"restore_location"`
	SnapshotID      string        `json:"snapshot_ID"`
	RestoredFiles   []string      `json:"restored_files"`
}

// BackupMetrics - metrics from the backup data
type BackupMetrics struct {
	BackupStartTimestamp int         `json:"backup_start_timestamp"`
	BackupEndTimestamp   int         `json:"backup_end_timestamp"`
	Errors               int         `json:"errors"`
	NewFiles             int         `json:"new_files"`
	ChangedFiles         int         `json:"changed_files"`
	UnmodifiedFiles      int         `json:"unmodified_files"`
	NewDirs              int         `json:"new_dirs"`
	ChangedDirs          int         `json:"changed_dirs"`
	UnmodifiedDirs       int         `json:"unmodified_dirs"`
	DataTransferred      int         `json:"data_transferred"`
	MountedPVCs          interface{} `json:"mounted_PVCs"`
	Folder               string      `json:"Folder"`
}

// Snapshot - information about each snapshot in a backup
type Snapshot struct {
	ID       string      `json:"id"`
	Time     time.Time   `json:"time"`
	Tree     string      `json:"tree"`
	Paths    []string    `json:"paths"`
	Hostname string      `json:"hostname"`
	Username string      `json:"username"`
	UID      int         `json:"uid"`
	GID      int         `json:"gid"`
	Tags     interface{} `json:"tags"`
}
