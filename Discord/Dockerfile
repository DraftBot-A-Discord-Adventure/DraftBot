ARG NODE_VERSION=23

# Base image to use
FROM node:${NODE_VERSION}-alpine AS builder

# Set the yarn version
ENV YARN_VERSION=4.5.1

# Set the working directory
WORKDIR /draftbot/Discord

# Setup yarn modern
RUN corepack enable

# Copy files in the workdir
COPY ./Discord/package.json ./Discord/yarn.lock ./Discord/tsconfig.json ./Discord/.yarnrc.yml ./
# Create the config directory
RUN mkdir config

# Install the dependencies (yarn is already in the node image, don't need to install it)
RUN yarn workspaces focus --production
RUN yarn install

# Copy the lib
RUN mkdir ../Lib
COPY ./Lib/package.json ./Lib/yarn.lock ./Lib/.yarnrc.yml ../Lib/
COPY ./Lib/src ../Lib/src

# Copy the translations
COPY ./Lang ../Lang

# Copy the source code
COPY ./Discord/src ./src

# Install the lib dependencies
WORKDIR /draftbot/Lib
RUN yarn workspaces focus --production && yarn install
WORKDIR /draftbot/Discord

# Compile the source code
RUN yarn interface
RUN yarn run tsc

FROM node:${NODE_VERSION}-alpine

WORKDIR /draftbot

# Setup yarn modern
RUN corepack enable

# Copy files in the workdir
COPY ./Discord/package.json ./Discord/yarn.lock ./Discord/tsconfig.json ./Discord/.yarnrc.yml ./
# Create the directories
RUN mkdir config

# Install the dependencies (yarn is already in the node image, don't need to install it)
RUN yarn workspaces focus --production
RUN yarn install

# Copy the builded app from the builder
COPY --from=builder /draftbot/Discord/dist ./dist

# Setup permissions
RUN mkdir -p /.cache/node/corepack
RUN chmod -R 777 /.cache/node/corepack
RUN chmod o+rx /root
RUN chmod -R o+rx /root/.yarn

# Command used to start the app
CMD [ "yarn", "dockerStart" ]