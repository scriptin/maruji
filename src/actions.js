import _ from 'lodash'
import $ from 'jquery'
import Promise from 'bluebird'
import { createAction } from 'redux-actions'
import * as util from './util'
import * as svgUtil from './svg'

const toErrorMsg = xhr => _.trim(xhr.responseText, '\r\n\t ') + ' (' + xhr.statusText + ')'
const getJSON = url => Promise.resolve($.getJSON(url))
const getPlainText = url => Promise.resolve($.get({
  url,
  dataType: 'text'
}))

export function initApp(listUrl, defsUrl) {
  return (dispatch, getState) => {
    dispatch(defsLoadStart())
    dispatch(initProgress())
    return Promise.join(
      getJSON(listUrl)
        .catch(Error, e => dispatch(listLoadFailure(e.message)))
        .catch(xhr => dispatch(listLoadFailure(toErrorMsg(xhr)))),
      getJSON(defsUrl)
        .catch(Error, e => dispatch(defsLoadFailure(e.message)))
        .catch(xhr => dispatch(defsLoadFailure(toErrorMsg(xhr)))),
      (list, defs) => {
        dispatch(listLoadSuccess(list))
        dispatch(defsLoadSuccess(defs))
        dispatch(nextQuestion())
      }
    )
  }
}

// Kanji list loading

export const LIST_LOAD_START = 'LIST_LOAD_START'
export const listLoadStart = createAction(LIST_LOAD_START)

export const LIST_LOAD_SUCCESS = 'LIST_LOAD_SUCCESS'
export const listLoadSuccess = createAction(LIST_LOAD_SUCCESS)

export const LIST_LOAD_FAILURE = 'LIST_LOAD_FAILURE'
export const listLoadFailure = createAction(LIST_LOAD_FAILURE, e => new Error(e))

// Kanji definitions loading

export const DEFS_LOAD_START = 'DEFS_LOAD_START'
export const defsLoadStart = createAction(DEFS_LOAD_START)

export const DEFS_LOAD_SUCCESS = 'DEFS_LOAD_SUCCESS'
export const defsLoadSuccess = createAction(DEFS_LOAD_SUCCESS)

export const DEFS_LOAD_FAILURE = 'DEFS_LOAD_FAILURE'
export const defsLoadFailure = createAction(DEFS_LOAD_FAILURE, e => new Error(e))

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
      return dispatch(initProgressFailure('Local storage is not available in this browser'))
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

export const INIT_PROGRESS_FAILURE = 'INIT_PROGRESS_FAILURE'
export const initProgressFailure = createAction(INIT_PROGRESS_FAILURE, e => new Error(e))

export const SET_PROGRESS = 'SET_PROGRESS'
export const setProgress = createAction(SET_PROGRESS)

// Questions

function selectRandomIncluding(list, n, ...including) {
  let result = [...including]
  while (result.length < n) {
    let next = list[_.random(list.length - 1)]
    if ( ! _.includes(result, next)) result.push(next)
  }
  return _.shuffle(result)
}

const KANJI_TO_FETCH = 4

function buildQuestion(kanjiList, kanjiDefs, progress) {
  let kanji = kanjiList[(Math.random() * kanjiList.length) | 0] // TODO
  let words = kanjiDefs.kanji[kanji].map(wordId => kanjiDefs.words[wordId])
  let kanjiOptions = selectRandomIncluding(kanjiList, KANJI_TO_FETCH, kanji)
  return {
    kanji,
    words,
    kanjiOptions
  }
}

export function nextQuestion() {
  return (dispatch, getState) => {
    let kanjiList = getState().kanjiList.list
    let kanjiDefs = getState().kanjiDefs.defs
    let progress = getState().progressStorage.progress
    let question = buildQuestion(kanjiList, kanjiDefs, progress)
    return Promise.map(question.kanjiOptions, kanji => {
      return getPlainText('kanjivg/' + util.kanjiCode(kanji) + '.svg')
        .then(svg => ({
          svg: svgUtil.preprocess($(svg).last()),
          isCorrect: kanji == question.kanji
        }))
        .catch(Error, e => dispatch(svgLoadFailure(e.message)))
        .catch(xhr => dispatch(svgLoadFailure(toErrorMsg(xhr))))
    }).then(answerOptions => dispatch(
      askQuestion(_.assign({}, {
        kanji: question.kanji,
        words: question.words,
        answerOptions
      }))
    ))
  }
}

export const ASK_QUESTION = 'ASK_QUESTION'
export const askQuestion = createAction(ASK_QUESTION)

export const SVG_LOAD_FAILURE = 'SVG_LOAD_FAILURE'
export const svgLoadFailure = createAction(SVG_LOAD_FAILURE, e => new Error(e))
