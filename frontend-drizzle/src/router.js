import React from 'react'

import Layout from './pages/Layout'
import Storage from './pages/Storage'
import Help from './pages/Help'
import Web3Wrapper from './pages/Web3Wrapper'

import withRouter from './utils/withRouter'

export const routes = {
  'PAGE_VALUE': {
    path: '/',
    component: Storage
  },
  'PAGE_HELP': {
    path: '/help',
    component: Help
  },
}

const NotFound = () => (
  <div>not found</div>
)

@withRouter()
class AppRouter extends React.Component {
  render() {
    const pageName = this.props.router.type
    const Page = routes[pageName] ? routes[pageName].component : NotFound
    return (
      <Layout>
        <Web3Wrapper>
          <Page />
        </Web3Wrapper>
      </Layout>
    )
  }
}

export default AppRouter