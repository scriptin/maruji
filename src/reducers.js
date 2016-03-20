import _ from 'lodash'
import $ from 'jquery'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import * as util from './util'
import {
  REPORT_ERROR,
  LIST_LOAD_START, LIST_LOAD_END,
  DEFS_LOAD_START, DEFS_LOAD_END,
  SET_PROGRESS,
  ASK_QUESTION, GIVE_ANSWER
} from './actions'
import { QUESTION_TYPE_STROKE_ORDER, QUESTION_TYPE_COMPONENTS } from './question'

const errorStore = handleActions({
  [REPORT_ERROR]: (state, action) => {
    console.error(action.payload)
    return _.assign({}, state, {
      errors: _.concat(state.errors, action.payload.message)
    })
  }
}, {
  errors: []
})

const kanjiListStore = handleActions({
  [LIST_LOAD_START]: (state, action) => _.assign({}, state, {
    isLoading: true
  }),
  [LIST_LOAD_END]: (state, action) => _.assign({}, state, {
    isLoading: false,
    list: action.payload
  })
}, {
  isLoading: false,
  list: []
})

const kanjiDefsStore = handleActions({
  [DEFS_LOAD_START]: (state, action) => _.assign({}, state, {
    isLoading: true
  }),
  [DEFS_LOAD_END]: (state, action) => _.assign({}, state, {
    isLoading: false,
    defs: action.payload
  })
}, {
  isLoading: false,
  defs: {}
})

const progressStore = handleActions({
  [SET_PROGRESS]: (state, action) => _.assign({}, state, {
    progress: action.payload
  })
}, {
  progress: {}
})

const strokeOrderAnswerIsCorect = (queue, answerId) =>
  (   _.isEmpty(queue) && answerId == 0) ||
  ( ! _.isEmpty(queue) && answerId == _.last(queue) + 1)

const updateAnswerOption = (option, correct) => _.assign({}, option, {
  answered: true,
  correct,
  active: false // last given answer turns inactive even if it wasn't correct
                // to prevent accidental double-clicks
})

const resetAnswerOption = option => {
  let answeredAndCorrect = option.answered && option.correct
  return _.assign({}, option, {
    answered: answeredAndCorrect,
    correct: answeredAndCorrect,
    active: ! answeredAndCorrect // only correct answers stay inactive
  })
}

const updateSvg = (svg, answerId) => {
  $(svg.find('.strokes path').toArray()[answerId]).removeClass('muted')
  return svg
}

function updateStateStrokeOrder(state, action) {
  let correct = strokeOrderAnswerIsCorect(state.answerQueue, action.payload)
  let optionIdx = state.answerOptions.findIndex(a => a.answerId == action.payload)

  let kanjiSvg = correct
    ? updateSvg(state.kanjiSvg.clone(), action.payload)
    : state.kanjiSvg
  let answerOptions = util.replaceElement(
    state.answerOptions.map(resetAnswerOption),
    optionIdx,
    updateAnswerOption(state.answerOptions[optionIdx], correct)
  )
  let answerQueue = correct
    ? _.concat(state.answerQueue, action.payload)
    : state.answerQueue
  let progress = correct
    ? Math.round((state.answerQueue.length + 1) / state.answerOptions.length * 100)
    : state.progress
  let mistakeCount = correct
    ? state.mistakeCount
    : (state.mistakeCount + 1)

  return _.assign({}, state, {
    kanjiSvg,
    answerOptions,
    answerQueue,
    progress,
    mistakeCount
  })
}

const questionStore = handleActions({
  [ASK_QUESTION]: (state, action) => _.assign({}, state, action.payload, {
    progress: 0
  }),
  [GIVE_ANSWER]: (state, action) => {
    switch (state.type) {
      case QUESTION_TYPE_STROKE_ORDER: return updateStateStrokeOrder(state, action)
      case QUESTION_TYPE_COMPONENTS: return state;
      default: throw new Error('Unexpected question type: ' + state.type)
    }
  }
}, {
  type: null,
  kanji: null,
  kanjiSvg: null,
  kanjiSvgMeta: null,
  words: null,
  answerOptions: null,
  answerQueue: [],
  mistakeCount: 0,
  progress: 0
})

export default combineReducers({
  errorStore,
  kanjiListStore,
  kanjiDefsStore,
  progressStore,
  questionStore
})
