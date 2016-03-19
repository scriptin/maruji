import React, { PropTypes } from 'react'
import $ from 'jquery'
import SvgPanel from './SvgPanel'

require('../styles/btn-kanji.less')

const SvgButton = ({ svg, answerId, answered, correct, active, onAnswerButtonClick }) => {
  let stateClass = 'btn-' + (answered ? (correct ? 'success' : 'danger') : 'default')
  let clickHandler = () => onAnswerButtonClick(answerId)
  return (
    <button className={'btn btn-kanji ' + stateClass} disabled={ ! active} onClick={clickHandler}>
      <SvgPanel svg={svg} />
    </button>
  )
}

SvgButton.propTypes = {
  svg: PropTypes.object.isRequired,
  answerId: PropTypes.number.isRequired,
  answered: PropTypes.bool.isRequired,
  correct: PropTypes.bool.isRequired,
  active: PropTypes.bool.isRequired,
  onAnswerButtonClick: PropTypes.func.isRequired
}

export default SvgButton
