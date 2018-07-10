import React from 'react'
import PropTypes from 'prop-types'
import { connectStore } from 'redux-box'
import { withStyles } from '@material-ui/core/styles'

import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'

import Link from 'redux-first-router-link'

const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 2,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  textLink: {
    marginTop: theme.spacing.unit * 3,
  },
})

@connectStore({
  
})
class Help extends React.Component {

  render() {
    const { classes } = this.props

    return (
      <div className={classes.root}>
        <Grid container spacing={24}>
          <Grid item xs={12} sm={6}>
            <Paper className={classes.paper}>
              <Typography variant="body2">
                Help
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            
          </Grid>
        </Grid>
      </div>
    )
  }
}

Help.propTypes = {
  classes: PropTypes.object.isRequired,
}

export default withStyles(styles)(Help)