'use strict'

const _ = require('lodash')
const util = require('./build-util')

const URL_TEMPLATE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/%.svg'
const toUrl = code => URL_TEMPLATE.replace('%', code)

const cleanSvg = svgText => svgText
  .replace(/<!DOCTYPE(.|[\n])*\]>/g, '') // Remove DOCTYPE
  .replace(/<!--(.|[\n])*-->/g, '') // Remove comments
  .replace(/[\n]{2,}/g, '\n') // Remove extra blank lines

util.readJSON(util.KANJI_LIST_FILE)
  .then(kanjiList => kanjiList.map((kanji, idx) => {
    let code = util.kanjiCode(kanji)
    let url = toUrl(code)
    let file = util.KANJIVG_DIR + code + '.svg'
    console.log('Downloading "' + url + '"...')
    return util.httpsDownload(url)
      .then(cleanSvg)
      .then(content => {
        console.log('Writing to "' + file + '"...')
        return util.write(file, content)
          .then(() => console.log('Saved file "' + file + '"'))
          .catch(e => console.log(e))
      })
  }))
  .all()
  .then(() => console.log('Done'))
