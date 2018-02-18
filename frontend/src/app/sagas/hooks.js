import { take, put, call, fork, select, all, takeLatest, takeEvery } from 'redux-saga/effects'

import { 
  getRouteInfoHooks,
  authenticateRoute
} from 'template-ui/lib/plugins2/router/tools'

import consoleTools from 'template-ui/lib/utils/console'

import FormSagas from 'template-ui/lib/plugins2/form/sagas'
import systemSagas from 'template-ui/lib/plugins2/system/sagas'

import config from '../config'
import actions from '../actions'
import selectors from '../selectors'

import { redirects } from '../routes'

const redirectorHook = (name) => {
  const redirectFunction = redirects[name]
  function* doRedirect(payload) {
    const state = yield select(state => state)
    yield put(actions.router.redirect(redirectFunction(payload, state)))
  }

  return doRedirect
}

const Hooks = (opts = {}) => {

  const form = FormSagas()

  const hooks = {
    
    // system sagas
    message: systemSagas.message,

    // form sagas
    formList: form.list,
    formItem: form.item,
    formSearchItem: form.searchItem,

  }

  function* initialize() {
    console.log(`initialising`)
  }

  return {
    hooks,
    initialize,
    getHook: (name) => hooks[name],
    getRouteHooks: (routeInfo, mode = 'enter') => {
      const routeInfoHooks = getRouteInfoHooks(routeInfo, mode)
      return routeInfoHooks
    }
    
  }
}

export default Hooks