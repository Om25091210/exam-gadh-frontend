# syntax=docker/dockerfile:1
# One image recipe for both Next.js apps: docker build --build-arg APP=web|admin .
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
ARG APP
# the /v1 rewrite target is fixed at build time: the API container on the compose network
ARG API_URL=http://api:3000
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ENV API_URL=$API_URL NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @eg/$APP build

FROM node:22-alpine
ARG APP
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 APP=$APP
WORKDIR /app
COPY --from=build /app/apps/$APP/.next/standalone ./
COPY --from=build /app/apps/$APP/.next/static ./apps/$APP/.next/static
COPY --from=build /app/apps/$APP/public ./apps/$APP/public
# Next writes its image-optimisation cache here
RUN mkdir -p apps/$APP/.next/cache && chown -R node:node apps/$APP/.next/cache
USER node
EXPOSE 3000
CMD ["sh", "-c", "node apps/$APP/server.js"]
