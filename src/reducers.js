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

const errors = handleActions({
  [REPORT_ERROR]: (state, action) => {
    console.error(action.payload)
    return _.assign({}, state, {
      errorList: state.errorList.concat([action.payload.message])
    })
  }
}, {
  errorList: []
})

const kanjiList = handleActions({
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

const kanjiDefs = handleActions({
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

const progressStorage = handleActions({
  [SET_PROGRESS]: (state, action) => _.assign({}, state, {
    progress: action.payload
  })
}, {
  progress: {}
})

function strokeOrderAnswerIsCorect(state, action) {
  let queue = state.answerQueue
  let answerId = action.payload
  return (   _.isEmpty(queue) && answerId == 0) ||
         ( ! _.isEmpty(queue) && answerId == _.last(queue) + 1)
}

const updateAnswerOption = (option, correct) => _.assign({}, option, {
  answered: true,
  correct,
  active: ! correct
})

function updateStateStrokeOrder(state, action, correct) {
  let optionIdx = state.answerOptions.findIndex(a => a.answerId == action.payload)

  let answerOptions = util.replaceElement(
    state.answerOptions,
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
    answerOptions,
    answerQueue,
    progress,
    mistakeCount
  })
}

const question = handleActions({
  [ASK_QUESTION]: (state, action) => _.assign({}, state, action.payload, {
    progress: 0
  }),
  [GIVE_ANSWER]: (state, action) => {
    switch (state.type) {
      case QUESTION_TYPE_STROKE_ORDER: return updateStateStrokeOrder(
        state, action,
        strokeOrderAnswerIsCorect(state, action)
      )
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
  errors,
  kanjiList,
  kanjiDefs,
  progressStorage,
  question
})
