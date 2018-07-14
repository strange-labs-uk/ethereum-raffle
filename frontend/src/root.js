import { hot } from 'react-hot-loader'
import React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import store from './store'
import Theme from './theme'
import Router from './router'
import { DrizzleProvider } from 'drizzle-react'
import drizzleOptions from './drizzleOptions'

class Root extends React.Component {
  render() {
    return (
      <Provider store={ store }>
        <DrizzleProvider options={drizzleOptions} store={store}>
          <Theme>
            <Router />
          </Theme>
        </DrizzleProvider>
      </Provider>
    );
  }
}

export default hot(module)(Root)