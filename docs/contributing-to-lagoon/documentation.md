# Contributing to Lagoon documentation

We really value anything that you can offer us!

We've made building and viewing the documentation really straightforward, and the team is always ready to help out with reviews or pointers.

We use [mkdocs](https://www.mkdocs.org/) with the excellent [Material](https://squidfunk.github.io/mkdocs-material/) theme.

## Viewing and updating docs locally

From the root of the Lagoon repository (you'll need Docker), run:

```bash title="Get local docs up and running."
make docs/serve
```

<!-- markdown-link-check-disable-next-line -->
This will start a development server on [http://127.0.0.1:8000](http://127.0.0.1:8000), configured to live-reload on any updates.

The customized Docker image contains all the necessary extensions.

Alternatively, to run the `mkdocs` package locally, you'll need to install mkdocs, and then install all of the necessary plugins.

```bash title="Install mkdocs"
pip3 install -r docs/requirements.txt
mkdocs serve
```

## Editing in the Cloud

Each documentation page also has an "edit" pencil in the top right, that will take you to the correct page in the Git repository.

Feel free to contribute here, too - you can always use the built-in [github.dev web-based editor](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor). It's got basic Markdown previews, but none of the mkdocs loveliness.

## How we deploy documentation

We use the [Deploy MkDocs](https://github.com/marketplace/actions/deploy-mkdocs) GitHub Action to build all main branch pushes, and trigger a deployment of the `gh-pages` branch.
