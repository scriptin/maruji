import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import Alert from './Alert'

function buildAlert(isLoading, errors) {
  let alertClass = (errors.length > 0) ? 'danger' : isLoading ? 'info' : 'success'
  let contents
  if (errors.length > 0) {
    contents = <p>
      <strong>Errors:</strong>
      { ' ' + errors.join('; ') }
    </p>
  } else if (isLoading) {
    contents = <p>Loading...</p>
  } else {
    contents = <p>Ready!</p>
  }
  return <Alert alertClass={ alertClass }> { contents } </Alert>
}

const StatusBar = ({ isLoading, errors }) => (
  <div className="container">
    <div className="row">
      <div className="col-md-12">
        { buildAlert(isLoading, errors) }
      </div>
    </div>
  </div>
)

StatusBar.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  errors: PropTypes.arrayOf(PropTypes.string).isRequired
}

export default connect(state => ({
  isLoading: state.defs.isLoading || state.list.isLoading,
  errors: _.map(state, s => s.lastError).filter(e => e != null)
}))(StatusBar)
