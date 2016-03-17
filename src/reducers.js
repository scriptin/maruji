import _ from 'lodash'
import $ from 'jquery'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import {
  REPORT_ERROR,
  LIST_LOAD_START, LIST_LOAD_SUCCESS,
  DEFS_LOAD_START, DEFS_LOAD_SUCCESS,
  SET_PROGRESS,
  ASK_QUESTION
} from './actions'

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
  [LIST_LOAD_SUCCESS]: (state, action) => _.assign({}, state, {
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
  [DEFS_LOAD_SUCCESS]: (state, action) => _.assign({}, state, {
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

const question = handleActions({
  [ASK_QUESTION]: (state, action) => action.payload
}, {
  kanji: null,
  words: null,
  answerOptions: null
})

export default combineReducers({
  errors,
  kanjiList,
  kanjiDefs,
  progressStorage,
  question
})
