FROM node:12.16.1-buster

RUN npm install --force --global typescript yarn

COPY . /app
WORKDIR /app

RUN yarn && \
    tsc

CMD ["yarn", "start"]   