import React from 'react'
import Word from './Word'

const WordList = ({ words, hiddenChar }) => (
  <table className='table table-condensed table-hover'>
    <tbody>
      { words.map((word, idx) => <Word key={idx} num={idx + 1} word={word} hiddenChar={hiddenChar} />) }
    </tbody>
  </table>
)

export default WordList
