import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import SvgButton from './SvgButton'
import ProgressBar from './ProgressBar'
import * as util from '../util'
import * as svgUtil from '../svg'

require('../styles/kanji-svg.less')

const AnswerArea = ({ isLoading, answerOptions }) => {
  if (isLoading) return <ProgressBar />
  return (
    <div>
      { answerOptions.map((opt, idx) =>
        <SvgButton key={idx} svg={svgUtil.postprocess(opt.svg, 80)} />
      ) }
    </div>
  )
}

AnswerArea.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  answerOptions: PropTypes.arrayOf(PropTypes.object)
}

export default connect(state => ({
  isLoading: !state.question.answerOptions,
  answerOptions: state.question.answerOptions
}))(AnswerArea)
