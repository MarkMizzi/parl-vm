#!/usr/bin/bash

# set pipelining mode for errors
set -e

sudo docker build -t pixel_playground .
sudo docker run -p 8080:8080 -it --init pixel_playground