import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import SvgButton from './SvgButton'
import ProgressBar from './ProgressBar'
import * as util from '../util'

const AnswerArea = ({ isLoading, possibleAnswers }) => {
  if (isLoading) return <ProgressBar />
  return (
    <div>
      { _.keys(possibleAnswers).map((kanji, idx) => {
        let code = util.kanjiCode(kanji)
        return <SvgButton key={idx} code={code} svg={possibleAnswers[kanji]} />
      }) }
    </div>
  )
}

AnswerArea.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  possibleAnswers: PropTypes.object
}

export default connect(state => ({
  isLoading: !state.question.question,
  possibleAnswers: state.question.question ? state.question.question.possibleAnswers: null
}))(AnswerArea)
