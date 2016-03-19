import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { QUESTION_TYPE_STROKE_ORDER, QUESTION_TYPE_COMPONENTS } from '../question'

require('../styles/answer-panel.less')

function questionTitle(questionType) {
  switch (questionType) {
    case QUESTION_TYPE_STROKE_ORDER: return 'Add strokes in a correct order';
    case QUESTION_TYPE_COMPONENTS: return 'Add kanji components, in any order';
    default: throw new Error('Unexpected question type: ' + questionType)
  }
}

const Answer = ({ questionType, answerOptions, progress, mistakeCount }) => (
  <div className="panel panel-default answer-panel">
    <div className="panel-heading">
      { questionTitle(questionType) }
    </div>
    <div className="panel-body">
      <p>
        TODO
      </p>
      <div className="clearfix">
        <div className="progress pull-left">
          <div className="progress-bar" role="progressbar"
            aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"
            style={{width: progress + '%'}}>
            <span className="sr-only">{ progress }% Complete</span>
          </div>
        </div>
        <div className="mistake-count pull-right text-right">
          <strong className="text-danger">
            { mistakeCount }
          </strong>
          &nbsp;mistakes
        </div>
      </div>
    </div>
  </div>
)

Answer.propTypes = {
  questionType: PropTypes.string.isRequired,
  progress: PropTypes.number.isRequired,
  mistakeCount: PropTypes.number.isRequired
}

export default connect(state => ({
  questionType: state.question.type,
  progress: state.question.progress,
  mistakeCount: state.question.mistakeCount
}))(Answer)
