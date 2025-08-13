# === Build stage ===
FROM node:22.15.1-alpine AS build

# Dipendenze per moduli nativi (bcrypt, ecc.)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./
RUN npm ci

# Copia tutto il codice
COPY . .

# Build TypeScript -> JavaScript
RUN npm run build

# === Production stage con strumenti di debug ===
FROM node:22.15.1-alpine AS production

WORKDIR /app

# Installa solo runtime dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copia la build dallo stage precedente
COPY --from=build /app/dist ./dist

# Creazione utente non-root
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
RUN chown -R nodejs:nodejs /app

# Passa a root temporaneamente per installare strumenti di debug
USER root
RUN apk add --no-cache bash bind-tools busybox-extras
USER nodejs

# Esponi la porta dell'app
EXPOSE 3000

# Healthcheck opzionale
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/ping', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Avvio dell'app
CMD ["node", "dist/app.js"]
