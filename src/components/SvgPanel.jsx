import React, { PropTypes } from 'react'

require('../styles/svg-panel.less')

const SvgPanel = ({ svg }) => (
  <span className="svg-panel" dangerouslySetInnerHTML={{__html: svg.prop('outerHTML')}} />
)

SvgPanel.propTypes = {
  svg: PropTypes.object.isRequired
}

export default SvgPanel
