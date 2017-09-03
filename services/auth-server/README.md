Auth-Server

This service serves as a authentication backend for the AmazeeIO API and
auth-ssh server. Make sure to not expose it to untrusted consumers.

# `/login` #

This will create or read a token mapped to a specific ssh public key,
dependent on whether the ssh-key was registered or not.

On creation, there is no verification of the given key, it will create a token
regardless.

Method: POST

Request Body:

```json
{
  "key": "my-public-ssh-key"
}
```

Error Response:

```
Code: 401
```

Success Response:

```
Code: 200
Body: your-token-as-plain-text
```
