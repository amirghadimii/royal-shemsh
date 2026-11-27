FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 4001

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.mjs && node dist/main"]
