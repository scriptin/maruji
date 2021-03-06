import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import SvgPanel from './SvgPanel'
import { QUESTION_TYPE } from '../question'
import { nextQuestion } from '../actions'

require('../styles/answer-panel.less')

const UNKNOWN_KANJI_PLACEHOLDER = '？'

const questionTitle = questionType => {
  switch (questionType) {
    case QUESTION_TYPE.STROKE_ORDER: return 'Select kanji strokes in a correct order:'
    case QUESTION_TYPE.RANDOM_KANJI: return 'Select a correct kanji:'
    case QUESTION_TYPE.SIMILAR_KANJI: return 'Select a correct kanji:'
    case QUESTION_TYPE.MATCHING_VOCAB: return 'Select all words (on the left) for the kanji:'
    default: throw new Error('Unexpected question type: ' + questionType)
  }
}

const AnswerPanel = ({
  questionType, showKanji, kanji, kanjiSvg, answerOptions, progress, done, mistakeCount,
  onContinueClick
}) => (
  <div className="panel panel-default answer-panel">
    <div className="panel-heading">
      <h3 className="panel-title">
        { questionTitle(questionType) }
      </h3>
    </div>
    <div className="panel-body">
      <table>
        <tbody>
          <tr>
            <td>
              <SvgPanel svg={kanjiSvg} />
            </td>
            <td>
              <span className="big-kanji">
                { showKanji ? kanji : UNKNOWN_KANJI_PLACEHOLDER }
              </span>
            </td>
            <td>
              <p>
                <button
                  disabled={ ! done}
                  className={ 'btn ' + (done ? 'btn-primary' : 'btn-default') }
                  onClick={onContinueClick}
                >
                  Continue
                </button>
              </p>
              <p>
                <button disabled={done} className="btn btn-xs btn-default">
                  Skip
                </button>
                <small className="text-muted"> { ' if you are lazy' } </small>
              </p>
              <p>
                <button disabled={done} className="btn btn-xs btn-default">
                  Mark as correct
                </button>
                <small className="text-muted"> { ' if it is trivial' } </small>
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <div className="progress">
                <div className="progress-bar" role="progressbar"
                  aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"
                  style={{width: progress + '%'}}>
                  <span className="sr-only">{ progress }% Complete</span>
                </div>
              </div>
            </td>
            <td>
              <p className="mistake-count">
                <strong className="text-danger">
                  { mistakeCount }
                </strong>
                { ' mistake' + (mistakeCount != 1 ? 's' : '') }
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
)

AnswerPanel.propTypes = {
  questionType: PropTypes.string.isRequired,
  showKanji: PropTypes.bool.isRequired,
  kanji: PropTypes.string.isRequired,
  kanjiSvg: PropTypes.object.isRequired,
  progress: PropTypes.number.isRequired,
  done: PropTypes.bool.isRequired,
  mistakeCount: PropTypes.number.isRequired,
  onContinueClick: PropTypes.func.isRequired
}

export default connect(
  state => {
    let questionStore = state.questionStore
    let questionType = questionStore.type
    let done = questionStore.progress >= 100
    let questionTypesWithVisibleKanji = [QUESTION_TYPE.STROKE_ORDER, QUESTION_TYPE.MATCHING_VOCAB]
    return {
      questionType,
      showKanji: done || _.includes(questionTypesWithVisibleKanji, questionType),
      kanji: questionStore.kanji,
      kanjiSvg: questionStore.kanjiSvg,
      progress: questionStore.progress,
      done,
      mistakeCount: questionStore.mistakeCount
    }
  },
  dispatch => ({
    onContinueClick: () => dispatch(nextQuestion())
  })
)(AnswerPanel)
