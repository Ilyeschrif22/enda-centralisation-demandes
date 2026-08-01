FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package*.json ./
# `npm install` accepts an updated lockfile while still using it as the
# preferred resolution source. This keeps image builds working when frontend
# dependencies are changed without regenerating the lockfile first.
RUN npm install --no-audit --no-fund
COPY . .

ARG VITE_KEYCLOAK_URL=http://localhost:8180
ARG VITE_KEYCLOAK_REALM=microservices-gateway
ARG VITE_KEYCLOAK_CLIENT=react-client
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT=$VITE_KEYCLOAK_CLIENT
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
