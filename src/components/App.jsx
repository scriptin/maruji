import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

function App({ status }) {
  return (
    <div className="container">
      <div className="row">
        <div className="col-md-12">
          { status }
        </div>
      </div>
    </div>
  )
}

App.propTypes = {
  status: PropTypes.string.isRequired
}

function mapStateToProps(state) {
  return {
    status: state.isLoading
      ? 'Loading...'
      : (state.lastError === null)
        ? 'Done!'
        : 'Last error: ' + state.lastError
  }
}

export default connect(mapStateToProps)(App)
