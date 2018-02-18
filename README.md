# Ethereum Lottery

You need:

 * [docker](https://docs.docker.com/install/)

```bash
git clone https://github.com/strange-labs-uk/ethereum-lottery
cd ethereum-lottery
bash docker.sh build
```

#### start blockchain

[Ganache](https://github.com/trufflesuite/ganache-cli/) gives us a test blockchain to work with:

```bash
bash docker.sh ganache
bash docker.sh ganache-logs
```

#### migrate contracts

```bash
bash docker.sh migrate
```

This will copy the compiled contracts to `frontend/www/build` ready for the frontend build.


#### start frontend

```bash
bash docker.sh frontend
```

You can now view the frontend on [http://127.0.0.1:8080](http://127.0.0.1:8080)

#### test

```bash
bash docker.sh truffle test
```

If you want to run your tests faster - you can use `truffle develop`:

```bash
export LOCAL_TRUFFLE=1
bash docker.sh truffle develop
truffle(develop)> compile
truffle(develop)> migrate
truffle(develop)> test
```

#### hot-reloading for templatestack

The frontend uses some stuff from [templatestack](https://github.com/binocarlos/templatestack).

When developing the frontend - it's useful to have hot-reloading for this code too.  After having done `git clone https://github.com/binocarlos/templatestack` - run the following:

```bash
export LINK_TEMPLATESTACK=1
bash docker.sh frontend
```
