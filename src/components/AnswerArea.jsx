import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import ProgressBar from './ProgressBar'
import AnswerPanel from './AnswerPanel'
import AnswerList from './AnswerList'

const AnswerArea = ({ isLoading, answerOptions, onAnswerButtonClick }) => {
  if (isLoading) return <ProgressBar />
  return (
    <div>
      <AnswerPanel />
      <AnswerList />
    </div>
  )
}

AnswerArea.propTypes = {
  isLoading: PropTypes.bool.isRequired
}

export default connect(state => ({
  isLoading: !state.questionStore.answerOptions
}))(AnswerArea)
