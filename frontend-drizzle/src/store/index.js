import { compose, applyMiddleware } from 'redux';
import { createStore } from 'redux-box'
import { fork, all, call, put } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import { reducer as formReducer }  from 'redux-form'
import { connectRoutes } from 'redux-first-router'
import createHistory from 'history/createBrowserHistory'
import { 
  drizzleReducers,
  drizzleSagas,
  generateContractsInitialState,
} from 'drizzle'

import drizzleOptions from '../drizzleOptions'
import { routes } from '../router'
import snackbar from './snackbar'
import storage from './storage'
import raffle from './raffle'

const history = createHistory()
const router = connectRoutes(history, routes) 

const modules = [
  snackbar,
  storage,
  raffle,
]

const drizzleSagaRoot = function*() {
  yield all(
    drizzleSagas.map(saga => fork(saga))
  )
}

const config = {
  preloadedState: {
    contracts: generateContractsInitialState(drizzleOptions)
  },
  reducers : {
    form : formReducer,
    location: router.reducer,
    ...drizzleReducers,
  },
  middlewares: [router.middleware],
  sagas: [call(drizzleSagaRoot)],
  composeRedux: (composer) => (middleware) => composer(router.enhancer, middleware),
}

export default createStore(modules, config)