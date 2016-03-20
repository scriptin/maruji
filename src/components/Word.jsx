import React, { PropTypes } from 'react'
import TranslationList from './TranslationList'

require('../styles/word.less')

const renderWriting = (w, kanji) => (
  <span className="word">
    { w.replace(new RegExp(kanji, 'g'), '〇') }
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

const Word = ({ word, kanji }) => (
  <div className="panel panel-default">
    <div className="panel-heading">
      <h3 className="panel-title">
        { renderWriting(word.w, kanji) }
        { renderReadings(word.r) }
      </h3>
    </div>
    <div className="panel-body">
      <TranslationList translations={word.t} />
    </div>
  </div>
)

Word.propTypes = {
  kanji: PropTypes.string.isRequired,
  word: PropTypes.shape({
    w: PropTypes.string.isRequired,
    r: PropTypes.arrayOf(PropTypes.string).isRequired,
    t: PropTypes.arrayOf(PropTypes.shape({
      pos: PropTypes.arrayOf(PropTypes.string).isRequired,
      forKana: PropTypes.arrayOf(PropTypes.string).isRequired,
      gloss: PropTypes.arrayOf(PropTypes.string).isRequired
    })).isRequired
  }).isRequired
}

export default Word
