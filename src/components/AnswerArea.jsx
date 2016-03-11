import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import SvgButton from './SvgButton'
import ProgressBar from './ProgressBar'

const kanjiCode = kanji => _.padStart(kanji.charCodeAt(0).toString(16), 5, '0')

const AnswerArea = ({ isLoading, possibleAnswers }) => {
  if (isLoading) return <ProgressBar />
  return (
    <div>
      { possibleAnswers.map((answer, idx) => {
        let code = kanjiCode(answer)
        return <SvgButton key={idx} code={code} url={ '/kanjivg/' + code + '.svg' } />
      }) }
    </div>
  )
}

AnswerArea.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  possibleAnswers: PropTypes.arrayOf(PropTypes.string)
}

export default connect(state => ({
  isLoading: !state.question,
  possibleAnswers: state.question ? state.question.possibleAnswers: null
}))(AnswerArea)
