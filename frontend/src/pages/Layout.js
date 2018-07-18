import React from 'react'
import PropTypes from 'prop-types'
import { connectStore } from 'redux-box'
import { withStyles } from '@material-ui/core/styles'

import Snackbar from '@material-ui/core/Snackbar'

import snackbarModule from '../store/snackbar'

import AppBar from '../components/AppBar'

import backgroundImage from '../img/background-min.png'

const styles = theme => ({
  root: {
    height: '100%',
    backgroundImage: `url(${backgroundImage})`,
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    height: '100%'
  },
  mainContent: {
    
  }
})

@connectStore({
  snackbar: snackbarModule,
})
class Layout extends React.Component {

  render() {
    const { classes, snackbar } = this.props

    return (
      <div className={ classes.root }>
        <AppBar />
        <div>
          <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={ snackbar.isOpen }
            autoHideDuration={3000}
            onClose={ snackbar.close }
            message={ <span id="message-id">{ snackbar.message }</span> }
          />
        </div>
        <div className={ classes.mainContent }>
          { this.props.children }
        </div>
      </div>
    )
  }
}

Layout.propTypes = {
  classes: PropTypes.object.isRequired,
}

export default withStyles(styles)(Layout)