import React, { PropTypes } from 'react'
import TranslationList from './TranslationList'

require('../styles/word.less')

const CIRCLE = '〇'
const READING_BRACKET_OPEN = '【'
const READING_BRACKET_CLOSE = '】'

const wrapInSpan = (part, kanji, idx) => (
  <span key={idx} className={_.includes([kanji, CIRCLE], part) ? 'text-primary' : ''}>
    { part }
  </span>
)

const renderWriting = (w, kanji, hide) => (
  <span className="no-break">
    {
      (hide ? w.replace(new RegExp(kanji, 'g'), CIRCLE) : w)
        .split('')
        .map((part, idx) => wrapInSpan(part, kanji, idx))
    }
  </span>
)

const renderReading = (r, idx, total) => (
  <span key={idx} className={ 'no-break' + (idx == 0 ? '' : ' text-muted') }>
    { READING_BRACKET_OPEN + r + READING_BRACKET_CLOSE }
  </span>
)

const renderReadings = readings => (
  <span>
    { readings.map((r, idx) => renderReading(r, idx, readings.length)) }
  </span>
)

const renderSelectButton = (clickHandler, correct, answered, active) => {
  let correctnessClass = 'btn-default'
  if (answered) {
    correctnessClass = correct ? 'btn-success' : 'btn-danger'
  }
  let text = 'select'
  if (answered) {
    text = correct ? '○ correct' : '× wrong'
  }
  return (
    <button className={ 'btn btn-xs pull-rigth ' + correctnessClass }
      disabled={ ! active}
      onClick={clickHandler}>
      { text }
    </button>
  )
}

const Word = ({ showSelectButton, hide, word, onSelectButtonClick }) => {
  let clickHandler = () => onSelectButtonClick(word.answerId)
  return (
    <div className="word panel panel-default">
      <div className="panel-heading">
        <h3 className="panel-title">
          { renderWriting(word.vocab.w, word.kanji, hide && ! word.answered) }
          { renderReadings(word.vocab.r) }
          { showSelectButton ? renderSelectButton(clickHandler, word.correct, word.answered, word.active) : '' }
        </h3>
      </div>
      <div className="panel-body">
        <TranslationList translations={word.vocab.t} />
      </div>
    </div>
  )
}

Word.propTypes = {
  showSelectButton: PropTypes.bool.isRequired,
  onSelectButtonClick: PropTypes.func.isRequired,
  hide: PropTypes.bool.isRequired,
  word: PropTypes.shape({
    kanji: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    vocab: PropTypes.shape({
      w: PropTypes.string.isRequired,
      r: PropTypes.arrayOf(PropTypes.string).isRequired,
      t: PropTypes.arrayOf(PropTypes.shape({
        pos: PropTypes.arrayOf(PropTypes.string).isRequired,
        forKana: PropTypes.arrayOf(PropTypes.string).isRequired,
        gloss: PropTypes.arrayOf(PropTypes.string).isRequired
      })).isRequired
    }).isRequired,
    correct: PropTypes.bool.isRequired
  }).isRequired
}

export default Word
