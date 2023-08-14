# Base image to use
FROM node:20-alpine AS builder

# App directory
WORKDIR /draftbot

# Copy files in the workdir
COPY package.json yarn.lock tsconfig.json ./
# Install the packages (yarn is already in the node image, don't need to install it)
RUN mkdir config resources && \
    yarn install

COPY src ./src
COPY test/ ./test
COPY resources/ ./resources
RUN yarn run tsc

FROM node:20-alpine

WORKDIR /draftbot

# Copy files in the workdir
COPY package.json yarn.lock tsconfig.json ./
# Install the packages without devDependencies
RUN mkdir config resources && \
    yarn install --production
# Copy the builded app from the builder
COPY --from=builder /draftbot/dist /draftbot/resources ./

# Command used to start the app
CMD [ "yarn", "dockerStart" ]