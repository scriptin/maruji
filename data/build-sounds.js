'use strict';

const _ = require('lodash')
const Promise = require('bluebird')
const util = require('./build-util')

const READING_TYPES = ['ja_on', 'ja_kun']
const NOT_KANA = /[^ぁ-ゔゞァ-・ヽヾ゛゜ー]+/g

const cleanupReading = r => r.split('.')[0].replace(NOT_KANA, '')

console.log('Reading kanji list and kanjidic2 file...')
Promise.join(
  util.readJSON(util.KANJI_LIST_FILE),
  util.readXML(util.KANJIDIC2_FILE),
  (kanjiList, kanjidic2) => {
    let kanjiLookupHash = util.toLookupHash(kanjiList)

    console.log('Extracting sounds for kanji in the list...')
    let sounds = _(kanjidic2.kanjidic2.character)
      .map(entry => {
        let kanji = entry.literal[0]
        let readings = []
        if (entry.reading_meaning) {
          readings = _(entry.reading_meaning[0].rmgroup).flatMap(rmgroup => {
            if ( ! rmgroup.reading) return []
            return rmgroup.reading
              .filter(r => _.includes(READING_TYPES, r.$.r_type))
              .map(r => cleanupReading(r._))
          }).uniq().value()
        }
        return [kanji, readings]
      })
      .filter(pair => kanjiLookupHash[pair[0]])
      .fromPairs()

    console.log('Writing to "' + util.KANJI_SOUNDS_OUT_FILE + '"...')
    util.write(util.KANJI_SOUNDS_OUT_FILE, JSON.stringify(sounds, null, '  '))
      .then(() => console.log('Done!'))
  }
)
