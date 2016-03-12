import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import WordList from './WordList'
import ProgressBar from './ProgressBar'

const QuestionArea = ({ isLoading, question }) => {
  if (isLoading) return <ProgressBar />
  return <WordList words={question.words} hiddenChar={question.kanji} />
}

QuestionArea.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  question: PropTypes.shape({
    kanji: PropTypes.string.isRequired,
    words: PropTypes.arrayOf(PropTypes.shape({
      w: PropTypes.string.isRequired,
      r: PropTypes.arrayOf(PropTypes.string).isRequired,
      t: PropTypes.arrayOf(PropTypes.shape({
        pos: PropTypes.arrayOf(PropTypes.string).isRequired,
        forKana: PropTypes.arrayOf(PropTypes.string).isRequired,
        gloss: PropTypes.arrayOf(PropTypes.string).isRequired
      })).isRequired
    })).isRequired
  })
}

export default connect(state => ({
  isLoading: !state.question.question,
  question: state.question.question
}))(QuestionArea)
