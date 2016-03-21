import _ from 'lodash'
import $ from 'jquery'
import Promise from 'bluebird'
import { createAction } from 'redux-actions'
import * as util from './util'
import * as svgUtil from './svg'
import { buildQuestion } from './question'

// Errors

export const REPORT_ERROR = 'REPORT_ERROR'
export const reportError = createAction(REPORT_ERROR, e => e instanceof Error ? e : new Error(e))

// Initialization

export function initApp(listUrl, defsUrl) {
  return dispatch => {
    dispatch(listLoadStart())
    dispatch(defsLoadStart())
    dispatch(initProgress())
    return Promise.join(
      util.getJSON(listUrl)
        .catch(Error, e => dispatch(reportError(e)))
        .catch(xhr => dispatch(reportError(util.xhrToErrorMsg(xhr)))),
      util.getJSON(defsUrl)
        .catch(Error, e => dispatch(reportError(e)))
        .catch(xhr => dispatch(reportError(util.xhrToErrorMsg(xhr)))),
      (list, defs) => {
        dispatch(listLoadEnd(list))
        dispatch(defsLoadEnd(defs))
        dispatch(nextQuestion())
      }
    )
  }
}

// Kanji list loading

export const LIST_LOAD_START = 'LIST_LOAD_START'
export const listLoadStart = createAction(LIST_LOAD_START)

export const LIST_LOAD_END = 'LIST_LOAD_END'
export const listLoadEnd = createAction(LIST_LOAD_END)

// Kanji definitions loading

export const DEFS_LOAD_START = 'DEFS_LOAD_START'
export const defsLoadStart = createAction(DEFS_LOAD_START)

export const DEFS_LOAD_END = 'DEFS_LOAD_END'
export const defsLoadEnd = createAction(DEFS_LOAD_END)

// Handling progress, localStorage

function storageAvailable() {
  try {
    let storage = window.localStorage
    let x = '__storage_test__' + Math.random()
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

export function initProgress(savedProgress = {}) {
  return dispatch => {
    if ( ! storageAvailable()) {
      return dispatch(reportError('Local storage is not available in this browser'))
    }
    const PROGRESS_STORAGE_KEY = 'progress'
    let progress = localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (progress == null) {
      localStorage.setItem(PROGRESS_STORAGE_KEY, savedProgress)
      progress = savedProgress
    }
    return dispatch(setProgress(progress))
  }
}

export const SET_PROGRESS = 'SET_PROGRESS'
export const setProgress = createAction(SET_PROGRESS)

// Questions

export function nextQuestion() {
  return (dispatch, getState) => {
    let kanjiList = getState().kanjiListStore.list
    let kanjiDefs = getState().kanjiDefsStore.defs
    let progress = getState().progressStore.progress
    return buildQuestion(kanjiList, kanjiDefs, progress)
      .then(question => dispatch(askQuestion(question)))
      .catch(Error, e => dispatch(reportError(e)))
      .catch(xhr => dispatch(reportError(util.xhrToErrorMsg(xhr))))
  }
}

export const ASK_QUESTION = 'ASK_QUESTION'
export const askQuestion = createAction(ASK_QUESTION)

export const GIVE_ANSWER = 'GIVE_ANSWER'
export const giveAnswer = createAction(GIVE_ANSWER)
