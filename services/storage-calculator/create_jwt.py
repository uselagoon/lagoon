#!/usr/bin/env python3

import os
import jwt

payload = {'role': 'admin', 'iss': 'storage-calculator',
           'aud': os.environ['JWTAUDIENCE'], 'sub': 'storage-calculator'}

access_token = jwt.encode(payload, os.environ['JWTSECRET'], algorithm='HS256')

print(access_token)
