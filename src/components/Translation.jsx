import React from 'react'

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

export default Translation
