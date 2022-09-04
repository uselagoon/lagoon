package helpers

import (
	"crypto/sha1"
	"fmt"
	"regexp"
	"strings"
)

const (
	// DefaultNamespacePattern is what is used when one is not provided.
	DefaultNamespacePattern = "${project}-${environment}"
)

// GenerateNamespaceName handles the generation of the namespace name from environment and project name with prefixes and patterns
func GenerateNamespaceName(pattern, environmentName, projectname, prefix, controllerNamespace string, randomPrefix bool) string {
	nsPattern := pattern
	if pattern == "" {
		nsPattern = DefaultNamespacePattern
	}
	environmentName = ShortenEnvironment(projectname, MakeSafe(environmentName))
	// lowercase and dnsify the namespace against the namespace pattern
	ns := MakeSafe(
		strings.Replace(
			strings.Replace(
				nsPattern,
				"${environment}",
				environmentName,
				-1,
			),
			"${project}",
			projectname,
			-1,
		),
	)
	// If there is a namespaceprefix defined, and random prefix is disabled
	// then add the prefix to the namespace
	if prefix != "" && randomPrefix == false {
		ns = fmt.Sprintf("%s-%s", prefix, ns)
	}
	// If the randomprefix is enabled, then add a prefix based on the hash of the controller namespace
	if randomPrefix {
		ns = fmt.Sprintf("%s-%s", HashString(controllerNamespace)[0:8], ns)
	}
	// Once the namespace is fully calculated, then truncate the generated namespace
	// to 63 characters to not exceed the kubernetes namespace limit
	if len(ns) > 63 {
		ns = fmt.Sprintf("%s-%s", ns[0:58], HashString(ns)[0:4])
	}
	return ns
}

// ShortenEnvironment shortens the environment name down the same way that Lagoon does
func ShortenEnvironment(project, environment string) string {
	overlength := 58 - len(project)
	if len(environment) > overlength {
		environment = fmt.Sprintf("%s-%s", environment[0:overlength-5], HashString(environment)[0:4])
	}
	return environment
}

// MakeSafe ensures that any string is dns safe
func MakeSafe(in string) string {
	out := regexp.MustCompile(`[^0-9a-z-]`).ReplaceAllString(
		strings.ToLower(in),
		"$1-$2",
	)
	return out
}

// HashString get the hash of a given string.
func HashString(s string) string {
	h := sha1.New()
	h.Write([]byte(s))
	bs := h.Sum(nil)
	return fmt.Sprintf("%x", bs)
}
