import time
import os

from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    envs = ''
    for key, val in os.environ.items():
        envs+=str("{}={}\n".format(key, val))
    return '{}'.format(envs)
