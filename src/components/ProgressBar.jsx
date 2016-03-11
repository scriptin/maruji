import React from 'react'

const ProgressBar = () => (
  <div className="progress">
    <div className="progress-bar progress-bar-striped active" role="progressbar"
      aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"
      style={{width: '100%'}}>
      <span className="sr-only">Loading...</span>
    </div>
  </div>
)

export default ProgressBar
