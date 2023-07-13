FROM node:20.4.0 AS build

WORKDIR /home/node

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm

USER node

RUN pnpm install

COPY . .

WORKDIR /home/node

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "pnpm", "run", "healthcheck" ]

CMD ["pnpm", "start"]