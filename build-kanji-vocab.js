var _ = require('lodash');
var fs = require('fs');
var Promise = require('bluebird');
Promise.promisifyAll(fs);

var
  DATA_IN_DIR = 'data-in/',
  KANJI_LIST_FILE = DATA_IN_DIR + 'kanji-list.json',
  DICT_FILE = DATA_IN_DIR + 'jmdict-eng.json',
  WORD_FREQ_FILE = DATA_IN_DIR + 'wikipedia-20150422-lemmas.tsv',
  KANJI_DEFS_FILE = 'data-out/kanji-vocab.json',
  KANJI_REGEXP = /[\u4e00-\u9fff]+/g,
  MAX_WORDS = 10,
  EXCLUDED_TAGS = [
    'iK', 'ik',
    'oK', 'ok',
    'io', 'oik',
    'obs', 'arch',
    'X', 'obsc', 'vulg', 'derog'
  ];

var dictPatches = [
  (dict) => { // "ラー油" and "辣油" are both should be read as "ラーユ"
    var idx = dict.words.findIndex((w) => w.id == 1137730);
    dict.words[idx].kana[0].appliesToKanji = [ '*' ];
  }
];

console.log('Reading data files...');
Promise.join(
  fs.readFileAsync(KANJI_LIST_FILE, 'utf8'),
  fs.readFileAsync(DICT_FILE, 'utf8'),
  fs.readFileAsync(WORD_FREQ_FILE, 'utf8'),
  (kanjiListData, dictData, wordFreqData) => {
    console.log('Parsing data files...');
    var kanjiList = JSON.parse(kanjiListData);
    var dict = JSON.parse(dictData);
    var wordFreq = wordFreqData.split('\n').map((line) => _.last(line.split('\t')));

    console.log('Patching/fixing the dictionary...');
    dictPatches.forEach((patch) => patch(dict));
    console.log(dictPatches.length + ' patch applied');

    console.log('Extracting all words from the dictionary which have any kanji from the list...')
    var wordsWithKanji = getWordsWithKanji(dict, kanjiList);
    console.log('Found ' + wordsWithKanji.length + ' words');

    console.log('Filtering the frequency-ordered word list...');
    var wordsWithKanjiHash = toLookupHash(wordsWithKanji);
    var wordFreqList = wordFreq.filter((w) => wordsWithKanjiHash[w] >= 0);
    console.log('Filtered down to ' + wordFreqList.length + ' words');

    console.log('Building a lookup hash for word frequencies...');
    var workFreqHash = toLookupHash(wordFreqList);

    console.log('Building kanji definitions...');
    var defs = buildDefs(kanjiList, dict, workFreqHash);

    console.log('Optimizing definitions...');
    optimizeDefs(defs, workFreqHash, MAX_WORDS);

    console.log('Validating...');
    validateDefs(defs);

    console.log('Number of words in a final definitions: ' + _.keys(defs.words).length);

    console.log('Writing to file "' + KANJI_DEFS_FILE + '"...');
    return fs.writeFile(KANJI_DEFS_FILE, JSON.stringify(defs, null, ' '), 'utf8');
  }
).then(() => console.log('Done'));

function toLookupHash(arr) {
  var i = 0;
  return arr.reduce((hash, elem) => {
    hash[elem] = i;
    i += 1;
    return hash;
  }, {});
}

function containsAnyCharacter(word, chars) {
  return ! _.isUndefined(
    chars.find((char) => _.includes(word, char))
  );
}

function getWordsWithKanji(dict, kanjiList) {
  return _.flatten(
    dict.words.map((word) =>
      word.kanji
        .map((writing) => writing.text)
        .filter((text) => containsAnyCharacter(text, kanjiList))
    )
  );
}

function hasExcludedTags(tags) {
  return _.intersection(EXCLUDED_TAGS, tags).length > 0;
}

function applies(appliesList, all) {
  return _.includes(appliesList, '*') || ! _.isEmpty(_.intersection(all, appliesList));
}

