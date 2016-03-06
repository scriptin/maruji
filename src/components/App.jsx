import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

function App({ isLoading, status }) {
  return (
    <div className="container">
      <div className="row">
        <div className="col-md-12">
          { isLoading ? 'Loading...' : status }
        </div>
      </div>
    </div>
  )
}

App.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  status: PropTypes.string.isRequired
}

function mapStateToProps(state) {
  return {
    isLoading: state.isLoading,
    status: state.lastError ? '' + state.lastError : 'Done!'
  }
}

export default connect(mapStateToProps)(App)
