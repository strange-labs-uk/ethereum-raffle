import React from 'react'

import PropTypes from 'prop-types'
import { connectStore } from 'redux-box'
import { withStyles } from '@material-ui/core/styles'

import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'

import settings from '../settings'

import SideMenu from './SideMenu'

const styles = {
  root: {
    flexGrow: 1,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  toolbar: {
    backgroundColor: 'transparent',
    boxShadow: 'none',
  }
}

class AppBarComponent extends React.Component {
  render() {
    const { classes } = this.props

    return (
      <div className={classes.root}>
        <AppBar position="static" className={classes.toolbar}>
          <Toolbar>
            <SideMenu />
            <Typography variant="title" color="inherit" className={classes.flex}>
              { settings.title }
            </Typography>
          </Toolbar>
        </AppBar>
      </div>
    )
  }
}

AppBarComponent.propTypes = {
  classes: PropTypes.object.isRequired,
}

export default withStyles(styles)(AppBarComponent)