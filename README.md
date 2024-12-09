# ParL VM Playground

## Running the playground locally

If you want to run the playground locally, you can do so by running
``` bash
./scripts/run.bash
```
This will build and start the Docker image for the playground, which will be available at http://localhost:8080.

## Hosting your own copy of the playground

Hosting a copy of the playground is a little work intensive unless you own the domain `parl.markmizzi.dev` (which at the time of writing belongs to me).

Change the hardcoded references to `parl.markmizzi.dev` in `nginx.conf` and `scripts/deploy.bash` to a domain name you own (a simple search and replace will do). Also remember to change my email `mizzimark2001@gmail.com` to one of your own in the call to `certbot` within `scripts/deploy.bash`.

Once all this is done, simply run
``` bash
./scripts/deploy.bash
```
on the machine where you want to host the playground.