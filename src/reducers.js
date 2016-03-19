import _ from 'lodash'
import $ from 'jquery'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
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

function strokeOrderCorrect(state, action, optionIdx) {
  let updatedAnswerOption = _.assign({}, state.answerOptions[optionIdx], {
    answered: true,
    correct: true,
    active: false
  })
  return _.assign({}, state, {
    answerOptions: state.answerOptions.slice(0, optionIdx)
      .concat([updatedAnswerOption])
      .concat(state.answerOptions.slice(optionIdx + 1)),
    answerQueue: state.answerQueue.concat([action.payload]),
    progress: ((state.answerQueue.length + 1) / state.answerOptions.length * 100) | 0
  })
}

function strokeOrderIncorrect(state, action, optionIdx) {
  let updatedAnswerOption = _.assign({}, state.answerOptions[optionIdx], {
    answered: true,
    correct: false,
    active: true
  })
  return _.assign({}, state, {
    answerOptions: state.answerOptions.slice(0, optionIdx)
      .concat([updatedAnswerOption])
      .concat(state.answerOptions.slice(optionIdx + 1)),
    mistakeCount: state.mistakeCount + 1
  })
}

const question = handleActions({
  [ASK_QUESTION]: (state, action) => _.assign({}, state, action.payload, {
    progress: 0
  }),
  [GIVE_ANSWER]: (state, action) => {
    switch (state.type) {
      case QUESTION_TYPE_STROKE_ORDER:
        let optionIdx = state.answerOptions.findIndex(a => a.answerId == action.payload)
        if (
          (_.isEmpty(state.answerQueue) && action.payload == 0) ||
          ( ! _.isEmpty(state.answerQueue) && action.payload == _.last(state.answerQueue) + 1)
        ) {
          return strokeOrderCorrect(state, action, optionIdx)
        } else {
          return strokeOrderIncorrect(state, action, optionIdx)
        }
        break;
      case QUESTION_TYPE_COMPONENTS:
        break;
      default: throw new Error('Unexpected question type: ' + state.type)
    }
  }
}, {
  type: null,
  kanji: null,
  words: null,
  kanjiSvg: null,
  kanjiSvgMeta: null,
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
