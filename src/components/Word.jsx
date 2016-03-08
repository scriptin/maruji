import React from 'react'
import TranslationList from './TranslationList'

const renderWriting = (w, hiddenChar) => w.replace(new RegExp(hiddenChar, 'g'), '〇')

const wrapReading = r => '【' + r + '】'

const renderReadings = readings => (
  <span>
    { wrapReading(readings[0]) }
    {
      (readings.length > 1) ? (
        <span className='text-muted'>
          { '、' + _.drop(readings).map(wrapReading).join('、') }
        </span>
      ) : null
    }
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
