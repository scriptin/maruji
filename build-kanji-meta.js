'use strict';

const _ = require('lodash')
const fs = require('fs')
const parseString = require('xml2js').parseString
const Promise = require('bluebird')
Promise.promisifyAll(fs)

const KANJI_LIST_FILE = 'data-in/kanji-list.json'
const SIMILAR_KANJI_FILE = 'data-in/similar-kanji.json'
const KANJIVG_DIR = 'src/resources/kanjivg/'
const JUNK_REGEXP = /[A-Z\ud840-\udfff\/？\+]+/gi

const SIMILARITY_THRESHOLD = 0.01
const MIN_SIMILAR = 20

const charCode = char => char.charCodeAt(0).toString(16)
const kanjiCode = kanji => _.padStart(charCode(kanji), 5, '0')
const fileName = kanji => KANJIVG_DIR + kanjiCode(kanji) + '.svg'

const read = file => fs.readFileAsync(file, 'utf8')
const getJSON = fileName => read(fileName).then(text => JSON.parse(text))

const parseXML = xmlString => new Promise((resolve, reject) => {
  parseString(
    xmlString,
    { async: true },
    (err, data) => err ? reject(err) : resolve(data)
  )
})

const getSvgRoot = svg => svg.svg.g[0].g[0]
const containsGroups = g => g.g && _.isArray(g.g) && ! _.isEmpty(g.g)
const containsPaths = g => g.path && _.isArray(g.path) && ! _.isEmpty(g.path)

const extractSvgGroups = (g, level) => {
  let elem = g.$['kvg:element'] || g.$['kvg:phon'] || '？'
  let id = g.$.id.replace('kvg:', '')
  let groupNumber = _.padStart(id.split('-g')[1], 3, '0')
  let part = g.$['kvg:part'] || 0
  let key = [level, groupNumber, elem, part, id].join(':')
  let value = null
  if (containsGroups(g)) {
    value = g.g.map(group => extractSvgGroups(group, level + 1)).filter(_.identity)
    if (_.isEmpty(value)) value = null
  }
  return value ? [key].concat(_.flatten(value)) : [key]
}

const decompose = svg => extractSvgGroups(getSvgRoot(svg), 0).sort()

const extractSvgPathCount = svg => {
  let selfStrokes = 0
  let childrenStrokes = 0
  if (containsPaths(svg)) {
    selfStrokes = svg.path.length
  }
  if (containsGroups(svg)) {
    childrenStrokes = _.sum(svg.g.map(extractSvgPathCount))
  }
  return selfStrokes + childrenStrokes
}

const countStrokes = svg => extractSvgPathCount(getSvgRoot(svg))

const weightComponents = comps => {
  return _.flatMap(comps, c => {
    let parts = c.split(':')
    let level = parts[0]
    if (level > 3) return []
    let elem = parts[2]
    let weight = 1 / Math.pow(level + 1, 1.5)
    return elem
      .replace(JUNK_REGEXP, '')
      .split('')
      .map(component => ({ component, weight }))
  })
}

const componentsSimilarity = (c1, c2, similarityMap) => {
  let a = c1.component, b = c2.component
  let weight = c1.weight * c2.weight
  let similarity = (similarityMap[a] && similarityMap[a][b]) ? similarityMap[a][b] : 0
  return (a == b) ? weight : weight * similarity
}

// Returns numbers in (0, 1) interval, presumbly with normal distribution or similar
const similarity = (
  weightedComponents1, nStrokes1,
  weightedComponents2, nStrokes2,
  similarityMap
) => {
  let score = _(weightedComponents1).flatMap(c1 => {
    return weightedComponents2.map(c2 => componentsSimilarity(c1, c2, similarityMap))
  }).sum()
  let strokeCountRatio = Math.pow(Math.min(nStrokes1, nStrokes2) / Math.max(nStrokes1, nStrokes2), 2)
  return score * strokeCountRatio
}

const buildSvgMap = kanjiList => Promise.all(
  kanjiList.map(kanji => {
    return read(fileName(kanji))
      .then(parseXML)
      .then(svg => [kanji, svg])
  })
).then(_.fromPairs)

const buildSimilarityMap = (kanjiList, similarPairs) => {
  let result = {}
  const init = kanji => {
    if ( ! result[kanji]) result[kanji] = {}
  }
  _.forEach(similarPairs, (score, pairString) => {
    let pair = pairString.split('')
    let a = pair[0], b = pair[1]
    init(a)
    init(b)
    result[a][b] = result[b][a] = Math.pow(score/20, 2)
  })
  return result
}

console.log('Reading kanji list and similar kanji pairs...')
Promise.join(
  getJSON(KANJI_LIST_FILE),
  getJSON(SIMILAR_KANJI_FILE),
  (kanjiList, similarPairs) => {
    console.log('Building svg objects map and similarity map...')
    Promise.join(
      buildSvgMap(kanjiList),
      buildSimilarityMap(kanjiList, similarPairs),
      (svgMap, similarityMap) => {
        console.log('Decomposing kanji...')
        let componentsMap = _(svgMap)
          .map((svg, kanji) => [kanji, decompose(svg)])
          .fromPairs()
          .value()
        // console.log(componentsMap)

        let strokeCountMap = _(svgMap)
          .map((svg, kanji) => [kanji, countStrokes(svg)])
          .fromPairs()
          .value()
        // console.log(strokeCountMap)

        console.log('Calculating component weigths...')
        let weightedComponentsMap = _(componentsMap)
          .map((comps, kanji) => [kanji, weightComponents(comps)])
          .fromPairs()
          .value()
        // console.log(weightedComponentsMap)

        console.log('Picking most similar kanji...')
        const samples = (k, idx) => idx < 20 || (idx > 1000 && idx < 1020) || idx > 2230
        let items = _(kanjiList).filter(samples).map((thisKanji, idx) => {
          if ((idx + 1) % 100 == 0) console.log((idx + 1) + ' of ' + kanjiList.length)
          let similarKanji = _(kanjiList)
            .filter(k => k != thisKanji)
            .map(otherKanji => ({
              kanji: otherKanji,
              similarity: similarity(
                weightedComponentsMap[thisKanji], strokeCountMap[thisKanji],
                weightedComponentsMap[otherKanji], strokeCountMap[otherKanji],
                similarityMap
              )
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .takeWhile((o, idx) => idx < MIN_SIMILAR || o.similarity > SIMILARITY_THRESHOLD)
            .map(o => o.kanji)
            .value()
            .join('')
          return {
            kanji: thisKanji,
            components: componentsMap[thisKanji],
            similar: similarKanji
          }
        })

        console.log(JSON.stringify(items, null, '  '))
      }
    )
  }
)
