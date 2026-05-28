FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Install Playwright Chromium
FROM node:20-alpine AS playwright
WORKDIR /app
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache \
    chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV NODE_ENV=production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
COPY --from=playwright --chown=appuser:nodejs /app/dist ./dist
COPY --from=playwright --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=playwright --chown=appuser:nodejs /app/src/db/schema.prisma ./prisma/schema.prisma
USER appuser
EXPOSE 4000
CMD ["node", "dist/index.js"]
