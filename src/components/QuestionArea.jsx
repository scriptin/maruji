import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import WordList from './WordList'

function displayQuestion(isLoading, question) {
  if (isLoading) return (
    <div className="progress">
      <div className="progress-bar progress-bar-striped active" role="progressbar"
        aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"
        style={{width: '100%'}}>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
  return <WordList words={question.words} hiddenChar={question.kanji} />
}

const QuestionArea = ({ isLoading, question }) => (
  <div className="container">
    { displayQuestion(isLoading, question) }
  </div>
)

QuestionArea.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  question: PropTypes.shape({
    kanji: PropTypes.string.isRequired,
    possibleAnswers: PropTypes.arrayOf(PropTypes.string).isRequired,
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
  isLoading: !state.question,
  question: state.question
}))(QuestionArea)
