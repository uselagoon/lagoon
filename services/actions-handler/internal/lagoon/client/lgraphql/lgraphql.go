// Code generated by go-bindata. (@generated) DO NOT EDIT.

 //Package lgraphql generated by go-bindata.// sources:
// _lgraphql/deployEnvironmentLatest.graphql
package lgraphql

import (
	"bytes"
	"compress/gzip"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func bindataRead(data []byte, name string) ([]byte, error) {
	gz, err := gzip.NewReader(bytes.NewBuffer(data))
	if err != nil {
		return nil, fmt.Errorf("read %q: %v", name, err)
	}

	var buf bytes.Buffer
	_, err = io.Copy(&buf, gz)
	clErr := gz.Close()

	if err != nil {
		return nil, fmt.Errorf("read %q: %v", name, err)
	}
	if clErr != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

type asset struct {
	bytes []byte
	info  os.FileInfo
}

type bindataFileInfo struct {
	name    string
	size    int64
	mode    os.FileMode
	modTime time.Time
}

// Name return file name
func (fi bindataFileInfo) Name() string {
	return fi.name
}

// Size return file size
func (fi bindataFileInfo) Size() int64 {
	return fi.size
}

// Mode return file mode
func (fi bindataFileInfo) Mode() os.FileMode {
	return fi.mode
}

// ModTime return file modify time
func (fi bindataFileInfo) ModTime() time.Time {
	return fi.modTime
}

// IsDir return file whether a directory
func (fi bindataFileInfo) IsDir() bool {
	return fi.mode&os.ModeDir != 0
}

// Sys return file is sys mode
func (fi bindataFileInfo) Sys() interface{} {
	return nil
}

var __lgraphqlDeployenvironmentlatestGraphql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x5c\xce\xcd\x4a\xc5\x30\x10\xc5\xf1\x7d\x9e\xe2\x08\x2e\xae\xaf\x90\xb5\x77\x51\x74\x27\x74\x23\x2e\x52\x3a\xc8\x60\x3a\x29\xd3\x49\xa1\x48\xdf\x5d\x52\x63\x3f\x5c\xe6\xe4\x4f\xf2\x1b\xb2\x05\xe3\x24\xb8\x39\xe0\x91\x64\x66\x4d\x32\x90\x98\xc7\xfd\x38\x34\x32\x66\x7b\x28\x45\x97\xe3\x57\xd3\x7b\xbc\x99\xb2\x7c\x96\x65\x54\x4e\xca\xb6\x78\x34\x62\xbf\x09\xc7\xbe\x0d\xca\xa1\x8b\x34\x79\xbc\xdf\x65\x7e\xa1\xa5\x0d\x31\xd3\xf6\xd0\x87\x03\x9e\xf0\xed\x00\xa0\xa7\x31\xa6\xe5\xf4\xd5\x6b\x30\x9a\xec\xc6\x25\xf4\x35\x02\x2e\xb0\x33\xb3\xde\xff\xb1\xaa\xaf\xae\x07\x6d\x57\xee\xfd\xd5\xf8\x0f\x5d\x2b\x25\xcb\x2a\xcf\xc1\x82\x87\x69\xa6\x6d\x5e\x8b\xde\xad\x3f\x01\x00\x00\xff\xff\xe5\x93\x85\x63\x39\x01\x00\x00")

func _lgraphqlDeployenvironmentlatestGraphqlBytes() ([]byte, error) {
	return bindataRead(
		__lgraphqlDeployenvironmentlatestGraphql,
		"_lgraphql/deployEnvironmentLatest.graphql",
	)
}

func _lgraphqlDeployenvironmentlatestGraphql() (*asset, error) {
	bytes, err := _lgraphqlDeployenvironmentlatestGraphqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "_lgraphql/deployEnvironmentLatest.graphql", size: 0, mode: os.FileMode(0), modTime: time.Unix(0, 0)}
	a := &asset{bytes: bytes, info: info}
	return a, nil
}

// Asset loads and returns the asset for the given name.
// It returns an error if the asset could not be found or
// could not be loaded.
func Asset(name string) ([]byte, error) {
	cannonicalName := strings.Replace(name, "\\", "/", -1)
	if f, ok := _bindata[cannonicalName]; ok {
		a, err := f()
		if err != nil {
			return nil, fmt.Errorf("Asset %s can't read by error: %v", name, err)
		}
		return a.bytes, nil
	}
	return nil, fmt.Errorf("Asset %s not found", name)
}

// MustAsset is like Asset but panics when Asset would return an error.
// It simplifies safe initialization of global variables.
func MustAsset(name string) []byte {
	a, err := Asset(name)
	if err != nil {
		panic("asset: Asset(" + name + "): " + err.Error())
	}

	return a
}

// AssetInfo loads and returns the asset info for the given name.
// It returns an error if the asset could not be found or
// could not be loaded.
func AssetInfo(name string) (os.FileInfo, error) {
	cannonicalName := strings.Replace(name, "\\", "/", -1)
	if f, ok := _bindata[cannonicalName]; ok {
		a, err := f()
		if err != nil {
			return nil, fmt.Errorf("AssetInfo %s can't read by error: %v", name, err)
		}
		return a.info, nil
	}
	return nil, fmt.Errorf("AssetInfo %s not found", name)
}

// AssetNames returns the names of the assets.
func AssetNames() []string {
	names := make([]string, 0, len(_bindata))
	for name := range _bindata {
		names = append(names, name)
	}
	return names
}

// _bindata is a table, holding each asset generator, mapped to its name.
var _bindata = map[string]func() (*asset, error){
	"_lgraphql/deployEnvironmentLatest.graphql": _lgraphqlDeployenvironmentlatestGraphql,
}

// AssetDir returns the file names below a certain
// directory embedded in the file by go-bindata.
// For example if you run go-bindata on data/... and data contains the
// following hierarchy:
//     data/
//       foo.txt
//       img/
//         a.png
//         b.png
// then AssetDir("data") would return []string{"foo.txt", "img"}
// AssetDir("data/img") would return []string{"a.png", "b.png"}
// AssetDir("foo.txt") and AssetDir("notexist") would return an error
// AssetDir("") will return []string{"data"}.
func AssetDir(name string) ([]string, error) {
	node := _bintree
	if len(name) != 0 {
		cannonicalName := strings.Replace(name, "\\", "/", -1)
		pathList := strings.Split(cannonicalName, "/")
		for _, p := range pathList {
			node = node.Children[p]
			if node == nil {
				return nil, fmt.Errorf("Asset %s not found", name)
			}
		}
	}
	if node.Func != nil {
		return nil, fmt.Errorf("Asset %s not found", name)
	}
	rv := make([]string, 0, len(node.Children))
	for childName := range node.Children {
		rv = append(rv, childName)
	}
	return rv, nil
}

type bintree struct {
	Func     func() (*asset, error)
	Children map[string]*bintree
}

var _bintree = &bintree{nil, map[string]*bintree{
	"_lgraphql": &bintree{nil, map[string]*bintree{
		"deployEnvironmentLatest.graphql": &bintree{_lgraphqlDeployenvironmentlatestGraphql, map[string]*bintree{}},
	}},
}}

// RestoreAsset restores an asset under the given directory
func RestoreAsset(dir, name string) error {
	data, err := Asset(name)
	if err != nil {
		return err
	}
	info, err := AssetInfo(name)
	if err != nil {
		return err
	}
	err = os.MkdirAll(_filePath(dir, filepath.Dir(name)), os.FileMode(0755))
	if err != nil {
		return err
	}
	err = ioutil.WriteFile(_filePath(dir, name), data, info.Mode())
	if err != nil {
		return err
	}
	err = os.Chtimes(_filePath(dir, name), info.ModTime(), info.ModTime())
	if err != nil {
		return err
	}
	return nil
}

// RestoreAssets restores an asset under the given directory recursively
func RestoreAssets(dir, name string) error {
	children, err := AssetDir(name)
	// File
	if err != nil {
		return RestoreAsset(dir, name)
	}
	// Dir
	for _, child := range children {
		err = RestoreAssets(dir, filepath.Join(name, child))
		if err != nil {
			return err
		}
	}
	return nil
}

func _filePath(dir, name string) string {
	cannonicalName := strings.Replace(name, "\\", "/", -1)
	return filepath.Join(append([]string{dir}, strings.Split(cannonicalName, "/")...)...)
}