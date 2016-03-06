import _ from 'lodash'
import $ from 'jquery'
import { handleActions } from 'redux-actions'
import {
  DEFS_LOAD_START,
  DEFS_LOAD_SUCCESS,
  DEFS_LOAD_FAILURE
} from './actions'

let initialState = {
  isLoading: false,
  lastError: null,
  defs: {}
}

export default handleActions({
  [DEFS_LOAD_START]: (state, action) => _.assign({}, state, {
    isLoading: true
  }),
  [DEFS_LOAD_SUCCESS]: (state, action) => _.assign({}, state, {
    isLoading: false,
    defs: action.payload
  }),
  [DEFS_LOAD_FAILURE]: (state, action) => _.assign({}, state, {
    isLoading: false,
    lastError: action.payload.toString()
  })
}, initialState)
