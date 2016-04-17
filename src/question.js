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
  kanjiOptions: [{ // If type == STROKE_ORDER or type == MATCHING_VOCAB, then contains a single element
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
  MATCHING_VOCAB: 'MATCHING_VOCAB',
  COMPONENTS: 'COMPONENTS'
}

const HOW_MUCH_KANJI = 8
const HOW_MUCH_WORDS = 24
const KANJI_ANSWER_SIZE = 100
const KANJI_ANSWER_OPTION_SIZE = 90
const KANJIG_PATH = 'kanjivg'

const kanjiToUrl = kanji => KANJIG_PATH + '/' + util.kanjiCode(kanji) + '.svg'

const buildQustionHandle = (progress, kanjiList) => {
  // TODO: build question based on progress data
  let typeList = [
    QUESTION_TYPE.STROKE_ORDER,
    QUESTION_TYPE.RANDOM_KANJI,
    QUESTION_TYPE.SIMILAR_KANJI,
    QUESTION_TYPE.MATCHING_VOCAB
  ]
  let type = typeList[_.random(typeList.length - 1)]
  let kanji = kanjiList[(Math.random() * kanjiList.length) | 0]
  return { type, kanji }
}

const addQuestionDetails = (questionHandle, kanjiList, kanjiVocab, similarKanji, kanjiSounds) => {
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
        .shuffle()
        .value()
        .map(kanji => ({ kanji, correct: kanji == questionHandle.kanji }))
    })
    case QUESTION_TYPE.MATCHING_VOCAB:
      let theKanji = questionHandle.kanji
      let correctWords = getWords(kanjiVocab, theKanji, true)
      let sounds = kanjiSounds[theKanji]
      let otherWords = _(getKanjiWithSimilarSounds(kanjiList, theKanji, kanjiSounds, sounds, HOW_MUCH_KANJI))
        .flatMap(kanji => getWords(kanjiVocab, kanji, false))
        .shuffle()
        .take(HOW_MUCH_WORDS - correctWords.length)
      let allWords = otherWords.concat(correctWords)
        // make sure we don't accidentaly add words for different kanji which contain a target kanji:
        .filter(word => word.correct || ! _.includes(word.vocab.w, theKanji))
        .uniqBy(word => word.id)
        .shuffle()
        .value()
      return _.assign({}, questionHandle, {
        words: allWords,
        kanjiOptions: [{ kanji: theKanji, correct: true }]
      })
    default: throw new Error('Unexpected question type: ' + questionHandle.type)
  }
}

const getKanjiWithSimilarSounds = (kanjiList, targetKanji, kanjiSounds, sounds, howMany) => {
  let candidates = []
  kanjiList.forEach(candidate => {
    if (targetKanji == candidate) return;
    let sameSounds = _.intersection(kanjiSounds[candidate], kanjiSounds[targetKanji]).length
    candidates.push({ candidate, sameSounds })
  })
  return _(candidates)
    .shuffle() // make sure candidates are not in the same order each time
    .orderBy(['sameSounds'], ['desc'])
    .map(o => o.candidate)
    .take(howMany)
    .value()
}

const getWords = (kanjiVocab, kanji, correct) => kanjiVocab.kanji[kanji]
  .map(id => ({ kanji, id, vocab: kanjiVocab.words[id], correct }))

const addQuestionAsyncData = questionWithDetails => {
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
    case QUESTION_TYPE.MATCHING_VOCAB: return postprocessedSvg
    default: throw new Error('Unexpected question type: ' + questionType)
  }
}

const buildAnswerOptions = (questionType, kanji, kanjiDataList, size) => {
  switch (questionType) {
    case QUESTION_TYPE.STROKE_ORDER: return buildStrokeOrderAnswerOptions(kanji, kanjiDataList[0].svg, size)
    case QUESTION_TYPE.RANDOM_KANJI: return buildKanjiAnswerOptions(kanjiDataList, size)
    case QUESTION_TYPE.SIMILAR_KANJI: return buildKanjiAnswerOptions(kanjiDataList, size)
    case QUESTION_TYPE.MATCHING_VOCAB: return []
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
  let kanjiSounds = state.kanjiSoundsStore.sounds

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
    similarKanji,
    kanjiSounds
  )

  // Step 3: add data which needs to be loaded via AJAX requests:
  return addQuestionAsyncData(questionWithDetails)
}
