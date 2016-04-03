import React, { PropTypes } from 'react'
import Translation from './Translation'

require('../styles/translation-list.less')

const TranslationList = ({ translations, tags }) => (
  <ol className="translation-list">
    { translations.map((t, idx) => <Translation key={idx} translation={t} tags={tags} />) }
  </ol>
)

TranslationList.propTypes = {
  translations: PropTypes.arrayOf(PropTypes.object).isRequired,
  tags: PropTypes.object.isRequired
}

export default TranslationList
