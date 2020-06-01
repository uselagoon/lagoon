#!/usr/bin/env python3

import os
import jwt

payload = {'role': 'admin', 'iss': 'api-data-watcher-pusher',
           'aud': os.environ['JWTAUDIENCE'], 'sub': 'api-data-watcher-pusher'}

print(jwt.encode(payload, os.environ['JWTSECRET'], algorithm='HS256').decode())
