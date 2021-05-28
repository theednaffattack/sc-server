#
# Builder stage.
# This state compile our TypeScript to get the JavaScript code
#
FROM node:12.16.2 AS builder

WORKDIR /usr/src/app
# ENV YARN_CACHE_FOLDER=/dev/shm/yarn_cache

COPY package*.json ./
COPY tsconfig*.json ./
COPY ./src ./src
COPY ./db/postgres/migrations ./db/postgres/migrations
COPY ./certs ./certs
COPY ./yarn.lock ./
RUN yarn install --frozen-lockfile && yarn build
# RUN npm ci --quiet && npm run build

#
# Production stage.
# This state compile get back the JavaScript code from builder stage
# It will also install the production package only
#
FROM node:12.16.2-slim

WORKDIR /app
ENV NODE_ENV=production

# COPY package*.json ./
# RUN yarn install --frozen-lockfile --production
# RUN npm ci --quiet --only=production

## We just need the build to execute the command
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/db/postgres/migrations ./db/migrations
COPY --from=builder /usr/src/app/certs ./certs


# Inform Docker that the container is listening on the specified port at runtime.
EXPOSE 5050

USER node

# start the app
# CMD ["node", "/dist/index.js"]
CMD ["yarn", "start"]
