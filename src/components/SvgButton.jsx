import React, { PropTypes } from 'react'
import $ from 'jquery'

require('../styles/btn-svg.less')

const SvgButton = ({ svg, answerId, answered, correct, active, onAnswerButtonClick }) => {
  let stateClass = answered ? (correct ? 'btn-success' : 'btn-danger') : 'btn-default'
  return (
    <button
      className={'btn btn-svg ' + stateClass}
      disabled={ ! active}
      onClick={() => onAnswerButtonClick(answerId)}
      dangerouslySetInnerHTML={{__html: svg.prop('outerHTML')}}
    />
  )
}

SvgButton.propTypes = {
  svg: PropTypes.object.isRequired,
  answerId: PropTypes.number.isRequired,
  onAnswerButtonClick: PropTypes.func.isRequired
}

export default SvgButton
