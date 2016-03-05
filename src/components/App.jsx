import React from 'react'
import { connect } from 'react-redux'

const App = React.createClass({
  render: () => {
    return <div className="container">
      <div className="row">
        <div className="col-md-12">
          <span className="glyphicon glyphicon-star" aria-hidden="true"></span>
          Hello world
        </div>
      </div>
    </div>
  }
})

export default connect()(App)
