import _ from 'lodash'
import $ from 'jquery'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import {
  DEFS_LOAD_START, DEFS_LOAD_SUCCESS, DEFS_LOAD_FAILURE,
  INIT_PROGRESS_FAILURE, RESET_PROGRESS
} from './actions'

const defs = handleActions({
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
  [RESET_PROGRESS]: (state, action) => _.assign({}, state, {
    progress: action.payload
  })
}, {
  lastError: null,
  progress: {}
})

const app = combineReducers({
  defs,
  progressStorage
})

export default app
