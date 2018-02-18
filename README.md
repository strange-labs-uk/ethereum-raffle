# Ethereum Lottery

```bash
git clone https://github.com/strange-labs-uk/ethereum-lottery
cd ethereum-lottery
```

## Docker Setup for CI

This setup is best suited for running non-interactive automated tests (like in CI).

You need:

 * [docker](https://docs.docker.com/install/)

#### install

```bash
bash docker.sh build
```

#### start ganache

[Ganache](https://github.com/trufflesuite/ganache-cli/) gives us a test blockchain to work with:

```bash
bash docker.sh ganache
```

If you want to follow the logs - `docker logs -f ganache` and open another terminal window.

#### truffle

```bash
bash docker.sh truffle compile
bash docker.sh truffle migrate
bash docker.sh truffle test
```

You can also run truffle from your host e.g. `truffle compile` - this will use the `development network` and connect to the ganache server.

## start frontend

```bash
bash docker.sh frontend
```

You can now view the frontend on [http://127.0.0.1:8080](http://127.0.0.1:8080)

If you want to follow the logs - `docker logs -f frontend` and open another terminal window.

#### stop

```bash
docker rm -f frontend ganache
```

## Local truffle

If you want to run your tests faster - you can use `truffle develop`:

```bash
export LOCAL_TRUFFLE=1
bash docker.sh truffle develop
truffle(develop)> compile
truffle(develop)> migrate
truffle(develop)> test
```


You need:

 * [node.js](https://nodejs.org/en/download/)

#### install

```bash
(cd truffle && yarn install)
```

This will install the various node.js modules each section needs.

#### truffle

To compile, migrate and test the contracts:

```bash
cd truffle
truffle develop
> compile
> migrate
> test
```

## tips

#### truffle develop

To run tests a bit faster but interactively:

```bash

```


#### hot-reloading for templatestack

The frontend uses some stuff from [templatestack](https://github.com/binocarlos/templatestack).

When developing the frontend - it's useful to have hot-reloading for this code too.  After having done `git clone https://github.com/binocarlos/templatestack` - run the following:

```bash
export LINK_TEMPLATESTACK=1
bash docker.sh frontend
```
