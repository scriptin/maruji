import React from 'react'
import Translation from './Translation'

const TranslationList = ({ translations }) => (
  <ol>
    { translations.map((t, idx) => <Translation key={idx} translation={t} />) }
  </ol>
)

export default TranslationList
