import _ from 'lodash'
import $ from 'jquery'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import {
  LIST_LOAD_START, LIST_LOAD_SUCCESS, LIST_LOAD_FAILURE,
  DEFS_LOAD_START, DEFS_LOAD_SUCCESS, DEFS_LOAD_FAILURE,
  INIT_PROGRESS_FAILURE, SET_PROGRESS,
  ASK_QUESTION
} from './actions'

const kanjiList = handleActions({
  [LIST_LOAD_START]: (state, action) => _.assign({}, state, {
    isLoading: true
  }),
  [LIST_LOAD_SUCCESS]: (state, action) => _.assign({}, state, {
    isLoading: false,
    list: action.payload
  }),
  [LIST_LOAD_FAILURE]: (state, action) => _.assign({}, state, {
    isLoading: false,
    lastError: action.payload.message
  })
}, {
  isLoading: false,
  lastError: null,
  list: []
})

const kanjiDefs = handleActions({
  [DEFS_LOAD_START]: (state, action) => _.assign({}, state, {
    isLoading: true
  }),
  [DEFS_LOAD_SUCCESS]: (state, action) => _.assign({}, state, {
    isLoading: false,
    defs: action.payload
  }),
  [DEFS_LOAD_FAILURE]: (state, action) => _.assign({}, state, {
    isLoading: false,
    lastError: action.payload.message
  })
}, {
  isLoading: false,
  lastError: null,
  defs: {}
})

const progressStorage = handleActions({
  [INIT_PROGRESS_FAILURE]: (state, action) => _.assign({}, state, {
    lastError: action.payload.message
  }),
  [SET_PROGRESS]: (state, action) => _.assign({}, state, {
    progress: action.payload
  })
}, {
  lastError: null,
  progress: {}
})

const question = handleActions({
  [ASK_QUESTION]: (state, action) => _.assign({}, state, action.payload)
}, null)

export default combineReducers({
  kanjiList,
  kanjiDefs,
  progressStorage,
  question
})
