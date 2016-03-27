'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const util = require('./build-util')

const MAX_WORDS = 10
const EXCLUDED_TAGS = [
  'iK', 'ik',
  'oK', 'ok',
  'io', 'oik',
  'obs', 'arch',
  'X', 'obsc', 'vulg', 'derog'
]

const dictPatches = [
  dict => { // "ラー油" and "辣油" are both should be read as "ラーユ"
    let idx = dict.words.findIndex((w) => w.id == 1137730)
    dict.words[idx].kana[0].appliesToKanji = [ '*' ]
  }
]

const containsAnyCharacter = (word, chars) => ! _.isUndefined(chars.find(char => _.includes(word, char)))

const getWordsWithKanji = (dict, kanjiList) => {
  return _.flatten(
    dict.words.map(word => {
      return word.kanji
        .map(writing => writing.text)
        .filter(text => containsAnyCharacter(text, kanjiList))
    })
  )
}

const hasExcludedTags = tags => ! _.isEmpty(_.intersection(EXCLUDED_TAGS, tags))

const applies = (appliesList, all) => _.includes(appliesList, '*') || ! _.isEmpty(_.intersection(all, appliesList))

const buildKanjiVocab = (kanjiList, dict, wordFreqHash) => {
  let kanjiVocab = {
    kanji: _(kanjiList).map(kanji => [ kanji, [] ]).fromPairs().value(),
    words: {}
  }

  let wordsTotal = dict.words.length
  dict.words.forEach((word, idx) => {
    util.reportProgress(idx, wordsTotal, 10000)

    // Ignore kana-only words
    if (word.kanji.length == 0) return

    let w = getWriting(word, kanjiList, wordFreqHash)
    if (w == null) return

    let rs = getReadings(word, w)
    if (_.isEmpty(rs)) return

    let ts = getTranslations(word, w, rs.map(getText))
    if (_.isEmpty(ts)) return

    let wordId = '' + word.id
    kanjiVocab.words[wordId] = buildCompactWord(w, rs, ts)
    w.text.split('').forEach(char => {
      if ( ! _.isUndefined(kanjiVocab.kanji[char])) {
        kanjiVocab.kanji[char].push(wordId)
      }
    })
  })

  return kanjiVocab
}

const getText = obj => obj.text

const getWriting = (word, kanjiList, wordFreqHash) => {
  // Don't use other forms for simplicity
  let w = word.kanji[0]
  if (
    wordFreqHash[w.text] >= 0 &&
    containsAnyCharacter(w.text, kanjiList) &&
    ! hasExcludedTags(w.tags)
  ) return w
  return null
}

const getReadings = (word, writing) => {
  return word.kana.filter(r => {
    return applies(r.appliesToKanji, [writing]) &&
      ! hasExcludedTags(r.tags)
  })
}

const getTranslations = (word, writing, readings) => {
  return word.sense.filter(t => {
    return applies(t.appliesToKanji, [writing]) &&
      applies(t.appliesToKana, readings) &&
      ! hasExcludedTags(t.misc)
  })
}

const validateKanjiVocab = kanjiVocab => {
  noneExist(kanjiVocab.kanji, (kanji, refs) => _.isEmpty(refs), 'Kanji without refs to words')
  noneExist(kanjiVocab.words, (id, word) => _.isEmpty(word.w), 'Words without writings')
  noneExist(kanjiVocab.words, (id, word) => _.isEmpty(word.r), 'Words without readings')
  noneExist(kanjiVocab.words, (id, word) => _.isEmpty(word.t), 'Words without translations')
}

const noneExist = (obj, filter, description) => {
  let found = _.toPairs(obj).filter(pair => filter(pair[0], pair[1]))
  if ( ! _.isEmpty(found)) {
    throw new Error(
      description + ':\n' +
      found.map(p => p.map(JSON.stringify).join(': ')).join(',\n')
    )
  }
}

const buildCompactWord = (writing, readings, translations) => {
  return {
    w: writing.text,
    r: readings.map(getText),
    t: translations.map(t => ({
      pos: t.partOfSpeech,
      forKana: t.appliesToKana,
      gloss: t.gloss.map(getText)
    }))
  }
}

const optimizeKanjiVocab = (kanjiVocab, workFreqHash, topN) => {
  let usedRefs = {}

  _.keys(kanjiVocab.kanji).forEach(kanji => {
    // Sort lists of refs by frequencies of corresponding words
    kanjiVocab.kanji[kanji] = kanjiVocab.kanji[kanji].sort((a, b) => {
      let wa = kanjiVocab.words[a].w
      let wb = kanjiVocab.words[b].w
      return (workFreqHash[wa] || -1) - (workFreqHash[wb] || -1)
    }).slice(0, topN)
    kanjiVocab.kanji[kanji].forEach(ref => usedRefs[ref] = true)
  })

  // Remove words which are not referenced from any kanji ref lists
  kanjiVocab.words = _.fromPairs(
    _.toPairs(kanjiVocab.words).filter(pair => usedRefs[pair[0]])
  )
}

console.log('Reading data files...')
Promise.join(
  util.readJSON(util.KANJI_LIST_FILE),
  util.readJSON(util.DICT_FILE),
  util.read(util.WORD_FREQ_FILE)
    .then(text => text.split('\n').map(line => _.last(line.split('\t')))),
  (kanjiList, dict, wordFreq) => {
    console.log('Patching/fixing the dictionary...')
    dictPatches.forEach(patch => patch(dict))
    console.log(dictPatches.length + ' patch(es) applied')

    console.log('Extracting all words from the dictionary which have any kanji from the list...')
    let wordsWithKanji = getWordsWithKanji(dict, kanjiList)
    console.log('Found ' + wordsWithKanji.length + ' words')

    console.log('Filtering the frequency-ordered word list...')
    let wordsWithKanjiHash = util.toLookupHash(wordsWithKanji)
    let wordFreqList = wordFreq.filter(w => wordsWithKanjiHash[w] >= 0)
    console.log('Filtered down to ' + wordFreqList.length + ' words')

    console.log('Building a lookup hash for word frequencies...')
    let workFreqHash = util.toLookupHash(wordFreqList)

    console.log('Building kanji-vocab data...')
    let kanjiVocab = buildKanjiVocab(kanjiList, dict, workFreqHash)
    console.log('Optimizing kanji-vocab data...')
    optimizeKanjiVocab(kanjiVocab, workFreqHash, MAX_WORDS)
    console.log('Validating kanji-vocab data...')
    validateKanjiVocab(kanjiVocab)
    console.log('Number of words in a final kanji-vocab data: ' + _.keys(kanjiVocab.words).length)

    console.log('Writing to file "' + util.KANJI_VOCAB_OUT_FILE + '"...')
    util.write(util.KANJI_VOCAB_OUT_FILE, JSON.stringify(kanjiVocab, null, '  '))
      .then(() => console.log('Done'))
  }
)
