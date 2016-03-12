import _ from 'lodash'

export const kanjiCode = kanji => _.padStart(kanji.charCodeAt(0).toString(16), 5, '0')
