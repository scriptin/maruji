export const INIT_APP = 'INIT_APP'
export function initApp(defsUrl) {
  return dispatch => {
    dispatch(defsLoadStart())
    return $.getJSON(defsUrl)
      .done(defs => dispatch(defsLoadSuccess(defs)))
      .fail(xhr => dispatch(defsLoadFail(xhr.statusText + ', ' + xhr.responseText)))
  }
}

export const DEFS_LOAD_START = 'DEFS_LOAD_START'
export function defsLoadStart() {
  return { type: DEFS_LOAD_START }
}

export const DEFS_LOAD_SUCCESS = 'DEFS_LOAD_SUCCESS'
export function defsLoadSuccess(defs) {
  return {
    type: DEFS_LOAD_SUCCESS,
    defs
  }
}

export const DEFS_LOAD_FAIL = 'DEFS_LOAD_FAIL'
export function defsLoadFail(error) {
  return {
    type: DEFS_LOAD_FAIL,
    error
  }
}
