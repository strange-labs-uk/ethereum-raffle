import React, { Component, PropTypes } from 'react'

import UserWrapper from 'template-ui/lib/containers/UserWrapper'
import RouteFactory from 'template-ui/lib/containers/Route'

import { processRoutes } from 'template-ui/lib/plugins2/router/tools'

import Section from 'template-ui/lib/components/Section'

import config from './config'

import Application from './containers/Application'
import Home from './components/Home'

import selectors from './selectors'

const Route = RouteFactory(config.basepath)

export const routeConfig = processRoutes({
  '': {
    hooks: []
  },
  '/': {
    hooks: []
  },
  '/help': {
    hooks: []
  },
  '/about': {
    hooks: []
  },
}, config.basepath)

export const redirects = {
  
}

export const routes = (
  <Application>
    <Route home>
      <Section>
        <Home />
      </Section>
    </Route>

    <Route path='/help'>
      <Section>
        <div>Help</div>
      </Section>
    </Route>

    <Route path='/about'>
      <Section>
        <div>About</div>
      </Section>
    </Route>
  </Application>
)
