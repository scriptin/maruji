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

// Usually returns values below 1, with maximum at about 4-8. Presumbly normal distribution or similar
const similarity = (
  weightedComponents1, strokeCount1,
  weightedComponents2, strokeCount2,
  similarityMap
) => {
  let comps1 = _.uniq(weightedComponents1.map(c => c.component))
  let comps2 = _.uniq(weightedComponents2.map(c => c.component))
  let common = _.intersection(comps1, comps2)
  let weigths = weightedComponents2.map(c2 => {
    if (_.includes(common, c2.component)) return c2.weight
    let maxSimilarityScore = _(comps1)
      .filter(c => similarityMap[c])
      .map(c => similarityMap[c][c2.component] || 0)
      .max() || 0
    return c2.weight * maxSimilarityScore
  })
  let strokeCountRatio = Math.min(strokeCount1, strokeCount2) / Math.max(strokeCount1, strokeCount2)
  return _.sum(weigths) * strokeCountRatio
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
    result[a][b] = result[b][a] = score/10
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
        let items = _(kanjiList).take(20).map((thisKanji, idx) => {
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
            .takeWhile((o, idx) => idx < 20 || o.similarity > 3)
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
