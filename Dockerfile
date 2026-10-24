FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY index.html ./
COPY content-seed.json ./
COPY manus-routes.json ./
COPY scalevo-mark.svg ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
