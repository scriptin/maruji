import React from 'react'
import Word from './Word'

const intoColumns = words => {
  if (words.length == 1) return [words]
  if (words.length == 2) return [words[0], words[1]]

  let lengths = words.map(w => w.t.length + 3.5) // header adds to length
  let possibleSlices = lengths.map((l, idx, all) => {
    let left = _.sum(_.slice(all, 0, idx))
    let right = _.sum(_.slice(all, idx))
    return [idx, Math.abs(left - right)]
  })
  let optimalSlice = _.minBy(possibleSlices, s => s[1])[0]
  return [
    _.slice(words, 0, optimalSlice),
    _.slice(words, optimalSlice)
  ]
}

const WordList = ({ words, hiddenChar }) => (
  <div className="row">
    { intoColumns(words).map((column, colIdx) =>
      <div key={colIdx} className="col-md-6">
        { column.map((word, idx) =>
          <Word key={idx} num={idx + 1} word={word} hiddenChar={hiddenChar} />
        ) }
      </div>
    ) }
  </div>
)

export default WordList
