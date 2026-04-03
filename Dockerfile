FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npx vite build --outDir /app/public

FROM node:20
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/tsconfig.json ./
COPY backend/src/ ./src/
COPY --from=frontend-build /app/public ./public/
RUN npx tsc
CMD ["node", "dist/index.js"]
