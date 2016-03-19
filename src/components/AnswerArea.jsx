import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import SvgButton from './SvgButton'
import ProgressBar from './ProgressBar'
import * as util from '../util'
import { giveAnswer } from '../actions'

require('../styles/kanji-svg.less')

const AnswerArea = ({ isLoading, answerOptions, onAnswerButtonClick }) => {
  if (isLoading) return <ProgressBar />
  return (
    <div>
      { answerOptions.map((opt, idx) =>
        <SvgButton
          key={idx}
          answerId={opt.answerId}
          answered={opt.answered}
          correct={opt.correct}
          active={opt.active}
          svg={opt.svg}
          onAnswerButtonClick={onAnswerButtonClick}
        />
      ) }
    </div>
  )
}

AnswerArea.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  answerOptions: PropTypes.arrayOf(PropTypes.object)
}

export default connect(
  state => ({
    isLoading: !state.question.answerOptions,
    answerOptions: state.question.answerOptions
  }),
  dispatch => ({
    onAnswerButtonClick: answerId => dispatch(giveAnswer(answerId))
  })
)(AnswerArea)
