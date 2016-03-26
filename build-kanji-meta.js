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

// Usually returns values below 2, with maximum at about 4
const similarity = (weightedComponents1, strokeCount1, weightedComponents2, strokeCount2) => {
  let common = _.intersection(
    _.uniq(weightedComponents1.map(c => c.component)),
    _.uniq(weightedComponents2.map(c => c.component))
  )
  let w1 = weightedComponents1.map(c => _.includes(common, c.component) ? c.weight : 0)
  let w2 = weightedComponents2.map(c => _.includes(common, c.component) ? c.weight : 0)
  let strokeCountRatio = Math.min(strokeCount1, strokeCount2) / Math.max(strokeCount1, strokeCount2)
  return (_.sum(w1) + _.sum(w2)) * strokeCountRatio
}

const buildSvgData = kanjiList => Promise.all(
  kanjiList.map(kanji => {
    return read(fileName(kanji))
      .then(parseXML)
      .then(svg => [kanji, svg])
  })
).then(_.fromPairs)

const buildSimilarityData = (kanjiList, similarPairs) => {
  const addToSet = (set, elem) => _.uniq(_.concat(set, elem))
  let result = _.fromPairs(
    kanjiList.map(k => [ k, [] ])
  )
  similarPairs.forEach(pair => {
    let a = pair[0], b = pair[1]
    result[a] = addToSet(result[a], b)
    result[b] = addToSet(result[b], a)
  })
  return result
}

console.log('Reading kanji list and similar kanji pairs...')
Promise.join(
  getJSON(KANJI_LIST_FILE),
  getJSON(SIMILAR_KANJI_FILE).then(pairs => pairs.map(p => p.split(''))),
  (kanjiList, similarPairs) => {
    console.log('Building svg objects map and similarity map...')
    Promise.join(
      buildSvgData(kanjiList),
      buildSimilarityData(kanjiList, similarPairs),
      (svgData, similarityData) => {
        console.log('Decomposing kanji...')
        let componentsMap = _(svgData)
          .map((svg, kanji) => [kanji, decompose(svg)])
          .fromPairs()
          .value()
        // console.log(componentsMap)

        let strokeCountMap = _(svgData)
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
          if ((idx + 1) % 100 == 0) console.log((idx + 1) + ' of ' + kanjiList.length)
          let similarKanji = _(kanjiList)
            .filter(k => k != thisKanji)
            .map(otherKanji => ({
              kanji: otherKanji,
              similarity: similarity(
                weightedComponentsMap[thisKanji], strokeCountMap[thisKanji],
                weightedComponentsMap[otherKanji], strokeCountMap[otherKanji]
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
