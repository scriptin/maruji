import _ from 'lodash'

export const QUESTION_TYPE_STROKE_ORDER = 'QUESTION_TYPE_STROKE_ORDER'
export const QUESTION_TYPE_COMPONENTS = 'QUESTION_TYPE_COMPONENTS'

function selectRandomIncluding(list, n, ...including) {
  let result = [...including]
  while (result.length < n) {
    let next = list[_.random(list.length - 1)]
    if ( ! _.includes(result, next)) result.push(next)
  }
  return _.shuffle(result)
}

const KANJI_TO_FETCH = 4

export function buildQuestion(kanjiList, kanjiDefs, progress) {
  let kanji = kanjiList[(Math.random() * kanjiList.length) | 0] // TODO: choose kanji according to progress
  let isNew = true // TODO: is kanji presented for the first time or has some pregress records?
  let words = kanjiDefs.kanji[kanji].map(wordId => kanjiDefs.words[wordId])
  let kanjiOptions = isNew ? [kanji] : selectRandomIncluding(kanjiList, KANJI_TO_FETCH, kanji)
  let type = isNew ? QUESTION_TYPE_STROKE_ORDER : QUESTION_TYPE_COMPONENTS
  return {
    type,
    kanji,
    words,
    kanjiOptions
  }
}

export function splitIntoStrokes(svg) {
  return svg.find('.strokes path').toArray().map((stroke, idx) => {
    let clone = svg.clone()
    let order = $(stroke).attr('data-order')
    clone.find('.strokes path[data-order!=' + order + ']').addClass('muted')
    clone.find('.strokes path[data-order =' + order + ']').addClass('highlighted')
    return clone
  })
}
