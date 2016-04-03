import React, { PropTypes } from 'react'

const renderPosTag = (tag, description, idx, isLast) => (
  <span key={idx}>
    <abbr title={description}>{ ' ' +  tag + ' ' }</abbr>
    { isLast ? '' : ',' }
  </span>
)

const renderPosTags = (pos, tags) => (
  <small className="text-info">
    { '(' }
    { pos.map((tag, idx) => renderPosTag(tag, tags[tag], idx, idx == pos.length - 1)) }
    { ')' }
  </small>
)

const renderForKana = forKana => {
  if (_.includes(forKana, '*')) return ''
  return (
    <small className="text-muted">
      { '(only for ' + forKana.join(', ') + ')' }
    </small>
  )
}

const Translation = ({ translation, tags }) => (
  <li>
    { renderPosTags(translation.pos, tags) }
    { ' ' }
    { translation.gloss.join('; ') }
    { ' ' }
    { renderForKana(translation.forKana) }
  </li>
)

Translation.propTypes = {
  translation: PropTypes.shape({
    pos: PropTypes.arrayOf(PropTypes.string).isRequired,
    gloss: PropTypes.arrayOf(PropTypes.string).isRequired,
    forKana: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired,
  tags: PropTypes.object.isRequired
}

export default Translation
