'use strict';

var _ = require('lodash')
var fs = require('fs')
var https = require('https')
var Promise = require('bluebird')
Promise.promisifyAll(fs)

const
  URL_TEMPLATE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/%.svg',
  KANJI_LIST = 'data-in/kanji-list.json',
  OUT_DIR = 'src/resources/kanjivg/'

const get = url => new Promise((resolve, reject) => https.get(url, resolve).on('error', reject))

const kanjiCode = kanji => _.padStart(kanji.charCodeAt(0).toString(16), 5, '0')

const toUrl = code => URL_TEMPLATE.replace('%', code)

const download = url => get(url).then(response => {
  return new Promise(resolve => {
    let content = ''
    response.setEncoding('utf8')
    response.on('data', chunk => content += chunk)
    response.on('end', () => resolve(content))
  })
})

fs.readFileAsync(KANJI_LIST, 'utf8')
  .then(f => JSON.parse(f).map((kanji, idx) => {
    let code = kanjiCode(kanji)
    let url = toUrl(code)
    let file = OUT_DIR + code + '.svg'
    console.log('Downloading ' + url)
    return download(url).then(content => {
      let filteredContent = content
        .replace(/<!DOCTYPE(.|[\n])*\]>/g, '')
        .replace(/<!--(.|[\n])*-->/g, '')
        .replace(/[\n]{2,}/g, '\n')
      console.log('Writing to ' + file)
      return fs.writeFileAsync(file, filteredContent, 'utf8')
        .then(() => console.log('Saved file ' + file))
        .catch(e => console.log(e))
    })
  }))
  .all()
  .then(() => console.log('Done'))
