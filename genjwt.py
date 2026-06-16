#!/usr/bin/env python3

import os
from datetime import datetime, timedelta, timezone
import jwt

payload = {'role': 'admin', 'iss': 'api-data-watcher-pusher',
           'aud': os.environ['JWTAUDIENCE'], 'sub': 'api-data-watcher-pusher'}

now = datetime.now(timezone.utc)
iat_plus_minutes = int(os.environ.get('IATPLUSMIN', '0'))
iat = now + timedelta(minutes=iat_plus_minutes)
payload['iat'] = iat

jwt_no_expire = os.environ.get('JWTNOEXPIRE', '').lower() == 'true'
if not jwt_no_expire:
    payload['exp'] = iat + timedelta(minutes=11)

access_token = jwt.encode(payload, os.environ['JWTSECRET'], algorithm='HS256')

print(access_token)
