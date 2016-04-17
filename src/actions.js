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

const loadJSONAndHandleErrors = (fileUrl, dispatch) => util.getJSON(fileUrl)
  .catch(Error, e => dispatch(reportError(e)))
  .catch(xhr => dispatch(reportError(util.xhrToErrorMsg(xhr))))

export const initApp = files => {
  return dispatch => {
    dispatch(listLoadStart())
    dispatch(vocabLoadStart())
    dispatch(similarLoadStart())
    dispatch(soundsLoadStart())
    dispatch(initProgress())
    return Promise.join(
      loadJSONAndHandleErrors(files.kanjiList, dispatch),
      loadJSONAndHandleErrors(files.kanjiVocab, dispatch),
      loadJSONAndHandleErrors(files.similarKanji, dispatch),
      loadJSONAndHandleErrors(files.kanjiSounds, dispatch),
      (list, vocab, similar, sounds) => {
        dispatch(listLoadEnd(list))
        dispatch(vocabLoadEnd(vocab))
        dispatch(similarLoadEnd(similar))
        dispatch(soundsLoadEnd(sounds))
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

// Kanji-vacabulary loading

export const VOCAB_LOAD_START = 'VOCAB_LOAD_START'
export const vocabLoadStart = createAction(VOCAB_LOAD_START)

export const VOCAB_LOAD_END = 'VOCAB_LOAD_END'
export const vocabLoadEnd = createAction(VOCAB_LOAD_END)

// Similar kanji loading

export const SIMILAR_LOAD_START = 'SIMILAR_LOAD_START'
export const similarLoadStart = createAction(SIMILAR_LOAD_START)

export const SIMILAR_LOAD_END = 'SIMILAR_LOAD_END'
export const similarLoadEnd = createAction(SIMILAR_LOAD_END)

// Kanji sounds loading

export const SOUNDS_LOAD_START = 'SOUNDS_LOAD_START'
export const soundsLoadStart = createAction(SOUNDS_LOAD_START)

export const SOUNDS_LOAD_END = 'SOUNDS_LOAD_END'
export const soundsLoadEnd = createAction(SOUNDS_LOAD_END)

// Handling progress, localStorage

const storageAvailable = () => {
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

export const initProgress = (savedProgress = {}) => {
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

export const nextQuestion = () => {
  return (dispatch, getState) => {
    return buildQuestion(getState())
      .then(question => dispatch(askQuestion(question)))
      .catch(Error, e => dispatch(reportError(e)))
      .catch(xhr => dispatch(reportError(util.xhrToErrorMsg(xhr))))
  }
}

export const ASK_QUESTION = 'ASK_QUESTION'
export const askQuestion = createAction(ASK_QUESTION)

export const GIVE_ANSWER = 'GIVE_ANSWER'
export const giveAnswer = createAction(GIVE_ANSWER)
