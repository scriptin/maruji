import React from 'react'
import Word from './Word'

const WordList = ({ words, hiddenChar }) => (
  <div>
    { words.map((word, idx) =>
      <Word key={idx} num={idx + 1} word={word} hiddenChar={hiddenChar} />
    ) }
  </div>
)

export default WordList
