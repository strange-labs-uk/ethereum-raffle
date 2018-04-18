#!/usr/bin/env bash
set -euxo pipefail

export DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export APPNAME=${APPNAME:="lottery"}
export LINK_TEMPLATESTACK=${LINK_TEMPLATESTACK:=""}
export CI_JOB_ID=${CI_JOB_ID:=""}
export LOCAL_TRUFFLE=${LOCAL_TRUFFLE:=""}

function build-truffle() {
  docker build -t $APPNAME-truffle truffle
}

function build-frontend() {
  docker build -t $APPNAME-frontend frontend
}

function build() {
  build-truffle
  build-frontend
}

function frontend() {
  local linkedPath=""
  if [ -n "$LINK_TEMPLATESTACK" ]; then
    # this is so we can develop on both codebases without having to npm publish
    # you will need to "git clone https://github.com/binocarlos/templatestack"
    # into the same folder as ethereum-lottery
    linkedPath=" -v $DIR/../templatestack/template-ui/lib:/app/node_modules/template-ui/lib -v $DIR/../templatestack/template-tools/src:/app/node_modules/template-tools/src"
  fi
  docker run -ti --rm \
    --name $APPNAME-frontend \
    -p 8080:80 $linkedPath \
    -e "TEST_WEB3_PROVIDER=http://127.0.0.1:8545" \
    -v "$DIR/frontend/src:/app/src" \
    -v "$DIR/frontend/www:/app/www" \
    "$APPNAME-frontend"
}

function frontend-logs() {
  docker logs -f $APPNAME-frontend
}

function frontend-stop() {
  docker rm -f $APPNAME-frontend || true
}

function truffle() {
  local extraDocker=""
  local extraGanache=""
  # LOCAL_TRUFFLE means a "truffle develop"
  # it means we are not expecting a ganache container to be running
  if [ -z "$LOCAL_TRUFFLE" ]; then
    extraDocker="$extraDocker --net $APPNAME-network -e GANACHE_HOST=$APPNAME-ganache "
    extraGanache="$extraGanache --network ganache "
  fi
  # mount code if not running in CI mode
  if [ -z "$CI_JOB_ID" ]; then
    extraDocker="$extraDocker -v $DIR/truffle/contracts:/app/contracts -v $DIR/truffle/migrations:/app/migrations -v $DIR/truffle/test:/app/test -v $DIR/truffle/build:/app/build"
  fi
  if [ -t 1 ] ; then
    extraDocker="$extraDocker -ti"
  fi
  docker rm -f $APPNAME-truffle || true
  docker run $extraDocker \
    --name $APPNAME-truffle \
    $APPNAME-truffle $extraGanache "$@" 
}

# build/deploy the contracts then copy the build folder into the frontend Docker context
function migrate() {
  rm -rf $DIR/frontend/www/build
  truffle migrate
  if [ ! -d "$DIR/truffle/build" ]; then
    docker cp $APPNAME-truffle:/app/build $DIR/truffle/build
  fi
  cp -r $DIR/truffle/build $DIR/frontend/www/build
  docker rm -f $APPNAME-truffle || true
}

function ganache() {
  docker network create $APPNAME-network || true
  docker run -d \
    -p 8545:8545 \
    --net $APPNAME-network \
    --name $APPNAME-ganache \
    --entrypoint "node_modules/.bin/ganache-cli" \
    $APPNAME-truffle -a 10 --debug -d fixed -h 0.0.0.0 "$@"
}

function ganache-logs() {
  docker logs -f $APPNAME-ganache
}

function ganache-stop() {
  docker rm -f $APPNAME-ganache || true
  docker network rm $APPNAME-network || true
}

eval "$@"