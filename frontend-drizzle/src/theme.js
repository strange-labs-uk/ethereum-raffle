import React from 'react'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import blue from '@material-ui/core/colors/blue'
import CssBaseline from '@material-ui/core/CssBaseline'

const theme = createMuiTheme({
  palette: {
    primary: {
      light: '#8241B7',
      main: '#5C1B91',
      dark: '#36006B',
    },
    /*
    secondary: {
      light: green[300],
      main: green[500],
      dark: green[700],
    },*/
  },
})

function Theme(props) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      { props.children }
    </MuiThemeProvider>
  );
}

export default Theme