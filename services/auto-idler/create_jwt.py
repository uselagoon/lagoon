#!/usr/bin/env python3

import os
import jwt

payload = {'role': 'admin', 'iss': 'auto-idler',
           'aud': os.environ['JWTAUDIENCE'], 'sub': 'auto-idler'}

print(jwt.encode(payload, os.environ['JWTSECRET'], algorithm='HS256').decode())
