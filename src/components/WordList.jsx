import React, { PropTypes } from 'react'
import Word from './Word'
import { connect } from 'react-redux'
import { QUESTION_TYPE } from '../question'
import { giveAnswer } from '../actions'

const WordList = ({
  showSelectButton, hide, words,
  onSelectButtonClick
}) => (
  <div>
    { words.map((word, idx) =>
      <Word key={idx} word={word} hide={hide}
        showSelectButton={showSelectButton}
        onSelectButtonClick={onSelectButtonClick} />
    ) }
  </div>
)

WordList.propTypes = {
  showSelectButton: PropTypes.bool.isRequired,
  hide: PropTypes.bool.isRequired,
  words: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default connect(
  state => {
    let questionStore = state.questionStore
    return {
      showSelectButton: questionStore.type == QUESTION_TYPE.MATCHING_VOCAB,
      hide: questionStore.type != QUESTION_TYPE.STROKE_ORDER,
      words: questionStore.words
    }
  },
  dispatch => ({
    onSelectButtonClick: answerId => dispatch(giveAnswer(answerId))
  })
)(WordList)
