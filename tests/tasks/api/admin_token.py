#!/usr/bin/env python

import os
import jwt

payload = {'role': 'admin', 'iss': 'test-suite',
           'aud': os.environ['JWTAUDIENCE'], 'sub': 'test-suite'}

access_token = jwt.encode(payload, os.environ['JWTSECRET'], algorithm='HS256')

print(access_token)
