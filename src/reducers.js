import _ from 'lodash'
import $ from 'jquery'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import * as util from './util'
import * as svgUtil from './svg'
import {
  REPORT_ERROR,
  LIST_LOAD_START, LIST_LOAD_END,
  VOCAB_LOAD_START, VOCAB_LOAD_END,
  SIMILAR_LOAD_START, SIMILAR_LOAD_END,
  SET_PROGRESS,
  ASK_QUESTION, GIVE_ANSWER
} from './actions'
import { QUESTION_TYPE } from './question'

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

// Kanji-vocabulary store

const kanjiVocabStore = handleActions({
  [VOCAB_LOAD_START]: (state, action) => _.assign({}, state, {
    isLoading: true
  }),
  [VOCAB_LOAD_END]: (state, action) => _.assign({}, state, {
    isLoading: false,
    vocab: action.payload
  })
}, {
  isLoading: false,
  vocab: {}
})

// Similar kanji store

const similarKanjiStore = handleActions({
  [SIMILAR_LOAD_START]: (state, action) => _.assign({}, state, {
    isLoading: true
  }),
  [SIMILAR_LOAD_END]: (state, action) => _.assign({}, state, {
    isLoading: false,
    similar: action.payload
  })
}, {
  isLoading: false,
  similar: {}
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
    correct: (questionType == QUESTION_TYPE.STROKE_ORDER) ? answeredAndCorrect : option.correct,
    active: ! answeredAndCorrect // only correct answers stay inactive
  })
}

const updateStateOnStrokeOrderAnswer = (state, action) => {
  let correct = strokeOrderAnswerIsCorect(state.answerQueue, action.payload)
  let optionIdx = state.answerOptions.findIndex(a => a.answerId == action.payload)

  let kanjiSvg = correct
    ? svgUtil.unmuteStroke(state.kanjiSvg.clone(), action.payload)
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

const updateStateOnKanjiAnswer = (state, action) => {
  let correct = state.answerOptions[action.payload].correct
  let optionIdx = action.payload

  let kanjiSvg = correct
    ? svgUtil.showRoot(state.kanjiSvg.clone())
    : state.kanjiSvg
  let answerOptions = util.replaceElement(
    state.answerOptions.map(resetAnswerOption),
    optionIdx,
    updateAnswerOption(state.answerOptions[optionIdx], correct)
  )
  let progress = correct ? 100 : 0
  let mistakeCount = correct
    ? state.mistakeCount
    : (state.mistakeCount + 1)

  return _.assign({}, state, {
    kanjiSvg,
    answerOptions,
    progress,
    mistakeCount
  })
}

const defaultQuestionStore = {
  isLoading: true,
  type: null,
  kanji: null,
  kanjiSvg: null,
  kanjiOptions: [],
  words: [],
  answerOptions: [],
  answerQueue: [],
  mistakeCount: 0,
  progress: 0
}

const questionStore = handleActions({
  [ASK_QUESTION]: (state, action) => _.assign({}, defaultQuestionStore, action.payload, {
    isLoading: false,
    answerOptions: action.payload.answerOptions.map((ao, idx) => ({
      svg: ao.svg,
      correct: ao.correct,
      order: ao.order,
      answerId: ao.order != null ? ao.order : idx, // order is null if question type is not STROKE_ORDER
      answered: false,
      active: true
    }))
  }),
  [GIVE_ANSWER]: (state, action) => {
    if (state.progress >= 100) return state
    switch (state.type) {
      case QUESTION_TYPE.STROKE_ORDER: return updateStateOnStrokeOrderAnswer(state, action)
      case QUESTION_TYPE.RANDOM_KANJI: return updateStateOnKanjiAnswer(state, action)
      case QUESTION_TYPE.SIMILAR_KANJI: return updateStateOnKanjiAnswer(state, action)
      default: throw new Error('Unexpected question type: ' + state.type)
    }
  }
}, defaultQuestionStore)

export default combineReducers({
  errorStore,
  kanjiListStore,
  kanjiVocabStore,
  similarKanjiStore,
  progressStore,
  questionStore
})
