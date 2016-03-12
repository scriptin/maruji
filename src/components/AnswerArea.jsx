import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import SvgButton from './SvgButton'
import ProgressBar from './ProgressBar'
import * as util from '../util'

const preprocessSvg = (svg, size) => {
  svg.attr({ width: size, height: size })
  svg.find('> g:nth-child(2)').remove() // remove stroke numbers
  return svg
}

const AnswerArea = ({ isLoading, possibleAnswers }) => {
  if (isLoading) return <ProgressBar />
  return (
    <div>
      { _.keys(possibleAnswers).map((kanji, idx) =>
        <SvgButton key={idx} svg={preprocessSvg(possibleAnswers[kanji], 80)} />
      ) }
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
