FROM mhart/alpine-node:8
MAINTAINER kaiyadavenport@gmail.com
WORKDIR /app
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh
RUN apk add --update \
    python \
    python-dev \
    py-pip \
    build-base \
  && pip install virtualenv \
  && rm -rf /var/cache/apk/*
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock
RUN yarn install
COPY . /app
ENTRYPOINT ["yarn", "run"]
CMD ["watch"]