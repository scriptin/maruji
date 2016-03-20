import React, { PropTypes } from 'react'

const renderPos = pos => (
  <small className="text-info">
    { '(' + pos.join(', ') + ')' }
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

const Translation = ({ translation }) => (
  <li>
    { renderPos(translation.pos) }
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
  }).isRequired
}

export default Translation
