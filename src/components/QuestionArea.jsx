import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import WordList from './WordList'
import ProgressBar from './ProgressBar'

const QuestionArea = ({ isLoading, kanji, words }) => {
  if (isLoading) return <ProgressBar />
  return <WordList words={words} hiddenChar={kanji} />
}

QuestionArea.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  kanji: PropTypes.string,
  words: PropTypes.arrayOf(PropTypes.shape({
    w: PropTypes.string.isRequired,
    r: PropTypes.arrayOf(PropTypes.string).isRequired,
    t: PropTypes.arrayOf(PropTypes.shape({
      pos: PropTypes.arrayOf(PropTypes.string).isRequired,
      forKana: PropTypes.arrayOf(PropTypes.string).isRequired,
      gloss: PropTypes.arrayOf(PropTypes.string).isRequired
    })).isRequired
  }))
}

export default connect(state => ({
  isLoading: !state.question.words,
  kanji: state.question.kanji,
  words: state.question.words
}))(QuestionArea)
