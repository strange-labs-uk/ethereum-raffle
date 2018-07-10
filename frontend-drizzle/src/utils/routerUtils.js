import { call, put, select } from 'redux-saga/effects'

const routerUtils = {
  push: (type, payload) => ({
    type,
    payload
  }),
  getRoute: (routerProps) => routerProps.routesMap[routerProps.type],
}

export default routerUtils