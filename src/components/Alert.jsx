import React, { PropTypes } from 'react'

const Alert = ({ alertClass, children }) => (
  <div className={'alert alert-' + alertClass} role="alert">
    { children }
  </div>
)

Alert.propTypes = {
  alertClass: PropTypes.string.isRequired
}

export default Alert
