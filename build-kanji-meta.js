'use strict';

const _ = require('lodash')
const fs = require('fs')
const parseString = require('xml2js').parseString
const Promise = require('bluebird')
Promise.promisifyAll(fs)

const KANJI_LIST_FILE = 'data-in/kanji-list.json'
const KANJIVG_DIR = 'src/resources/kanjivg/'
const JUNK_REGEXP = /[A-Z\ud840-\udfff\/？\+]+/gi

const charCode = char => char.charCodeAt(0).toString(16)
const kanjiCode = kanji => _.padStart(charCode(kanji), 5, '0')

const read = file => fs.readFileAsync(file, 'utf8')

const parse = xmlString => new Promise((resolve, reject) => {
  parseString(
    xmlString,
    { async: true },
    (err, data) => err ? reject(err) : resolve(data)
  )
})

const containsGroups = g => g.g && _.isArray(g.g) && ! _.isEmpty(g.g)
const containsPaths = g => g.path && _.isArray(g.path) && ! _.isEmpty(g.path)

const transformSvgGroup = (g, level) => {
  let elem = g.$['kvg:element'] || g.$['kvg:phon'] || '？'
  let id = g.$.id.replace('kvg:', '')
  let groupNumber = _.padStart(id.split('-g')[1], 3, '0')
  let part = g.$['kvg:part'] || 0
  let key = [level, groupNumber, elem, part, id].join(':')
  let value = null
  if (containsGroups(g)) {
    value = g.g.map(group => transformSvgGroup(group, level + 1)).filter(_.identity)
    if (_.isEmpty(value)) value = null
  }
  return value ? [key].concat(_.flatten(value)) : [key]
}

const decomp = svg => _.tail(transformSvgGroup(svg.svg.g[0].g[0], 0)).sort()

let kanjiList

const weightComps = comps => {
  return _.flatMap(comps, c => {
    let parts = c.split(':')
    let level = parts[0]
    if (level > 3) return []
    let elem = parts[2]
    return elem
      .replace(JUNK_REGEXP, '')
      .split('')
      .map(char => [char, 1 / Math.pow(level, 2)])
  })
}

const similarity = (k1, k2, weights) => {
  return _.sum(
    weights[k1].map(w1 => {
      let corresponding = weights[k2].filter(w2 => w1[0] == w2[0])
      return _.sum(corresponding.map(w2 => w1[1]*w2[1])) || 0
    })
  ) || 0
}

read(KANJI_LIST_FILE)
  .then(kanjiListText => {
    kanjiList = JSON.parse(kanjiListText)
    return kanjiList.map(kanji => [
      kanji,
      KANJIVG_DIR + kanjiCode(kanji) + '.svg'
    ])
  })
  .map(pair => read(pair[1]).then(parse).then(svg => [pair[0], svg]))
  .all()
  .then(pairs => {
    let items = _(pairs)
      .map(pair => [pair[0], { components: decomp(pair[1]) }])
      .fromPairs()
      .value()
    let weightedComponents = _(items)
      .map((item, kanji) => [kanji, weightComps(item.components)])
      .fromPairs()
      .value()
    _.forEach(items, (item, kanji) => {
      item.similar = _(kanjiList)
        .filter(k => k != kanji)
        .map(k => [k, similarity(kanji, k, weightedComponents)])
        .sort((a, b) => b[1] - a[1])
        .map(pair => pair[0])
        .take(20)
        .value()
        .join('')
    })
    console.log(JSON.stringify(items, null, '  '))
  })
