import React, { PropTypes } from 'react'
import $ from 'jquery'

require('../styles/btn-svg.less')

const SvgButton = ({ svg }) => (
  <button className="btn btn-default btn-svg"
    dangerouslySetInnerHTML={{__html: svg.prop('outerHTML')}}
  />
)

SvgButton.propTypes = {
  svg: PropTypes.object.isRequired
}

export default SvgButton
