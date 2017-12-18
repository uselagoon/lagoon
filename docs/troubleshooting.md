# Troubleshooting

---

This document describes troubleshooting information.

---

## Error from server (Forbidden)

If you see an error similar to the following.

```console
Error from server (Forbidden): User "developer" cannot list pods in project "kube-system"
```

Ensure that you are logged in as an administrator.  On MiniShift do the following.

```console
$ oc login -u system:admin
```


## Error: could not find tiller

If you see an error similar to the following.

```console
Error: could not find tiller
```

Create the missing environment variable.

```console
$ export TILLER_NAMESPACE=tiller
```

## ERROR: Python module 'yq' must be installed.
Provide instructions how to debug this error on a Mac. Mac uses the legacy Python v.2.7 which has no module `yq` available.
A possible workaround is to use `pyenv` via `brew install pyenv`. This allows to switch Python version globally or per directory.
https://github.com/pyenv/pyenv

Steps to install python3 in Mac OS X
```shell
$ brew instal automake
$ brew install libtool
$ brew install pyenv
$ echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bash_profile
$ echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bash_profile
$ echo -e 'if command -v pyenv 1>/dev/null 2>&1; then\n  eval "$(pyenv init -)"\nfi' >> ~/.bash_profile
$ exec "$SHELL"
$ pyenv install 3.6.3
$ pyenv init -
$ pip install jq
$ pip install yq
```

