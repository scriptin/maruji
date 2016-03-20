import _ from 'lodash'
import $ from 'jquery'
import Promise from 'bluebird'

export const kanjiCode = kanji => _.padStart(kanji.charCodeAt(0).toString(16), 5, '0')

export const xhrToErrorMsg = xhr => _.trim(xhr.responseText, '\r\n\t ') + ' (' + xhr.statusText + ')'

export const getJSON = url => Promise.resolve($.getJSON(url))

export const getPlainText = url => Promise.resolve($.get({
  url,
  dataType: 'text'
}))

export const replaceElement = (arr, idx, elem) =>
  _.concat(arr.slice(0, idx), elem).concat(arr.slice(idx + 1))
