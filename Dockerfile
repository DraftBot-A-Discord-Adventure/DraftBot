# Base image to use
FROM node:16-alpine

# App directory
WORKDIR /draftbot

# Copy files in the workdir
COPY package.json yarn.lock tsconfig.json ./
COPY src/ ./src
COPY test/ ./test
COPY resources/ ./resources
COPY database/migrations/ ./database/migrations/
RUN mkdir ./config

# Install the packages (yarn is already in the node image, don't need to install it)
RUN yarn install

# Bundle app source
COPY . .

# Command used to start the app
CMD [ "yarn", "dockerStart" ]