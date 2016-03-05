import React from 'react'
import { connect } from 'react-redux'

const App = React.createClass({
  render: () => {
    return <div>Hello world</div>
  }
})

export default connect()(App)
