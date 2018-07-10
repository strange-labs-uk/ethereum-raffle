import { connect } from 'react-redux'
import utils from './routerUtils'

const withRouter = () => {
  return connect(
    state => {
      const routerProps = state.location
      const currentRoute = routerProps.routesMap[routerProps.type]
      return {
        router: routerProps,
        currentRoute,
      }
    },
    dispatch => ({
      routerPush: url => dispatch(utils.push(url)),
      routerExternal: url => document.location = url,
    })
  )
}

export default withRouter