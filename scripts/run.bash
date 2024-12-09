#!/usr/bin/bash

# set pipelining mode for errors
set -e

sudo docker build -t parl_playground .
sudo docker run -p 8080:8080 -it --init parl_playground