FROM node:20.4.0 AS build

ENV GEOIP=YOUR_LICENSE_KEY

WORKDIR /home/node

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm

USER node

RUN pnpm install

COPY . .

WORKDIR /home/node/node_modules/geoip-lite

RUN pnpm run-script updatedb license_key=${GEOIP}

WORKDIR /home/node

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "pnpm", "run", "healthcheck" ]

CMD ["pnpm", "start"]