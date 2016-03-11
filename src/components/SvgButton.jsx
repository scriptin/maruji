import React, { PropTypes } from 'react'
import InlineSVG from 'react-inlinesvg'
import $ from 'jquery'

require('../styles/btn-svg.less')

const SvgButton = ({ url, code, size = 80 }) => (
  <button className="btn btn-default btn-svg">
    <InlineSVG src={url} uniquifyIDs={false}
      className={ 'kanji-' + code }
      onLoad={() => {
        let svg = $('.kanji-' + code).find('svg')
        svg.attr('width', size).attr('height', size)
        svg.find('> g:nth-child(2)').remove() // stroke numbers
      }}>
      Your browser does not support SVG!
    </InlineSVG>
  </button>
)

SvgButton.propTypes = {
  url: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  size: PropTypes.number
}

export default SvgButton
