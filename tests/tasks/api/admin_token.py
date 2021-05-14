#!/usr/bin/env python

import os
import jwt

payload = {'role': 'admin', 'iss': 'test-suite',
           'aud': os.environ['JWTAUDIENCE'], 'sub': 'test-suite'}

print(jwt.encode(payload, os.environ['JWTSECRET'], algorithm='HS256').decode())
