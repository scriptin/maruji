import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import AnswerButton from './AnswerButton'

function displayAnswers(isLoading, possibleAnswers) {
  if ( ! isLoading) {
    return (
      <div className="btn-group" role="group">
        { possibleAnswers.map((answer, idx) => <AnswerButton key={idx} text={answer} />) }
      </div>
    )
  }
}

const AnswerArea = ({ isLoading, possibleAnswers }) => (
  <div className="container">
    <div className="row">
      <div className="col-md-12">
        { displayAnswers(isLoading, possibleAnswers) }
      </div>
    </div>
  </div>
)

AnswerArea.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  possibleAnswers: PropTypes.arrayOf(PropTypes.string)
}

export default connect(state => ({
  isLoading: !state.question,
  possibleAnswers: state.question ? state.question.possibleAnswers: null
}))(AnswerArea)
