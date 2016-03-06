import { createAction } from 'redux-actions'

export const INIT_APP = 'INIT_APP'
export function initApp(defsUrl) {
  return dispatch => {
    dispatch(defsLoadStart())
    dispatch(initProgress())
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

function storageAvailable() {
  try {
    let storage = window.localStorage
    let x = '__storage_test__' + Math.random()
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch(e) {
    return false;
  }
}

export function initProgress(defaultProgress = {}) {
  return dispatch => {
    if ( ! storageAvailable()) {
      return dispatch(initProgressFailure('Local storage is not available in this browser'))
    }
    const PROGRESS_STORAGE_KEY = 'progress'
    let progress = localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (progress == null) {
      localStorage.setItem(PROGRESS_STORAGE_KEY, defaultProgress)
      progress = defaultProgress
    }
    return dispatch(resetProgress())
  }
}

export const INIT_PROGRESS_FAILURE = 'INIT_PROGRESS_FAILURE'
export const initProgressFailure = createAction(INIT_PROGRESS_FAILURE, e => new Error(e))

export const RESET_PROGRESS = 'RESET_PROGRESS'
export const resetProgress = createAction(RESET_PROGRESS)
