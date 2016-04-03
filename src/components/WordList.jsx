import React, { PropTypes } from 'react'
import Word from './Word'
import { connect } from 'react-redux'
import { QUESTION_TYPE } from '../question'

const WordList = ({ hide, words }) => (
  <div>
    { words.map((word, idx) => <Word key={idx} word={word} hide={hide} />) }
  </div>
)

WordList.propTypes = {
  hide: PropTypes.bool.isRequired,
  words: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default connect(state => {
  let questionStore = state.questionStore
  return {
    hide: questionStore.type != QUESTION_TYPE.STROKE_ORDER,
    words: questionStore.words
  }
})(WordList)
