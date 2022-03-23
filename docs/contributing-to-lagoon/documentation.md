# Contributing to Lagoon documentation

We really value anything that you can offer us!

We've made building and viewing the documentation really easy, and the team is always ready to help out with reviews or pointers.

We use [mkdocs](https://www.mkdocs.org/) with the excellent [Material](https://squidfunk.github.io/mkdocs-material/) theme.

## Viewing and updating docs locally

From the root of this repo, just run:

```bash
docker run --rm -it -p 127.0.0.1:8000:8000 -v ${PWD}:/docs squidfunk/mkdocs-material
```

This will start a development server on [http://127.0.0.1:8000](http://127.0.0.1:8000), configured to live-reload on any updates.
The Docker image contains all the necessary extensions.

## Editing in the cloud

Each documentation page also has an "edit" pencil in the top right, that will take you to the correct page in the git repository.

Feel free to contribute here too - you can always use the inbuilt [github.dev web-based editor](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor).
It's got basic markdown previews, but none of the mkdocs loveliness

## How we deploy documentation

We use the [Deploy MkDocs](https://github.com/marketplace/actions/deploy-mkdocs) GitHub Action to build all main branch pushes, and trigger a deployment of the `gh-pages` branch.
