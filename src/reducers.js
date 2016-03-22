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

// Errors store

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

// Kanji list store

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

// Kanji definitions store

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

// Progress store

const progressStore = handleActions({
  [SET_PROGRESS]: (state, action) => _.assign({}, state, {
    progress: action.payload
  })
}, {
  progress: {}
})

// Question store

const strokeOrderAnswerIsCorect = (queue, answerId) =>
  (   _.isEmpty(queue) && answerId == 0) ||
  ( ! _.isEmpty(queue) && answerId == _.last(queue) + 1)

const updateAnswerOption = (option, correct) => _.assign({}, option, {
  answered: true,
  correct,
  active: false // last given answer turns inactive even if it wasn't correct
                // to prevent accidental double-clicks
})

const resetAnswerOption = (option, questionType) => {
  let answeredAndCorrect = option.answered && option.correct
  return _.assign({}, option, {
    answered: answeredAndCorrect,
    correct: (questionType == QUESTION_TYPE_STROKE_ORDER) ? answeredAndCorrect : option.correct,
    active: ! answeredAndCorrect // only correct answers stay inactive
  })
}

const updateSvgStroke = (svg, answerId) => {
  $(svg.find('.strokes path').toArray()[answerId]).removeClass('muted')
  return svg
}

const updateStateOnStrokeOrderAnswer = (state, action) => {
  let correct = strokeOrderAnswerIsCorect(state.answerQueue, action.payload)
  let optionIdx = state.answerOptions.findIndex(a => a.answerId == action.payload)

  let kanjiSvg = correct
    ? updateSvgStroke(state.kanjiSvg.clone(), action.payload)
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

const updateStateOnComponentsAnswer = (state, action) => {
  let optionIdx = state.answerOptions.findIndex(a => a.answerId == action.payload)
  let correct = state.answerOptions[optionIdx].correct

  let kanjiSvg = state.kanjiSvg // TODO
  let answerOptions = util.replaceElement(
    state.answerOptions.map(resetAnswerOption),
    optionIdx,
    updateAnswerOption(state.answerOptions[optionIdx], correct)
  )
  let answerQueue = correct
    ? _.concat(state.answerQueue, action.payload)
    : state.answerQueue
  let totalCorrectOptions = state.answerOptions.filter(a => a.correct).length
  let progress = correct
    ? Math.round((state.answerQueue.length + 1) / totalCorrectOptions * 100)
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

const defaultQuestionStore = {
  isLoading: true,
  type: null,
  kanji: null,
  kanjiSvg: null,
  words: [],
  answerOptions: [],
  answerQueue: [],
  mistakeCount: 0,
  progress: 0
}

const questionStore = handleActions({
  [ASK_QUESTION]: (state, action) => _.assign({}, defaultQuestionStore, action.payload, {
    isLoading: false
  }),
  [GIVE_ANSWER]: (state, action) => {
    switch (state.type) {
      case QUESTION_TYPE_STROKE_ORDER: return updateStateOnStrokeOrderAnswer(state, action)
      case QUESTION_TYPE_COMPONENTS: return updateStateOnComponentsAnswer(state, action)
      default: throw new Error('Unexpected question type: ' + state.type)
    }
  }
}, defaultQuestionStore)

export default combineReducers({
  errorStore,
  kanjiListStore,
  kanjiDefsStore,
  progressStore,
  questionStore
})
