import _ from 'lodash'
import Promise from 'bluebird'
import * as util from './util'
import * as svgUtil from './svg'

/* * *
Data structures
===============

Question handle is ment to be a basis for constructing the full question:

question handle :: {
  type :: Enum,
  kanji :: Char
}

Question is constructed from question handle by adding more fields:

question :: {
  type :: Enum,
  kanji :: Char,
  kanjiSvg :: jQuery,
  kanjiOptions: [{ // If type == STROKE_ORDER, then contains a single element
    kanji :: Char,
    correct :: Boolean // `true` if this.kanji == question.kanji
  }]
  words: [{
    kanji :: Char, // Kanji for which this word was selected
    id :: String, // Vocabulary item ID
    vocab :: Object, // See `kanji-vocab.json` file
    correct :: Boolean // Always `true` if type != MATCHING_VOCAB
  }],
  answerOptions: [{ // Empty if type == MATCHING_VOCAB
    svg :: jQuery,
    correct :: Boolean,
    order :: Int|null // Set only when type == STROKE_ORDER, `null` otherwise
  }]
}
 * * */

export const QUESTION_TYPE = {
  STROKE_ORDER: 'STROKE_ORDER',
  RANDOM_KANJI: 'RANDOM_KANJI',
  SIMILAR_KANJI: 'SIMILAR_KANJI',
  COMPONENTS: 'COMPONENTS',
  MATCHING_VOCAB: 'MATCHING_VOCAB'
}

const HOW_MUCH_KANJI = 8
const KANJI_ANSWER_SIZE = 100
const KANJI_ANSWER_OPTION_SIZE = 90
const KANJIG_PATH = 'kanjivg'

const kanjiToUrl = kanji => KANJIG_PATH + '/' + util.kanjiCode(kanji) + '.svg'

const buildQustionHandle = (progress, kanjiList) => {
  // TODO: build question based on progress data
  let typeList = [
    QUESTION_TYPE.STROKE_ORDER,
    QUESTION_TYPE.RANDOM_KANJI,
    QUESTION_TYPE.SIMILAR_KANJI
  ]
  let type = typeList[_.random(typeList.length - 1)]
  let kanji = kanjiList[(Math.random() * kanjiList.length) | 0]
  return { type, kanji }
}

const addQuestionDetails = (questionHandle, kanjiList, kanjiVocab, similarKanji) => {
  switch (questionHandle.type) {
    case QUESTION_TYPE.STROKE_ORDER: return _.assign({}, questionHandle, {
      words: getWords(kanjiVocab, questionHandle.kanji, true),
      kanjiOptions: [{ kanji: questionHandle.kanji, correct: true }]
    })
    case QUESTION_TYPE.RANDOM_KANJI: return _.assign({}, questionHandle, {
      words: getWords(kanjiVocab, questionHandle.kanji, true),
      kanjiOptions: util.selectRandomIncluding(kanjiList, HOW_MUCH_KANJI, questionHandle.kanji)
        .map(kanji => ({ kanji, correct: kanji == questionHandle.kanji }))
    })
    case QUESTION_TYPE.SIMILAR_KANJI: return _.assign({}, questionHandle, {
      words: getWords(kanjiVocab, questionHandle.kanji, true),
      kanjiOptions: _(similarKanji[questionHandle.kanji])
        .shuffle()
        .take(HOW_MUCH_KANJI - 1)
        .concat(questionHandle.kanji)
        .value()
        .map(kanji => ({ kanji, correct: kanji == questionHandle.kanji }))
    })
    default: throw new Error('Unexpected question type: ' + questionHandle.type)
  }
}

const getWords = (kanjiVocab, kanji, correct) => kanjiVocab.kanji[kanji]
  .map(id => ({ kanji, id, vocab: kanjiVocab.words[id], correct }))

const addQuestionAsyncData = questionWithDetails => {
  if (questionWithDetails.type == QUESTION_TYPE.MATCHING_VOCAB) {
    // In this case there is nothing to fetch, instead we just add empty list of answer options,
    // because all answer options are in the list of words, not list of kanji
    return Promise.resolve(
      _.assign({}, questionWithDetails, { answerOptions: [] })
    )
  }
  return Promise.map(questionWithDetails.kanjiOptions, ({ kanji, correct }) => {
    return util.getPlainText(kanjiToUrl(kanji))
      .then(svgPlainText => {
        let svg = svgUtil.preprocess($(svgPlainText).last())
        let svgMeta = svgUtil.getMetadata(svg)
        return { kanji, svg, svgMeta, correct }
      })
  })
  .then(kanjiDataList => {
    let originalKanjiDataItem = kanjiDataList.find(k => k.correct)
    let kanjiSvg = prepareSvg(
      questionWithDetails.type,
      originalKanjiDataItem.svg.clone(),
      KANJI_ANSWER_SIZE
    )
    let answerOptions = buildAnswerOptions(
      questionWithDetails.type,
      questionWithDetails.kanji,
      kanjiDataList,
      KANJI_ANSWER_OPTION_SIZE
    )
    return _.assign({}, questionWithDetails, { kanjiSvg, answerOptions })
  })
}

const prepareSvg = (questionType, svg, size) => {
  let postprocessedSvg = svgUtil.postprocess(svg, size)
  switch (questionType) {
    case QUESTION_TYPE.STROKE_ORDER: return svgUtil.muteAllStrokes(postprocessedSvg)
    case QUESTION_TYPE.RANDOM_KANJI: return svgUtil.hideRoot(postprocessedSvg)
    case QUESTION_TYPE.SIMILAR_KANJI: return svgUtil.hideRoot(postprocessedSvg)
    default: throw new Error('Unexpected question type: ' + questionType)
  }
}

const buildAnswerOptions = (questionType, kanji, kanjiDataList, size) => {
  switch (questionType) {
    case QUESTION_TYPE.STROKE_ORDER: return buildStrokeOrderAnswerOptions(kanji, kanjiDataList[0].svg, size)
    case QUESTION_TYPE.RANDOM_KANJI: return buildKanjiAnswerOptions(kanjiDataList, size)
    case QUESTION_TYPE.SIMILAR_KANJI: return buildKanjiAnswerOptions(kanjiDataList, size)
    default: throw new Error('Unexpected question type: ' + questionType)
  }
}

const buildStrokeOrderAnswerOptions = (kanji, svg, size) => _(svgUtil.splitIntoStrokes(svg))
  .map((svg, idx) => ({
    svg: svgUtil.postprocess(svg, size),
    correct: true,
    order: idx
  }))
  .shuffle()
  .value()

const buildKanjiAnswerOptions = (kanjiDataList, size) => kanjiDataList.map(kanjiDataItem => ({
  svg: svgUtil.postprocess(kanjiDataItem.svg, size),
  correct: kanjiDataItem.correct,
  order: null
}))

export const buildQuestion = state => {
  let progress = state.progressStore.progress
  let kanjiList = state.kanjiListStore.list
  let kanjiVocab = state.kanjiVocabStore.vocab
  let similarKanji = state.similarKanjiStore.similar

  // Step 1: build question handle
  let questionHandle = buildQustionHandle(
    progress,
    kanjiList
  )

  // Step 2: add data which can be gathered syncroniously
  let questionWithDetails = addQuestionDetails(
    questionHandle,
    kanjiList,
    kanjiVocab,
    similarKanji
  )

  // Step 3: add data which needs to be loaded via AJAX requests:
  return addQuestionAsyncData(questionWithDetails)
}
