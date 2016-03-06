import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

const StatusType = {
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
}

function stateToStatus(state) {
  if (state.isLoading) return StatusType.LOADING
  return (state.lastError == null) ? StatusType.SUCCESS : StatusType.ERROR
}

function toAlert(status, lastError) {
  switch (status) {
    case StatusType.LOADING:
      return { alertClass: 'alert-info', alertText: 'Loading kanji definitions...' }
    case StatusType.ERROR:
      return { alertClass: 'alert-danger', alertText: lastError }
    case StatusType.SUCCESS:
      return { alertClass: 'alert-success', alertText: 'Kanji definitions are loaded successfully' }
    default:
      throw Error('Unexpected status: ' + status)
  }
}

const StatusBar = ({ status, lastError }) => {
  let { alertClass, alertText } = toAlert(status, lastError)
  return (
    <div className="container">
      <div className="row">
        <div className="col-md-12">
          <div className={'alert ' + alertClass} role="alert">
            { alertText }
          </div>
        </div>
      </div>
    </div>
  )
}

StatusBar.propTypes = {
  status: PropTypes.string.isRequired,
  lastError: PropTypes.string
}

export default connect(state => ({
  status: stateToStatus(state),
  lastError: state.lastError
}))(StatusBar)
