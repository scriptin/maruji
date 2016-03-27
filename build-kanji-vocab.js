'use strict'

const _ = require('lodash')
const fs = require('fs')
const Promise = require('bluebird')
Promise.promisifyAll(fs)

const DATA_IN_DIR = 'data-in/'
const KANJI_LIST_FILE = DATA_IN_DIR + 'kanji-list.json'
const DICT_FILE = DATA_IN_DIR + 'jmdict-eng.json'
const WORD_FREQ_FILE = DATA_IN_DIR + 'wikipedia-20150422-lemmas.tsv'
const KANJI_DEFS_FILE = 'data-out/kanji-vocab.json'
const KANJI_REGEXP = /[\u4e00-\u9fff]+/g
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

console.log('Reading data files...')
Promise.join(
  fs.readFileAsync(KANJI_LIST_FILE, 'utf8'),
  fs.readFileAsync(DICT_FILE, 'utf8'),
  fs.readFileAsync(WORD_FREQ_FILE, 'utf8'),
  (kanjiListData, dictData, wordFreqData) => {
    console.log('Parsing data files...')
    let kanjiList = JSON.parse(kanjiListData)
    let dict = JSON.parse(dictData)
    let wordFreq = wordFreqData.split('\n').map(line => _.last(line.split('\t')))

    console.log('Patching/fixing the dictionary...')
    dictPatches.forEach(patch => patch(dict))
    console.log(dictPatches.length + ' patch applied')

    console.log('Extracting all words from the dictionary which have any kanji from the list...')
    let wordsWithKanji = getWordsWithKanji(dict, kanjiList)
    console.log('Found ' + wordsWithKanji.length + ' words')

    console.log('Filtering the frequency-ordered word list...')
    let wordsWithKanjiHash = toLookupHash(wordsWithKanji)
    let wordFreqList = wordFreq.filter(w => wordsWithKanjiHash[w] >= 0)
    console.log('Filtered down to ' + wordFreqList.length + ' words')

    console.log('Building a lookup hash for word frequencies...')
    let workFreqHash = toLookupHash(wordFreqList)

    console.log('Building kanji definitions...')
    let defs = buildDefs(kanjiList, dict, workFreqHash)

    console.log('Optimizing definitions...')
    optimizeDefs(defs, workFreqHash, MAX_WORDS)

    console.log('Validating...')
    validateDefs(defs)

    console.log('Number of words in a final definitions: ' + _.keys(defs.words).length)

    console.log('Writing to file "' + KANJI_DEFS_FILE + '"...')
    return fs.writeFile(KANJI_DEFS_FILE, JSON.stringify(defs, null, '  '), 'utf8')
  }
).then(() => console.log('Done'))

const toLookupHash = arr => {
  let i = 0
  return arr.reduce((hash, elem) => {
    hash[elem] = i
    i += 1
    return hash
  }, {})
}

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

const reportProgress = (idx, total, batchSize) => {
  if ((idx + 1) % batchSize == 0) {
    let percent = ((idx + 1) / total * 100) | 0
    console.log((idx + 1) + ' of ' + total + ' (' + percent + '%)')
  }
}

const buildDefs = (kanjiList, dict, wordFreqHash) => {
  let kanjiDefs = {
    kanji: _(kanjiList).map(kanji => [ kanji, [] ]).fromPairs().value(),
    words: {}
  }

  let wordsTotal = dict.words.length
  dict.words.forEach((word, idx) => {
    reportProgress(idx, wordsTotal, 10000)

    // Ignore kana-only words
    if (word.kanji.length == 0) return

    let w = getWriting(word, kanjiList, wordFreqHash)
    if (w == null) return

    let rs = getReadings(word, w)
    if (_.isEmpty(rs)) return

    let ts = getTranslations(word, w, rs.map(getText))
    if (_.isEmpty(ts)) return

    let wordId = '' + word.id
    kanjiDefs.words[wordId] = buildCompactWord(w, rs, ts)
    w.text.split('').forEach(char => {
      if ( ! _.isUndefined(kanjiDefs.kanji[char])) {
        kanjiDefs.kanji[char].push(wordId)
      }
    })
  })

  return kanjiDefs
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

const validateDefs = defs => {
  noneExist(defs.kanji, (kanji, refs) => _.isEmpty(refs), 'Kanji without refs to words')
  noneExist(defs.words, (id, word) => _.isEmpty(word.w), 'Words without writings')
  noneExist(defs.words, (id, word) => _.isEmpty(word.r), 'Words without readings')
  noneExist(defs.words, (id, word) => _.isEmpty(word.t), 'Words without translations')
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

const optimizeDefs = (defs, workFreqHash, topN) => {
  let usedRefs = {}

  _.keys(defs.kanji).forEach(kanji => {
    // Sort lists of refs by frequencies of corresponding words
    defs.kanji[kanji] = defs.kanji[kanji].sort((a, b) => {
      let wa = defs.words[a].w
      let wb = defs.words[b].w
      return (workFreqHash[wa] || -1) - (workFreqHash[wb] || -1)
    }).slice(0, topN)
    defs.kanji[kanji].forEach(ref => usedRefs[ref] = true)
  })

  // Remove words which are not referenced from any kanji ref lists
  defs.words = _.fromPairs(
    _.toPairs(defs.words).filter(pair => usedRefs[pair[0]])
  )
}
