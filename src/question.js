import _ from 'lodash'
import Promise from 'bluebird'
import * as util from './util'
import * as svgUtil from './svg'

export const QUESTION_TYPE_STROKE_ORDER = 'QUESTION_TYPE_STROKE_ORDER'
export const QUESTION_TYPE_COMPONENTS = 'QUESTION_TYPE_COMPONENTS'

const KANJI_ANSWER_SIZE = 100
const KANJI_OPTION_SIZE = 90

const KANJI_TO_FETCH = 6
const KANJIG_PATH = 'kanjivg'

const kanjiToUrl = kanji => KANJIG_PATH + '/' + util.kanjiCode(kanji) + '.svg'

const selectRandomIncluding = (list, n, ...including) => {
  let result = [...including]
  while (result.length < n) {
    let next = list[_.random(list.length - 1)]
    if ( ! _.includes(result, next)) result.push(next)
  }
  return _.shuffle(result)
}

const buildQuestionBase = (kanjiList, kanjiDefs, progress) => {
  // TODO: build question based on progress data.
  let type = (Math.random() > 0.8) ? QUESTION_TYPE_STROKE_ORDER : QUESTION_TYPE_COMPONENTS
  let kanji = kanjiList[(Math.random() * kanjiList.length) | 0]
  let isNew = true
  let words = kanjiDefs.kanji[kanji].map(wordId => kanjiDefs.words[wordId])
  let kanjiOptions = (type == QUESTION_TYPE_STROKE_ORDER)
    ? [kanji]
    : selectRandomIncluding(kanjiList, KANJI_TO_FETCH, kanji)
  return { type, kanji, kanjiOptions, words }
}

const prepareSvg = (svg, questionType) => {
  let postprocessedSvg = svgUtil.postprocess(svg, KANJI_ANSWER_SIZE)
  switch (questionType) {
    case QUESTION_TYPE_STROKE_ORDER: return svgUtil.muteAllStrokes(postprocessedSvg)
    case QUESTION_TYPE_COMPONENTS: return postprocessedSvg // TODO
    default: throw new Error('Unexpected question type: ' + questionType)
  }
}

const buildOptions = (kanji, kanjiDataList, split, size) => _(kanjiDataList)
  .map(k => split(k.svg, k.svgMeta))
  .flatten()
  .map((svg, idx) => ({
    svg: svgUtil.postprocess(svg, size),
    answerId: idx,
    answered: false,
    correct: kanji == svg.find('.strokes > g').first().attr(svgUtil.DATA_PREFIX + 'element'),
    active: true
  }))
  .shuffle()
  .value()

const buildAnswerOptions = (kanji, kanjiDataList, questionType, svgSize) => {
  switch (questionType) {
    case QUESTION_TYPE_STROKE_ORDER: return buildOptions(
      kanji,
      kanjiDataList,
      svgUtil.splitIntoStrokes,
      svgSize
    )
    case QUESTION_TYPE_COMPONENTS: return buildOptions(
      kanji,
      kanjiDataList,
      svgUtil.splitIntoComponents,
      svgSize
    )
    default: throw new Error('Unexpected question type: ' + questionType)
  }
}

export const buildQuestion = (kanjiList, kanjiDefs, progress) => {
  let question = buildQuestionBase(kanjiList, kanjiDefs, progress)
  return Promise.map(question.kanjiOptions, kanji => {
    return util.getPlainText(kanjiToUrl(kanji))
      .then(svgPlainText => {
        let svg = svgUtil.preprocess($(svgPlainText).last())
        let svgMeta = svgUtil.getMetadata(svg)
        let correct = kanji == question.kanji
        return { kanji, svg, svgMeta, correct }
      })
  })
  .then(kanjiDataList => {
    let originalKanjiDataItem = kanjiDataList.find(k => k.correct)
    let kanjiSvg = prepareSvg(
      originalKanjiDataItem.svg.clone(),
      question.type
    )
    let answerOptions = buildAnswerOptions(
      question.kanji,
      kanjiDataList,
      question.type,
      KANJI_OPTION_SIZE
    )
    return {
      type: question.type,
      kanji: question.kanji,
      kanjiSvg,
      words: question.words,
      answerOptions,
      kanjiDataList
    }
  })
}
