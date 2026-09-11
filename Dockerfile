# syntax=docker/dockerfile:1
# One image, every stage but the browser one (that is Dockerfile.e2e — Playwright's
# Chromium has no musl build, so the browser-mode unit projects and e2e cannot
# run on Alpine). Stages: base → deps → dev → test | build → prod.
# Both ARGs take any node image. The hardened pair needs `docker login dhi.io`:
# DEV_IMAGE=dhi.io/node:24-alpine3.23-dev RUN_IMAGE=dhi.io/node:24-alpine3.23
ARG DEV_IMAGE=node:24-alpine
ARG RUN_IMAGE=node:24-alpine

FROM ${DEV_IMAGE} AS base
WORKDIR /app
# `npm run lint` shells out to `git ls-files` (scripts/file-names.mjs and
# friends), so the test service mounts the checkout and the image carries git.
RUN apk add --no-cache git
# Run as `node`: what the dev server writes into the bind mount (.svelte-kit,
# src/lib/paraglide) then stays owned by the host user, not root.
RUN chown node:node /app
USER node

FROM base AS deps
# `--ignore-scripts`: `prepare` compiles paraglide and runs svelte-kit sync,
# both need the source tree — vite does both again on start and build.
RUN --mount=type=cache,target=/npm,mode=0777 \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci --ignore-scripts --cache /npm

FROM deps AS dev
COPY --chown=node:node . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Everything that does not need a browser. Browser tests: Dockerfile.e2e.
# Run it with the source mounted (compose `test`): lint needs the .git dir.
FROM dev AS test
CMD ["sh", "-c", "npm run check && npm run lint && npm run depcheck && npm run test:unit -- --run --project server"]

FROM dev AS build
ENV ADAPTER=node
RUN npm run build

FROM base AS prod-deps
RUN --mount=type=cache,target=/npm,mode=0777 \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci --omit=dev --ignore-scripts --cache /npm

FROM ${RUN_IMAGE} AS prod
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
# `"type": "module"` — adapter-node's output is ESM.
COPY --from=build --chown=node:node /app/package.json ./
USER node
EXPOSE 3000
CMD ["node", "build"]
