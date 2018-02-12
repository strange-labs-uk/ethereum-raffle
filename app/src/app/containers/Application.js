import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'

import config from '../config'
import actions from '../actions'
import selectors from '../selectors'

import Application from '../components/Application'

class ApplicationContainer extends Component {
  render() {
    return (
      <Application {...this.props} />
    )
  }
}

export default connect(
  (state, ownProps) => {
    const menuOptions = config.menu.normal()
    const manualScroll = selectors.system.manualScroll(state)
    const menuOpen = selectors.system.menuOpen(state)
    return {
      title: config.title,
      menuOpen,
      menuOptions,
      bodyScroll: manualScroll ? true : false,
      initialized: selectors.system.initialized(state),
      snackbar: selectors.system.message(state)
    }
  },
  (dispatch) => {
    return {
      toggleMenu: () => dispatch(actions.system.toggleMenu()),
      onMenuClick: (id) => {
        dispatch(actions.system.setMenu(false))
        dispatch(actions.router.redirect(id))
      },
      onOptionClick: (id) => {
        dispatch(actions.router.redirect(id))
      },
      clearSnackbar: () => {
        dispatch(actions.system.message(''))
      }
    }
  }
)(ApplicationContainer)