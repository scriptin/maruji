'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const util = require('./build-util')

// How many kanji to take from the similarity-ordered list
const SIMILAR_LIST_LENGTH = 20
// Below which value of similarity two kanji are not considered simialar
const SIMILARITY_THRESHOLD = 0.1

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

const weightComponents = comps => comps.map(
  comp => _.assign({}, comp, { weight: 1 / (comp.level + 1) })
)

const getSimilarity = (similarityMaps, type, a, b) => _.get(similarityMaps, [type, a, b], false)

const POSITION_SIMILARITY = {
  'same': 1,
  'left-right': 0.9,
  'top-bottom': 0.9,
  'kamae-kamae1': 0.7,
  'kamae-kamae2': 0.7,
  'kamae1-kamae2': 0.7,
  'none-left': 0.5,
  'none-right': 0.5,
  'none-top': 0.5,
  'none-bottom': 0.5,
  'other': 0.1
}

const positionSimilarity = (p1, p2) => {
  if (p1 == p2) return POSITION_SIMILARITY.same
  let combo1 = p1 + '-' + p2
  let combo2 = p2 + '-' + p1
  return POSITION_SIMILARITY[combo1] || POSITION_SIMILARITY[combo2] || POSITION_SIMILARITY.other
}

const levelSimilarity = (l1, l2) => Math.min(l1 + 1, l2 + 1) / Math.max(l1 + 1, l2 + 1)

const strokeCountSimilarity = (s1, s2) => Math.pow(Math.min(s1, s2) / Math.max(s1, s2), 2)

const componentsSimilarity = (c1, c2, similarityMaps) => {
  let a = c1.component, b = c2.component
  let weight = c1.weight * c2.weight
    * positionSimilarity(c1.position, c2.position)
    * levelSimilarity(c1.level, c2.level)
  let similarity1 = getSimilarity(similarityMaps, "componentsOnly", a, b)
  let similarity2 = getSimilarity(similarityMaps, "both", a, b)
  return (a == b) ? weight : weight * (similarity1 || similarity2 || 0)
}

const similarityForKanji = (a, b, similarityMaps) => {
  let similarity1 = getSimilarity(similarityMaps, "kanjiOnly", a, b)
  let similarity2 = getSimilarity(similarityMaps, "both", a, b)
  return similarity1 || similarity2 || 0
}

const similarityByComponents = (
  a, components1, nStrokes1,
  b, components2, nStrokes2,
  similarityMaps
) => {
  let score = _(components1).map(c1 => {
    return _.max(components2.map(c2 => componentsSimilarity(c1, c2, similarityMaps)))
  }).sum()
  return score * strokeCountSimilarity(nStrokes1, nStrokes2)
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
          .map((svg, kanji) => [ kanji, weightComponents(decompose(svg)) ])
          .fromPairs()
          .value()
        // console.log(componentsMap)

        let strokeCountMap = _(svgMap)
          .map((svg, kanji) => [kanji, countStrokes(svg)])
          .fromPairs()
          .value()
        // console.log(strokeCountMap)

        console.log('Picking most similar kanji...')
        let items = _(kanjiList).map((thisKanji, idx) => {
          util.reportProgress(idx, kanjiList.length, 100)
          let similarKanji = _(kanjiList)
            .filter(k => k != thisKanji)
            .map(otherKanji => {
              let forKanji = similarityForKanji(thisKanji, otherKanji, similarityMaps)
              let byComponents = similarityByComponents(
                thisKanji,  componentsMap[thisKanji],  strokeCountMap[thisKanji],
                otherKanji, componentsMap[otherKanji], strokeCountMap[otherKanji],
                similarityMaps
              )
              return {
                kanji: otherKanji,
                forKanji,
                byComponents,
                score: (forKanji > 0) ? (10 + forKanji) : byComponents
              }
            })
            .sort((a, b) => b.score - a.score)
            .takeWhile((kanji, idx) => idx < SIMILAR_LIST_LENGTH || kanji.score >= SIMILARITY_THRESHOLD)
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
