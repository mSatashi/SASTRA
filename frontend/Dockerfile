# Build from the frontend directory: docker build -t sastra-frontend ./frontend
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .

# Public Vite configuration is embedded at build time, never supplied as secrets.
ARG VITE_DATA_MODE=demo
ARG VITE_API_URL=/api/v1
ENV VITE_DATA_MODE=${VITE_DATA_MODE} \
    VITE_API_URL=${VITE_API_URL}
RUN case "$VITE_DATA_MODE" in demo|api) ;; *) echo "VITE_DATA_MODE must be demo or api" >&2; exit 1 ;; esac \
    && npm run format:check \
    && npm test \
    && npm run build

FROM nginx:stable-alpine AS runtime
ENV PORT=8080 \
    NGINX_ENVSUBST_FILTER="^PORT$"
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
