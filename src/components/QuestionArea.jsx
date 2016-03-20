import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import WordList from './WordList'
import ProgressBar from './ProgressBar'

const QuestionArea = ({ isLoading }) => isLoading ? <ProgressBar /> : <WordList />

QuestionArea.propTypes = {
  isLoading: PropTypes.bool.isRequired
}

export default connect(state => ({
  isLoading: state.questionStore.isLoading
}))(QuestionArea)
