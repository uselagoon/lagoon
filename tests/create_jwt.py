#!/usr/bin/env python3

import os
import jwt

payload = {
    'role': 'admin',
    'iss': 'e2e-tests',
    'aud': os.environ['JWTAUDIENCE'],
    'sub': 'e2e-tests'
}

print(jwt.encode(payload, os.environ['JWTSECRET'], algorithm='HS256'))
