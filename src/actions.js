import { createAction } from 'redux-actions'

export const INIT_APP = 'INIT_APP'
export function initApp(defsUrl) {
  return dispatch => {
    dispatch(defsLoadStart())
    return $.getJSON(defsUrl)
      .done(defs => dispatch(defsLoadSuccess(defs)))
      .fail(xhr => dispatch(defsLoadFailure(xhr.statusText + ', ' + xhr.responseText)))
  }
}

export const DEFS_LOAD_START = 'DEFS_LOAD_START'
export const defsLoadStart = createAction(DEFS_LOAD_START)

export const DEFS_LOAD_SUCCESS = 'DEFS_LOAD_SUCCESS'
export const defsLoadSuccess = createAction(DEFS_LOAD_SUCCESS)

export const DEFS_LOAD_FAILURE = 'DEFS_LOAD_FAILURE'
export const defsLoadFailure = createAction(DEFS_LOAD_FAILURE, e => new Error(e))
