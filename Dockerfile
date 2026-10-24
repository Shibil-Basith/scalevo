FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js index.html content-seed.json manus-routes.json app.config.ts ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
