FROM node:22-alpine

WORKDIR /app

ENV VITE_API_URL=/api

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY . .

RUN npm run build:shared
RUN npm run build -w @exam-platform/frontend

EXPOSE 4173

CMD ["npm", "run", "preview", "-w", "@exam-platform/frontend", "--", "--host", "0.0.0.0", "--port", "4173"]
