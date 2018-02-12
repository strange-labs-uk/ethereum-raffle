import React from 'react'
import { render } from 'react-dom'
import { routerForBrowser } from 'redux-little-router'
import RootFactory from 'template-ui/lib/containers/Root'
import configureStore from 'template-ui/lib/store/configureStore'
import rootSaga from './sagas'
import { routeConfig, routes } from './routes'
import reducers from './reducers'

const router = routerForBrowser({
  routes: routeConfig
})

const Root = RootFactory(routes)

const store = configureStore({
  router,
  reducers,
  initialState: window.__INITIAL_STATE__
})

store.runSaga(rootSaga)

render(
  <Root 
    store={ store }
  />,
  document.getElementById('mount')
)
