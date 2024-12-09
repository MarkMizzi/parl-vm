FROM ubuntu:24.04

# Install system deps
RUN apt-get update
RUN apt-get install -y nodejs npm

### Setting up playground

# Copy playground src to container
COPY playground playground
COPY vm vm
COPY highlighting highlighting

# build Parl lexer, parser and highlighting
WORKDIR /highlighting
RUN npm install

WORKDIR /playground

# Install deps and build playground app
RUN npm install
RUN npm run build
RUN npm prune --production

# Clean up typescript files as these are not needed in build.
WORKDIR /
RUN rm **/*.ts

# Remove npm as it is no longer needed.
RUN apt-get remove -y npm
RUN apt-get autoremove -y

# Command to run the playground app, appropriate port is also exposed.
WORKDIR /playground
CMD ["./node_modules/http-server/bin/http-server", "./dist"]