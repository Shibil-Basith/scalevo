FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY index.html ./
COPY content-seed.json ./
COPY manus-routes.json ./
COPY scalevo-mark.svg ./
COPY scalevo-favicon.svg ./
COPY scalevo-logo-dark-bg.svg ./
COPY scalevo-logo-login.svg ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
