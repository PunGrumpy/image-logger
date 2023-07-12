FROM node:20.10.0-alpine3.10 AS build

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install

COPY . .

CMD ["pnpm", "start"]