function reportProgress(idx, total, batchSize) {
  if ((idx + 1) % batchSize == 0) {
    var percent = ((idx + 1) / total * 100) | 0;
    console.log((idx + 1) + ' of ' + total + ' (' + percent + '%)');
  }
}

function buildDefs(kanjiList, dict, wordFreqHash) {
  var kanjiDefs = {
    kanji: _.fromPairs(kanjiList.map((kanji) => [kanji, []] )),
    words: {}
  };

  var wordsTotal = dict.words.length;
  dict.words.forEach((word, idx) => {
    reportProgress(idx, wordsTotal, 10000);

    // Ignore kana-only words
    if (word.kanji.length == 0) return;

    var w = getWriting(word, kanjiList, wordFreqHash);
    if (w == null) return;

    var rs = getReadings(word, w);
    if (_.isEmpty(rs)) return;

    var ts = getTranslations(word, w, rs.map(getText));
    if (_.isEmpty(ts)) return;

    var wordId = "" + word.id;
    kanjiDefs.words[wordId] = buildCompactWord(w, rs, ts);
    w.text.split('').forEach((char) => {
      if ( ! _.isUndefined(kanjiDefs.kanji[char])) {
        kanjiDefs.kanji[char].push(wordId);
      }
    });
  });

  return kanjiDefs;
}

function getText(obj) {
  return obj.text;
}

function getWriting(word, kanjiList, wordFreqHash) {
  // Don't use other forms for simplicity
  var w = word.kanji[0];
  if (
    wordFreqHash[w.text] >= 0 &&
    containsAnyCharacter(w.text, kanjiList) &&
    ! hasExcludedTags(w.tags)
  ) return w;
  return null;
}

function getReadings(word, writing) {
  return word.kana.filter((r) =>
    applies(r.appliesToKanji, [writing]) &&
    ! hasExcludedTags(r.tags)
  );
}

function getTranslations(word, writing, readings) {
  return word.sense.filter((t) =>
    applies(t.appliesToKanji, [writing]) &&
    applies(t.appliesToKana, readings) &&
    ! hasExcludedTags(t.misc)
  );
}

function validateDefs(defs) {
  noneExist(defs.kanji, (kanji, refs) => _.isEmpty(refs), 'Kanji without refs to words');
  noneExist(defs.words, (id, word) => _.isEmpty(word.w), 'Words without writings');
  noneExist(defs.words, (id, word) => _.isEmpty(word.r), 'Words without readings');
  noneExist(defs.words, (id, word) => _.isEmpty(word.t), 'Words without translations');
}

function noneExist(obj, filter, description) {
  var found = _.toPairs(obj)
    .filter((pair) => filter(pair[0], pair[1]));
  if ( ! _.isEmpty(found)) {
    throw new Error(
      description + ':\n' +
      found.map((p) => p.map(JSON.stringify).join(': ')).join(',\n')
    );
  }
}

function buildCompactWord(writing, readings, translations) {
  return {
    w: writing.text,
    r: readings.map(getText),
    t: translations.map((t) => ({
      pos: t.partOfSpeech,
      forKana: t.appliesToKana,
      gloss: t.gloss.map(getText)
    }))
  };
}

function optimizeDefs(defs, workFreqHash, topN) {
  var usedRefs = {};

  _.keys(defs.kanji).forEach((kanji) => {
    // Sort lists of refs by frequencies of corresponding words
    defs.kanji[kanji] = defs.kanji[kanji].sort((a, b) => {
      var wa = defs.words[a].w;
      var wb = defs.words[b].w;
      return (workFreqHash[wa] || -1) - (workFreqHash[wb] || -1);
    }).slice(0, topN);
    defs.kanji[kanji].forEach((ref) => usedRefs[ref] = true);
  });

  // Remove words which are not referenced from any kanji ref lists
  defs.words = _.fromPairs(
    _.toPairs(defs.words).filter((pair) => usedRefs[pair[0]])
  );
}
