import React, { PropTypes } from 'react'
import $ from 'jquery'

require('../styles/btn-svg.less')

const SvgButton = ({ svg, isCorrect }) => (
  <button className="btn btn-default btn-svg"
    dangerouslySetInnerHTML={{__html: svg.prop('outerHTML')}}
  />
)

SvgButton.propTypes = {
  svg: PropTypes.object.isRequired,
  isCorrect: PropTypes.bool.isRequired
}

export default SvgButton
