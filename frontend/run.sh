#!/bin/bash -e

set -e

export DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -n "${MANUALRUN}" ]; then
  echo "entering manual run mode"
  sleep 10000000
else
  npm run watch
fi