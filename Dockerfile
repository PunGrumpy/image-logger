FROM node:20.4.0 AS build

ENV GEOIP=YOUR_LICENSE_KEY

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install

COPY . .

RUN cd node_modules/geoip-lite && pnpm run-script updatedb license_key=${GEOIP}

CMD ["pnpm", "start"]