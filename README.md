# Ethereum Lottery

You need:

 * [docker](https://docs.docker.com/install/)

```bash
git clone https://github.com/strange-labs-uk/ethereum-lottery
cd ethereum-lottery
bash docker.sh build
```

## test contracts

To get a truffle develop environment with mounted code:

```bash
bash docker.sh develop
truffle(develop)> compile
truffle(develop)> migrate
truffle(develop)> test
```

## start blockchain

To start a ganache-cli server that our frontend can connect to:

```bash
bash docker.sh ganache-start
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

#### hot-reloading for templatestack

The frontend uses some stuff from [templatestack](https://github.com/binocarlos/templatestack).

When developing the frontend - it's useful to have hot-reloading for this code too.  After having done `git clone https://github.com/binocarlos/templatestack` - run the following:

```bash
export LINK_TEMPLATESTACK=1
bash docker.sh frontend
```

#### CI testing

The `.gitlab-ci.yml` file works differently in that it:

 * starts a blockchain server (Ganache)
 * runs 

[Ganache](https://github.com/trufflesuite/ganache-cli/) gives us a test blockchain to work with:

```bash
bash docker.sh ganache
```

This gives us a test blockchain that behaves just like `truffle develop`