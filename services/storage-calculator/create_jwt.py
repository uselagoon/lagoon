#!/usr/bin/env python3

import os
import jwt

payload = {'role': 'admin', 'iss': 'storage-calculator',
           'aud': os.environ['JWTAUDIENCE'], 'sub': 'storage-calculator'}

print(jwt.encode(payload, os.environ['JWTSECRET'], algorithm='HS256').decode())
