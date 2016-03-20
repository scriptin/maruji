import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import Alert from './Alert'

const ErrorAlert = ({ errors }) => (
  <Alert alertClass={ 'danger' + (errors.length > 0 ? '' : ' hidden') }>
    <strong>Errors:</strong>
    { ' ' + errors.join('; ') }
  </Alert>
)

ErrorAlert.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.string).isRequired
}

export default connect(state => ({
  errors: state.errorStore.errors
}))(ErrorAlert)
