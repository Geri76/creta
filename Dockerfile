FROM node:17

WORKDIR /usr/src/creta

COPY package*.json ./
COPY ./src ./
COPY ./dist ./

RUN npm install
RUN npm run compile

EXPOSE 3000

CMD ["npm", "run", "dev"]