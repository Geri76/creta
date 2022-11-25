FROM node:19-slim

WORKDIR /usr/src/creta

COPY package*.json ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./dist ./dist

RUN npm install
RUN npm run compile

EXPOSE 3000

CMD ["npm", "run", "dev"]