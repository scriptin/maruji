'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const util = require('./build-util')

// How many kanji to take from the similarity-ordered list
const SIMILAR_LIST_LENGTH = 20

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
      .replace(util.JUNK_REGEXP, '')
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
  kanjiList.map(kanji => util.readXML(util.svgFileName(kanji)).then(svg => [ kanji, svg ]))
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
  util.readJSON(util.KANJI_LIST_FILE),
  util.readJSON(util.SIMILAR_KANJI_FILE),
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
        let items = _(kanjiList).map((thisKanji, idx) => {
          util.reportProgress(idx, kanjiList.length, 100)
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
            .take(SIMILAR_LIST_LENGTH)
            .map(o => o.kanji)
            .join('')
          return [ thisKanji, similarKanji ]
        }).fromPairs().value()

        console.log('Writing to "' + util.SIMILAR_KANJI_OUT_FILE + '"...')
        util.write(util.SIMILAR_KANJI_OUT_FILE, JSON.stringify(items, null, '  '))
          .then(() => console.log('Done!'))
      }
    )
  }
)
