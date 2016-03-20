import React, { PropTypes } from 'react'
import $ from 'jquery'
import SvgPanel from './SvgPanel'

require('../styles/kanji-button.less')

const KanjiButton = ({ svg, answerId, answered, correct, active, onAnswerButtonClick }) => {
  let stateClass = 'btn-' + (answered ? (correct ? 'success' : 'danger') : 'default')
  let clickHandler = () => onAnswerButtonClick(answerId)
  return (
    <button className={'kanji-button btn ' + stateClass} disabled={ ! active} onClick={clickHandler}>
      <SvgPanel svg={svg} />
    </button>
  )
}

KanjiButton.propTypes = {
  svg: PropTypes.object.isRequired,
  answerId: PropTypes.number.isRequired,
  answered: PropTypes.bool.isRequired,
  correct: PropTypes.bool.isRequired,
  active: PropTypes.bool.isRequired,
  onAnswerButtonClick: PropTypes.func.isRequired
}

export default KanjiButton
