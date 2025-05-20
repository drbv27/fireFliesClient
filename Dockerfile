FROM node:18.17.1

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY ../../package*.json ./

RUN npm install

COPY ../../ .

EXPOSE 3001

RUN npm install -g concurrently

CMD [ "npm", "start" ]