FROM mhart/alpine-node:8
MAINTAINER kaiyadavenport@gmail.com
WORKDIR /app
RUN apk add --update \
    python \
    python-dev \
    py-pip \
    build-base \
    git \
  && pip install virtualenv \
  && rm -rf /var/cache/apk/*
COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json
RUN npm install
COPY . /app
EXPOSE 8545