'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const util = require('./build-util')

console.log('Reading kanji list and kradfile...')
Promise.join(
  util.readJSON(util.KANJI_LIST_FILE),
  util.readJSON(util.KRAD_FILE),
  (kanjiList, kradfile) => {
    console.log('Restructuring kradfile...')
    let krad = _(kradfile)
      .map((components, kanji) => [ kanji, components.split('') ])
      .fromPairs()
      .value()

    console.log('Picking most similar kanji...')
    let items = _(kanjiList)
      .map((thisKanji, idx) => {
        util.reportProgress(idx, kanjiList.length, 100)
        let similarKanji = _(kanjiList)
          .filter(k => k != thisKanji)
          .map(otherKanji => [ otherKanji, _.intersection(krad[thisKanji], krad[otherKanji]).length ])
          .filter(pair => pair[1] > 0)
          .groupBy(pair => pair[1])
          .map((kanjiPairs, n) => [ +n, kanjiPairs.map(p => p[0]).join('') ])
          .fromPairs()
          .value()
        return [ thisKanji, similarKanji ]
      })
      .fromPairs()
      .value()

    console.log('Writing to "' + util.SIMILAR_KRAD_OUT_FILE + '"...')
    util.write(util.SIMILAR_KRAD_OUT_FILE, JSON.stringify(items, null, '  '))
      .then(() => console.log('Done!'))
  }
)
