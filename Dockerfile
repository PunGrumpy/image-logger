FROM node:20.4.0 AS build

ENV HEALTHCHECK_USER_AGENT "image-logger-by-pungrumpy"

WORKDIR /home/node

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm

USER node

RUN pnpm install

COPY . .

CMD ["pnpm", "start"]