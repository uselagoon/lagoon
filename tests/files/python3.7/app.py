import time

import os
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    envs = os.environ.items()
    return '{}'.format(envs)
