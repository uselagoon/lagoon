#!/usr/bin/env python3

import os
import jwt

payload = {'role': 'admin', 'iss': 'api-data-watcher-pusher',
           'aud': os.environ['JWTAUDIENCE'], 'sub': 'api-data-watcher-pusher'}

access_token = jwt.encode(payload, os.environ['JWTSECRET'], algorithm='HS256')

print(access_token)
