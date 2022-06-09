# Install the Lagoon CLI

1. Install the Lagoon CLI on your local machine:
   1. Check [https://github.com/uselagoon/lagoon-cli#install](https://github.com/uselagoon/lagoon-cli#install) on how to install for your operating system. For macOS, you can use Homebrew:
      1. `brew tap uselagoon/lagoon-cli`
      2. `brew install lagoon`
2. The CLI needs to know how to communicate with Lagoon, so run the following command:
    `lagoon config add --graphql https://<YOUR-API-URL>/graphql --ui https://YOUR-UI-URL --hostname <YOUR.SSH.IP> --lagoon <YOUR-LAGOON-NAME> --port 22`
3. Access Lagoon by authenticating with your SSH key.
   1. In the Lagoon UI (the URL is in `values.yml` if you forget), go to **Settings**.
   2. Add your public SSH key.
   3. You need to set the default Lagoon to _your_ Lagoon so that it doesn’t try to use the amazee.io defaults:
      1. `lagoon config default --lagoon <YOUR-LAGOON-NAME>`
4. Now run `lagoon login`
   1. How the system works:
      1. Lagoon talks to SSH and authenticates against your public/private key pair, and gets a token for your username.
   2. Verify via `lagoon whoami` that you are logged in.

!!! Note "Note:"
    Note: We don’t generally recommend using the Lagoon Admin role, but you’ll need to create an admin account at first to get started. Ideally, you’ll immediately create another account to work from which is _not_ an admin.
