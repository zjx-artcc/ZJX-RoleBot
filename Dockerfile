# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.1.0

FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app

COPY . .

# Debug
RUN ls -la

RUN yarn install --production

# Install the TypeScript compiler.
RUN npm i -g typescript

# Compile
RUN tsc -p ./tsconfig.json

# Run the application as a non-root user.
USER node

# Run the application.
CMD node ./dist/Bot.js