FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/

RUN npx tsc

CMD ["node", "dist/index.js"]
