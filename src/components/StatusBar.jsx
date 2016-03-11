import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import Alert from './Alert'
import { isLoading, errors } from '../getters'

const StatusBar = ({ isLoading, errors }) => {
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

StatusBar.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  errors: PropTypes.arrayOf(PropTypes.string).isRequired
}

export default connect(state => ({
  isLoading: isLoading(state),
  errors: errors(state)
}))(StatusBar)
