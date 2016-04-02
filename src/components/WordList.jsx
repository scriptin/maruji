import React, { PropTypes } from 'react'
import Word from './Word'
import { connect } from 'react-redux'
import { QUESTION_TYPE } from '../question'

const WordList = ({ kanji, hide, words }) => (
  <div>
    { words.map((word, idx) => <Word key={idx} word={word} kanji={kanji} hide={hide} />) }
  </div>
)

WordList.propTypes = {
  kanji: PropTypes.string.isRequired,
  hide: PropTypes.bool.isRequired,
  words: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default connect(state => {
  let questionStore = state.questionStore
  return {
    kanji: questionStore.kanji,
    hide: questionStore.type != QUESTION_TYPE.STROKE_ORDER,
    words: questionStore.words
  }
})(WordList)
