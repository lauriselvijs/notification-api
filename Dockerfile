FROM node:24-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev \
    && npm cache clean --force

COPY src ./src

COPY .env.example .env

USER node

EXPOSE 3000

CMD ["node", "--experimental-strip-types", "src/index.ts"]
