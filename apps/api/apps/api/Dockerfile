FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY . .

RUN npm run build:shared
RUN npm run prisma:generate -w @exam-platform/api
RUN npm run build -w @exam-platform/api


FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app .

EXPOSE 8080

CMD npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma \
    && npx prisma db seed --schema=apps/api/prisma/schema.prisma \
    && npm run start -w @exam-platform/api