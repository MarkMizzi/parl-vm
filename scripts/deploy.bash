#!/usr/bin/bash

# set pipelining mode for errors
set -e

CONTAINER_NAME=pixel_playground

### Build docker container

sudo docker build -t ${CONTAINER_NAME} .

### Start docker container

# Kill any running playground containers.
# https://stackoverflow.com/questions/32073971/stopping-docker-containers-by-image-name-ubuntu
RUNNING_CONTAINERS=`sudo docker ps -a --filter ancestor=${CONTAINER_NAME} --format="{{.ID}}"`
if [ ! -z "${RUNNING_CONTAINERS}" ]
then
    sudo docker rm `sudo docker stop ${RUNNING_CONTAINERS}`
fi
sudo docker run -p 8080:8080 -d ${CONTAINER_NAME}

### Install NGINX configuration
sudo cp nginx.conf /etc/nginx/sites-available/pixel_playground.conf
sudo ln -f -s /etc/nginx/sites-available/pixel_playground.conf \
    /etc/nginx/sites-enabled/pixel_playground.conf

sudo service nginx reload

### Get certificate
sudo certbot -n --nginx --email mizzimark2001@gmail.com --agree-tos \
    -d www.pixel.markmizzi.dev -d pixel.markmizzi.dev \
    --redirect --keep-until-expiring