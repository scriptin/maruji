import React from 'react'
import TranslationList from './TranslationList'

require('../styles/word.less')

const renderWriting = (w, hiddenChar) => (
  <span className="word">
    { w.replace(new RegExp(hiddenChar, 'g'), '〇') }
  </span>
)

const renderReading = (r, idx, total) => (
  <span key={idx} className={ 'word' + (idx == 0 ? '' : ' text-muted') }>
    { '【' + r + '】' }
  </span>
)

const renderReadings = readings => (
  <span>
    { readings.map((r, idx) => renderReading(r, idx, readings.length)) }
  </span>
)

const Word = ({ word, hiddenChar }) => (
  <div className="panel panel-default">
    <div className="panel-heading">
      <h3 className="panel-title">
        { renderWriting(word.w, hiddenChar) }
        { renderReadings(word.r) }
      </h3>
    </div>
    <div className="panel-body">
      <TranslationList translations={word.t} />
    </div>
  </div>
)

export default Word
