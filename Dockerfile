FROM node:24-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci \
    && npm run prisma:generate \
    && npm prune --omit=dev \
    && npm cache clean --force

COPY src ./src

USER node

EXPOSE 3000

CMD ["node", "--experimental-strip-types", "src/index.ts"]
