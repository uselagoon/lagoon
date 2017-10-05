#!/usr/bin/env

import random, string, json

def pw(N):
    return ''.join(random.SystemRandom().choice(string.ascii_lowercase + string.ascii_uppercase + string.digits) for _ in range(N))


secret = {
"Version": "v1",
    "stringData": {
        "JWTSECRET": pw(20),
        "RABBITMQ_PASSWORD": pw(10),
        "RABBITMQ_USERNAME": pw(10),
        "SERVICE_API_ADMIN_TOKEN": pw(80)
 },
"kind": "Secret",
    "metadata": { "name": "secret-environment" },
    "type": "Opaque"
}

with file('secrets', 'w') as f:
    json.dump(secret, f, indent=2)
