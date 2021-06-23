#!/usr/bin/env python3

import os
import jwt

payload = {'role': 'admin', 'iss': os.environ['JWTUSER'],
           'aud': os.environ['JWTAUDIENCE'], 'sub': os.environ['JWTUSER']}

access_token = jwt.encode(payload, os.environ['JWTSECRET'], algorithm='HS256')

print(access_token)
