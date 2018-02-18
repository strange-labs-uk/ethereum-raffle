#!/usr/bin/env bash
set -euxo pipefail

export DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export APPNAME=${APPNAME:="lottery"}
export LINK_TEMPLATESTACK=${LINK_TEMPLATESTACK:=""}

function network-create() {
  if [ -z "$(docker network ls | grep $APPNAME-network)" ]; then
    docker network create $APPNAME-network
  fi
}

function build() { 
  docker build -t $APPNAME-frontend frontend
  docker build -t $APPNAME-truffle truffle
  docker build -t $APPNAME-bot bot
}

function frontend() {
  local linkedPath=""
  if [ -n "$LINK_TEMPLATESTACK" ]; then
    # this is so we can develop on both codebases without having to npm publish
    # you will need to "git clone https://github.com/binocarlos/templatestack"
    # into the same folder as ethereum-lottery
    linkedPath=" -v $DIR/../templatestack/template-ui/lib:/app/node_modules/template-ui/lib -v $DIR/../templatestack/template-tools/src:/app/node_modules/template-tools/src"
  fi
  docker run -d \
    --net $APPNAME-network \
    --name frontend \
    -p 8080:80 $linkedPath -v "$DIR/frontend/src:/app/src" \
    "$APPNAME-frontend"
}

function truffle() {
  local useNetwork=""
  if [ -z "$LOCAL_TRUFFLE" ]; then
    useNetwork=" --network ganache "
  fi
  docker run -ti --rm \
    --net $APPNAME-network \
    -v "$DIR/truffle/contracts:/app/contracts" \
    -v "$DIR/truffle/migrations:/app/migrations" \
    -v "$DIR/truffle/test:/app/test" \
    -v "$DIR/truffle/build:/app/build" \
    $APPNAME-truffle $useNetwork "$@"
}

function ganache() {
  docker run -d \
    --net $APPNAME-network \
    --name ganache \
    -p 8545:8545 \
    --entrypoint "node_modules/.bin/ganache-cli" \
    $APPNAME-truffle -a 10 --debug -d hello "$@"
}

function ganache-logs() {
  docker logs -f ganache
}

eval "$@"
