# === Build stage ===
FROM node:22-alpine AS builder

WORKDIR /app

# Vite "inlinea" le variabili import.meta.env.VITE_* a BUILD-TIME: vanno quindi
# passate come build-arg (docker build --build-arg ...), non come env a runtime.
ARG VITE_BACKEND_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_ENABLE_SECURITY_CONTROLS=true
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_ENABLE_SECURITY_CONTROLS=$VITE_ENABLE_SECURITY_CONTROLS

COPY package*.json ./
# Resilienza rete: registry npm a volte stalla (EIDLETIMEOUT) → retry + timeout ampio.
RUN npm ci --no-audit --no-fund --fetch-retries=5 --fetch-timeout=600000
COPY . .
RUN npm run build

# === Production stage (nginx) ===
FROM nginx:alpine

# File statici buildati
COPY --from=builder /app/dist /usr/share/nginx/html

# Config nginx minimale (SPA routing + cache asset)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
