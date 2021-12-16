# Contributing to Lagoon documentation

We really value anything that you can offer us!

We've made building and viewing the documentation really easy, and the team is always ready to help out with reviews or pointers.

We use [mkdocs](https://www.mkdocs.org/) with the excellent [Material](https://squidfunk.github.io/mkdocs-material/) theme.

## Viewing and updating docs locally

From the root of this repo, just run

`docker run --rm -it -p 8000:8000 -v ${PWD}:/docs squidfunk/mkdocs-material`

and this will start a development server on your local port 8000, configured to livereload on any updates.  The docker image contains all the necessary extensions.

## Editing in the cloud

Each documentation page also has an "edit" pencil in the top right, that will take you to the correct page in the git repository.

Feel free to contribute here too - you can always use the inbuilt [github.dev web-based editor](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor). It's got basic markdown previews, but none of the mkdocs loveliness

## How we deploy documentation

We use the [Deploy MkDocs](https://github.com/marketplace/actions/deploy-mkdocs) GitHub Action to build all main branch pushes, and trigger a deployment of the gh-pages branch.