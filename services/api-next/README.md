
# Setup

```
# Install OCaml compiler and tooling as specific switch
opam switch 4.04.2-api-next --alias-of 4.04.2

# Pin our project in the global OPAM scope
opam pin add -yn api-next .

# Check for external OS-specific system packages etc.
opam depext api-next

# Install dependent modules for this project
opam install --deps-only api-next
```
