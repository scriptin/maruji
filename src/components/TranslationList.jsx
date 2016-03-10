import React from 'react'
import Translation from './Translation'

require('../styles/translation-list.less')

const TranslationList = ({ translations }) => (
  <ol className="translation-list">
    { translations.map((t, idx) => <Translation key={idx} translation={t} />) }
  </ol>
)

export default TranslationList
