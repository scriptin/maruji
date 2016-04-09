'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const util = require('./build-util')

// How many kanji to take from the similarity-ordered list
const SIMILAR_LIST_LENGTH = 20
// Below which value of similarity two kanji are not considered simialar
const SIMILARITY_THRESHOLD = 0.05

const getSvgRoot = svg => svg.svg.g[0].g[0]
const containsGroups = g => g.g && _.isArray(g.g) && ! _.isEmpty(g.g)
const containsPaths = g => g.path && _.isArray(g.path) && ! _.isEmpty(g.path)

const extractGroupMetadata = (g, level) => {
  let element = g.$['kvg:element'] || g.$['kvg:phon'] || '？'
  let position = g.$['kvg:position'] || 'none'
  let groupMetadata = { element, level, position }
  let subgroupsMetadata = []
  if (containsGroups(g)) {
    subgroupsMetadata = _.flatten(
      g.g.map(group => extractGroupMetadata(group, level + 1))
    ).filter(_.identity)
  }
  return [groupMetadata].concat(subgroupsMetadata)
}

const decompose = svg => {
  let groups = extractGroupMetadata(getSvgRoot(svg), 0)
  return _.flatten(groups.map(g => {
    return g.element
      .replace(util.JUNK_REGEXP, '')
      .split('')
      .map(component => ({
        component,
        level: g.level,
        position: g.position
      }))
  }))
}

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
  let levels = comps.map(c => c.level)
  let nComponentsOnLevel = _.countBy(levels)
  // Levels hold equal amount of weight, distributed among all components on a level
  let weightPerLevel = 1 / (_.max(levels) + 1)

  return comps.map(comp => ({
    component: comp.component,
    weight: weightPerLevel / nComponentsOnLevel[comp.level]
  }))
}

const getSimilarity = (similarityMaps, type, a, b) => {
  if (similarityMaps[type][a] && similarityMaps[type][a][b]) {
    return similarityMaps[type][a][b]
  }
  return false
}

const POSITION_SIMILARITY = {
  'same': 1,
  'left-right': 0.9,
  'top-bottom': 0.9,
  'kamae-kamae1': 0.5,
  'kamae-kamae2': 0.5,
  'kamae1-kamae2': 0.5,
  'other': 0.1
}

const getPositionSimilarity = (p1, p2) => {
  if (p1 == p2) return POSITION_SIMILARITY.same
  let combo1 = p1 + '-' + p2
  let combo2 = p2 + '-' + p1
  return POSITION_SIMILARITY[combo1] || POSITION_SIMILARITY[combo2] || POSITION_SIMILARITY.other
}

const componentsSimilarity = (c1, c2, similarityMaps) => {
  let a = c1.component, b = c2.component
  let weight = c1.weight * c2.weight * getPositionSimilarity(c1.position, c2.position)
  let similarity1 = getSimilarity(similarityMaps, "componentsOnly", a, b)
  let similarity2 = getSimilarity(similarityMaps, "both", a, b)
  return (a == b) ? weight : weight * (similarity1 || similarity2 || 0)
}

// Returns a number in (0, 1) interval
const similarity = (
  a, weightedComponents1, nStrokes1,
  b, weightedComponents2, nStrokes2,
  similarityMaps
) => {
  let similarity1 = getSimilarity(similarityMaps, "kanjiOnly", a, b)
  let similarity2 = getSimilarity(similarityMaps, "both", a, b)
  if (similarity1 || similarity2) {
    return similarity1 || similarity2
  } else {
    let score = _(weightedComponents1).flatMap(c1 => {
      return weightedComponents2.map(c2 => componentsSimilarity(c1, c2, similarityMaps))
    }).sum()
    let strokeCountRatio = Math.min(nStrokes1, nStrokes2) / Math.max(nStrokes1, nStrokes2)
    return score * Math.pow(strokeCountRatio, 2)
  }
}

const buildSvgMap = kanjiList => Promise.all(
  kanjiList.map(kanji => {
    return util.readXML(util.svgFileName(kanji))
      .then(svg => [ kanji, svg ])
  })
).then(_.fromPairs)

const buildSimilarityMaps = (kanjiList, similarPairs) => {
  let result = _.fromPairs(_.keys(similarPairs).map(k => [k, {}]))
  const init = (type, kanji) => {
    if ( ! result[type][kanji]) result[type][kanji] = {}
  }
  _.keys(similarPairs).forEach(type => {
    _.forEach(similarPairs[type], (score, pairString) => {
      let pair = pairString.split('')
      let a = pair[0], b = pair[1]
      init(type, a)
      init(type, b)
      result[type][a][b] = result[type][b][a] = Math.pow(score/10, 2)
    })
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
      buildSimilarityMaps(kanjiList, similarPairs),
      (svgMap, similarityMaps) => {
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
                thisKanji, weightedComponentsMap[thisKanji], strokeCountMap[thisKanji],
                otherKanji, weightedComponentsMap[otherKanji], strokeCountMap[otherKanji],
                similarityMaps
              )
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .takeWhile((kanji, idx) => idx < SIMILAR_LIST_LENGTH || kanji.similarity >= SIMILARITY_THRESHOLD)
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
