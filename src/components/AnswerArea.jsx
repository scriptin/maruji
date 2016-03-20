import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import ProgressBar from './ProgressBar'
import AnswerPanel from './AnswerPanel'
import AnswerOptionList from './AnswerOptionList'

const AnswerArea = ({ isLoading, answerOptions, onAnswerButtonClick }) => {
  if (isLoading) return <ProgressBar />
  return (
    <div>
      <AnswerPanel />
      <AnswerOptionList />
    </div>
  )
}

AnswerArea.propTypes = {
  isLoading: PropTypes.bool.isRequired
}

export default connect(state => ({
  isLoading: state.questionStore.isLoading
}))(AnswerArea)
