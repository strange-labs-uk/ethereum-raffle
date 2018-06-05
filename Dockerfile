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
    git \
  && pip install -U pip \
  && pip install virtualenv \
  && rm -rf /var/cache/apk/*
COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json
RUN npm install
COPY . /app
ENTRYPOINT ["npm", "run"]
CMD ["watch"]
