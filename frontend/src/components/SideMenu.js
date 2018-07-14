import React from 'react'

import PropTypes from 'prop-types'
import { connectStore } from 'redux-box'
import { withStyles } from '@material-ui/core/styles'

import SwipeableDrawer from '@material-ui/core/SwipeableDrawer'
import IconButton from '@material-ui/core/IconButton'

import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'

import AccountCircle from '@material-ui/icons/AccountCircle'
import MenuIcon from '@material-ui/icons/Menu'

import settings from '../settings'
import withRouter from '../utils/withRouter'

const styles = (theme) => ({
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
  list: {
    width: 250,
  },
})

@connectStore({
  
})
@withRouter()
class SideMenu extends React.Component {
  state = {
    drawerOpen: false,
  }

  handleOpen = event => {
    this.setState({ drawerOpen: true })
  }

  handleClose = () => {
    this.setState({ drawerOpen: false })
  }

  openPage = (url) => {
    this.handleClose()
    this.props.routerPush(url)
  }


  logout() {
    this.props.routerExternal(settings.logout)
  }

  getMenu() {
    const { } = this.props
    return [
      <ListItem button key='raffle' onClick={ () => this.openPage('PAGE_RAFFLE') }>
        <ListItemText primary="Raffle" />
      </ListItem>,
      <ListItem button key='value' onClick={ () => this.openPage('PAGE_VALUE') }>
        <ListItemText primary="Key Values" />
      </ListItem>,
      <ListItem button key='help' onClick={ () => this.openPage('PAGE_HELP') }>
        <ListItemText primary="Help" />
      </ListItem>,
    ]
  }

  render() {
    const { classes } = this.props
    const { drawerOpen } = this.state

    return (
      <div>
        <IconButton 
          className={classes.menuButton} 
          color="inherit" 
          aria-label="Menu" 
          onClick={this.handleOpen}
        >
          <MenuIcon />
        </IconButton>
        <SwipeableDrawer
          open={ drawerOpen }
          onClose={ this.handleClose }
          onOpen={ this.handleOpen }
        >
          <div
            tabIndex={0}
            role="button"
            onClick={ this.handleClose }
            onKeyDown={ this.handleClose }
          >
            <div className={classes.list}>
              <List component="nav">
                { this.getMenu() }
              </List>
            </div>
          </div>
        </SwipeableDrawer>
      </div>
    )
  }
}

SideMenu.propTypes = {
  classes: PropTypes.object.isRequired,
}

export default withStyles(styles)(SideMenu)