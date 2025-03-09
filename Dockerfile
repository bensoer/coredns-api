####################
# Build Stage
####################
FROM node:23-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node . .

# Do a full install including dev dependencies - we need that to have the nest cli & to build
RUN npm ci --legacy-peer-deps

# Run the build command which creates the production bundle
# Run apply-migrations to generate the sqlite database
RUN npm run build

# remove node_modules and reinstall it only with production dependencies
RUN rm -rf ./node_modules \
    && npm ci --omit=dev --legacy-peer-deps \
    && npm cache clean --force

USER node

####################
# Production
####################

FROM node:23-alpine as production

ENV NODE_ENV production

# Copy the bundled code from the build stage to the production image
RUN mkdir -p /app && \
    chown -R node:node /app && \
    mkdir -p /etc/coredns && \
    chown -R node:node /etc/coredns && \
    chmod -R 755 /etc/coredns && \
    npm -g install typeorm
COPY --chown=node:node --from=build /usr/src/app/node_modules /app/node_modules
COPY --chown=node:node --from=build /usr/src/app/dist /app/dist
COPY --chown=node:node ./startup.sh /app/startup.sh

USER node
WORKDIR /app

# Start the server using the production build
ENTRYPOINT [ "sh", "startup.sh" ]