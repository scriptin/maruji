import _ from 'lodash'
import $ from 'jquery'
import * as actions from './actions'

let initialState = {
  isLoading: false,
  defs: {},
  lastError: null
}

export default function app(state = initialState, action) {
  switch (action.type) {
    case actions.DEFS_LOAD_START:
      return _.assign({}, state, {
        isLoading: true
      })
    case actions.DEFS_LOAD_SUCCESS:
      return _.assign({}, state, {
        isLoading: false,
        defs: action.defs
      })
    case actions.DEFS_LOAD_FAIL:
      return _.assign({}, state, {
        isLoading: false,
        lastError: action.error
      })
    default:
      return state
  }
}
