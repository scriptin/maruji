import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import KanjiButton from './KanjiButton'
import { giveAnswer } from '../actions'

require('../styles/answer-list.less')

const AnswerList = ({ answerOptions, onAnswerButtonClick }) => (
  <ol className="answer-list list-unstyled">
    { answerOptions.map((opt, idx) =>
      <li key={idx}>
        <KanjiButton
          answerId={opt.answerId}
          answered={opt.answered}
          correct={opt.correct}
          active={opt.active}
          svg={opt.svg}
          onAnswerButtonClick={onAnswerButtonClick}
        />
      </li>
    ) }
  </ol>
)

AnswerList.propTypes = {
  answerOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAnswerButtonClick: PropTypes.func.isRequired
}

export default connect(
  state => ({
    answerOptions: state.question.answerOptions
  }),
  dispatch => ({
    onAnswerButtonClick: answerId => dispatch(giveAnswer(answerId))
  })
)(AnswerList)
