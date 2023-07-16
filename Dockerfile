FROM node:20.4.0 AS build

ENV HEALTHCHECK_USER_AGENT="image-logger-by-pungrumpy"

WORKDIR /home/node

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm

USER node

RUN pnpm install

COPY . .

WORKDIR /home/node

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl -H "User-Agent: ${HEALTHCHECK_USER_AGENT}" http://localhost:8080

CMD ["pnpm", "start"]