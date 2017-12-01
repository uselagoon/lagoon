build:
	jbuilder build @install

doc:
	jbuilder build @doc

run: build
	jbuilder exec api

clean:
	rm -rf _build

test:
	jbuilder runtest

pin:
	opam pin add .

repin: build
	opam upgrade api

build-all:
	jbuilder build --workspace jbuild-workspace.dev @install

test-all:
	jbuilder build --workspace jbuild-workspace.dev @runtest

.PHONY: build test pin repin build-all test-all
