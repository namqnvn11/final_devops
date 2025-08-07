
FROM node:18-alpine

RUN apk add --no-cache bash curl python3 make g++ && \
    npm install -g npm@latest

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod -R +x node_modules/.bin

RUN npm run build

EXPOSE 5000

CMD ["node", "dist/server.js"]
