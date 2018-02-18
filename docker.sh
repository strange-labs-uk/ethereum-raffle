#!/usr/bin/env bash
set -euxo pipefail

export DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export APPNAME=${APPNAME:="lottery"}
export LINK_TEMPLATESTACK=${LINK_TEMPLATESTACK:=""}

function build-truffle() {
  docker build -t $APPNAME-truffle truffle
}

function build-frontend() {
  docker build -t $APPNAME-frontend frontend
}

function build-bot() {
  docker build -t $APPNAME-bot bot
}

function build() {
  build-truffle
  build-frontend
  build-bot
}

function network-create() {
  if [ -z "$(docker network ls | grep $APPNAME-network)" ]; then
    docker network create $APPNAME-network
  fi
}

function network-delete() {
  if [ -n "$(docker network ls | grep $APPNAME-network)" ]; then
    docker network rm $APPNAME-network
  fi
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
    --name $APPNAME-frontend \
    -p 8080:80 $linkedPath -v "$DIR/frontend/src:/app/src" \
    "$APPNAME-frontend"
}

function frontend-logs() {
  docker logs -f $APPNAME-frontend
}

function frontend-stop() {
  docker rm -f $APPNAME-frontend || true
}

function truffle() {
  local useNetwork=""
  local mountFolders=""
  if [ -z "$LOCAL_TRUFFLE" ]; then
    useNetwork=" --network ganache "
  fi
  # mount code if not running in CI mode
  if [ -z "$CI_JOB_ID" ]; then
    mountFolders="$mountFolders -v $DIR/truffle/contracts:/app/contracts "
    mountFolders="$mountFolders -v $DIR/truffle/migrations:/app/migrations "
    mountFolders="$mountFolders -v $DIR/truffle/test:/app/test "
    mountFolders="$mountFolders -v $DIR/truffle/build:/app/build "
  fi
  docker run -ti --rm \
    --net $APPNAME-network $mountFolders \
    $APPNAME-truffle $useNetwork "$@"
}

function ganache() {
  docker run -d \
    --net $APPNAME-network \
    --name $APPNAME-ganache \
    -p 8545:8545 \
    --entrypoint "node_modules/.bin/ganache-cli" \
    $APPNAME-truffle -a 10 --debug -d fixed "$@"
}

function ganache-logs() {
  docker logs -f $APPNAME-ganache
}

function ganache-stop() {
  docker rm -f $APPNAME-ganache || true
}

eval "$@"
