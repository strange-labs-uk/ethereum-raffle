import { take, put, call, fork, select, all, takeLatest, takeEvery } from 'redux-saga/effects'
import { delay } from 'redux-saga'

import RouterSaga from 'template-ui/lib/plugins2/router/saga'

import actions from '../actions'

import config from '../config'
import Hooks from './hooks'
import Web3 from './web3'

const web3 = Web3({
  
})

const hooks = Hooks({
  
})

const router = RouterSaga({
  getHook: hooks.getHook,
  getRouteHooks: hooks.getRouteHooks,
  getRoute: (path) => config.basepath + path
})

function* initialize() {
  yield call(web3.initialize)
  yield call(hooks.initialize)
  yield fork(router.initialize)
  yield put(actions.system.initialized())
}

export default function* root() {
  yield fork(initialize)
}