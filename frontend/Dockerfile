FROM mhart/alpine-node:8
MAINTAINER kaiyadavenport@gmail.com
WORKDIR /app
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock
RUN yarn install
COPY . /app
ENTRYPOINT ["yarn", "run"]
CMD ["watch"]