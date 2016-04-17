'use strict'

const _ = require('lodash')
const fs = require('fs')
const Promise = require('bluebird')
Promise.promisifyAll(fs)
const parseString = require('xml2js').parseString
const https = require('https')

const DATA_IN_DIR  = __dirname + '/data-in/'
const DATA_OUT_DIR = __dirname + '/data-out/'
const KANJIVG_DIR  = __dirname + '/../src/resources/kanjivg/'

const read = file => fs.readFileAsync(file, 'utf8')
const write = (file, text) => fs.writeFileAsync(file, text, 'utf8')

const readJSON = fileName => read(fileName).then(text => JSON.parse(text))

const parseXML = xmlString => new Promise((resolve, reject) => {
  parseString(
    xmlString,
    { async: true },
    (err, data) => err ? reject(err) : resolve(data)
  )
})

const readXML = file => read(file).then(parseXML)

const charCode = char => char.charCodeAt(0).toString(16)
const kanjiCode = kanji => _.padStart(charCode(kanji), 5, '0')
const svgFileName = kanji => KANJIVG_DIR + kanjiCode(kanji) + '.svg'

const toLookupHash = arr => {
  let i = 0
  return arr.reduce((hash, elem) => {
    hash[elem] = i
    i += 1
    return hash
  }, {})
}

const reportProgress = (idx, total, batchSize) => {
  if ((idx + 1) % batchSize == 0) {
    let percent = ((idx + 1) / total * 100) | 0
    console.log((idx + 1) + ' of ' + total + ' (' + percent + '%)')
  }
}

const httpsGet = url => new Promise((resolve, reject) => https.get(url, resolve).on('error', reject))

const httpsDownload = url => httpsGet(url).then(response => {
  return new Promise(resolve => {
    let content = ''
    response.setEncoding('utf8')
    response.on('data', chunk => content += chunk)
    response.on('end', () => resolve(content))
  })
})

module.exports = {
  DATA_IN_DIR,
  DATA_OUT_DIR,
  KANJIVG_DIR,

  KANJI_LIST_FILE:    DATA_IN_DIR + 'kanji-list.json',
  SIMILAR_KANJI_FILE: DATA_IN_DIR + 'similar-kanji.json',
  DICT_FILE:          DATA_IN_DIR + 'jmdict-eng.json',
  WORD_FREQ_FILE:     DATA_IN_DIR + 'wikipedia-20150422-lemmas.tsv',
  KANJIDIC2_FILE:     DATA_IN_DIR + 'kanjidic2.xml',
  KRAD_FILE:          DATA_IN_DIR + 'kradfile.json',

  SIMILAR_KANJI_OUT_FILE: DATA_OUT_DIR + 'similar-kanji.json',
  SIMILAR_KRAD_OUT_FILE:  DATA_OUT_DIR + 'similar-krad.json',
  KANJI_VOCAB_OUT_FILE:   DATA_OUT_DIR + 'kanji-vocab.json',
  KANJI_SOUNDS_OUT_FILE:  DATA_OUT_DIR + 'kanji-sounds.json',

  KANJI_REGEXP: /[\u4e00-\u9fff]+/g,
  JUNK_REGEXP:  /[A-Z\ud840-\udfff\/？\+]+/gi,

  charCode,
  kanjiCode,
  svgFileName,

  read,
  write,
  readJSON,
  readXML,

  toLookupHash,
  reportProgress,

  httpsDownload
}
