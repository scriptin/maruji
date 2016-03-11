import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import AnswerButton from './AnswerButton'
import ProgressBar from './ProgressBar'

const AnswerArea = ({ isLoading, possibleAnswers }) => {
  if (isLoading) return <ProgressBar />
  return (
    <div className="btn-group" role="group">
      { possibleAnswers.map((answer, idx) => <AnswerButton key={idx} text={answer} />) }
    </div>
  )
}

AnswerArea.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  possibleAnswers: PropTypes.arrayOf(PropTypes.string)
}

export default connect(state => ({
  isLoading: !state.question,
  possibleAnswers: state.question ? state.question.possibleAnswers: null
}))(AnswerArea)
