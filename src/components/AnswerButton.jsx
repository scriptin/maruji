import React, { PropTypes } from 'react'

const AnswerButton = ({ text }) => (
  <button className="btn btn-primary btn-lg">
    { text }
  </button>
)

AnswerButton.propTypes = {
  text: PropTypes.string.isRequired
}

export default AnswerButton
