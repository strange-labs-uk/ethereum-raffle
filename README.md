# Ethereum HashKeyRaffle Demo

## setup

First install [nodejs and npm](https://docs.npmjs.com/getting-started/installing-node)

```bash
$ node --version
v8.9.4
```

Then install dependencies:

```bash
npm install
(cd frontend && npm install)
```

## using truffle to compile and run tests

First - you need a development server in one window:

```bash
npm run develop
```

Then in another window:

```bash
npm run compile
npm run migrate
npm run test
```

## run frontend

To run the frontend in hot reloading mode:

```bash
cd frontend
npm run watch
```

Then open your browser to [http://localhost:1234](http://localhost:1234)