#!/usr/bin/env python3

import os
import jwt
from datetime import datetime, timezone, timedelta

iat = datetime.now(timezone.utc)
exp = iat + timedelta(minutes=1)
payload = {'exp': exp, 'iat': iat, 'role': 'admin', 'aud': os.environ['JWTAUDIENCE'], 'sub': 'ssh'}

print(jwt.encode(payload, os.environ['JWTSECRET'], algorithm='HS256'))
