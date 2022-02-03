#!/usr/bin/env python

# usage ./refresh_token.py {auth-server client secret} {current keycloak grant}

import sys
import base64
import json
import jwt
import time
import requests
import os

auth_server_client_secret = sys.argv[1]
grant_raw = base64.standard_b64decode(sys.argv[2])

grant = json.loads(grant_raw)

access_token = jwt.decode(grant['access_token'], options={"verify_signature": False}, algorithms=["HS256"])

data = {'client_id': 'auth-server',
        'client_secret': auth_server_client_secret,
        'grant_type': 'refresh_token',
        'refresh_token': grant['refresh_token']}

r = requests.post(url = os.environ['KEYCLOAK_URL'] + "/auth/realms/lagoon/protocol/openid-connect/token", data = data)
print(r.text)
