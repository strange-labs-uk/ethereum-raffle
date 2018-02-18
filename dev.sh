#!/usr/bin/env bash
set -euxo pipefail

export DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export APPNAME=${APPNAME:="lottery"}

function install() {
  docker network create lottery
}

function build() {
  docker build -t $APPNAME-frontend frontend
  docker build -t $APPNAME-truffle truffle
  docker build -t $APPNAME-bot bot
}

eval "$@"
