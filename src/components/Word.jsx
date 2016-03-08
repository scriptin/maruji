import React from 'react'
import TranslationList from './TranslationList'

require('../styles/word.less')

const renderWriting = (w, hiddenChar) => (
  <span className='word'>
    { w.replace(new RegExp(hiddenChar, 'g'), '〇') }
  </span>
)

const renderComma = (idx, total) => (idx + 1 < total)
  ? <span className='text-muted'>{ '、' }</span>
  : null

const renderReading = (r, idx, total) => (
  <span key={idx} className={ 'word' + (idx == 0 ? '' : ' text-muted') }>
    { '【' + r + '】' }{ renderComma(idx, total) }
  </span>
)

const renderReadings = readings => (
  <span>
    { readings.map((r, idx) => renderReading(r, idx, readings.length)) }
  </span>
)

const Word = ({ num, word, hiddenChar }) => (
  <tr>
    <td> { renderWriting(word.w, hiddenChar) }{ renderReadings(word.r) } </td>
    <td>
      <TranslationList translations={word.t} />
    </td>
  </tr>
)

export default Word
