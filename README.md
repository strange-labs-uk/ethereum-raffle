# Ethereum HashKeyRaffle Demo

## setup

First install [nodejs and
npm](https://docs.npmjs.com/getting-started/installing-node).

```bash
$ node --version
v9.11.1
```

Then install dependencies:

```bash
npm install
(cd frontend && npm install)
```

## using ganache and truffle to compile and run tests

First - you need a development server in one window:

```bash
npm run ganache
```

Then in another window, you can run test:

```bash
npm run test
```

To deploy a contract to the blockchain after tests have passed:

```bash
npm run compile
npm run migrate
```

You can enter development console mode (previously `truffle develop`):

```bash
npm run console
```

## run frontend

To run the frontend in hot reloading mode:

```bash
(cd frontend && npm run watch)
```

Then open your browser to [http://localhost:1234](http://localhost:1234)
