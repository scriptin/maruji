import React, { PropTypes } from 'react'
import Word from './Word'
import { connect } from 'react-redux'

const WordList = ({ words, kanji }) => (
  <div>
    { words.map((word, idx) =>
      <Word key={idx} num={idx + 1} word={word} kanji={kanji} />
    ) }
  </div>
)

WordList.propTypes = {
  kanji: PropTypes.string.isRequired,
  words: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default connect(state => {
  let questionStore = state.questionStore
  return {
    kanji: questionStore.kanji,
    words: questionStore.words
  }
})(WordList)
