#!/usr/bin/bash

# set pipelining mode for errors
set -e

CONTAINER_NAME=parl_playground

### Build docker container

# Kill any running playground containers.
# https://stackoverflow.com/questions/32073971/stopping-docker-containers-by-image-name-ubuntu
RUNNING_CONTAINERS=`sudo docker ps -a --filter ancestor=${CONTAINER_NAME} --format="{{.ID}}"`
if [ ! -z "${RUNNING_CONTAINERS}" ]
then
    sudo docker rm `sudo docker stop ${RUNNING_CONTAINERS}`
fi
sudo docker build -t ${CONTAINER_NAME} .

### Start docker container

sudo docker run -p 8090:8080 -d ${CONTAINER_NAME}

### Install NGINX configuration
sudo cp nginx.conf /etc/nginx/sites-available/parl_playground.conf
sudo ln -f -s /etc/nginx/sites-available/parl_playground.conf \
    /etc/nginx/sites-enabled/parl_playground.conf

sudo service nginx reload

### Get certificate
sudo certbot -n --nginx --email mizzimark2001@gmail.com --agree-tos \
    -d www.parl.markmizzi.dev -d parl.markmizzi.dev \
    --redirect --keep-until-expiring