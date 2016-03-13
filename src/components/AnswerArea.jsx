import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import SvgButton from './SvgButton'
import ProgressBar from './ProgressBar'
import * as util from '../util'

require('../styles/kanji-svg.less')

const buildFrame = (width, height) => {
  let w = width - 1
  let h = height - 1
  let rect = '<rect x="0.5" y="0.5" width="' + w +'" height="' + h + '"/>'
  let diag1 = '<path d="M0.5,0.5L' + w + ',' + h + '"/>'
  let diag2 = '<path d="M0.5,' + h + 'L' + w + ',0.5"/>'
  return $('<g class="frame">' + rect + diag1 + diag2 + '</g>')
}

const preprocessSvg = (svg, size) => {
  // remove stroke numbers:
  svg.find('> g:nth-child(2)').remove()
  // remove inline styles from strokes, add a class instead:
  svg.find('> g').removeAttr('style').addClass('strokes')
  // add frame:
  svg.prepend(buildFrame(svg.attr('width'), svg.attr('height')))
  // set class and adjust attributes of a root element:
  svg.addClass('kanji-svg').attr({ width: size, height: size })
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
