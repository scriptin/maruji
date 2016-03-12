import React, { PropTypes } from 'react'
import $ from 'jquery'

require('../styles/btn-svg.less')

const preprocessSvg = (svg, size) => {
  svg.attr({ width: size, height: size })
  svg.find('> g:nth-child(2)').remove() // remove stroke numbers
  return svg
}

const SvgButton = ({ svg, code, size = 80 }) => (
  <button className="btn btn-default btn-svg"
    dangerouslySetInnerHTML={{__html: preprocessSvg(svg, size).prop('outerHTML')}}
  />
)

SvgButton.propTypes = {
  svg: PropTypes.object.isRequired,
  code: PropTypes.string.isRequired,
  size: PropTypes.number
}

export default SvgButton
