# Helm

---

This document describes how to install [Helm](https://helm.sh) inside an OpenShift cluster.

A more comprehensive guide can be found [here](https://blog.openshift.com/getting-started-helm-openshift/).

---

## Instructions

**Notes**<br/>

* To execute these instructions you must be logged into OpenShift / [MiniShift](https://github.com/minishift/minishift) as a cluster administrator. For local setup, install MiniShift first (`brew cask install minishift`)
* You must have the `oc` command installed.  If you have installed MiniShift then you already have it.
* Helm v2.7.0 is used.

The installation instructions for Helm can be found [here](https://github.com/kubernetes/helm#install).
***For local install in Mac OS X***
****Note on VM Driver****
By default Minishift is set to use the `xhyve` virtualization driver. If you have another driver available, for example `virtualbox`, use the `--vm-driver` flag.

```console
$ brew install kubernetes-helm
$ minishift start --vm-driver virtualbox
```
Once your Minishift is running (`minishift status`), skip to the `Create new project` section.

****The instructions to install Helm on Linux are below.****

```console
$ curl -s https://storage.googleapis.com/kubernetes-helm/helm-v2.7.0-linux-amd64.tar.gz | tar xz
$ cp linux-amd64/helm /usr/local/bin/
$ helm init --client-only
```

****Create a new project and set the Helm namespace environment variable.****

```console
$ oc new-project tiller
$ export TILLER_NAMESPACE=tiller
```

****Create the required OpenShift resources and install `tiller` (the Helm server-side component)****
Note that this command must be run from the root of the `bay` repository.

```console
$ oc process -f manifests/helm/tiller-template.yaml \
-p TILLER_NAMESPACE="${TILLER_NAMESPACE}" | oc create -f -
```

****Confirm that Helm has been installed****
```console
$ helm version
```
Note, that in the case you see an error `Error: cannot connect to Tiller`, then execute the command below.

For each project that Helm needs to deploy to run the following command (when switched into the project).

```console
$ oc policy add-role-to-user edit "system:serviceaccount:${TILLER_NAMESPACE}:tiller"
```
